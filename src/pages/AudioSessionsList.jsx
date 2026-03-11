import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Loader2, Music, Clock, Smartphone, Calendar, Headphones } from 'lucide-react';

import { API_URL } from '../config';

export default function AudioSessionsList() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [audioMap, setAudioMap] = useState({}); // { sessionId: base64Data }
    const [fetchingAudio, setFetchingAudio] = useState({}); // { sessionId: boolean }

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get(`${API_URL}/admin/sessions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSessions(response.data);
            } catch (error) {
                console.error('Error fetching sessions', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const loadAudio = async (sessionId) => {
        if (audioMap[sessionId] || fetchingAudio[sessionId]) return;

        setFetchingAudio(prev => ({ ...prev, [sessionId]: true }));
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/sessions/${sessionId}/audio`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // CRITICAL: Prepend base64 prefix if not present
            let base64 = response.data.audioBase64;
            if (base64 && !base64.startsWith('data:')) {
                base64 = `data:audio/m4a;base64,${base64}`;
            }
            setAudioMap(prev => ({ ...prev, [sessionId]: base64 }));
        } catch (error) {
            console.error('Error fetching audio data', error);
        } finally {
            setFetchingAudio(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-700">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Headphones className="w-8 h-8 text-indigo-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Recording Sessions</h1>
                    <p className="text-slate-400 mt-1">Manage and playback all smart recordings from devices</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden border border-white/5 rounded-3xl bg-slate-900/40 backdrop-blur-xl shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-5 text-sm font-semibold text-slate-300">ID</th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-300">User Email</th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-300">
                                    <div className="flex items-center gap-2"><Clock size={16} /> Duration</div>
                                </th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Type</th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-300">
                                    <div className="flex items-center gap-2"><Smartphone size={16} /> Device</div>
                                </th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-300">
                                    <div className="flex items-center gap-2"><Calendar size={16} /> Date</div>
                                </th>
                                <th className="px-6 py-5 text-sm font-semibold text-slate-300">Audio Playback</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sessions.map((s, idx) => (
                                <tr key={s._id} className="hover:bg-white/5 transition-colors duration-200 group">
                                    <td className="px-6 py-5 text-sm font-mono text-slate-500">#{s._id.substring(s._id.length - 6)}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium">{s.userId?.email || 'Unknown User'}</span>
                                            <span className="text-xs text-slate-500">UID: {s.userId?._id?.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-300">{s.duration} s</td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            {s.eventType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-slate-400 font-medium capitalize">{s.deviceModel || 'N/A'}</td>
                                    <td className="px-6 py-5 text-slate-400 text-sm italic">
                                        {new Date(s.createdAt).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-5 min-w-[280px]">
                                        {audioMap[s._id] ? (
                                            <div className="bg-white/5 p-2 rounded-2xl border border-white/5 shadow-inner">
                                                <audio controls src={audioMap[s._id]} className="h-9 w-full opacity-90 transition-opacity hover:opacity-100" autoPlay>
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => loadAudio(s._id)}
                                                className="group relative flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-300 border border-white/10 active:scale-95 disabled:opacity-50"
                                                disabled={fetchingAudio[s._id]}
                                            >
                                                {fetchingAudio[s._id] ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                                        <span className="text-sm font-medium">Fetching...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="p-1 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/40 transition-colors">
                                                            <Play size={14} className="fill-indigo-400 text-indigo-400" />
                                                        </div>
                                                        <span className="text-sm font-medium">Listen Record</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sessions.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-center px-4">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
                            <Music className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-300 mb-1">Silence is golden</h3>
                        <p className="max-w-xs mx-auto text-sm">No recordings found yet. Start recording with the mobile app to see sounds appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
