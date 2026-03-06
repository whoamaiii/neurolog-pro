import type { ChildProfile } from '../../types';
import type { PreparedLog, PreparedCrisis } from './dataPrep';
import { logsToSummaryStrings, crisisToSummaryStrings, generateStatsSummary } from './tokenOptimization';

// =============================================================================
// PROMPT ENGINEERING
// =============================================================================

/**
 * Builds a personalized context string from the child profile
 */
export const buildChildProfileContext = (profile: ChildProfile | null): string => {
    if (!profile) return '';

    const parts: string[] = [];

    // Basic info
    if (profile.name || profile.age) {
        const nameAge = [profile.name, profile.age ? `${profile.age} år` : ''].filter(Boolean).join(', ');
        parts.push(`Barnet: ${nameAge}`);
    }

    // Diagnoses
    if (profile.diagnoses.length > 0) {
        parts.push(`Diagnoser: ${profile.diagnoses.join(', ')}`);
    }

    // Communication style
    const commStyleMap: Record<string, string> = {
        'verbal': 'Verbal kommunikasjon',
        'limited_verbal': 'Begrenset verbal kommunikasjon',
        'non_verbal': 'Non-verbal',
        'aac': 'Bruker ASK/AAC'
    };
    if (profile.communicationStyle) {
        parts.push(`Kommunikasjon: ${commStyleMap[profile.communicationStyle] || profile.communicationStyle}`);
    }

    // Sensory profile
    if (profile.sensorySensitivities.length > 0) {
        parts.push(`Sensoriske utfordringer: ${profile.sensorySensitivities.join(', ')}`);
    }
    if (profile.seekingSensory.length > 0) {
        parts.push(`Sensorisk søking: ${profile.seekingSensory.join(', ')}`);
    }

    // Effective strategies
    if (profile.effectiveStrategies.length > 0) {
        parts.push(`Kjente effektive strategier: ${profile.effectiveStrategies.join(', ')}`);
    }

    // Additional context
    if (profile.additionalContext) {
        parts.push(`Tilleggsinformasjon: ${profile.additionalContext}`);
    }

    return parts.length > 0 ? `\n\nBARNETS PROFIL:\n${parts.join('\n')}` : '';
};

export const buildSystemPrompt = (childProfile?: ChildProfile | null): string => {
    const profileContext = buildChildProfileContext(childProfile || null);

    return `Du er en ekspert på nevrodivergens, Low Arousal-metodikk, og atferdsanalyse for barn med autisme og ADHD.
${profileContext}

VIKTIG INSTRUKSJONER:
1. Analyser data for å finne KAUSALE sammenhenger, ikke bare korrelasjoner
2. Fokusér på samspillet mellom biologiske faktorer (Interosepsjon/Energi) og ytre krav
3. Vurder tidsmønstre: Når på dagen/uken oppstår problemer?
4. Identifiser forvarsler og eskaleringsmønstre
5. Evaluer hvilke strategier som faktisk fungerer vs. hvilke som brukes mest
6. Gi konkrete, handlingsorienterte anbefalinger
${childProfile?.effectiveStrategies?.length ? `7. Prioriter kjente effektive strategier for dette barnet: ${childProfile.effectiveStrategies.join(', ')}` : ''}

ANALYSEPERSPEKTIV:
- Spoon Theory: Lav energi (< 4) = redusert kapasitet for krav
- Arousal > 7 = høy aktivering, risiko for overbelastning
- Valens < 4 = negativ stemning, behov for støtte
- Kombinasjonen lav energi + høy arousal = kritisk tilstand

RETURNER alltid JSON med eksakt denne strukturen:
{
    "triggerAnalysis": "string - Detaljert analyse av triggere og kontekster",
    "strategyEvaluation": "string - Evaluering av strategier med effektivitetsdata",
    "interoceptionPatterns": "string - Mønstre knyttet til biologiske behov",
    "correlations": [
        {
            "factor1": "string",
            "factor2": "string",
            "relationship": "string",
            "strength": "weak|moderate|strong",
            "description": "string"
        }
    ],
    "recommendations": ["string - konkret anbefaling 1", "string - konkret anbefaling 2"],
    "summary": "string - Helhetlig oppsummering med hovedfunn"
}`;
};

export const buildUserPrompt = (
    preparedLogs: PreparedLog[],
    preparedCrisis: PreparedCrisis[],
    totalDays: number,
    useTokenOptimization: boolean = true
): string => {
    const hasCrisisData = preparedCrisis.length > 0;

    let prompt = `Analyser følgende datasett fra ${totalDays} dager med ${preparedLogs.length} logger`;
    if (hasCrisisData) {
        prompt += ` og ${preparedCrisis.length} krisehendelser`;
    }
    prompt += ':\n\n';

    // Use token-optimized format (summary strings) or full JSON
    if (useTokenOptimization) {
        // Add statistical summary first for context
        prompt += generateStatsSummary(preparedLogs, preparedCrisis);
        prompt += '\n';

        // Compact log format
        prompt += `=== DETALJERTE LOGGER ===\n`;
        prompt += `Format: Tid (Kontekst) | A:arousal | V:valens | E:energi | Triggere | Tiltak(effekt)\n`;
        prompt += `Effekt-symboler: ✓=hjalp, ✗=eskalerte, ~=ingen endring\n\n`;
        prompt += logsToSummaryStrings(preparedLogs);

        if (hasCrisisData) {
            prompt += `\n\n=== KRISEHENDELSER ===\n`;
            prompt += crisisToSummaryStrings(preparedCrisis);
        }
    } else {
        // Full JSON format (more expensive but preserves all details)
        prompt += `=== DAGLIGE LOGGER (${preparedLogs.length} stk) ===\n`;
        prompt += JSON.stringify(preparedLogs, null, 2);

        if (hasCrisisData) {
            prompt += `\n\n=== KRISEHENDELSER (${preparedCrisis.length} stk) ===\n`;
            prompt += JSON.stringify(preparedCrisis, null, 2);
        }
    }

    prompt += `\n\nSPESIFIKKE SPØRSMÅL:
1. TRIGGER-ANALYSE: Hvilke spesifikke kontekster og kombinasjoner fører oftest til Arousal > 7?
2. STRATEGI-EVALUERING: Hvilke tiltak har høyest dokumentert effekt? Sammenlign med bruksfrekvens.
3. INTEROSEPSJON: Er det mønstre knyttet til energinivå, sult, søvn som påvirker regulering?
4. TIDSMØNSTRE: Hvilke dager/tider er mest sårbare?`;

    if (hasCrisisData) {
        prompt += `\n5. KRISE-PREDIKSJON: Hvilke forvarsler og kombinasjoner forutsår krisehendelser?
6. GJENOPPRETTINGSTID: Hva påvirker hvor raskt barnet kommer tilbake etter krise?`;
    }

    return prompt;
};
