import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, ShieldCheck, Smartphone, Award, Clock, Download, CheckCircle2, Lock, Cpu, BarChart2 } from 'lucide-react';
import { BASE_URL } from '../config';

export default function NightMonitor() {
    const navigate = useNavigate();
    const apkDownloadUrl = `${BASE_URL}/download/apk`;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Hero Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '2rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10B981',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    marginBottom: '0.75rem'
                }}>
                    <ShieldCheck size={16} />
                    <span>EinsDream 3.0 · Audio 100% Local On-Device</span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                    Centro de Monitoreo Acústico Inteligente
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '750px' }}>
                    En la arquitectura <strong style={{ color: 'white' }}>EinsDream 3.0</strong>, toda la captura acústica continua (.m4a) y la detección de eventos (ronquidos, tos, respiración) se ejecutan de manera nativa y privada en tu dispositivo móvil.
                </p>
            </div>

            {/* Architecture Pillars Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        marginBottom: '1rem'
                    }}>
                        <Smartphone size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: '0 0 0.5rem 0' }}>
                        1. Grabación Continua en Teléfono
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                        El teléfono graba toda la pernoctación en formato comprimido (.m4a). El audio <strong style={{ color: '#38bdf8' }}>NUNCA sube a internet ni al servidor</strong>, garantizando 100% de privacidad.
                    </p>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10B981',
                        marginBottom: '1rem'
                    }}>
                        <Cpu size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: '0 0 0.5rem 0' }}>
                        2. Detección Acústica Local
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                        El detector interno de la app marca la hora exacta, intensidad pico en decibelios y tipo preliminar (ronquido, tos) con una barra de tiempo interactiva.
                    </p>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818CF8',
                        marginBottom: '1rem'
                    }}>
                        <BarChart2 size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: '0 0 0.5rem 0' }}>
                        3. Telemetría Pura a la Nube
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                        Al despertar, el móvil sincroniza solo un payload JSON liviano (&lt; 20 KB) con las estadísticas del descanso. La base de datos tiene <strong style={{ color: '#818CF8' }}>CERO bytes de audio</strong>.
                    </p>
                </div>
            </div>

            {/* Banner Call to Action */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(56, 189, 248, 0.1))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white', margin: '0 0 0.5rem 0' }}>
                        ¿Listo para monitorear tu noche?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '550px' }}>
                        Descarga la aplicación móvil EinsDream v2.7.0 para Android, colócala junto a tu cama y activa el monitoreo inteligente al acostarte.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <a
                        href={apkDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', gap: '0.5rem' }}
                    >
                        <Download size={18} />
                        <span>Descargar APK v2.7.0</span>
                    </a>
                    <button
                        onClick={() => navigate('/recordings')}
                        className="btn btn-secondary"
                        style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', gap: '0.5rem' }}
                    >
                        <Award size={18} />
                        <span>Ver Estadísticas & Score</span>
                    </button>
                    <button
                        onClick={() => navigate('/timeline')}
                        className="btn btn-secondary"
                        style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', gap: '0.5rem' }}
                    >
                        <Clock size={18} />
                        <span>Ver Línea de Tiempo</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
