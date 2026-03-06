import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Pencil } from 'lucide-react';
import type { TimelineItemProps } from './types';

// Timeline Item Component (Liquid Glass Style)
export const TimelineItem: React.FC<TimelineItemProps> = ({
    activity,
    isLast,
    onEdit,
    onComplete
}) => {
    const getStatusStyles = () => {
        switch (activity.status) {
            case 'completed':
                return {
                    dot: { background: '#22C55E', border: '2px solid #22C55E', boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' },
                    card: { opacity: 0.6 },
                    connector: 'bg-green-500/50'
                };
            case 'current':
                return {
                    dot: { background: '#00D4FF', border: '2px solid #00D4FF', boxShadow: '0 0 20px rgba(0, 212, 255, 0.5), 0 0 0 4px rgba(0, 212, 255, 0.2)' },
                    card: {
                        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        transform: 'scale(1.02)'
                    },
                    connector: 'bg-gradient-to-b from-cyan-500/50 to-purple-500/30'
                };
            default:
                return {
                    dot: { background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' },
                    card: {
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        opacity: 0.7
                    },
                    connector: 'bg-white/20'
                };
        }
    };

    const styles = getStatusStyles();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex gap-4"
        >
            {/* Timeline connector line */}
            <div className="flex flex-col items-center">
                {/* Dot */}
                <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-4 h-4 rounded-full z-10 transition-all flex items-center justify-center"
                    style={styles.dot}
                >
                    {activity.status === 'completed' && (
                        <CheckCircle size={10} className="text-white" />
                    )}
                </motion.div>
                {/* Connector line */}
                {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[60px] ${styles.connector}`} />
                )}
            </div>

            {/* Activity Card */}
            <motion.div
                whileHover={{ scale: activity.status !== 'current' ? 1.02 : 1 }}
                className={`flex-1 rounded-2xl p-4 mb-3 transition-all cursor-pointer group ${activity.status === 'current' ? 'liquid-glass-active' : 'liquid-glass-card'
                    }`}
                style={styles.card}
                onClick={() => onEdit(activity.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEdit(activity.id);
                    }
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
                        {activity.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate ${activity.status === 'current' ? 'text-white' : 'text-white/80'}`}>
                            {activity.title}
                        </h4>
                        <p className="text-white/50 text-sm">{activity.time} - {activity.endTime}</p>
                    </div>

                    {/* Status indicator */}
                    {activity.status === 'completed' && (
                        <CheckCircle size={20} className="text-green-400 shrink-0" />
                    )}
                    {activity.status === 'current' && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onComplete(activity.id);
                            }}
                            className="p-2 rounded-lg shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
                                boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)'
                            }}
                        >
                            <CheckCircle size={16} className="text-white" />
                        </motion.button>
                    )}

                    {/* Edit button on hover */}
                    {activity.status !== 'current' && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/10 hover:bg-white/20"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(activity.id);
                            }}
                        >
                            <Pencil size={14} className="text-white/70" />
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
