import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export type DateRangeValue = '7' | '30' | '90';

interface DateRangeFilterProps {
    dateRange: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
}

const options = [
    { value: '7' as const, label: '7 Dager' },
    { value: '30' as const, label: '30 Dager' },
    { value: '90' as const, label: '90 Dager' }
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ dateRange, onChange }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2"
        >
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`flex items-center justify-center rounded-full h-10 px-4 gap-2 text-sm font-bold transition-colors ${dateRange === option.value
                        ? 'bg-primary text-white'
                        : 'bg-primary/20 text-white hover:bg-primary/30'
                        }`}
                >
                    <Calendar size={16} />
                    <span>{option.label}</span>
                </button>
            ))}
        </motion.div>
    );
};
