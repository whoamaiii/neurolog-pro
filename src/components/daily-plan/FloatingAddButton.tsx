import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Floating Add Button (Liquid Glass Style)
export const FloatingAddButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { t } = useTranslation();
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full text-white flex items-center justify-center z-40 neon-glow-blue"
            style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #007AFF 100%)' }}
            aria-label={t('visualSchedule.modal.add')}
        >
            <Plus size={28} aria-hidden="true" />
        </motion.button>
    );
};
