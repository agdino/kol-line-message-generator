import React, { useState, useCallback, useEffect } from 'react';
import type { KOLFormData, Preset } from './types';
import KOLMessageForm from './components/KOLMessageForm';
import GeneratedMessage from './components/GeneratedMessage';
import TemplateEditor from './components/TemplateEditor';
import { formatDataForDisplay, unformatNumber, unformatPercent } from './utils/formatting';


const initialFormData: KOLFormData = {
  contactPerson: '',
  kolName: '',
  profitShare: '15', // Store raw numbers
  guaranteedMinimum: '無',
  bonusAmount: '無',
  performanceThreshold: '無',
  profitShareBonus: '無',
  fanOffer: '無',
  endDate: new Date().toISOString().split('T')[0],
  sendHandle: '是',
};

const PRESETS_STORAGE_key = 'kol-message-presets-v2';
const TEMPLATE_STORAGE_KEY = 'kol-message-template-v5';

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


const getDefaultPresets = (): Preset[] => {
  const year = new Date().getFullYear();
  const endDate = `${year}-11-30`;
  // Presets now also store raw, unformatted data
  return [
    {
      id: 'A',
      name: '方案A：分潤20%',
      data: {
        profitShare: '20',
        guaranteedMinimum: '無',
        bonusAmount: '無',
        performanceThreshold: '無',
        profitShareBonus: '25',
        endDate,
        fanOffer: '無',
      }
    },
    {
      id: 'B',
      name: '方案B：分潤15%+保底25000',
      data: {
        profitShare: '15',
        guaranteedMinimum: '25000',
        bonusAmount: '無',
        performanceThreshold: '無',
        profitShareBonus: '20',
        endDate,
        fanOffer: '無',
      }
    },
    {
      id: 'C',
      name: '方案C：分潤10%+加碼10000',
      data: {
        profitShare: '10',
        guaranteedMinimum: '無',
        bonusAmount: '10000',
        performanceThreshold: '150000',
        profitShareBonus: '15',
        endDate,
        fanOffer: '無',
      }
    },
    {
      id: 'THRESHOLD_TEMPLATE',
      name: '門檻達標模板',
      data: {
        profitShare: '15',
        performanceThreshold: '200000',
        profitShareBonus: '20',
        endDate,
      }
    },
    {
      id: 'FAN_OFFER_COMBO',
      name: '粉絲優惠模板：組合優惠',
      data: {
        endDate,
        fanOffer: `🔹抽免單（3 名）
🔹單品售價 1,649（優於官網）
🔹手把 + DOCK 充電轉接組獨家組 2,790（官網原價 3,180）
🔺補充：組合的充電轉接器支援 NS1 代主機，本次調查發現各通路購買 ZA 的客群有 60-70% 使用 Switch 1 代主機，所以推出此組合，目前反應很不錯`,
      }
    }
  ];
};


const processTemplate = (template: string, data: KOLFormData): string => {
  if (!template) return '';

  const formattedData = formatDataForDisplay(data);
  
  // New multi-line capable regex. The `s` flag isn't strictly needed with `[\s\S]`,
  // but this is a robust way to match any character including newlines.
  const multiLineRegex = /\[if: (\w+)(?:=([^|\]]+))?\|([\s\S]*?)\]/g;

  // 1. Process conditional blocks
  let processedMessage = template.replace(multiLineRegex, (match, key, expectedValue, content) => {
    const typedKey = key as keyof KOLFormData;
    // Use original, unformatted data for logical checks
    const actualValue = data[typedKey] ? data[typedKey].toString().trim() : '';
    
    let conditionMet = false;

    if (expectedValue !== undefined) {
      conditionMet = (actualValue === expectedValue.trim());
    } else {
      conditionMet = (actualValue !== '' && actualValue !== '無');
    }

    return conditionMet ? content : '';
  });
  
  // 2. Clean up extra newlines created by removing conditional blocks
  // This collapses 3 or more newlines into just 2 (a single blank line),
  // preserving intentional spacing while removing artifacts.
  processedMessage = processedMessage.replace(/(\r?\n){3,}/g, '\n\n');


  // 3. Replace placeholder variables using the formatted data object
  let finalMessage = processedMessage;
  for (const key in formattedData) {
    const typedKey = key as keyof KOLFormData;
    const value = formattedData[typedKey] || '';
    finalMessage = finalMessage.replace(new RegExp(`{${key}}`, 'g'), value);
  }

  return finalMessage.trim();
};


