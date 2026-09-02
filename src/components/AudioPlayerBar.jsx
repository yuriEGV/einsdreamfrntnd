import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, X, Radio } from 'lucide-react';
import { EVENT_LABELS } from '../services/yamnetClassifier';

export default function AudioPlayerBar({ session, audioSource, onClose }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(session?.duration || 15);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [synthActive, setSynthActive] = useState(false);

    const audioRef = useRef(null);
    const synthRef = useRef(null);

    const meta = EVENT_LABELS[session?.eventType] || EVENT_LABELS.unknown;

    // Helper: Synthesize acoustic sound using Web Audio API if no audio file or raw stream
    const playSynthesizedSound = (type = 'snore') => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            synthRef.current = ctx;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            if (type === 'snore') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(75, ctx.currentTime);
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(220, ctx.currentTime);
            } else if (type === 'cough') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(420, ctx.currentTime);
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(800, ctx.currentTime);
            } else if (type === 'breathing') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(140, ctx.currentTime);
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(300, ctx.currentTime);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
            }

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (duration || 15));

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + (duration || 15));
            setSynthActive(true);
        } catch (e) {
            console.warn('Synth error:', e);
        }
    };

    useEffect(() => {
        if (!session) return;
        setCurrentTime(0);
        setIsPlaying(true);

        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Fallback to Web Audio synthesis if audio element fails to load stream
                playSynthesizedSound(session.eventType);
            });
        } else {
            playSynthesizedSound(session.eventType);
        }

        return () => {
            if (synthRef.current) {
                try { synthRef.current.close(); } catch {}
            }
        };
    }, [session, audioSource]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
                playSynthesizedSound(session?.eventType);
                setIsPlaying(true);
            });
        }
    };

    const handleSeek = (e) => {
        const targetTime = parseFloat(e.target.value);
        setCurrentTime(targetTime);
        if (audioRef.current) {
            audioRef.current.currentTime = targetTime;
        }
    };

    const skipTime = (deltaSeconds) => {
        if (audioRef.current) {
            const newTime = Math.min(duration, Math.max(0, audioRef.current.currentTime + deltaSeconds));
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        } else {
            const newTime = Math.min(duration, Math.max(0, currentTime + deltaSeconds));
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        setIsMuted(val === 0);
        if (audioRef.current) {
            audioRef.current.volume = val;
        }
    };

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false);
            if (audioRef.current) audioRef.current.volume = volume || 1;
        } else {
            setIsMuted(true);
            if (audioRef.current) audioRef.current.volume = 0;
        }
    };

    const formatSeconds = (sec) => {
        const s = Math.floor(sec || 0);
        const mins = Math.floor(s / 60);
        const remSecs = s % 60;
        return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
    };

    if (!session) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'linear-gradient(180deg, rgba(22, 26, 35, 0.96) 0%, rgba(15, 18, 24, 0.98) 100%)',
            borderTop: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px)',
            padding: '1rem 2rem',
            animation: 'slideUp 0.3s ease-out'
        }}>
            {/* Hidden Audio Element */}
            {audioSource && (
                <audio
                    ref={audioRef}
                    src={audioSource}
                    onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => {
                        if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
                            setDuration(audioRef.current.duration);
                        }
                    }}
                    onEnded={() => {
                        setIsPlaying(false);
                        setCurrentTime(0);
                    }}
                />
            )}

            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                {/* 1. Event Info Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: meta.color + '22',
                        border: `1px solid ${meta.color}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: meta.color
                    }}>
                        <Radio size={22} className={isPlaying ? 'pulse-anim' : ''} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem' }}>
                                {meta.es}
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                                {session.intensityDb || 55} dB
                            </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {new Date(session.detectedAt || session.createdAt).toLocaleTimeString()} • {session.deviceModel || 'Móvil'}
                        </div>
                    </div>
                </div>

                {/* 2. Playback Controls & Progress Bar */}
                <div style={{ flex: 1, minWidth: '320px', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        {/* -5s Rewind */}
                        <button
                            onClick={() => skipTime(-5)}
                            className="icon-btn"
                            title="Retroceder 5 segundos"
                            style={{ color: '#94A3B8', padding: '0.4rem' }}
                        >
                            <RotateCcw size={18} />
                            <span style={{ fontSize: '0.65rem', position: 'absolute', fontWeight: 'bold' }}>5</span>
                        </button>

                        {/* Play / Pause Big Button */}
                        <button
                            onClick={togglePlay}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                border: 'none',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                                transition: 'transform 0.15s ease'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
                        </button>

                        {/* +5s Forward */}
                        <button
                            onClick={() => skipTime(5)}
                            className="icon-btn"
                            title="Adelantar 5 segundos"
                            style={{ color: '#94A3B8', padding: '0.4rem' }}
                        >
                            <RotateCw size={18} />
                            <span style={{ fontSize: '0.65rem', position: 'absolute', fontWeight: 'bold' }}>5</span>
                        </button>
                    </div>

                    {/* Progress Slider (Scrubber) */}
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: '35px', textAlign: 'right' }}>
                            {formatSeconds(currentTime)}
                        </span>

                        <input
                            type="range"
                            min="0"
                            max={duration || 15}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            style={{
                                flex: 1,
                                height: '6px',
                                borderRadius: '3px',
                                accentColor: '#6366F1',
                                cursor: 'pointer',
                                background: `linear-gradient(to right, #6366F1 ${(currentTime / (duration || 15)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 15)) * 100}%)`
                            }}
                        />

                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: '35px' }}>
                            {formatSeconds(duration)}
                        </span>
                    </div>
                </div>

                {/* 3. Volume Control & Close Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={toggleMute} className="icon-btn" style={{ color: '#94A3B8' }}>
                            {isMuted ? <VolumeX size={18} color="#EF4444" /> : <Volume2 size={18} />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            style={{ width: '70px', height: '4px', accentColor: '#818CF8', cursor: 'pointer' }}
                        />
                    </div>

                    <button
                        onClick={onClose}
                        className="icon-btn"
                        title="Cerrar reproductor"
                        style={{ color: '#94A3B8', marginLeft: '0.5rem' }}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
