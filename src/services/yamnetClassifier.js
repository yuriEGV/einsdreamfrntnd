/**
 * EinsDream 3.0 - Event Labels & Metadata Definition
 * (Acoustic audio processing and classification is 100% on-device on the mobile app)
 */

export const EVENT_LABELS = {
    snore: { es: 'Ronquido', color: '#F59E0B', badge: 'badge-snore', icon: 'Volume2' },
    cough: { es: 'Tos', color: '#F43F5E', badge: 'badge-cough', icon: 'Activity' },
    breathing: { es: 'Respiración', color: '#06B6D4', badge: 'badge-breathing', icon: 'Wind' },
    irregular_breathing: { es: 'Respiración irregular', color: '#EC4899', badge: 'badge-irregular', icon: 'AlertTriangle' },
    voice: { es: 'Voz / Habla', color: '#8B5CF6', badge: 'badge-voice', icon: 'MessageSquare' },
    movement: { es: 'Movimiento', color: '#10B981', badge: 'badge-movement', icon: 'Move' },
    noise: { es: 'Ruido ambiental', color: '#94A3B8', badge: 'badge-noise', icon: 'Radio' },
    'auto-agent': { es: 'Auto-Agent (Móvil)', color: '#6366F1', badge: 'badge-auto', icon: 'Cpu' },
    unknown: { es: 'No determinado', color: '#64748B', badge: 'badge-unknown', icon: 'HelpCircle' }
};

export const initYAMNet = async () => true;
export const classifyAudioFrame = async () => null;
export default { EVENT_LABELS, initYAMNet, classifyAudioFrame };
