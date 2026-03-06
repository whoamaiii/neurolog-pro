import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTimeout } from '../hooks/useTimer';
import { motion } from 'framer-motion';
import { useChildProfile } from '../store';
import {
    ArrowLeft,
    Save,
    Trash2,
    Check,
    Info,
    AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChildProfile } from '../types';
import { downloadExport, importData, exportAllData, type ImportResult } from '../utils/exportData';
import { loadDemoData, clearDemoData } from '../utils/demoData';
import { StorageManager } from '../utils/storage';
import { useTranslation } from 'react-i18next';
import { ProfileSection } from './settings/ProfileSection';
import { DataManagementSection } from './settings/DataManagementSection';
import { PreferencesSection } from './settings/PreferencesSection';

export const Settings: React.FC = () => {
    const { t } = useTranslation();
    const { childProfile, setChildProfile, updateChildProfile, clearChildProfile } = useChildProfile();

    // Form state - initialized from childProfile
    const [name, setName] = useState(childProfile?.name || '');
    const [age, setAge] = useState<number | ''>(childProfile?.age || '');
    const [diagnoses, setDiagnoses] = useState<string[]>(childProfile?.diagnoses || []);
    const [communicationStyle, setCommunicationStyle] = useState<ChildProfile['communicationStyle']>(childProfile?.communicationStyle || 'verbal');
    const [sensorySensitivities, setPrimarySensitivities] = useState<string[]>(childProfile?.sensorySensitivities || []);
    const [seekingSensory, setSeekingSensory] = useState<string[]>(childProfile?.seekingSensory || []);
    const [effectiveStrategies, setEffectiveStrategies] = useState<string[]>(childProfile?.effectiveStrategies || []);
    const [additionalContext, setAdditionalContext] = useState(childProfile?.additionalContext || '');

    const [saved, setSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 3D Background preference
    const [show3DBackground, setShow3DBackground] = useState(() => {
        const stored = localStorage.getItem('neurolog_3d_background');
        if (stored !== null) return stored === 'true';
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        return !isMobile && !prefersReducedMotion;
    });

    const handleToggle3DBackground = useCallback((enabled: boolean) => {
        setShow3DBackground(enabled);
        localStorage.setItem('neurolog_3d_background', String(enabled));
        window.location.reload();
    }, []);

    // Export/Import state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
    const [pendingImportData, setPendingImportData] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);

    // Compute data stats directly (no state needed)
    const dataStats = useMemo(() => {
        const data = exportAllData();
        return {
            logs: data.summary.totalLogs,
            crisis: data.summary.totalCrisisEvents,
            goals: data.goals.length
        };
    }, []);

    const storageUsage = useMemo(() => StorageManager.getUsageEstimate(), []);

    // Sync form state when childProfile changes externally (e.g., after import)
    const childProfileId = childProfile?.id;
    useEffect(() => {
        if (childProfile && childProfileId) {
            setName(childProfile.name);
            setAge(childProfile.age || '');
            setDiagnoses(childProfile.diagnoses);
            setCommunicationStyle(childProfile.communicationStyle);
            setPrimarySensitivities(childProfile.sensorySensitivities);
            setSeekingSensory(childProfile.seekingSensory);
            setEffectiveStrategies(childProfile.effectiveStrategies);
            setAdditionalContext(childProfile.additionalContext || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childProfileId]);

    useTimeout(() => setSaved(false), saved ? 2000 : null);
    useTimeout(() => window.location.reload(), importSuccess ? 1500 : null);

    const handleSave = () => {
        const now = new Date().toISOString();
        const profile: ChildProfile = {
            id: childProfile?.id || crypto.randomUUID(),
            name: name || 'Mitt barn',
            age: age === '' ? undefined : age,
            diagnoses,
            communicationStyle,
            sensorySensitivities,
            seekingSensory,
            effectiveStrategies,
            additionalContext: additionalContext || undefined,
            createdAt: childProfile?.createdAt || now,
            updatedAt: now
        };

        if (childProfile) {
            updateChildProfile(profile);
        } else {
            setChildProfile(profile);
        }

        setSaved(true);
    };

    const handleDelete = () => {
        clearChildProfile();
        setName('');
        setAge('');
        setDiagnoses([]);
        setCommunicationStyle('verbal');
        setPrimarySensitivities([]);
        setSeekingSensory([]);
        setEffectiveStrategies([]);
        setAdditionalContext('');
        setShowDeleteConfirm(false);
    };

    const handleExport = () => {
        downloadExport();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setPendingImportData(content);
            setShowImportModal(true);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleConfirmImport = () => {
        if (!pendingImportData) return;

        const result = importData(pendingImportData, importMode);
        setImportResult(result);

        if (result.success) {
            setImportSuccess(true);
        }

        setPendingImportData(null);
    };

    const handleLoadDemoData = () => {
        if (confirm(t('settings.dataManagement.demo.confirmLoad'))) {
            loadDemoData();
            window.location.reload();
        }
    };

    const handleClearDemoData = () => {
        if (confirm(t('settings.dataManagement.demo.confirmClear'))) {
            clearDemoData();
            window.location.reload();
        }
    };

    return (
        <div className="flex flex-col gap-6 py-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft className="text-white" size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
                    <p className="text-slate-400 text-sm">{t('settings.subtitle')}</p>
                </div>
            </div>

            {/* Info Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="liquid-glass-card p-4 rounded-2xl"
            >
                <div className="flex items-start gap-3">
                    <Info size={20} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-slate-300">
                            {t('settings.infoBanner')}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Profile Form */}
            <ProfileSection
                name={name}
                setName={setName}
                age={age}
                setAge={setAge}
                diagnoses={diagnoses}
                setDiagnoses={setDiagnoses}
                communicationStyle={communicationStyle}
                setCommunicationStyle={setCommunicationStyle}
                sensorySensitivities={sensorySensitivities}
                setSensorySensitivities={setPrimarySensitivities}
                seekingSensory={seekingSensory}
                setSeekingSensory={setSeekingSensory}
                effectiveStrategies={effectiveStrategies}
                setEffectiveStrategies={setEffectiveStrategies}
                additionalContext={additionalContext}
                setAdditionalContext={setAdditionalContext}
            />

            {/* Data Management */}
            <DataManagementSection
                dataStats={dataStats}
                handleExport={handleExport}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                showImportModal={showImportModal}
                setShowImportModal={setShowImportModal}
                importMode={importMode}
                setImportMode={setImportMode}
                importResult={importResult}
                setImportResult={setImportResult}
                setPendingImportData={setPendingImportData}
                handleConfirmImport={handleConfirmImport}
                storageUsage={storageUsage}
                onLoadDemoData={handleLoadDemoData}
                onClearDemoData={handleClearDemoData}
            />

            {/* Appearance */}
            <PreferencesSection
                show3DBackground={show3DBackground}
                onToggle3DBackground={handleToggle3DBackground}
            />

            {/* Save Profile Button */}
            <div className="flex gap-3">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all
                        ${saved ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/80'}
                    `}
                >
                    {saved ? (
                        <>
                            <Check size={20} />
                            {t('settings.save.saved')}
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            {t('settings.save.button')}
                        </>
                    )}
                </motion.button>

                {childProfile && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-4 rounded-2xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 size={20} />
                    </motion.button>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="liquid-glass-card p-6 rounded-3xl max-w-sm w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-full">
                                <AlertTriangle className="text-red-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('settings.delete.modal.title')}</h3>
                        </div>
                        <p className="text-slate-300 mb-6">
                            {t('settings.delete.modal.desc')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                            >
                                {t('settings.delete.modal.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                            >
                                {t('settings.delete.modal.confirm')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default Settings;
