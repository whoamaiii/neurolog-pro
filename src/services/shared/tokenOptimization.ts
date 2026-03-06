import type { PreparedLog, PreparedCrisis } from './dataPrep';

// =============================================================================
// TOKEN OPTIMIZATION - Compress logs to summary strings to save API costs
// =============================================================================

/**
 * Converts logs to compact summary strings instead of full JSON
 * Format: "Tirsdag 14:00: Høy Arousal (8), Trigger: Lyd, Tiltak: Skjerming (Mislykket)"
 * This significantly reduces token usage while preserving essential information
 */
export const logsToSummaryStrings = (logs: PreparedLog[]): string => {
    if (logs.length === 0) return 'Ingen logger tilgjengelig.';

    const summaries = logs.map(log => {
        const parts: string[] = [];

        // Time and context
        parts.push(`${log.relativeTime} (${log.context})`);

        // Core metrics with interpretation
        const arousalLevel = log.arousal <= 3 ? 'Lav' : log.arousal <= 6 ? 'Moderat' : 'Høy';
        const valenceLevel = log.valence <= 3 ? 'Negativ' : log.valence <= 6 ? 'Nøytral' : 'Positiv';
        const energyLevel = log.energy <= 3 ? 'Lav' : log.energy <= 6 ? 'Moderat' : 'Høy';

        parts.push(`A:${log.arousal}(${arousalLevel})`);
        parts.push(`V:${log.valence}(${valenceLevel})`);
        parts.push(`E:${log.energy}(${energyLevel})`);

        // Triggers (abbreviated)
        if (log.triggers.length > 0) {
            parts.push(`Triggere:[${log.triggers.join(',')}]`);
        }

        // Strategies and effectiveness
        if (log.strategies.length > 0) {
            const effectSymbol = log.strategyEffectiveness === 'helped' ? '✓' :
                log.strategyEffectiveness === 'escalated' ? '✗' : '~';
            parts.push(`Tiltak:[${log.strategies.join(',')}](${effectSymbol})`);
        }

        // Note if present
        if (log.note && log.note.trim()) {
            const shortNote = log.note.length > 50 ? log.note.substring(0, 50) + '...' : log.note;
            parts.push(`"${shortNote}"`);
        }

        return parts.join(' | ');
    });

    return summaries.join('\n');
};

/**
 * Converts crisis events to compact summary strings
 */
export const crisisToSummaryStrings = (events: PreparedCrisis[]): string => {
    if (events.length === 0) return '';

    const summaries = events.map(event => {
        const parts: string[] = [];

        // Time, type and context
        const typeMap: Record<string, string> = {
            'meltdown': 'Nedsmelting',
            'shutdown': 'Shutdown',
            'anxiety': 'Angst',
            'sensory_overload': 'Sensorisk overbelastning',
            'other': 'Annet'
        };
        parts.push(`${event.relativeTime}: ${typeMap[event.type] || event.type} (${event.context})`);

        // Duration and intensity
        parts.push(`Varighet:${event.durationMinutes}min, Intensitet:${event.peakIntensity}/10`);

        // Preceding state if available
        if (event.precedingArousal !== undefined || event.precedingEnergy !== undefined) {
            const preParts: string[] = [];
            if (event.precedingArousal !== undefined) preParts.push(`A:${event.precedingArousal}`);
            if (event.precedingEnergy !== undefined) preParts.push(`E:${event.precedingEnergy}`);
            parts.push(`Før:[${preParts.join(',')}]`);
        }

        // Warning signs
        if (event.warningSignsObserved.length > 0) {
            parts.push(`Forvarsler:[${event.warningSignsObserved.slice(0, 3).join(',')}]`);
        }

        // Triggers
        if (event.triggers.length > 0) {
            parts.push(`Triggere:[${event.triggers.join(',')}]`);
        }

        // Resolution
        const resolutionMap: Record<string, string> = {
            'self_regulated': 'Selvregulert',
            'co_regulated': 'Samregulert',
            'timed_out': 'Utløpt',
            'interrupted': 'Avbrutt'
        };
        parts.push(`Løsning:${resolutionMap[event.resolution] || event.resolution}`);

        // Recovery time
        if (event.recoveryTimeMinutes !== undefined) {
            parts.push(`Restitusjon:${event.recoveryTimeMinutes}min`);
        }

        return parts.join(' | ');
    });

    return summaries.join('\n');
};

/**
 * Generates statistical summary of logs for context
 */
export const generateStatsSummary = (logs: PreparedLog[], crisisEvents: PreparedCrisis[]): string => {
    if (logs.length === 0) return '';

    // Calculate averages
    const avgArousal = logs.reduce((sum, l) => sum + l.arousal, 0) / logs.length;
    const avgValence = logs.reduce((sum, l) => sum + l.valence, 0) / logs.length;
    const avgEnergy = logs.reduce((sum, l) => sum + l.energy, 0) / logs.length;

    // Count high arousal events
    const highArousalCount = logs.filter(l => l.arousal >= 7).length;
    const lowEnergyCount = logs.filter(l => l.energy <= 3).length;

    // Count triggers
    const triggerCounts: Record<string, number> = {};
    logs.forEach(log => {
        log.triggers.forEach(t => {
            triggerCounts[t] = (triggerCounts[t] || 0) + 1;
        });
    });
    const topTriggers = Object.entries(triggerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t, c]) => `${t}(${c})`);

    // Count strategies
    const strategyCounts: Record<string, { total: number; helped: number; escalated: number }> = {};
    logs.forEach(log => {
        log.strategies.forEach(s => {
            if (!strategyCounts[s]) {
                strategyCounts[s] = { total: 0, helped: 0, escalated: 0 };
            }
            strategyCounts[s].total++;
            if (log.strategyEffectiveness === 'helped') strategyCounts[s].helped++;
            if (log.strategyEffectiveness === 'escalated') strategyCounts[s].escalated++;
        });
    });
    const strategyStats = Object.entries(strategyCounts)
        .map(([s, c]) => {
            const successRate = c.total > 0 ? Math.round((c.helped / c.total) * 100) : 0;
            return `${s}:${successRate}% effektiv (n=${c.total})`;
        })
        .slice(0, 5);

    return `
=== STATISTISK SAMMENDRAG ===
Totalt ${logs.length} logger, ${crisisEvents.length} krisehendelser

GJENNOMSNITT:
- Arousal: ${avgArousal.toFixed(1)}/10
- Valens: ${avgValence.toFixed(1)}/10
- Energi: ${avgEnergy.toFixed(1)}/10

MØNSTRE:
- Høy arousal (≥7): ${highArousalCount} hendelser (${Math.round(highArousalCount / logs.length * 100)}%)
- Lav energi (≤3): ${lowEnergyCount} hendelser (${Math.round(lowEnergyCount / logs.length * 100)}%)

TOPP TRIGGERE: ${topTriggers.join(', ') || 'Ingen registrert'}

STRATEGI-EFFEKTIVITET:
${strategyStats.join('\n') || 'Ingen data'}
`;
};
