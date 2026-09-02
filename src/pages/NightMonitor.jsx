import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Mic, MicOff, Wifi, WifiOff, Battery, Volume2, ShieldCheck, Play, Square, Activity, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { AudioEngine } from '../services/AudioEngine';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import { getOfflineQueue, syncOfflineQueue } from '../services/offlineQueue';

export default function NightMonitor() {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [audioLevel, setAudioLevel] = useState({ db: 35, rms: 0, frequencyData: [] });
    const [latestEvent, setLatestEvent] = useState(null);
    const [eventCount, setEventCount] = useState(0);
    const [sessionTime, setSessionTime] = useState(0);
    const [batteryLevel, setBatteryLevel] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineCount, setOfflineCount] = useState(getOfflineQueue().length);
    const [isDimmed, setIsDimmed] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const audioEngineRef = useRef(null);
    const timerRef = useRef(null);

    // Load user settings from localStorage
    const preRoll = Number(localStorage.getItem('einsdream_preroll')) || 5;
    const postRoll = Number(localStorage.getItem('einsdream_postroll')) || 10;
    const thresholdDb = Number(localStorage.getItem('einsdream_threshold')) || 52;

    useEffect(() => {
        // Battery status API
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                setBatteryLevel(Math.round(battery.level * 100));
                battery.addEventListener('levelchange', () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                });
            }).catch(() => {});
        }

        // Online / Offline listeners
        const handleOnline = () => { setIsOnline(true); syncOfflineQueue(); };
        const handleOffline = () => setIsOnline(false);
        const handleQueue = (e) => setOfflineCount(e.detail?.count || 0);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('einsdream:queue_updated', handleQueue);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('einsdream:queue_updated', handleQueue);
            if (audioEngineRef.current) {
                audioEngineRef.current.stop();
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const toggleMonitoring = async () => {
        if (isMonitoring) {
            // Stop monitoring
            if (audioEngineRef.current) {
                audioEngineRef.current.stop();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setIsMonitoring(false);
        } else {
            // Start monitoring
            setErrorMsg(null);
            try {
                const engine = new AudioEngine({
                    preRollSeconds: preRoll,
                    postRollSeconds: postRoll,
                    thresholdDb: thresholdDb,
                    onAudioLevel: (level) => setAudioLevel(level),
                    onEventDetected: (event) => {
                        setLatestEvent(event);
                        if (event.count) setEventCount(event.count);
                    },
                    onError: (err) => setErrorMsg(err.message || 'Error en el micrófono')
                });

                audioEngineRef.current = engine;
                await engine.start();

                setIsMonitoring(true);
                setSessionTime(0);

                timerRef.current = setInterval(() => {
                    setSessionTime(prev => prev + 1);
                }, 1000);

            } catch (err) {
                setErrorMsg('No se pudo acceder al micrófono: ' + err.message);
                setIsMonitoring(false);
            }
        }
    };

    const formatDuration = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
        return `${mins}m ${secs}s`;
    };

    const eventMeta = latestEvent ? (EVENT_LABELS[latestEvent.eventType] || EVENT_LABELS.unknown) : null;

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '1000px',
            margin: '0 auto',
            transition: 'all 0.5s ease',
            filter: isDimmed ? 'brightness(0.3)' : 'none'
        }}>
            {/* Header / Mode Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <Moon size={28} color="#818CF8" />
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                            Modo Nocturno Einsdream
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Captura continua con buffer circular de pre-roll ({preRoll}s) y post-roll ({postRoll}s)
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setIsDimmed(!isDimmed)}
                        className="btn btn-secondary"
                        title="Atenuar pantalla para dormir"
                    >
                        {isDimmed ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{isDimmed ? 'Pantalla Normal' : 'Atenuar Pantalla'}</span>
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#FCA5A5',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <AlertCircle size={20} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Main Sleep Monitoring Glowing Card */}
            <div className="glass-card" style={{
                background: isMonitoring
                    ? 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15), rgba(22, 26, 35, 0.95))'
                    : 'var(--bg-secondary)',
                border: isMonitoring ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isMonitoring ? '0 0 50px rgba(99, 102, 241, 0.2)' : 'none',
                marginBottom: '2rem'
            }}>
                {/* Status Glow Indicator */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 1rem',
                    borderRadius: '2rem',
                    background: isMonitoring ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                    border: `1px solid ${isMonitoring ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                    color: isMonitoring ? '#34D399' : '#94A3B8',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '1.5rem'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isMonitoring ? '#10B981' : '#64748B',
                        boxShadow: isMonitoring ? '0 0 10px #10B981' : 'none'
                    }} />
                    {isMonitoring ? '● MONITOREANDO ACTIVAMENTE' : '● LISTO PARA MONITOREAR'}
                </div>

                {/* Big Action Button */}
                <div style={{ margin: '1rem 0 2rem 0' }}>
                    <button
                        onClick={toggleMonitoring}
                        style={{
                            width: '220px',
                            height: '220px',
                            borderRadius: '50%',
                            border: isMonitoring ? '4px solid #EF4444' : '4px solid #6366F1',
                            background: isMonitoring
                                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))'
                                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isMonitoring
                                ? '0 0 40px rgba(239, 68, 68, 0.3)'
                                : '0 0 40px rgba(99, 102, 241, 0.3)',
                            transform: isMonitoring ? 'scale(1.02)' : 'scale(1)'
                        }}
                    >
                        {isMonitoring ? (
                            <>
                                <Square size={48} color="#EF4444" fill="#EF4444" />
                                <span style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.05em' }}>DETENER</span>
                            </>
                        ) : (
                            <>
                                <Moon size={52} color="#818CF8" />
                                <span style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.05em' }}>INICIAR MONITOREO</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Real-time Audio Spectrum Bars */}
                {isMonitoring && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        gap: '4px',
                        height: '40px',
                        marginBottom: '1.5rem'
                    }}>
                        {(audioLevel.frequencyData.length > 0 ? audioLevel.frequencyData : Array(24).fill(10)).map((val, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '6px',
                                    height: `${Math.max(4, (val / 255) * 40)}px`,
                                    background: val > 150 ? '#EC4899' : val > 100 ? '#818CF8' : '#6366F1',
                                    borderRadius: '3px',
                                    transition: 'height 0.08s ease'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Live dB Meter & Session Timer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '2.5rem',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                            Tiempo de Sesión
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                            {formatDuration(sessionTime)}
                        </div>
                    </div>

                    <div style={{ width: '1px', height: '35px', background: 'var(--border-color)' }} />

                    <div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                            Nivel Sonoro Actual
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: audioLevel.db >= thresholdDb ? '#F59E0B' : '#34D399' }}>
                            {isMonitoring ? `${audioLevel.db} dB` : '-- dB'}
                        </div>
                    </div>

                    <div style={{ width: '1px', height: '35px', background: 'var(--border-color)' }} />

                    <div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                            Eventos Detectados
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#818CF8' }}>
                            {eventCount}
                        </div>
                    </div>
                </div>
            </div>

            {/* Latest Event Live Classification Tag */}
            {latestEvent && eventMeta && (
                <div className="glass-card" style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderColor: 'rgba(99, 102, 241, 0.25)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: eventMeta.color + '22',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: eventMeta.color
                        }}>
                            <Volume2 size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: 'white', fontSize: '1.05rem' }}>
                                    {eventMeta.es}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '1rem',
                                    background: eventMeta.color + '33',
                                    color: eventMeta.color,
                                    fontWeight: '600'
                                }}>
                                    {latestEvent.confidence}% Confianza IA
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                Detectado a las {new Date(latestEvent.detectedAt).toLocaleTimeString()} • {latestEvent.intensityDb} dB • {latestEvent.duration}s
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <span style={{
                            fontSize: '0.8rem',
                            color: latestEvent.status === 'synced' ? '#34D399' : '#F59E0B',
                            fontWeight: '500'
                        }}>
                            {latestEvent.status === 'synced' ? '✓ Subido a la nube' : 'En cola local'}
                        </span>
                    </div>
                </div>
            )}

            {/* Quick Diagnostic / Device Status Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isMonitoring ? <Mic size={22} color="#10B981" /> : <MicOff size={22} color="#94A3B8" />}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Micrófono</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: isMonitoring ? '#10B981' : '#94A3B8' }}>
                            {isMonitoring ? 'Activo & Calibrado' : 'En espera'}
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isOnline ? <Wifi size={22} color="#10B981" /> : <WifiOff size={22} color="#EF4444" />}
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Conexión</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: isOnline ? '#10B981' : '#EF4444' }}>
                            {isOnline ? 'Online (Sincronizado)' : 'Offline (En cola)'}
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Battery size={22} color="#818CF8" />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Batería</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'white' }}>
                            {batteryLevel !== null ? `${batteryLevel}%` : 'Conectado'}
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={22} color="#818CF8" />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Buffer Circular</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'white' }}>
                            {preRoll}s Pre / {postRoll}s Post
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
