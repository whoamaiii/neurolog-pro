/**
 * Shared formatting utilities
 */

/** Format seconds into MM:SS display string */
export const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/** Get CSS color class based on arousal level (1-10 scale).
 *  When logCount is provided and is 0, returns a neutral color. */
export const getArousalColor = (level: number, logCount?: number): string => {
    if (logCount !== undefined && logCount === 0) return 'bg-slate-800/30';
    if (level <= 3) return 'bg-emerald-500/70';
    if (level <= 4) return 'bg-emerald-400/70';
    if (level <= 5) return 'bg-yellow-400/70';
    if (level <= 6) return 'bg-orange-400/70';
    if (level <= 7) return 'bg-orange-500/70';
    if (level <= 8) return 'bg-red-400/70';
    return 'bg-red-600/80';
};
