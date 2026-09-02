import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Shield, Download, Smartphone, CheckCircle, Volume2, Save } from 'lucide-react';
import { BASE_URL } from '../config';

export default function SettingsPage() {
    const [preRoll, setPreRoll] = useState(Number(localStorage.getItem('einsdream_preroll')) || 5);
    const [postRoll, setPostRoll] = useState(Number(localStorage.getItem('einsdream_postroll')) || 10);
    const [thresholdDb, setThresholdDb] = useState(Number(localStorage.getItem('einsdream_threshold')) || 52);
    const [savedMsg, setSavedMsg] = useState(false);

    const [enabledTypes, setEnabledTypes] = useState({
        snore: true,
        cough: true,
        voice: true,
        breathing: true,
        irregular_breathing: true,
        noise: true,
        movement: true
    });

    const preRollOptions = [3, 5, 10, 15, 30];
    const postRollOptions = [5, 10, 15, 30];

    const handleSave = () => {
        localStorage.setItem('einsdream_preroll', preRoll);
        localStorage.setItem('einsdream_postroll', postRoll);
        localStorage.setItem('einsdream_threshold', thresholdDb);
        localStorage.setItem('einsdream_types', JSON.stringify(enabledTypes));

        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <Settings size={28} color="#818CF8" />
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                            Configuración de Captura y Sensores
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Ajusta el buffer circular de pre-roll, umbrales de sensibilidad y tipos de eventos a monitorear
                    </p>
                </div>

                <button onClick={handleSave} className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Save size={18} />
                    <span>Guardar Cambios</span>
                </button>
            </div>

            {savedMsg && (
                <div style={{
                    padding: '0.85rem 1.25rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#6EE7B7',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <CheckCircle size={20} />
                    <span>¡Configuración guardada exitosamente! Se aplicará en las próximas sesiones de monitoreo.</span>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 1. Pre-Roll & Buffer Circular */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Sliders size={22} color="#6366F1" />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white' }}>
                            Buffer Circular (Pre-Roll y Post-Roll)
                        </h3>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        El <strong>Pre-Roll</strong> conserva temporalmente los segundos de audio previos a la detección para no perder el inicio real del evento (ronquido, tos, respiración).
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Pre-roll Selector */}
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                                Duración Pre-Roll (Contexto Previo)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {preRollOptions.map(sec => (
                                    <button
                                        key={sec}
                                        onClick={() => setPreRoll(sec)}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            minWidth: '50px',
                                            justifyContent: 'center',
                                            background: preRoll === sec ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-tertiary)',
                                            color: preRoll === sec ? 'white' : 'var(--text-secondary)',
                                            border: preRoll === sec ? 'none' : '1px solid var(--border-color)',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {sec} s
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Post-roll Selector */}
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                                Duración Post-Roll (Grabación Posterior)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {postRollOptions.map(sec => (
                                    <button
                                        key={sec}
                                        onClick={() => setPostRoll(sec)}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            minWidth: '50px',
                                            justifyContent: 'center',
                                            background: postRoll === sec ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-tertiary)',
                                            color: postRoll === sec ? 'white' : 'var(--text-secondary)',
                                            border: postRoll === sec ? 'none' : '1px solid var(--border-color)',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {sec} s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Visual Box */}
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                    }}>
                        <span style={{ fontSize: '0.9rem', color: 'white' }}>
                            Duración Total por Evento: <strong>{preRoll + postRoll} segundos</strong> ({preRoll}s antes + {postRoll}s después)
                        </span>
                        <span className="badge-premium">Recomendado: 15s</span>
                    </div>
                </div>

                {/* 2. Sensitivity Threshold */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Volume2 size={22} color="#F59E0B" />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white' }}>
                            Sensibilidad del Detector Acústico
                        </h3>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Umbral de nivel sonoro (dB) a partir del cual el sistema activa la captura y clasificación.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Más Sensible (35 dB)</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#F59E0B' }}>{thresholdDb} dB</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Menos Sensible (75 dB)</span>
                        </div>
                        <input
                            type="range"
                            min="38"
                            max="70"
                            step="1"
                            value={thresholdDb}
                            onChange={(e) => setThresholdDb(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* 3. Mobile APK Companion */}
                <div className="glass-card" style={{ padding: '2rem', background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), var(--bg-secondary))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8' }}>
                                <Smartphone size={28} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>
                                    Aplicación Android Einsdream
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                                    Monitor nocturno + Grabaciones locales · Escucha tus audios directamente en el celular
                                </p>
                            </div>
                        </div>

                        <a
                            href={`${BASE_URL}/download/apk?v=2.1.0`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}
                        >
                            <Download size={18} />
                            <span>Descargar APK (v2.1.0)</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
