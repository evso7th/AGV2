'use client';

/**
 * ДЕВ-страница калибровки громкости гитар (Option A).
 * Один клик «Run» → офлайн-замер всех гитар → таблица RMS и трим-дБ (vs telecaster).
 * Числа из колонки dB вписываются в GUITAR_LOUDNESS_TRIM_DB (guitar-loudness.ts).
 */

import { useState } from 'react';
import { measureGuitarLoudness, type LoudnessRow } from '@/lib/guitar-loudness-calibration';

export default function CalibratePage() {
    const [rows, setRows] = useState<Record<string, LoudnessRow> | null>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async () => {
        setRunning(true);
        setError(null);
        setRows(null);
        try {
            const table = await measureGuitarLoudness();
            setRows(table);
            console.log('[Calibrate] Guitar loudness:', table);
        } catch (e: any) {
            setError(e?.message || String(e));
            console.error('[Calibrate] error:', e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#eee', background: '#111', minHeight: '100vh' }}>
            <h1 style={{ fontSize: 18, marginBottom: 12 }}>Guitar Loudness Calibration (dev)</h1>
            <p style={{ opacity: 0.7, fontSize: 12, marginBottom: 16 }}>
                Offline RMS measurement (A3, vel 0.8, window 0.55–0.80 s). Reference — telecaster (0 dB).
                Column <b>db</b> = trim for GUITAR_LOUDNESS_TRIM_DB.
            </p>
            <button
                onClick={run}
                disabled={running}
                style={{ padding: '8px 20px', fontWeight: 700, cursor: running ? 'default' : 'pointer', marginBottom: 20 }}
            >
                {running ? 'Measuring…' : 'Run Calibration'}
            </button>

            {error && <pre style={{ color: '#ff6b6b' }}>{error}</pre>}

            {rows && (
                <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr><th style={th}>instrument</th><th style={th}>RMS</th><th style={th}>trim dB (→ telecaster)</th></tr>
                    </thead>
                    <tbody>
                        {Object.entries(rows).map(([k, v]) => (
                            <tr key={k}>
                                <td style={td}>{k}</td>
                                <td style={td}>{v.rms.toFixed(6)}</td>
                                <td style={{ ...td, fontWeight: 700, color: '#7CFC9A' }}>{v.db >= 0 ? '+' : ''}{v.db.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '6px 16px', borderBottom: '1px solid #444' };
const td: React.CSSProperties = { padding: '4px 16px', borderBottom: '1px solid #222' };
