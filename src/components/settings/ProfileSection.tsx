import React from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Brain,
    MessageSquare,
    Zap,
    Heart,
    Check
} from 'lucide-react';
import type { ChildProfile } from '../../types';
import {
    DIAGNOSIS_OPTIONS,
    COMMUNICATION_STYLES,
    SENSORY_TRIGGERS,
    STRATEGIES
} from '../../types';
import { useTranslation } from 'react-i18next';
import { ChipSelect } from './ChipSelect';

export interface ProfileSectionProps {
    name: string;
    setName: (name: string) => void;
    age: number | '';
    setAge: (age: number | '') => void;
    diagnoses: string[];
    setDiagnoses: (diagnoses: string[]) => void;
    communicationStyle: ChildProfile['communicationStyle'];
    setCommunicationStyle: (style: ChildProfile['communicationStyle']) => void;
    sensorySensitivities: string[];
    setSensorySensitivities: (sensitivities: string[]) => void;
    seekingSensory: string[];
    setSeekingSensory: (seeking: string[]) => void;
    effectiveStrategies: string[];
    setEffectiveStrategies: (strategies: string[]) => void;
    additionalContext: string;
    setAdditionalContext: (context: string) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
    name,
    setName,
    age,
    setAge,
    diagnoses,
    setDiagnoses,
    communicationStyle,
    setCommunicationStyle,
    sensorySensitivities,
    setSensorySensitivities,
    seekingSensory,
    setSeekingSensory,
    effectiveStrategies,
    setEffectiveStrategies,
    additionalContext,
    setAdditionalContext
}) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass-card p-5 rounded-3xl space-y-6"
        >
            {/* Basic Info */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <User size={18} className="text-primary" />
                    <h2 className="text-lg font-bold text-white">{t('settings.basicInfo')}</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            {t('settings.nameLabel')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('settings.namePlaceholder')}
                            className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            {t('settings.ageLabel')}
                        </label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                            min={1}
                            max={25}
                            placeholder={t('settings.agePlaceholder')}
                            className="w-32 bg-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Diagnoses */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Brain size={18} className="text-purple-400" />
                    <h2 className="text-lg font-bold text-white">{t('settings.diagnoses.title')}</h2>
                </div>
                <p className="text-xs text-slate-500 mb-3">{t('settings.diagnoses.subtitle')}</p>
                <ChipSelect
                    options={DIAGNOSIS_OPTIONS}
                    selected={diagnoses}
                    onChange={setDiagnoses}
                />
            </div>

            {/* Communication Style */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={18} className="text-green-400" />
                    <h2 className="text-lg font-bold text-white">{t('settings.communication.title')}</h2>
                </div>
                <div className="space-y-2">
                    {COMMUNICATION_STYLES.map(style => (
                        <button
                            key={style.value}
                            type="button"
                            onClick={() => setCommunicationStyle(style.value as ChildProfile['communicationStyle'])}
                            className={`
                                w-full text-left px-4 py-3 rounded-xl transition-all
                                ${communicationStyle === style.value
                                    ? 'bg-primary/20 border border-primary text-white'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                }
                            `}
                        >
                            {style.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sensory Sensitivities */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Zap size={18} className="text-orange-400" />
                    <h2 className="text-lg font-bold text-white">{t('settings.sensoryChallenges.title')}</h2>
                </div>
                <p className="text-xs text-slate-500 mb-3">{t('settings.sensoryChallenges.subtitle')}</p>
                <ChipSelect
                    options={SENSORY_TRIGGERS.map(t => ({ value: t, label: t }))}
                    selected={sensorySensitivities}
                    onChange={setSensorySensitivities}
                    maxSelect={5}
                />
            </div>

            {/* Sensory Seeking */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Heart size={18} className="text-pink-400" />
                    <h2 className="text-lg font-bold text-white">{t('settings.sensorySeeking.title')}</h2>
                </div>
                <p className="text-xs text-slate-500 mb-3">{t('settings.sensorySeeking.subtitle')}</p>
                <ChipSelect
                    options={SENSORY_TRIGGERS.map(t => ({ value: t, label: t }))}
                    selected={seekingSensory}
                    onChange={setSeekingSensory}
                    maxSelect={5}
                />
            </div>

            {/* Effective Strategies */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Check size={18} className="text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">{t('settings.strategies.title')}</h2>
                </div>
                <p className="text-xs text-slate-500 mb-3">{t('settings.strategies.subtitle')}</p>
                <ChipSelect
                    options={STRATEGIES.map(s => ({ value: s, label: s }))}
                    selected={effectiveStrategies}
                    onChange={setEffectiveStrategies}
                />
            </div>

            {/* Additional Context */}
            <div>
                <label className="block text-sm text-slate-400 mb-2">
                    {t('settings.additionalContext.label')}
                </label>
                <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder={t('settings.additionalContext.placeholder')}
                    rows={3}
                    className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                    {t('settings.additionalContext.note')}
                </p>
            </div>
        </motion.div>
    );
};
