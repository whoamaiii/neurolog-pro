import React from 'react';
import { motion } from 'framer-motion';
import {
    Database,
    Download,
    Upload,
    Trash2,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ImportResult } from '../../utils/exportData';

export interface DataManagementSectionProps {
    dataStats: { logs: number; crisis: number; goals: number };
    handleExport: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showImportModal: boolean;
    setShowImportModal: (show: boolean) => void;
    importMode: 'replace' | 'merge';
    setImportMode: (mode: 'replace' | 'merge') => void;
    importResult: ImportResult | null;
    setImportResult: (result: ImportResult | null) => void;
    setPendingImportData: (data: string | null) => void;
    handleConfirmImport: () => void;
    storageUsage: {
        usedBytes: number;
        quotaBytes: number;
        usagePercent: number;
    };
    onLoadDemoData: () => void;
    onClearDemoData: () => void;
}

export const DataManagementSection: React.FC<DataManagementSectionProps> = ({
    dataStats,
    handleExport,
    fileInputRef,
    handleFileSelect,
    showImportModal,
    setShowImportModal,
    importMode,
    setImportMode,
    importResult,
    setImportResult,
    setPendingImportData,
    handleConfirmImport,
    storageUsage,
    onLoadDemoData,
    onClearDemoData
}) => {
    const { t } = useTranslation();

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="liquid-glass-card p-5 rounded-3xl space-y-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Database size={18} className="text-blue-400" />
                    <h2 className="text-lg font-bold text-white">{t('settings.dataManagement.title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <Download className="text-blue-400" size={24} />
                            <div>
                                <h3 className="font-bold text-white">{t('settings.dataManagement.export.title')}</h3>
                                <p className="text-xs text-slate-400">{t('settings.dataManagement.export.subtitle')}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            {t('settings.dataManagement.export.desc')}
                        </p>
                        <button
                            onClick={handleExport}
                            className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium text-sm transition-colors"
                        >
                            {t('settings.dataManagement.export.button')}
                        </button>
                    </div>

                    {/* Import */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <Upload className="text-purple-400" size={24} />
                            <div>
                                <h3 className="font-bold text-white">{t('settings.dataManagement.import.title')}</h3>
                                <p className="text-xs text-slate-400">{t('settings.dataManagement.import.subtitle')}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            {t('settings.dataManagement.import.desc')}
                        </p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 font-medium text-sm transition-colors"
                        >
                            {t('settings.dataManagement.import.button')}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".json"
                            className="hidden"
                        />
                    </div>

                    {/* Demo Data - For Kaggle Competition */}
                    <div className="bg-white/5 p-4 rounded-xl border border-amber-500/30 md:col-span-2">
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="text-amber-400" size={24} />
                            <div>
                                <h3 className="font-bold text-white">{t('settings.dataManagement.demo.title')}</h3>
                                <p className="text-xs text-slate-400">{t('settings.dataManagement.demo.subtitle')}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            {t('settings.dataManagement.demo.desc')}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={onLoadDemoData}
                                className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-medium text-sm transition-colors"
                            >
                                {t('settings.dataManagement.demo.loadButton')}
                            </button>
                            <button
                                onClick={onClearDemoData}
                                className="py-2 px-4 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium text-sm transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {dataStats && (
                    <div className="flex justify-between text-xs text-slate-500 px-2">
                        <span>{t('settings.stats.logs')}: {dataStats.logs}</span>
                        <span>{t('settings.stats.events')}: {dataStats.crisis}</span>
                        <span>{t('settings.stats.goals')}: {dataStats.goals}</span>
                    </div>
                )}

                {/* Storage Quota Warning */}
                {(() => {
                    const usedKB = Math.round(storageUsage.usedBytes / 1024);
                    const quotaKB = Math.round(storageUsage.quotaBytes / 1024);
                    return (
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${storageUsage.usagePercent >= 80 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'text-slate-500'}`}>
                            <Database size={14} className="flex-shrink-0" />
                            <span>{t('settings.storage.usage', { used: usedKB, total: quotaKB, percent: storageUsage.usagePercent })}</span>
                            {storageUsage.usagePercent >= 80 && (
                                <span className="ml-auto font-bold">{t('settings.storage.warning')}</span>
                            )}
                        </div>
                    );
                })()}
            </motion.div>

            {/* Import Modal */}
            {showImportModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="liquid-glass-card p-6 rounded-3xl max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <RefreshCw size={24} className="text-purple-400" />
                            {t('settings.dataManagement.import.modal.title')}
                        </h3>

                        <p className="text-slate-300 mb-6">
                            {t('settings.dataManagement.import.modal.desc')}
                        </p>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setImportMode('replace')}
                                className={`w-full p-3 rounded-xl border text-left transition-all ${importMode === 'replace'
                                    ? 'bg-red-500/20 border-red-500 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-bold text-sm">{t('settings.dataManagement.import.modal.replace.title')}</div>
                                <div className="text-xs opacity-70">{t('settings.dataManagement.import.modal.replace.desc')}</div>
                            </button>

                            <button
                                onClick={() => setImportMode('merge')}
                                className={`w-full p-3 rounded-xl border text-left transition-all ${importMode === 'merge'
                                    ? 'bg-blue-500/20 border-blue-500 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-bold text-sm">{t('settings.dataManagement.import.modal.merge.title')}</div>
                                <div className="text-xs opacity-70">{t('settings.dataManagement.import.modal.merge.desc')}</div>
                            </button>
                        </div>

                        {importResult?.error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/20 text-red-300 text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {importResult.error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setPendingImportData(null);
                                    setImportResult(null);
                                }}
                                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                            >
                                {t('settings.dataManagement.import.modal.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
                            >
                                {t('settings.dataManagement.import.modal.confirm')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};
