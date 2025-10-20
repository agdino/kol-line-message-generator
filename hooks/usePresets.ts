import { useState, useEffect, useCallback } from 'react';
import type { Preset, KOLFormData } from '../types';

const PRESETS_STORAGE_KEY = 'kol-message-presets-v2';

const getDefaultPresets = (): Preset[] => {
  const year = new Date().getFullYear();
  const endDate = `${year}-11-30`;
  return [
    { id: 'A', name: '方案A：分潤20%', data: { profitShare: '20', guaranteedMinimum: '無', bonusAmount: '無', performanceThreshold: '無', profitShareBonus: '25', endDate, fanOffer: '無' } },
    { id: 'B', name: '方案B：分潤15%+保底25000', data: { profitShare: '15', guaranteedMinimum: '25000', bonusAmount: '無', performanceThreshold: '無', profitShareBonus: '20', endDate, fanOffer: '無' } },
    { id: 'C', name: '方案C：分潤10%+加碼10000', data: { profitShare: '10', guaranteedMinimum: '無', bonusAmount: '10000', performanceThreshold: '150000', profitShareBonus: '15', endDate, fanOffer: '無' } },
    { id: 'THRESHOLD_TEMPLATE', name: '門檻達標模板', data: { profitShare: '15', performanceThreshold: '200000', profitShareBonus: '20', endDate } },
    { id: 'FAN_OFFER_COMBO', name: '粉絲優惠模板：組合優惠', data: { endDate, fanOffer: `🔹抽免單（3 名）\n🔹單品售價 1,649（優於官網）\n🔹手把 + DOCK 充電轉接組獨家組 2,790（官網原價 3,180）\n🔺補充：組合的充電轉接器支援 NS1 代主機，本次調查發現各通路購買 ZA 的客群有 60-70% 使用 Switch 1 代主機，所以推出此組合，目前反應很不錯` } }
  ];
};

export function usePresets(
    initialFormData: KOLFormData,
    setFormData: React.Dispatch<React.SetStateAction<KOLFormData>>
) {
    const [presets, setPresets] = useState<Preset[]>(() => {
        try {
            const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : getDefaultPresets();
        } catch {
            return getDefaultPresets();
        }
    });

    const [selectedPresetId, setSelectedPresetId] = useState<string>('');

    useEffect(() => {
        try {
            localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
        } catch (error) {
            console.error("Failed to save presets to localStorage", error);
        }
    }, [presets]);
    
    const addPreset = useCallback((name: string, currentFormData: KOLFormData) => {
        if (!name || !name.trim()) {
            alert("方案名稱不能為空！");
            return;
        }
        const newPreset: Preset = {
            id: Date.now().toString(),
            name: name.trim(),
            data: {
                profitShare: currentFormData.profitShare,
                guaranteedMinimum: currentFormData.guaranteedMinimum,
                bonusAmount: currentFormData.bonusAmount,
                performanceThreshold: currentFormData.performanceThreshold,
                profitShareBonus: currentFormData.profitShareBonus,
                endDate: currentFormData.endDate,
                fanOffer: currentFormData.fanOffer,
                sendHandle: currentFormData.sendHandle,
            }
        };
        setPresets(prev => [...prev, newPreset]);
        setSelectedPresetId(newPreset.id); // Auto-select the new preset
        alert(`方案 "${name.trim()}" 已儲存！`);
    }, []);

    const deletePreset = useCallback((presetId: string) => {
        if (!presetId) return;

        setPresets(currentPresets => {
            const presetToDelete = currentPresets.find(p => p.id === presetId);
            if (presetToDelete) {
                if (window.confirm(`確定要刪除方案 "${presetToDelete.name}" 嗎？`)) {
                    setSelectedPresetId('');
                    return currentPresets.filter(p => p.id !== presetId);
                }
            } else {
                // This alert is now less likely to happen, but good for debugging.
                alert("刪除失敗，找不到對應的方案。");
            }
            return currentPresets; // Return original state if no deletion occurs
        });
    }, []); // No dependencies needed due to functional update

    const selectPreset = useCallback((presetId: string) => {
        setSelectedPresetId(presetId);
        if (!presetId) return;

        const selected = presets.find(p => p.id === presetId);
        if (selected) {
            setFormData(current => ({
                ...initialFormData,
                ...current,
                ...selected.data
            }));
        }
    }, [presets, setFormData, initialFormData]);

    return { presets, selectedPresetId, addPreset, deletePreset, selectPreset };
}