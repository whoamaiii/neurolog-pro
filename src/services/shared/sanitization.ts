// =============================================================================
// DATA SANITIZATION
// =============================================================================

/**
 * Sanitizes text to remove potential personal identifiers
 * - Replaces names (capitalized words not at sentence start)
 * - Removes potential phone numbers
 * - Removes potential addresses
 */
export const sanitizeText = (text: string): string => {
    if (!text) return '';

    const sanitized = text
        // Remove names (capitalized words not at sentence start)
        .replace(/(?<!^|\. |\? |! |: )([A-Z][a-z]+)/g, '[PERSON]')
        // Remove potential phone numbers
        .replace(/\b\d{8,}\b/g, '[PHONE]')
        // Remove email addresses
        .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');

    return sanitized;
};

/**
 * Converts timestamps to relative format for privacy
 */
export const makeTimestampRelative = (timestamp: string, referenceDate: Date): string => {
    const date = new Date(timestamp);
    const diffDays = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const hour = date.getHours();
    const timeLabel = hour < 10 ? 'morgen' : hour < 14 ? 'formiddag' : hour < 18 ? 'ettermiddag' : 'kveld';

    if (diffDays === 0) return `I dag, ${timeLabel}`;
    if (diffDays === -1) return `I går, ${timeLabel}`;
    return `Dag ${Math.abs(diffDays) + 1}, ${timeLabel}`;
};
