import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConfirmDeleteModalProps } from './types';

// Confirm Delete Modal Component
export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    activityTitle
}) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-modal-title"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-sm rounded-2xl p-6 liquid-glass-card"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Trash2 size={32} className="text-red-400" />
                            </div>
                            <h2 id="delete-modal-title" className="text-xl font-bold text-white mb-2">
                                {t('visualSchedule.deleteModal.title')}
                            </h2>
                            <p className="text-white/60">
                                {t('visualSchedule.deleteModal.description', { title: activityTitle })}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                            >
                                {t('visualSchedule.modal.cancel')}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                className="flex-1 px-4 py-3 rounded-xl text-white font-bold neon-glow-green"
                                style={{
                                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                }}
                            >
                                {t('visualSchedule.modal.delete')}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
