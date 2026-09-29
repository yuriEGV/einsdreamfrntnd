/**
 * acousticSynth.js - EinsDream 3.0
 * Pure JavaScript acoustic synthesizer for sleep telemetry events.
 * Generates standards-compliant PCM 16-Bit Mono WAV data URIs directly in-browser.
 * Compatible with HTML5 <audio> and Web Audio API across all modern browsers.
 */

export function generateAcousticEventAudioUrl(eventType = 'snore', durationSec = 4, sampleRate = 16000) {
    const normType = String(eventType || 'unknown').toLowerCase();
    const numSamples = Math.round(sampleRate * durationSec);
    const dataSize = numSamples * 2;
    const totalBytes = 44 + dataSize;
    const u8 = new Uint8Array(totalBytes);
    const view = new DataView(u8.buffer);

    // RIFF WAVE header (PCM 16-bit Mono, sampleRate Hz)
    u8[0] = 82; u8[1] = 73; u8[2] = 70; u8[3] = 70; // 'RIFF'
    view.setUint32(4, 36 + dataSize, true);
    u8[8] = 87; u8[9] = 65; u8[10] = 86; u8[11] = 69; // 'WAVE'
    u8[12] = 102; u8[13] = 109; u8[14] = 116; u8[15] = 32; // 'fmt '
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM Format (1)
    view.setUint16(22, 1, true); // Mono (1 channel)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // ByteRate = sampleRate * 1 * 2
    view.setUint16(32, 2, true); // BlockAlign = 1 * 2
    view.setUint16(34, 16, true); // 16 bits per sample
    u8[36] = 100; u8[37] = 97; u8[38] = 116; u8[39] = 97; // 'data'
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        if (normType.includes('snore') || normType.includes('ronquido')) {
            // Ronquido vibratorio profundo y claro
            const cycle = (t % 3.4);
            if (cycle < 2.2) {
                const palatal = Math.sin(2 * Math.PI * 85 * t)
                    + 0.75 * Math.sin(2 * Math.PI * 170 * t)
                    + 0.5 * Math.sin(2 * Math.PI * 255 * t)
                    + 0.3 * Math.sin(2 * Math.PI * 340 * t);
                const friction = (Math.random() * 2 - 1) * 0.55;
                const flutterMod = 1 + 0.35 * Math.sin(2 * Math.PI * 22 * t);
                const env = Math.pow(Math.sin(Math.PI * (cycle / 2.2)), 1.3);
                sample = (palatal * flutterMod + friction) * 22000 * env;
            }
        } else if (normType.includes('cough') || normType.includes('tos')) {
            // Tos aguda explosiva en dos golpes
            const burst = (t % 2.0);
            if (burst < 0.22) {
                const noise = (Math.random() * 2 - 1);
                const tone = Math.sin(2 * Math.PI * 380 * t) * 0.4;
                sample = (noise + tone) * 25000 * Math.exp(-burst * 14);
            } else if (burst > 0.32 && burst < 0.56) {
                const t2 = burst - 0.32;
                const noise = (Math.random() * 2 - 1);
                const tone = Math.sin(2 * Math.PI * 420 * t) * 0.4;
                sample = (noise + tone) * 22000 * Math.exp(-t2 * 12);
            }
        } else if (normType.includes('breath') || normType.includes('respiraci')) {
            // Respiración rítmica y relajante
            const cycle = (t % 3.8);
            const isExhale = cycle > 1.7;
            const sub = isExhale ? (cycle - 1.7) / 2.1 : cycle / 1.7;
            const env = Math.sin(Math.PI * sub);
            const hiss = (Math.random() * 2 - 1) * 0.7;
            const tone = Math.sin(2 * Math.PI * (isExhale ? 320 : 380) * t) * 0.35;
            sample = (hiss + tone) * (isExhale ? 16000 : 13500) * env;
        } else if (normType.includes('move') || normType.includes('movimiento')) {
            // Movimiento corporal y sábanas
            const rustle = (t % 3.2);
            if (rustle < 1.4) {
                const friction = (Math.random() * 2 - 1) * 0.8;
                const creak = Math.sin(2 * Math.PI * 180 * t) * Math.sin(2 * Math.PI * 12 * t);
                const env = Math.sin(Math.PI * (rustle / 1.4));
                sample = (friction + creak) * 17000 * env;
            }
        } else if (normType.includes('voice') || normType.includes('habla') || normType.includes('speech')) {
            // Somniloquio / murmullo suave de voz
            const syl = (t % 2.5);
            if (syl < 1.6) {
                const f0 = 145 + 25 * Math.sin(2 * Math.PI * 3 * t);
                const vocal = Math.sin(2 * Math.PI * f0 * t)
                    + 0.6 * Math.sin(2 * Math.PI * f0 * 2 * t)
                    + 0.4 * Math.sin(2 * Math.PI * f0 * 4 * t);
                const noise = (Math.random() * 2 - 1) * 0.25;
                const env = Math.sin(Math.PI * (syl / 1.6)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 5 * t));
                sample = (vocal + noise) * 20000 * env;
            }
        } else {
            // Ambiente de dormitorio fluido y perceptible
            const cycle = (t % 4.0) / 4.0;
            const breathEnv = Math.pow(Math.sin(Math.PI * cycle), 1.4);
            const air = (Math.random() * 2 - 1) * 12000 * (0.35 + 0.65 * breathEnv);
            const tone = (Math.sin(2 * Math.PI * 220 * t) + 0.5 * Math.sin(2 * Math.PI * 330 * t)) * 4000 * breathEnv;
            sample = air + tone;
        }

        const clamped = Math.max(-32767, Math.min(32767, Math.round(sample)));
        view.setInt16(44 + i * 2, clamped, true);
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let b64 = '';
    const len = u8.length;
    for (let i = 0; i < len; i += 3) {
        const b0 = u8[i];
        const b1 = i + 1 < len ? u8[i + 1] : 0;
        const b2 = i + 2 < len ? u8[i + 2] : 0;
        b64 += chars[b0 >> 2];
        b64 += chars[((b0 & 3) << 4) | (b1 >> 4)];
        b64 += i + 1 < len ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
        b64 += i + 2 < len ? chars[b2 & 63] : '=';
    }

    return `data:audio/wav;base64,${b64}`;
}

export default generateAcousticEventAudioUrl;
