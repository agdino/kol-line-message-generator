import React, { useState, useCallback, useEffect } from 'react';
import type { KOLFormData, Preset } from './types';
import KOLMessageForm from './components/KOLMessageForm';
import GeneratedMessage from './components/GeneratedMessage';

const initialFormData: KOLFormData = {
  contactPerson: '',
  kolName: '',
  profitShare: '15%',
  guaranteedMinimum: '無',
  bonusAmount: '無',
  bonusThreshold: '無',
  fanOffer: '無',
  endDate: new Date().toISOString().split('T')[0],
  sendHandle: '是',
};

const PRESETS_STORAGE_KEY = 'kol-message-presets';

const getDefaultPresets = (): Preset[] => {
  const year = new Date().getFullYear();
  const endDate = `${year}-11-30`;
  return [
    {
      id: 'A',
      name: '方案A：分潤20%',
      data: {
        profitShare: '20%',
        guaranteedMinimum: '無',
        bonusAmount: '無',
        bonusThreshold: '無',
        endDate,
        fanOffer: '無',
      }
    },
    {
      id: 'B',
      name: '方案B：分潤15%+保底25000',
      data: {
        profitShare: '15%',
        guaranteedMinimum: '25000',
        bonusAmount: '無',
        bonusThreshold: '無',
        endDate,
        fanOffer: '無',
      }
    },
    {
      id: 'C',
      name: '方案C：分潤10%+加碼10000',
      data: {
        profitShare: '10%',
        guaranteedMinimum: '無',
        bonusAmount: '10000',
        bonusThreshold: '無',
        endDate,
        fanOffer: '無',
      }
    },
    {
      id: 'FAN_OFFER_COMBO',
      name: '粉絲優惠模板：組合優惠',
      data: {
        endDate,
        fanOffer: `抽免單（3 名）
單品售價 1,649（優於官網）
手把 + DOCK 充電轉接組獨家組 2,790（官網原價 3,180） 補充：組合的充電轉接器支援 NS1 代主機，本次調查發現各通路購買 ZA 的客群有 60-70% 使用 Switch 1 代主機，所以推出此組合，目前反應很不錯`,
      }
    }
  ];
};


function App() {
  const [formData, setFormData] = useState<KOLFormData>(initialFormData);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
      return savedPresets ? JSON.parse(savedPresets) : getDefaultPresets();
    } catch (error) {
      console.error("Failed to parse presets from localStorage", error);
      return getDefaultPresets();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error("Failed to save presets to localStorage", error);
    }
  }, [presets]);


  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      setFormData(prev => ({
        ...prev,
        ...selectedPreset.data,
      }));
    }
  }, [presets]);

  const handleAddPreset = useCallback((name: string) => {
    if (!name || !name.trim()) {
      alert("方案名稱不能為空！");
      return;
    }
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: name.trim(),
      data: {
        profitShare: formData.profitShare,
        guaranteedMinimum: formData.guaranteedMinimum,
        bonusAmount: formData.bonusAmount,
        bonusThreshold: formData.bonusThreshold,
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
    // Removed window.confirm as it can be blocked in some environments (e.g. AI Studio)
    setPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);


  const handleGenerateMessage = useCallback(() => {
    setIsLoading(true);
    setError('');
    setGeneratedMessage('');

    const {
      contactPerson,
      kolName,
      profitShare,
      guaranteedMinimum,
      bonusAmount,
      bonusThreshold,
      fanOffer,
      endDate,
      sendHandle,
    } = formData;

    if (!contactPerson || !kolName || !profitShare || !endDate) {
      setError('請填寫所有必填欄位 (聯絡人, KOL, 分潤方案, 結束時程)');
      setIsLoading(false);
      return;
    }

    // --- 合作模式與分潤 ---
    const cooperationItems: string[] = [];

    const guaranteeText = (guaranteedMinimum && guaranteedMinimum.toLowerCase() !== '無' && guaranteedMinimum.trim() !== '')
      ? `，並提供 ${guaranteedMinimum} 保底`
      : '';
    cooperationItems.push(`🔹採 ${profitShare} 分潤機制${guaranteeText}`);
    
    cooperationItems.push(`🔹透過 ${kolName} 的專屬頁面成交，提供銷售額的 ${profitShare} 作為回饋(扣除物流成本)`);

    if (bonusAmount && bonusAmount.toLowerCase() !== '無' && bonusAmount.trim() !== '' && bonusThreshold && bonusThreshold.toLowerCase() !== '無' && bonusThreshold.trim() !== '') {
      cooperationItems.push(`🔹當銷售額達到 ${bonusThreshold}，將額外提供 ${bonusAmount} 作為加碼獎勵`);
    }

    if (fanOffer && fanOffer.toLowerCase() !== '無' && fanOffer.trim() !== '') {
      cooperationItems.push(`🔹${fanOffer.replace(/\n/g, '\n🔹')}`);
    }

    if (cooperationItems.length < 3) {
      cooperationItems.push('🔹共享利潤，鼓勵大家共創好作品，獲取更高的回報！');
    }
    const cooperationSection = cooperationItems.join('\n');

    // --- 時程安排 ---
    const scheduleItems: string[] = [];
    scheduleItems.push(`🔹初期合作至 ${endDate}，後續可思考長期合作`);
    if (sendHandle === '是') {
      scheduleItems.push('🔹會再補 7DS-ZAPA 手把，日後也可以評估薩爾達無雙的合作案喔');
    } else {
      scheduleItems.push('🔹如果有需要素材，我們都可以提供免費的素材包');
    }
    const scheduleSection = scheduleItems.join('\n');

    // --- 組裝訊息 ---
    const message = `HI ${contactPerson}，如剛剛討論，提供方案給 ${kolName} 參考唷

<<< 合作模式與分潤 >>>
${cooperationSection}

<<< 成效追蹤 >>>
🔹會為 ${kolName} 建立專屬頁面與連結
🔹提供報表連結，方便追蹤轉單並調整內容節奏

<<< 時程安排 >>>
${scheduleSection}

再麻煩 ${kolName} 評估看看🙏期待可以合作一波~~`;

    setGeneratedMessage(message);
    setIsLoading(false);
    
  }, [formData]);


  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">KOL LINE 溝通訊息生成器</h1>
          <p className="text-slate-400 mt-2">快速生成專業、有吸引力的 KOL 合作提案訊息</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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