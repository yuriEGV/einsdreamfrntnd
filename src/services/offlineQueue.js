/**
 * Offline Sync Queue for Einsdream 2.0
 * Stores events in localStorage / memory if internet is disconnected,
 * and automatically uploads them via /api/sessions/bulk when connection returns.
 */

import axios from 'axios';
import { API_URL } from '../config';

const QUEUE_KEY = 'einsdream_offline_queue_v2';

export const getOfflineQueue = () => {
    try {
        const stored = localStorage.getItem(QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const addToOfflineQueue = (eventItem) => {
    try {
        const queue = getOfflineQueue();
        queue.push({
            ...eventItem,
            queuedAt: new Date().toISOString()
        });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        dispatchQueueUpdate();
    } catch (e) {
        console.error('Failed to add to offline queue:', e);
    }
};

export const clearOfflineQueue = () => {
    localStorage.removeItem(QUEUE_KEY);
    dispatchQueueUpdate();
};

export const syncOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { synced: 0 };

    const token = localStorage.getItem('adminToken');
    if (!token) return { synced: 0, error: 'No auth token' };

    try {
        const res = await axios.post(`${API_URL}/sessions/bulk`, { events: queue }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data && res.data.insertedCount) {
            clearOfflineQueue();
            return { synced: res.data.insertedCount };
        }
    } catch (err) {
        console.warn('Offline sync attempt failed:', err.message);
        return { synced: 0, error: err.message };
    }
    return { synced: 0 };
};

const dispatchQueueUpdate = () => {
    window.dispatchEvent(new CustomEvent('einsdream:queue_updated', {
        detail: { count: getOfflineQueue().length }
    }));
};

// Listen for browser coming back online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[Einsdream] Internet connection restored, syncing queue...');
        syncOfflineQueue();
    });
}
