import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Award,
    Moon,
    Clock,
    Wind,
    Activity,
    ShieldCheck,
    AlertTriangle,
    FileText,
    Download,
    CheckCircle2,
    X,
    Star,
    Calendar,
    BarChart3,
    Info,
    Lock,
    Loader2,
    Save
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend
} from 'recharts';
import { API_URL } from '../config';

const PATTERN_COLORS = {
    P1: { border: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', text: '#34D399', label: 'Baja actividad acústica y alta continuidad' },
    P2: { border: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', text: '#38BDF8', label: 'Actividad acústica dispersa' },
    P3: { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', text: '#FBBF24', label: 'Agrupaciones acústicas definidas (Clusters)' },
    P4: { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', text: '#F87171', label: 'Actividad acústica frecuente o prolongada' },
    P5: { border: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', text: '#CBD5E1', label: 'Cobertura insuficiente o limitaciones técnicas' }
};

export default function SdrReportModal({ sessionIdOrDate, initialReport, onClose, onSaved }) {
    const [report, setReport] = useState(initialReport || null);
    const [loading, setLoading] = useState(!initialReport);
    const [activeTab, setActiveTab] = useState('pattern'); // 'pattern' | 'metrics' | 'clusters' | 'subjective'
    const [savingSubjective, setSavingSubjective] = useState(false);
    const [subjectiveSuccess, setSubjectiveSuccess] = useState(false);

    // Subjective form state (MN-SDR-001 §7.3)
    const [subjectiveForm, setSubjectiveForm] = useState({
        perceivedQualityScore: 4,
        perceivedSleepLatencyMin: 15,
        rememberedAwakeningsCount: 0,
        restfulnessScore: 4,
        notes: ''
    });

    useEffect(() => {
        if (!initialReport && sessionIdOrDate) {
            fetchReport();
        } else if (initialReport) {
            setReport(initialReport);
            if (initialReport.subjective) {
                setSubjectiveForm({
                    perceivedQualityScore: initialReport.subjective.perceivedQualityScore ?? 4,
                    perceivedSleepLatencyMin: initialReport.subjective.perceivedSleepLatencyMin ?? 15,
                    rememberedAwakeningsCount: initialReport.subjective.rememberedAwakeningsCount ?? 0,
                    restfulnessScore: initialReport.subjective.restfulnessScore ?? 4,
                    notes: initialReport.subjective.notes ?? ''
                });
            }
        }
    }, [sessionIdOrDate, initialReport]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/night-sessions/${sessionIdOrDate}/report`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success && res.data?.report) {
                setReport(res.data.report);
                if (res.data.report.subjective) {
                    setSubjectiveForm({
                        perceivedQualityScore: res.data.report.subjective.perceivedQualityScore ?? 4,
                        perceivedSleepLatencyMin: res.data.report.subjective.perceivedSleepLatencyMin ?? 15,
                        rememberedAwakeningsCount: res.data.report.subjective.rememberedAwakeningsCount ?? 0,
                        restfulnessScore: res.data.report.subjective.restfulnessScore ?? 4,
                        notes: res.data.report.subjective.notes ?? ''
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching SDR report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSubjective = async (e) => {
        e.preventDefault();
        setSavingSubjective(true);
        setSubjectiveSuccess(false);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(
                `${API_URL}/night-sessions/${sessionIdOrDate || report?.session_date}/subjective`,
                subjectiveForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSubjectiveSuccess(true);
            setTimeout(() => setSubjectiveSuccess(false), 3500);
            if (onSaved) onSaved();
            fetchReport();
        } catch (err) {
            alert('Error al guardar la evaluación subjetiva: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingSubjective(false);
        }
    };

    const downloadJsonReport = () => {
        if (!report) return;
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MN-SDR-001_${report.session_date || 'report'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}>
                <div style={{ background: '#161A23', padding: '2.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <Loader2 size={36} className="spinner" style={{ margin: '0 auto 1rem', color: '#818CF8' }} />
                    <div style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Generando informe normativo MN-SDR-001...</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Calculando indicadores de Niveles 1, 2 y 3</div>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}>
                <div style={{ background: '#161A23', padding: '2rem', borderRadius: '16px', maxWidth: '420px', width: '90%', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <AlertTriangle size={36} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>No se pudo cargar el informe</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        No se encontraron datos normativos para esta sesión o hubo un problema al procesarlos.
                    </p>
                    <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>Cerrar</button>
                </div>
            </div>
        );
    }

    const patternCode = report.pattern?.code || 'P5';
    const patternStyle = PATTERN_COLORS[patternCode] || PATTERN_COLORS.P5;
    const isRefUser = report.reference?.type === 'REF-USER';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 13, 20, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1.5rem'
        }}>
            <div style={{
                background: '#161A23',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                maxWidth: '920px',
                width: '100%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(180deg, rgba(30, 35, 49, 0.6), transparent)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                        }}>
                            <FileText size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', margin: 0 }}>
                                    Informe Técnico de Sueño y Descanso
                                </h2>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    color: '#A5B4FC',
                                    border: '1px solid rgba(99, 102, 241, 0.35)'
                                }}>
                                    MN-SDR-001 v1.0
                                </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                Sesión: <strong style={{ color: 'white' }}>{report.session_date}</strong> • Rango: {report.identification?.time_range_local || 'Noche'} ({report.identification?.tz_offset_hours || 'UTC-3'})
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                            onClick={downloadJsonReport}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', gap: '0.35rem' }}
                            title="Descargar informe estándar en JSON"
                        >
                            <Download size={14} />
                            <span>JSON Oficial</span>
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                padding: '0.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '6px'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(15, 18, 24, 0.5)',
                    padding: '0 1.5rem',
                    gap: '0.5rem'
                }}>
                    {[
                        { key: 'pattern', label: 'Patrón & Diagnóstico (Nivel 3)', icon: Award },
                        { key: 'metrics', label: 'Indicadores Normativos (Niveles 1 y 2)', icon: Activity },
                        { key: 'clusters', label: 'Distribución & Agrupaciones', icon: BarChart3 },
                        { key: 'subjective', label: 'Evaluación Matutina (§7.3)', icon: Moon }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.75rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: isActive ? '2px solid #818CF8' : '2px solid transparent',
                                    color: isActive ? '#A5B4FC' : 'var(--text-tertiary)',
                                    fontWeight: isActive ? '700' : '500',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Icon size={15} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Modal Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {/* TAB 1: PATTERN & INTERPRETATION (NIVEL 3) */}
                    {activeTab === 'pattern' && (
                        <div>
                            {/* Pattern Badge Box */}
                            <div style={{
                                background: patternStyle.bg,
                                border: `1px solid ${patternStyle.border}`,
                                borderRadius: '14px',
                                padding: '1.25rem 1.5rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{
                                            fontWeight: '900',
                                            fontSize: '1.15rem',
                                            color: patternStyle.text,
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                            background: 'rgba(0, 0, 0, 0.3)'
                                        }}>
                                            {patternCode}
                                        </span>
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'white' }}>
                                            {report.pattern?.label || patternStyle.label}
                                        </h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                                        {report.pattern?.description}
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '6px',
                                        background: isRefUser ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                        color: isRefUser ? '#34D399' : '#94A3B8',
                                        border: `1px solid ${isRefUser ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.3)'}`
                                    }}>
                                        {report.reference?.type}
                                    </span>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                                        {isRefUser
                                            ? `Base: ${report.reference?.nights_used || 0} noches previas`
                                            : 'Sin historial comparativo aún'}
                                    </div>
                                </div>
                            </div>

                            {/* Independent Subindices Grid (§9) */}
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                                Subíndices Específicos Independientes (§9)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                {[
                                    { key: 'duration', label: 'Duración (SDR_SCORE_DURATION)', val: report.subindices?.duration, color: '#38BDF8' },
                                    { key: 'continuity', label: 'Continuidad (SDR_SCORE_CONTINUITY)', val: report.subindices?.continuity, color: '#818CF8' },
                                    { key: 'regularity', label: 'Regularidad (SDR_SCORE_REGULARITY)', val: report.subindices?.regularity, color: '#A78BFA' },
                                    { key: 'confidence', label: 'Confianza Técnica (SDR_SCORE_CONFIDENCE)', val: report.subindices?.confidence, color: '#10B981' }
                                ].map(sub => (
                                    <div key={sub.key} style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '0.4rem', fontWeight: '600' }}>
                                            {sub.label}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white' }}>
                                                {sub.val !== null && sub.val !== undefined ? sub.val : '--'}
                                            </span>
                                            {sub.val !== null && <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>/ 100</span>}
                                        </div>
                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: sub.val ? `${sub.val}%` : '0%',
                                                height: '100%',
                                                background: sub.color,
                                                borderRadius: '3px'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Descriptive Observations & Recommendations */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Info size={16} color="#818CF8" />
                                        <span>Observaciones Descriptivas</span>
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                                        {(report.observations || []).map((obs, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.4rem' }}>{obs}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <CheckCircle2 size={16} color="#10B981" />
                                        <span>Pautas de Higiene del Descanso</span>
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                                        {(report.recommendations || []).map((rec, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.4rem' }}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Normative Limitations Alert (§10) */}
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '12px',
                                padding: '1rem 1.25rem',
                                display: 'flex',
                                gap: '0.75rem'
                            }}>
                                <AlertTriangle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                <div>
                                    <div style={{ fontWeight: '700', color: '#F87171', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                                        Advertencia Técnica y Limitaciones Normativas (MN-SDR-001 §10)
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: '1.45' }}>
                                        Este dispositivo monitoriza únicamente fenómenos acústicos y/o de movimiento con fines de bienestar personal.
                                        NO constituye un dispositivo médico ni diagnóstico de apnea, insomnio u otra patología.
                                        La ausencia de sonido no equivale a sueño profundo ni garantiza descanso biológico reparador.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: NORMATIVE INDICATORS (NIVELES 1 Y 2) */}
                    {activeTab === 'metrics' && (
                        <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                                Tiempos y Cobertura de Monitorización (§6)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'SDR_DUR_REC (Duración Registrada)', val: `${report.monitoring?.recorded_duration_min || 0} min`, sub: `${((report.monitoring?.recorded_duration_min || 0) / 60).toFixed(1)} horas` },
                                    { label: 'SDR_DUR_PAUSE (Pausas Usuario)', val: `${report.monitoring?.pause_duration_min || 0} min`, sub: `${report.monitoring?.pause_count || 0} pausa(s)` },
                                    { label: 'SDR_DUR_VAL (Duración Válida)', val: `${report.monitoring?.valid_duration_min || 0} min`, sub: 'Tiempo neto monitorizado' },
                                    { label: 'SDR_COV (Cobertura)', val: `${report.monitoring?.coverage_pct || 0}%`, sub: (report.monitoring?.coverage_pct >= 85 ? 'Cobertura adecuada' : 'Cobertura limitada'), color: report.monitoring?.coverage_pct >= 85 ? '#10B981' : '#F59E0B' }
                                ].map((item, idx) => (
                                    <div key={idx} style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem', fontWeight: '600' }}>{item.label}</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: '800', color: item.color || 'white' }}>{item.val}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{item.sub}</div>
                                    </div>
                                ))}
                            </div>

                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                                Actividad Acústica (§7.1) & Agrupaciones (§8)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'SDR_AUD_EVT_COUNT (Eventos)', val: report.acoustic?.event_count || 0, sub: 'Total eventos audibles' },
                                    { label: 'SDR_AUD_EVT_RATE (Tasa)', val: `${report.acoustic?.events_per_hour || 0} /h`, sub: 'Eventos por hora válida' },
                                    { label: 'SDR_AUD_ACTIVE_DUR (Tiempo Activo)', val: `${report.acoustic?.active_duration_min || 0} min`, sub: `${report.acoustic?.active_pct || 0}% de la noche` },
                                    { label: 'SDR_AUD_INT_MEAN_DB (Int. Media)', val: report.acoustic?.intensity_mean_db !== null && report.acoustic?.intensity_mean_db !== undefined ? `${report.acoustic.intensity_mean_db} dB` : '--', sub: `Pico: ${report.acoustic?.intensity_max_db || '--'} dB` },
                                    { label: 'SDR_AUD_CLUST_COUNT (Clusters)', val: report.clusters?.cluster_count || 0, sub: `${report.clusters?.events_in_clusters || 0} evts agrupados` },
                                    { label: 'SDR_FRAG_INDEX (Fragmentación)', val: report.fragmentation?.fragmentation_index || 0, sub: 'Interrupciones acústicas' }
                                ].map((item, idx) => (
                                    <div key={idx} style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem', fontWeight: '600' }}>{item.label}</div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'white' }}>{item.val}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{item.sub}</div>
                                    </div>
                                ))}
                            </div>

                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                                Períodos de Baja Actividad Acústica (§8.3)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                                <div style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem', fontWeight: '600' }}>
                                        SDR_QUIET_LONGEST_SPAN (Tramo Tranquilo Mayor)
                                    </div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981' }}>
                                        {report.quiet_periods?.longest_quiet_min || 0} min
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                        Mayor lapso continuo sin eventos
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem', fontWeight: '600' }}>
                                        SDR_QUIET_TOTAL_DUR (Tranquilidad Acumulada)
                                    </div>
                                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#38BDF8' }}>
                                        {report.quiet_periods?.total_quiet_min || 0} min
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                        {report.quiet_periods?.quiet_pct || 0}% del tiempo de descanso
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: HOURLY DISTRIBUTION & CLUSTERS */}
                    {activeTab === 'clusters' && (
                        <div>
                            {/* Hourly Distribution Bar Chart */}
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <BarChart3 size={16} color="#818CF8" />
                                <span>Distribución Horaria de Eventos Acústicos</span>
                            </h4>
                            <div style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                                {(report.hourly_distribution || []).length > 0 ? (
                                    <div style={{ width: '100%', height: '220px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={report.hourly_distribution}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                                                <XAxis dataKey="hour_label" stroke="#64748B" fontSize={11} />
                                                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{ background: '#1E2331', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', fontSize: '0.75rem' }}
                                                    labelStyle={{ color: 'white', fontWeight: 'bold' }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
                                                <Bar dataKey="snore_count" name="Ronquidos" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="cough_count" name="Tos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="voice_count" name="Voz" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="other_count" name="Otros sonidos" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem 0', fontSize: '0.85rem' }}>
                                        No se registraron eventos acústicos en esta noche.
                                    </div>
                                )}
                            </div>

                            {/* Clusters Table */}
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>
                                Agrupaciones Acústicas Identificadas (§8)
                            </h4>
                            <div style={{ background: 'rgba(22, 26, 35, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                {(report.clusters?.list || []).length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(15, 18, 24, 0.6)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Inicio</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Lapso (span_s)</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Activo (active_s)</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Eventos</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Clase Dominante</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Pico dB</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.clusters.list.map((c, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#A5B4FC' }}>{c.cluster_id}</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'white' }}>{c.start_time}</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{c.span_s}s</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{c.active_s}s</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'white', fontWeight: '600' }}>{c.event_count}</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#F59E0B' }}>{c.dominant_class}</td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'white' }}>{c.max_intensity_db} dB</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem 0', fontSize: '0.85rem' }}>
                                        No se formaron agrupaciones (densidad acústica baja).
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SUBJECTIVE EVALUATION (§7.3) */}
                    {activeTab === 'subjective' && (
                        <div>
                            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ fontWeight: '700', color: '#A5B4FC', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    Evaluación Subjetiva Matutina del Usuario (§7.3)
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                    De acuerdo a la norma MN-SDR-001, la percepción subjetiva matutina complementa las mediciones de los sensores para calibrar el confort y la continuidad percibida.
                                </div>
                            </div>

                            <form onSubmit={handleSaveSubjective}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'white', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                            Calidad Percibida del Sueño (1 = Muy mala, 5 = Excelente)
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {[1, 2, 3, 4, 5].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setSubjectiveForm(prev => ({ ...prev, perceivedQualityScore: val }))}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.6rem',
                                                        borderRadius: '8px',
                                                        border: subjectiveForm.perceivedQualityScore === val ? '2px solid #818CF8' : '1px solid var(--border-color)',
                                                        background: subjectiveForm.perceivedQualityScore === val ? 'rgba(99, 102, 241, 0.25)' : 'rgba(22, 26, 35, 0.6)',
                                                        color: subjectiveForm.perceivedQualityScore === val ? '#A5B4FC' : 'var(--text-secondary)',
                                                        fontWeight: '700',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {val} ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: 'white', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                            Sensación de Descanso al Despertar (1 = Agotado, 5 = Pleno)
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {[1, 2, 3, 4, 5].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setSubjectiveForm(prev => ({ ...prev, restfulnessScore: val }))}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.6rem',
                                                        borderRadius: '8px',
                                                        border: subjectiveForm.restfulnessScore === val ? '2px solid #10B981' : '1px solid var(--border-color)',
                                                        background: subjectiveForm.restfulnessScore === val ? 'rgba(16, 185, 129, 0.25)' : 'rgba(22, 26, 35, 0.6)',
                                                        color: subjectiveForm.restfulnessScore === val ? '#34D399' : 'var(--text-secondary)',
                                                        fontWeight: '700',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: 'white', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                            Latencia Percibida (Minutos hasta conciliar el sueño)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="240"
                                            value={subjectiveForm.perceivedSleepLatencyMin}
                                            onChange={e => setSubjectiveForm(prev => ({ ...prev, perceivedSleepLatencyMin: parseInt(e.target.value) || 0 }))}
                                            style={{
                                                width: '100%',
                                                padding: '0.65rem 0.85rem',
                                                background: '#0F1218',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '0.85rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: 'white', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                            Despertares Recordados Durante la Noche
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            value={subjectiveForm.rememberedAwakeningsCount}
                                            onChange={e => setSubjectiveForm(prev => ({ ...prev, rememberedAwakeningsCount: parseInt(e.target.value) || 0 }))}
                                            style={{
                                                width: '100%',
                                                padding: '0.65rem 0.85rem',
                                                background: '#0F1218',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '0.85rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: 'white', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.4rem' }}>
                                        Notas o Sensaciones Subjetivas Adicionales
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={subjectiveForm.notes}
                                        onChange={e => setSubjectiveForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Ej: Me despertó el ruido del viento; me sentí cómodo durante la segunda mitad de la noche."
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            background: '#0F1218',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <button
                                        type="submit"
                                        disabled={savingSubjective}
                                        className="btn btn-primary"
                                        style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem', gap: '0.4rem' }}
                                    >
                                        {savingSubjective ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                                        <span>Guardar Evaluación Subjetiva</span>
                                    </button>

                                    {subjectiveSuccess && (
                                        <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <CheckCircle2 size={16} />
                                            <span>Guardado correctamente</span>
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.75rem',
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(15, 18, 24, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)'
                }}>
                    <div>
                        Motor: <strong style={{ color: 'white' }}>{report.algorithm}</strong> • Formato: <strong style={{ color: 'white' }}>{report.standard_id}</strong>
                    </div>
                    <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
