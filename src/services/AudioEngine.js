/**
 * EinsDream 3.0 - Web AudioEngine Deprecated
 * All acoustic recording and monitoring runs 100% locally on EinsDream Mobile.
 */
export class AudioEngine {
    constructor() {
        this.isRecording = false;
    }
    async start() {
        console.info('[EinsDream 3.0]: Web Audio recording is disabled. All acoustic monitoring is executed on the mobile device.');
        return false;
    }
    stop() {
        this.isRecording = false;
    }
}
export default AudioEngine;
