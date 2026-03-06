import React from 'react';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface PreferencesSectionProps {
    show3DBackground: boolean;
    onToggle3DBackground: (enabled: boolean) => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
    show3DBackground,
    onToggle3DBackground
}) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="liquid-glass-card p-5 rounded-3xl space-y-4"
        >
            <div className="flex items-center gap-2 mb-2">
                <Monitor size={18} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-white">{t('settings.appearance.title')}</h2>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <label htmlFor="toggle-3d-bg" className="text-sm text-white font-medium cursor-pointer">
                        {t('settings.appearance.3dBackground.label')}
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                        {t('settings.appearance.3dBackground.note')}
                    </p>
                </div>
                <button
                    id="toggle-3d-bg"
                    role="switch"
                    aria-checked={show3DBackground}
                    onClick={() => onToggle3DBackground(!show3DBackground)}
                    className={`
                        relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                        ${show3DBackground ? 'bg-primary' : 'bg-white/20'}
                    `}
                >
                    <span
                        className={`
                            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                            ${show3DBackground ? 'translate-x-5' : 'translate-x-0'}
                        `}
                    />
                </button>
            </div>
        </motion.div>
    );
};
