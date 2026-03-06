import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogs, useCrisis, useChildProfile } from '../store';
import { analyzeLogs, analyzeLogsDeep } from '../services/ai';
import type { AnalysisResult, LogEntry } from '../types';
import { AnalysisDisplay, DateRangeFilter } from './insights';
import type { DateRangeValue } from './insights';

// Helper to calculate strategy effectiveness from logs
const calculateStrategyEffectiveness = (logs: LogEntry[]) => {
    const strategies: Record<string, { success: number; noChange: number; escalated: number; total: number }> = {};

    logs.forEach(log => {
        log.strategies.forEach(strategy => {
            if (!strategies[strategy]) {
                strategies[strategy] = { success: 0, noChange: 0, escalated: 0, total: 0 };
            }
            strategies[strategy].total++;

            if (log.strategyEffectiveness === 'helped') {
                strategies[strategy].success++;
            } else if (log.strategyEffectiveness === 'no_change') {
                strategies[strategy].noChange++;
            } else if (log.strategyEffectiveness === 'escalated') {
                strategies[strategy].escalated++;
            }
        });
    });

    // Convert to percentages and sort by total usage
    return Object.entries(strategies)
        .map(([name, data]) => ({
            name,
            successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0,
            noChangeRate: data.total > 0 ? Math.round((data.noChange / data.total) * 100) : 0,
            escalatedRate: data.total > 0 ? Math.round((data.escalated / data.total) * 100) : 0,
            total: data.total
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5 strategies
};

// Helper to build heatmap data
const buildHeatmapData = (logs: LogEntry[]) => {
    const heatmap: Record<string, Record<string, number[]>> = {
        morning: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
        midday: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
        afternoon: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
        evening: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
    };

    logs.forEach(log => {
        if (log.timeOfDay && log.dayOfWeek) {
            const timeKey = log.timeOfDay === 'night' ? 'evening' : log.timeOfDay;
            if (heatmap[timeKey] && heatmap[timeKey][log.dayOfWeek]) {
                heatmap[timeKey][log.dayOfWeek].push(log.arousal);
            }
        }
    });

    // Calculate averages
    const result: Record<string, Record<string, number>> = {};
    Object.entries(heatmap).forEach(([time, days]) => {
        result[time] = {};
        Object.entries(days).forEach(([day, values]) => {
            result[time][day] = values.length > 0
                ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
                : 0;
        });
    });

    return result;
};

export const BehaviorInsights: React.FC = () => {
    const navigate = useNavigate();
    const { logs } = useLogs();
    const { crisisEvents } = useCrisis();
    const { childProfile } = useChildProfile();

    // Analysis state
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [dateRange, setDateRange] = useState<DateRangeValue>('30');

    // Filter logs by date range
    const filteredLogs = useMemo(() => {
        const now = new Date();
        const daysAgo = parseInt(dateRange);
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return logs.filter(log => new Date(log.timestamp) >= startDate);
    }, [logs, dateRange]);

    const filteredCrisis = useMemo(() => {
        const now = new Date();
        const daysAgo = parseInt(dateRange);
        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return crisisEvents.filter(event => new Date(event.timestamp) >= startDate);
    }, [crisisEvents, dateRange]);

    // Calculate derived data
    const strategyData = useMemo(() => calculateStrategyEffectiveness(filteredLogs), [filteredLogs]);
    const heatmapData = useMemo(() => buildHeatmapData(filteredLogs), [filteredLogs]);

    // Run analysis
    const runAnalysis = useCallback(async (forceRefresh = false) => {
        if (filteredLogs.length < 3) {
            setAnalysis(null);
            return;
        }

        setIsAnalyzing(true);

        try {
            const result = await analyzeLogs(filteredLogs, filteredCrisis, {
                forceRefresh,
                childProfile
            });
            setAnalysis(result);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Analysis failed:', error);
            }
            setAnalysis(null);
        } finally {
            setIsAnalyzing(false);
        }
    }, [filteredLogs, filteredCrisis, childProfile]);

    // Deep Analysis handler
    const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);

    const handleDeepAnalysis = useCallback(async () => {
        if (filteredLogs.length < 3) return;

        setIsDeepAnalyzing(true);
        try {
            const result = await analyzeLogsDeep(filteredLogs, filteredCrisis, { childProfile });
            setAnalysis(result);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Deep analysis failed:', error);
            }
        } finally {
            setIsDeepAnalyzing(false);
        }
    }, [filteredLogs, filteredCrisis, childProfile]);

    // Run analysis on mount and when data changes
    useEffect(() => {
        const timeoutId = setTimeout(() => runAnalysis(), 300);
        return () => clearTimeout(timeoutId);
    }, [runAnalysis]);

    // Get most recent crisis event for timeline
    const latestCrisis = filteredCrisis.length > 0 ? filteredCrisis[0] : null;

    return (
        <div className="flex flex-col gap-4">
            {/* TopAppBar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-10 flex items-center bg-background-dark/80 p-4 pb-2 backdrop-blur-sm justify-between rounded-b-xl -mx-4 -mt-4 mb-2 border-b border-white/10"
            >
                <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white" aria-label="Gå tilbake">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Atferdsinnsikt</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleDeepAnalysis}
                        disabled={isAnalyzing || isDeepAnalyzing}
                        className={`h-10 px-4 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${isDeepAnalyzing
                            ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50'
                            : analysis?.isDeepAnalysis
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50 hover:bg-indigo-500/30'
                            }`}
                    >
                        {isDeepAnalyzing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Tenker...</span>
                            </>
                        ) : (
                            <>
                                <Brain size={16} />
                                <span>{analysis?.isDeepAnalysis ? 'Dyp Analyse' : 'Dyp Analyse'}</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => runAnalysis(true)}
                        disabled={isAnalyzing || isDeepAnalyzing}
                        className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        {isAnalyzing ? (
                            <Loader2 size={20} className="text-primary animate-spin" />
                        ) : (
                            <RefreshCw size={20} />
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Date Range Selector */}
            <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />

            {/* Loading State */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-3 py-4 text-primary"
                    >
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm font-medium">Analyserer med AI...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analysis Display */}
            <AnalysisDisplay
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                latestCrisis={latestCrisis}
                heatmapData={heatmapData}
                strategyData={strategyData}
            />

            <div className="h-5"></div>
        </div>
    );
};
