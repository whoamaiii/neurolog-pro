import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// All Done Card (Liquid Glass Style)
export const AllDoneCard: React.FC = () => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 text-center liquid-glass-card"
            role="status"
            aria-label={t('visualSchedule.allDone.title')}
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center neon-glow-green"
                style={{ background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)' }}
                aria-hidden="true"
            >
                <CheckCircle size={40} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('visualSchedule.allDone.title')}</h2>
            <p className="text-white/60">{t('visualSchedule.allDone.subtitle')}</p>
        </motion.div>
    );
};
