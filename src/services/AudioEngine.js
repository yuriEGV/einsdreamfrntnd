/**
 * Einsdream 2.0 Audio Engine
 * Features:
 * - Real-time AudioContext & Analyser
 * - Circular Pre-Roll Ring Buffer (3s, 5s, 10s, 15s, 30s)
 * - Energy & Anomaly Detector with configurable threshold
 * - Post-Roll capture (5s, 10s, 15s, 30s)
 * - YAMNet classification
 * - Automatic background upload & offline fallback
 * - WakeLock management for night monitoring
 */

import axios from 'axios';
import { API_URL } from '../config';
import { classifyAudio, initYAMNet } from './yamnetClassifier';
import { addToOfflineQueue } from './offlineQueue';

export class AudioEngine {
    constructor(options = {}) {
        this.preRollSeconds = options.preRollSeconds || 5;
        this.postRollSeconds = options.postRollSeconds || 10;
        this.thresholdDb = options.thresholdDb || 52; // Detection sensitivity in dB
        this.enabledTypes = options.enabledTypes || ['snore', 'cough', 'voice', 'breathing', 'irregular_breathing', 'noise', 'movement'];

        this.onAudioLevel = options.onAudioLevel || (() => {});
        this.onEventDetected = options.onEventDetected || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        this.onError = options.onError || (() => {});

        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.mediaRecorder = null;
        this.wakeLock = null;

        this.isRunning = false;
        this.isProcessingEvent = false;
        this.animFrameId = null;

        // Circular buffer for pre-roll chunks
        this.circularBuffer = []; // array of { blob: Blob, timestamp: number }
        this.activeEventChunks = [];
        this.eventCount = 0;
        this.lastTriggerTime = 0;
    }

    async start() {
        if (this.isRunning) return;

        try {
            await initYAMNet();

            // Request microphone
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // AudioContext Setup
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioCtx();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.6;
            source.connect(this.analyser);

            // Setup MediaRecorder for circular time slices (every 1000ms)
            this.circularBuffer = [];
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    const now = Date.now();
                    this.circularBuffer.push({ data: e.data, timestamp: now });

                    // Keep only preRollSeconds worth of chunks
                    const maxKeepMs = (this.preRollSeconds + 2) * 1000;
                    while (this.circularBuffer.length > 0 && (now - this.circularBuffer[0].timestamp > maxKeepMs)) {
                        this.circularBuffer.shift();
                    }

                    if (this.isProcessingEvent) {
                        this.activeEventChunks.push(e.data);
                    }
                }
            };
            this.mediaRecorder.start(1000); // 1-second slices

            // Request WakeLock to prevent screen/browser sleep
            await this.requestWakeLock();

            this.isRunning = true;
            this.onStatusChange({ status: 'MONITORING', active: true });

            // Start Analysis Loop
            this.runAnalysisLoop();

