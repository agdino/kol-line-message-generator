import React, { useState, useCallback } from 'react';
import type { KOLFormData } from './types';
import KOLMessageForm from './components/KOLMessageForm';
import GeneratedMessage from './components/GeneratedMessage';
import TemplateEditor from './components/TemplateEditor';
import { polishFanOffer } from './services/geminiService';
import { usePresets } from './hooks/usePresets';
import { useTemplatePresets } from './hooks/useTemplatePresets';
import { formatDataForDisplay } from './utils/formatting';

const initialFormData: KOLFormData = {
  contactPerson: '',
  kolName: '',
  profitShare: '15',
  guaranteedMinimum: '無',
  bonusAmount: '無',
  performanceThreshold: '無',
  profitShareBonus: '無',
  fanOffer: '無',
  endDate: new Date().toISOString().split('T')[0],
  sendHandle: '是',
};

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


const processTemplate = (template: string, data: KOLFormData): string => {
  if (!template) return '';

  const formattedData = formatDataForDisplay(data);
  
  const multiLineRegex = /\[if: (\w+)(?:=([^|\]]+))?\|([\s\S]*?)\]/g;

  // 1. Process conditional blocks
  let processedMessage = template.replace(multiLineRegex, (match, key, expectedValue, content) => {
    const typedKey = key as keyof KOLFormData;
    const actualValue = data[typedKey] ? data[typedKey].toString().trim() : '';
    
    let conditionMet = false;

    if (expectedValue !== undefined) {
      conditionMet = (actualValue === expectedValue.trim());
    } else {
      conditionMet = (actualValue !== '' && actualValue !== '無');
    }

    return conditionMet ? content : '';
  });
  
  // 2. Clean up extra newlines
  processedMessage = processedMessage.replace(/(\r?\n){3,}/g, '\n\n');

  // 3. Replace placeholder variables
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
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'form' | 'template'>('form');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  
  const { 
    presets, 
    selectedPresetId, 
    addPreset, 
    deletePreset, 
    selectPreset 
  } = usePresets(initialFormData, setFormData);
  
  const {
    templatePresets,
    activeTemplateId,
    activeTemplate,
    addTemplate,
    deleteTemplate,
    selectTemplate,
    updateTemplate,
  } = useTemplatePresets();
  

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleRestart = useCallback(() => {
    setFormData(initialFormData);
    setGeneratedMessage('');
    setError('');
    selectPreset(''); // Also deselect preset
  }, [selectPreset]);

  const handleGenerateMessage = useCallback(() => {
    setIsLoading(true);
    setError('');
    setGeneratedMessage('');

    if (!formData.contactPerson || !formData.kolName) {
      setError('請填寫所有必填欄位 (聯絡人, KOL)');
      setIsLoading(false);
      return;
    }
    
    if (!activeTemplate) {
        setError("沒有可用的訊息範本。");
        setIsLoading(false);
        return;
    }

    const finalMessage = processTemplate(activeTemplate.template, formData);
    setGeneratedMessage(finalMessage);
    setIsLoading(false);
    
  }, [formData, activeTemplate]);

  const handlePolishFanOffer = useCallback(async () => {
    const fanOfferText = formData.fanOffer.trim();
    if (!fanOfferText || fanOfferText === '無' || fanOfferText.length < 5) {
      setError('請至少輸入 5 個字的粉絲優惠內容才能進行潤飾。');
      return;
    }

    setIsPolishing(true);
    setError('');

    try {
      const polishedText = await polishFanOffer(formData.fanOffer);
      setFormData(prev => ({ ...prev, fanOffer: polishedText }));
    } catch (e) {
      console.error("Polishing failed:", e);
      setError('AI 潤飾失敗，請檢查網路連線或稍後再試。');
    } finally {
      setIsPolishing(false);
    }
  }, [formData.fanOffer]);

  const resetTemplate = useCallback(() => {
    if (window.confirm("確定要將目前選擇的範本重置為預設內容嗎？")) {
      updateTemplate(activeTemplateId, DEFAULT_MESSAGE_TEMPLATE);
    }
  }, [activeTemplateId, updateTemplate]);

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
                  selectedPresetId={selectedPresetId}
                  onFormChange={handleFormChange}
                  onGenerate={handleGenerateMessage}
                  onRestart={handleRestart}
                  isLoading={isLoading}
                  isPolishing={isPolishing}
                  onPolishFanOffer={handlePolishFanOffer}
                  onQuickSelect={selectPreset}
                  onAddPreset={(name) => addPreset(name, formData)}
                  onDeletePreset={deletePreset}
                />
              )}
              {activeTab === 'template' && (
                <TemplateEditor
                  formData={formData}
                  isPreviewMode={isPreviewMode}
                  onPreviewModeChange={setIsPreviewMode}
                  templatePresets={templatePresets}
                  activeTemplateId={activeTemplateId}
                  onTemplateChange={(content) => updateTemplate(activeTemplateId, content)}
                  onSelectTemplate={selectTemplate}
                  onAddTemplate={(name) => addTemplate(name, activeTemplate?.template)}
                  onDeleteTemplate={deleteTemplate}
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