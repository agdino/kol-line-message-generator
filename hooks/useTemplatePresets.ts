import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TemplatePreset } from '../types';

const TEMPLATE_PRESETS_STORAGE_KEY = 'kol-message-templates-v1';

const DEFAULT_MESSAGE_TEMPLATE = `HI {contactPerson}，如剛剛討論，提供方案給 {kolName} 參考唷

<<< 合作模式與分潤 >>>
🔹採 {profitShare} 分潤機制[if: guaranteedMinimum|，並提供 {guaranteedMinimum} 保底]
🔹透過 {kolName} 的專屬頁面成交，提供銷售額的 {profitShare} 作為回饋(扣除物流成本)
[if: bonusAmount|🔹除分潤方案，將額外提供 {bonusAmount} 作為加碼獎勵]
[if: performanceThreshold|🔹如果業績達到 {performanceThreshold}，則分潤提升至 {profitShareBonus}]
[if: fanOffer|<<<粉絲福利>>>
{fanOffer}]

<<< 成效追蹤 >>>
🔹會為 {kolName} 建立專屬頁面與連結
🔹提供報表連結，方便追蹤轉單並調整內容節奏

<<< 時程安排 >>>
🔹初期合作至 {endDate}，後續可思考長期合作
[if: sendHandle=是|🔹會再補 7DS-ZAPA 手把，日後也可以評估薩爾達無雙的合作案喔]
[if: sendHandle=否|🔹如果有需要素材，我們都可以提供免費的素材包]

再麻煩 {kolName} 評估看看🙏期待可以合作一波~~`;

const getDefaultTemplatePresets = (): TemplatePreset[] => {
  return [
    {
      id: 'default-1',
      name: '預設範本',
      template: DEFAULT_MESSAGE_TEMPLATE,
    }
  ];
};

export function useTemplatePresets() {
    const [templatePresets, setTemplatePresets] = useState<TemplatePreset[]>(() => {
        try {
            const saved = localStorage.getItem(TEMPLATE_PRESETS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : getDefaultTemplatePresets();
        } catch {
            return getDefaultTemplatePresets();
        }
    });

    const [activeTemplateId, setActiveTemplateId] = useState<string>(() => templatePresets[0]?.id || '');
    
    useEffect(() => {
        try {
            localStorage.setItem(TEMPLATE_PRESETS_STORAGE_KEY, JSON.stringify(templatePresets));
        } catch (error) {
            console.error("Failed to save template presets to localStorage", error);
        }
    }, [templatePresets]);

    const activeTemplate = useMemo(() => 
        templatePresets.find(p => p.id === activeTemplateId) || templatePresets[0],
    [templatePresets, activeTemplateId]);

    const addTemplate = useCallback((name: string, templateContent?: string) => {
        if (!name || !name.trim()) {
            alert("範本名稱不能為空！");
            return;
        }
        if (!templateContent) {
            alert("沒有可用的範本內容來儲存。");
            return;
        }
        const newPreset: TemplatePreset = {
            id: Date.now().toString(),
            name: name.trim(),
            template: templateContent,
        };
        setTemplatePresets(prev => [...prev, newPreset]);
        setActiveTemplateId(newPreset.id);
        alert(`範本 "${name.trim()}" 已儲存！`);
    }, []);

    const deleteTemplate = useCallback((templateId: string) => {
        if (!templateId) return;
        if (templatePresets.length <= 1) {
            alert("無法刪除最後一個範本。");
            return;
        }

        const templateToDelete = templatePresets.find(p => p.id === templateId);
        if (templateToDelete && window.confirm(`確定要刪除範本 "${templateToDelete.name}" 嗎？`)) {
            setTemplatePresets(prev => {
                const newPresets = prev.filter(p => p.id !== templateId);
                if (activeTemplateId === templateId) {
                    // 找到被刪除範本在舊陣列中的索引
                    const deletedIndex = prev.findIndex(p => p.id === templateId);
                    // 嘗試選擇新陣列中相同索引的範本，如果超出範圍則選擇前一個
                    let nextActiveId = '';
                    if (newPresets[deletedIndex]) {
                        nextActiveId = newPresets[deletedIndex].id;
                    } else if (deletedIndex > 0) {
                        nextActiveId = newPresets[deletedIndex - 1].id;
                    } else {
                        nextActiveId = newPresets[0]?.id || '';
                    }
                    setActiveTemplateId(nextActiveId);
                }
                return newPresets;
            });
        }
    }, [templatePresets, activeTemplateId]);

    const selectTemplate = useCallback((templateId: string) => {
        setActiveTemplateId(templateId);
    }, []);

    const updateTemplate = useCallback((templateId: string, newContent: string) => {
        setTemplatePresets(prev =>
            prev.map(p =>
                p.id === templateId ? { ...p, template: newContent } : p
            )
        );
    }, []);

    return { 
        templatePresets, 
        activeTemplateId, 
        activeTemplate, 
        addTemplate, 
        deleteTemplate, 
        selectTemplate,
        updateTemplate
    };
}
