import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('EinsDream UI Error Caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '3rem 1.5rem',
                    maxWidth: '600px',
                    margin: '2rem auto',
                    textAlign: 'center',
                    background: 'rgba(30, 41, 59, 0.7)',
                    borderRadius: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: 'white'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem'
                    }}>
                        <AlertTriangle size={28} color="#EF4444" />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        Error al cargar esta sección
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Ocurrió una excepción al procesar los datos de visualización. Puedes intentar recargar.
                    </p>
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: '#F87171',
                        fontFamily: 'monospace',
                        textAlign: 'left',
                        marginBottom: '1.5rem',
                        overflowX: 'auto'
                    }}>
                        {this.state.error?.message || 'Error desconocido'}
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="btn btn-primary"
                        style={{ margin: '0 auto', gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} />
                        <span>Recargar Página</span>
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
