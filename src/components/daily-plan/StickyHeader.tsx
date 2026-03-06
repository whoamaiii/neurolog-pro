import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// Sticky Header Component (Liquid Glass Style)
export const StickyHeader: React.FC<{
    title: string;
    onBack: () => void;
    rightAction?: React.ReactNode;
}> = ({ title, onBack, rightAction }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-20 flex items-center bg-background-dark/80 p-4 pb-2 backdrop-blur-sm justify-between rounded-b-xl -mx-4 -mt-4 mb-2 border-b border-white/10"
        >
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onBack}
                aria-label="Back"
                className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            >
                <ArrowLeft size={20} />
            </motion.button>
            <h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">{title}</h1>
            <div className="flex size-10 items-center justify-center">
                {rightAction}
            </div>
        </motion.div>
    );
};