function App() {
  const [formData, setFormData] = useState<KOLFormData>(initialFormData);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'template'>('form');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  
  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
     try {
      const savedTemplate = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      return savedTemplate || DEFAULT_MESSAGE_TEMPLATE;
    } catch (error) {
       console.error("Failed to load template from localStorage", error);
       return DEFAULT_MESSAGE_TEMPLATE;
    }
  });
  
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const savedPresets = localStorage.getItem(PRESETS_STORAGE_key);
      return savedPresets ? JSON.parse(savedPresets) : getDefaultPresets();
    } catch (error) {
      console.error("Failed to parse presets from localStorage", error);
      return getDefaultPresets();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_key, JSON.stringify(presets));
    } catch (error) {
      console.error("Failed to save presets to localStorage", error);
    }
  }, [presets]);
  
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, messageTemplate);
    } catch (error) {
      console.error("Failed to save template to localStorage", error);
    }
  }, [messageTemplate]);


  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;

    // Always un-format the value before saving to state to keep it clean
    if (['guaranteedMinimum', 'bonusAmount', 'performanceThreshold'].includes(name)) {
      processedValue = unformatNumber(value);
    } else if (['profitShare', 'profitShareBonus'].includes(name)) {
      processedValue = unformatPercent(value);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  }, []);

  const handleRestart = useCallback(() => {
    setFormData(initialFormData);
    setGeneratedMessage('');
    setError('');
  }, []);

  const handleQuickSelect = useCallback((presetId: string) => {
    if (!presetId) return;

    const selectedPreset = presets.find(p => p.id === presetId);
    if (selectedPreset) {
      // Ensure presets merge with initial data to fill in missing fields
      const newFormData = { ...initialFormData, ...formData, ...selectedPreset.data };
      setFormData(newFormData);
    }
  }, [presets, formData]);

  const handleAddPreset = useCallback((name: string) => {
    if (!name || !name.trim()) {
      alert("方案名稱不能為空！");
      return;
    }
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: name.trim(),
      // Save only the relevant, clean data
      data: {
        profitShare: formData.profitShare,
        guaranteedMinimum: formData.guaranteedMinimum,
        bonusAmount: formData.bonusAmount,
        performanceThreshold: formData.performanceThreshold,
        profitShareBonus: formData.profitShareBonus,
        endDate: formData.endDate,
        fanOffer: formData.fanOffer,
        sendHandle: formData.sendHandle,
      }
    };
    setPresets(prev => [...prev, newPreset]);
    alert(`方案 "${name.trim()}" 已儲存！`);
  }, [formData]);

  const handleDeletePreset = useCallback((presetId: string) => {
    if (!presetId) {
      return;
    }
    setPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  const handleGenerateMessage = useCallback(() => {
    setIsLoading(true);
    setError('');
    setGeneratedMessage('');

    if (!formData.contactPerson || !formData.kolName) {
      setError('請填寫所有必填欄位 (聯絡人, KOL)');
      setIsLoading(false);
      return;
    }
    
    const finalMessage = processTemplate(messageTemplate, formData);

    setGeneratedMessage(finalMessage);
    setIsLoading(false);
    
  }, [formData, messageTemplate]);

  const resetTemplate = useCallback(() => {
    if (window.confirm("確定要將範本重置為預設值嗎？您目前的編輯將會遺失。")) {
      setMessageTemplate(DEFAULT_MESSAGE_TEMPLATE);
    }
  }, []);

  const TabButton = ({ active, children, ...props }: { active: boolean, children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const baseClasses = "px-6 py-3 text-base font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 rounded-t-lg";
    const activeClasses = "text-cyan-300 bg-slate-800";
    const inactiveClasses = "text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/70";
    
    return (
      <button className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`} {...props}>
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">KOL LINE 溝通訊息生成器</h1>
          <p className="text-slate-400 mt-2">快速生成專業、有吸引力的 KOL 合作提案訊息</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 flex flex-col">
            <div className="flex border-b border-slate-700 shrink-0 px-6 pt-2">
              <TabButton active={activeTab === 'form'} onClick={() => setActiveTab('form')}>
                合作條件
              </TabButton>
              <TabButton active={activeTab === 'template'} onClick={() => setActiveTab('template')}>
                訊息範本
              </TabButton>
            </div>
    
            <div className="p-6 flex-grow overflow-auto">
              {activeTab === 'form' && (
                <KOLMessageForm 
                  formData={formData}
                  presets={presets}
                  onFormChange={handleFormChange}
                  onGenerate={handleGenerateMessage}
                  onRestart={handleRestart}
                  isLoading={isLoading}
                  onQuickSelect={handleQuickSelect}
                  onAddPreset={handleAddPreset}
                  onDeletePreset={handleDeletePreset}
                />
              )}
              {activeTab === 'template' && (
                <TemplateEditor
                  formData={formData}
                  isPreviewMode={isPreviewMode}
                  onPreviewModeChange={setIsPreviewMode}
                  template={messageTemplate}
                  onTemplateChange={setMessageTemplate}
                  onReset={resetTemplate}
                  processTemplate={processTemplate}
                />
              )}
            </div>
          </div>
          
          <GeneratedMessage 
            message={generatedMessage}
            isLoading={isLoading}
            error={error}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
