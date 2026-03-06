import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    Play,
    Pause,
    RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CurrentActivityCardProps } from './types';

// Current Activity Card Component (Liquid Glass Style)
export const CurrentActivityCard: React.FC<CurrentActivityCardProps> = ({
    activity,
    onComplete,
    timerActive,
    timeRemaining,
    progress,
    onStartTimer,
    onPauseTimer,
    onResetTimer,
    formatTime,
    timerStarted
}) => {
    const { t } = useTranslation();

    return (
        <motion.div
            key={activity.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative overflow-hidden rounded-3xl liquid-glass-active"
            role="region"
            aria-label={`${t('visualSchedule.currentActivity')}: ${activity.title}`}
        >
            {/* Animated gradient background */}
            <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                    background: [
                        'linear-gradient(135deg, rgba(0, 212, 255, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)',
                        'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(0, 212, 255, 0.2) 100%)',
                        'linear-gradient(135deg, rgba(0, 212, 255, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)',
                    ]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 progress-glow"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Large icon background decoration */}
            <div className="absolute -right-4 -top-4 text-[120px] opacity-10 select-none pointer-events-none">
                {activity.icon}
            </div>

            <div className="relative z-10 p-6">
                {/* Status Badge */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
                    style={{
                        background: 'rgba(0, 212, 255, 0.2)',
                        border: '1px solid rgba(0, 212, 255, 0.4)'
                    }}
                >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">{t('visualSchedule.now')}</span>
                </motion.div>

                {/* Activity Icon & Title */}
                <div className="flex items-start gap-4 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl liquid-glass-card"
                        aria-hidden="true"
                    >
                        {activity.icon}
                    </motion.div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-1">{activity.title}</h1>
                        <p className="text-white/60 text-lg">{activity.time} - {activity.endTime}</p>
                    </div>
                </div>

                {/* Timer Display */}
                <AnimatePresence>
                    {timerStarted && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                        >
                            <div className="rounded-2xl p-4 liquid-glass-card">
                                <p className="text-white/50 text-sm font-medium mb-1 uppercase tracking-wider">{t('visualSchedule.timeRemaining')}</p>
                                <p
                                    className={`text-5xl font-bold tabular-nums ${timeRemaining <= 60 ? 'neon-text-blue animate-pulse' : 'text-white'}`}
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {formatTime(timeRemaining)}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3" role="group" aria-label="Controllers">
                    {!timerStarted ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onStartTimer}
                            className="flex-1 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 neon-glow-blue"
                            style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #007AFF 100%)' }}
                        >
                            <Play size={20} aria-hidden="true" />
                            {t('visualSchedule.startTimer')}
                        </motion.button>
                    ) : (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={timerActive ? onPauseTimer : onStartTimer}
                                className="flex-1 text-white px-4 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors liquid-glass-card"
                            >
                                {timerActive ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
                                {timerActive ? t('visualSchedule.pauseTimer') : t('visualSchedule.resumeTimer')}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onResetTimer}
                                className="text-white/70 px-4 py-4 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors liquid-glass-card"
                                aria-label={t('visualSchedule.resetTimer')}
                            >
                                <RotateCcw size={20} aria-hidden="true" />
                            </motion.button>
                        </>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onComplete}
                        className="flex-1 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 neon-glow-green"
                        style={{ background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)' }}
                    >
                        <CheckCircle size={20} aria-hidden="true" />
                        {t('visualSchedule.complete')}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