            return true;
        } catch (err) {
            console.error('[AudioEngine] Start failed:', err);
            this.onError(err);
            this.stop();
            throw err;
        }
    }

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                this.wakeLock.addEventListener('release', () => {
                    console.log('[AudioEngine] Screen Wake Lock was released');
                });
                console.log('[AudioEngine] Screen Wake Lock is active');
            } catch (err) {
                console.warn('[AudioEngine] Wake Lock request failed:', err.message);
            }
        }
    }

    runAnalysisLoop() {
        if (!this.isRunning || !this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const timeDomainData = new Float32Array(bufferLength);
        const frequencyData = new Uint8Array(bufferLength);

        const checkAudio = async () => {
            if (!this.isRunning) return;

            this.analyser.getFloatTimeDomainData(timeDomainData);
            this.analyser.getByteFrequencyData(frequencyData);

            // Compute RMS & Decibels
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += timeDomainData[i] * timeDomainData[i];
            }
            const rms = Math.sqrt(sum / bufferLength);
            const rawDb = 20 * Math.log10(Math.max(rms, 0.0001));
            const currentDb = Math.round(Math.min(95, Math.max(30, 95 + rawDb)));

            // Dispatch audio level for UI visualizer
            this.onAudioLevel({
                db: currentDb,
                rms,
                frequencyData: Array.from(frequencyData.slice(0, 32))
            });

            // Energy Anomaly Trigger Check
            const now = Date.now();
            const cooldownPassed = (now - this.lastTriggerTime) > ((this.postRollSeconds + 3) * 1000);

            if (currentDb >= this.thresholdDb && !this.isProcessingEvent && cooldownPassed) {
                this.triggerSoundEvent(currentDb, timeDomainData, frequencyData);
            }

            this.animFrameId = requestAnimationFrame(checkAudio);
        };

        this.animFrameId = requestAnimationFrame(checkAudio);
    }

    async triggerSoundEvent(triggerDb, timeDomainData, frequencyData) {
        this.isProcessingEvent = true;
        this.lastTriggerTime = Date.now();
        const detectedAt = new Date();

        console.log(`[AudioEngine] 🚨 Anomaly sound detected at ${triggerDb} dB! Starting capture...`);

        // 1. Classify with YAMNet classifier
        const classification = await classifyAudio(timeDomainData, frequencyData, this.audioContext?.sampleRate || 16000);

        // 2. Extract Pre-roll slice
        const preRollChunks = this.circularBuffer.map(c => c.data);
        this.activeEventChunks = [...preRollChunks];

        const eventData = {
            id: 'ev_' + Date.now(),
            eventType: classification.eventType,
            confidence: classification.confidence,
            intensityDb: Math.max(triggerDb, classification.intensityDb),
            preRollSeconds: this.preRollSeconds,
            postRollSeconds: this.postRollSeconds,
            duration: this.preRollSeconds + this.postRollSeconds,
            detectedAt: detectedAt.toISOString(),
            status: 'recording'
        };

        this.eventCount++;
        this.onEventDetected({ ...eventData, count: this.eventCount });

        // 3. Record Post-roll for configured duration
        setTimeout(async () => {
            try {
                const combinedBlob = new Blob(this.activeEventChunks, { type: 'audio/webm' });
                this.isProcessingEvent = false;
                this.activeEventChunks = [];

                // Upload to server or save to offline queue
                await this.uploadEvent(eventData, combinedBlob);
            } catch (err) {
                console.error('[AudioEngine] Event completion error:', err);
                this.isProcessingEvent = false;
            }
        }, this.postRollSeconds * 1000);
    }

    async uploadEvent(eventData, audioBlob) {
        const token = localStorage.getItem('adminToken');
        const filename = `event_${Date.now()}_${eventData.eventType}.webm`;

        try {
            if (!token) throw new Error('No user token');

            // 1. Initialize upload or use local endpoint
            const initRes = await axios.post(`${API_URL}/upload/init`, {
                filename,
                contentType: 'audio/webm'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { uploadMethod, url, fileKey, provider } = initRes.data;

            // 2. Upload file
            if (uploadMethod === 'PUT' && url.startsWith('http')) {
                await axios.put(url, audioBlob, {
                    headers: { 'Content-Type': 'audio/webm' }
                });
            } else {
                // Local multipart upload
                const formData = new FormData();
                formData.append('audio', audioBlob, filename);
                await axios.post(`${API_URL}/upload/local`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            // 3. Save Metadata
            await axios.post(`${API_URL}/upload/metadata`, {
                s3Key: fileKey,
                storageKey: fileKey,
                duration: eventData.duration,
                deviceModel: 'Web Monitor (Einsdream 2.0)',
                eventType: eventData.eventType,
                confidence: eventData.confidence,
                intensityDb: eventData.intensityDb,
                preRollSeconds: eventData.preRollSeconds,
                postRollSeconds: eventData.postRollSeconds,
                detectedAt: eventData.detectedAt,
                sessionGroup: `night_${new Date().toISOString().slice(0, 10)}`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[AudioEngine] Event successfully uploaded to Einsdream cloud!');
            this.onEventDetected({ ...eventData, status: 'synced' });

        } catch (err) {
            console.warn('[AudioEngine] Online upload failed, queuing event offline:', err.message);
            // Save to offline queue
            addToOfflineQueue({
                ...eventData,
                deviceModel: 'Web Monitor (Offline Queue)',
                sessionGroup: `night_${new Date().toISOString().slice(0, 10)}`
            });
            this.onEventDetected({ ...eventData, status: 'queued_offline' });
        }
    }

    setSettings({ preRollSeconds, postRollSeconds, thresholdDb }) {
        if (preRollSeconds) this.preRollSeconds = preRollSeconds;
        if (postRollSeconds) this.postRollSeconds = postRollSeconds;
        if (thresholdDb) this.thresholdDb = thresholdDb;
    }

    stop() {
        this.isRunning = false;
        this.isProcessingEvent = false;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try { this.mediaRecorder.stop(); } catch {}
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            try { this.audioContext.close(); } catch {}
            this.audioContext = null;
        }

        if (this.wakeLock) {
            try { this.wakeLock.release(); } catch {}
            this.wakeLock = null;
        }

        this.onStatusChange({ status: 'STOPPED', active: false });
    }
}
