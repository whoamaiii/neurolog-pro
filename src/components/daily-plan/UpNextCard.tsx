import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Activity } from './types';

// Up Next Card Component
export const UpNextCard: React.FC<{ activity: Activity }> = ({ activity }) => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-4 liquid-glass-card"
            role="region"
            aria-label={`${t('visualSchedule.next')}: ${activity.title}`}
        >
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl">
                    {activity.icon}
                </div>
                <div className="flex-1">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{t('visualSchedule.next')}</p>
                    <h3 className="text-white font-bold text-lg">{activity.title}</h3>
                    <p className="text-white/50 text-sm">{activity.time} - {activity.endTime}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Clock size={20} className="text-white/40" />
                </div>
            </div>
        </motion.div>
    );
};
