import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NewActivityModalProps } from './types';
import { ACTIVITY_ICONS } from './types';

// New/Edit Activity Modal (Liquid Glass Style)
export const NewActivityModal: React.FC<NewActivityModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editActivity,
    onDelete,
    onDuplicate
}) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState(editActivity?.title || '');
    const [icon, setIcon] = useState(editActivity?.icon || '📚');
    const [startTime, setStartTime] = useState(editActivity?.time || '09:00');
    const [duration, setDuration] = useState(editActivity?.durationMinutes || 30);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Reset form when modal opens with new/edit activity
    React.useEffect(() => {
        if (isOpen) {
            setTitle(editActivity?.title || '');
            setIcon(editActivity?.icon || '📚');
            setStartTime(editActivity?.time || '09:00');
            setDuration(editActivity?.durationMinutes || 30);
            setValidationError(null);
        }
    }, [isOpen, editActivity]);

    const calculateEndTime = (start: string, mins: number) => {
        const [h, m] = start.split(':').map(Number);
        const totalMins = h * 60 + m + mins;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            setValidationError(t('visualSchedule.modal.validation.titleRequired'));
            return false;
        }
        if (duration <= 0) {
            setValidationError(t('visualSchedule.modal.validation.durationInvalid'));
            return false;
        }
        setValidationError(null);
        return true;
    };

    const handleSave = () => {
        if (!validateForm()) return;
        onSave({
            title: title.trim(),
            icon,
            time: startTime,
            endTime: calculateEndTime(startTime, duration),
            durationMinutes: duration
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="activity-modal-title"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-md rounded-3xl overflow-hidden liquid-glass-card"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 id="activity-modal-title" className="text-xl font-bold text-white">
                                {editActivity ? t('visualSchedule.modal.editTitle') : t('visualSchedule.modal.newTitle')}
                            </h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                aria-label={t('visualSchedule.modal.cancel')}
                            >
                                <X size={20} className="text-white/70" aria-hidden="true" />
                            </motion.button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Validation Error */}
                            {validationError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm"
                                    role="alert"
                                >
                                    {validationError}
                                </motion.div>
                            )}

                            {/* Title Input */}
                            <div>
                                <label htmlFor="activity-title" className="block text-white/60 text-sm font-medium mb-2">{t('visualSchedule.modal.titleLabel')}</label>
                                <input
                                    id="activity-title"
                                    type="text"
                                    value={title}
                                    onChange={e => {
                                        setTitle(e.target.value);
                                        if (validationError) setValidationError(null);
                                    }}
                                    placeholder={t('visualSchedule.modal.titlePlaceholder')}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                                    aria-required="true"
                                    aria-invalid={validationError ? 'true' : 'false'}
                                />
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-white/60 text-sm font-medium mb-2">{t('visualSchedule.modal.iconLabel')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {ACTIVITY_ICONS.map(emoji => (
                                        <motion.button
                                            key={emoji}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setIcon(emoji)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${icon === emoji
                                                ? 'bg-cyan-500/30 border-2 border-cyan-400/50'
                                                : 'bg-white/10 border border-white/10 hover:bg-white/20'
                                                }`}
                                            style={icon === emoji ? { boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' } : {}}
                                        >
                                            {emoji}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Time & Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/60 text-sm font-medium mb-2">{t('visualSchedule.modal.startTime')}</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm font-medium mb-2">{t('visualSchedule.modal.duration')}</label>
                                    <select
                                        value={duration}
                                        onChange={e => setDuration(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                                    >
                                        <option value={15}>15 {t('settings.minutes', { defaultValue: 'min' })}</option>
                                        <option value={30}>30 {t('settings.minutes', { defaultValue: 'min' })}</option>
                                        <option value={45}>45 {t('settings.minutes', { defaultValue: 'min' })}</option>
                                        <option value={60}>1 {t('settings.hour', { defaultValue: 'time' })}</option>
                                        <option value={90}>1.5 {t('settings.hours', { defaultValue: 'timer' })}</option>
                                        <option value={120}>2 {t('settings.hours', { defaultValue: 'timer' })}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0 flex gap-3">
                            {editActivity && (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onDelete}
                                        className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onDuplicate}
                                        className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                                    >
                                        <Copy size={18} />
                                    </motion.button>
                                </>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="flex-1 px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white/70 font-medium hover:bg-white/15 transition-colors"
                            >
                                {t('visualSchedule.modal.cancel')}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={!title.trim()}
                                className="flex-1 px-6 py-3 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: 'linear-gradient(135deg, #00D4FF 0%, #007AFF 100%)',
                                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.2)'
                                }}
                            >
                                {editActivity ? t('visualSchedule.modal.save') : t('visualSchedule.modal.add')}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
