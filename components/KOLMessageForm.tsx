import React, { useState } from 'react';
import type { KOLFormData, Preset } from '../types';
import { formatNumber, formatPercent } from '../utils/formatting';
import Input from './ui/Input';
import Label from './ui/Label';
import Select from './ui/Select';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Textarea from './ui/Textarea';

interface KOLMessageFormProps {
  formData: KOLFormData;
  presets: Preset[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onGenerate: () => void;
  onRestart: () => void;
  isLoading: boolean;
  onQuickSelect: (planId: string) => void;
  onAddPreset: (name: string) => void;
  onDeletePreset: (planId: string) => void;
}

const KOLMessageForm: React.FC<KOLMessageFormProps> = ({ 
  formData, 
  presets,
  onFormChange, 
  onGenerate, 
  onRestart, 
  isLoading, 
  onQuickSelect,
  onAddPreset,
  onDeletePreset
}) => {
  
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handlePresetSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    onQuickSelect(id);
  };
  
  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      onAddPreset(newPresetName);
      setNewPresetName('');
    } else {
      alert("請輸入方案名稱。");
    }
  };

  const handleDeletePreset = () => {
    if (selectedPresetId) {
      if (window.confirm(`確定要刪除方案 "${presets.find(p => p.id === selectedPresetId)?.name}" 嗎？`)) {
        onDeletePreset(selectedPresetId);
        setSelectedPresetId('');
      }
    } else {
      alert("請從下拉選單中選擇一個要刪除的方案。")
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  // Helper to decide which value to display (raw or formatted)
  const getDisplayValue = (fieldName: keyof KOLFormData, formatFn: (val: string) => string) => {
    return focusedField === fieldName ? formData[fieldName] : formatFn(formData[fieldName]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-cyan-300 whitespace-nowrap">輸入合作條件</h2>
        <div className="w-full sm:w-auto">
          <Label htmlFor="quickSelect" className="sr-only">快速方案選單</Label>
          <Select
            id="quickSelect"
            name="quickSelect"
            onChange={handlePresetSelectChange}
            value={selectedPresetId}
            aria-label="快速方案選單"
          >
            <option value="" disabled>選擇快速方案...</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </Select>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-6">
          <div className="flex-grow">
              <Label htmlFor="newPresetName" className="sr-only">新方案名稱</Label>
              <Input
                  id="newPresetName"
                  type="text"
                  placeholder="為目前設定命名..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  aria-label="新方案名稱"
              />
          </div>
          <Button onClick={handleSavePreset} variant="secondary" size="sm" disabled={isLoading || !newPresetName.trim()}>
              儲存方案
          </Button>
          <Button onClick={handleDeletePreset} variant="secondary" size="sm" disabled={isLoading || !selectedPresetId}>
              刪除所選
          </Button>
      </div>


      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="contactPerson">聯絡人 *</Label>
            <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={onFormChange} required />
          </div>
          <div>
            <Label htmlFor="kolName">KOL *</Label>
            <Input id="kolName" name="kolName" value={formData.kolName} onChange={onFormChange} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="profitShare">分潤方案 * (例如: 15%)</Label>
                <Input 
                  id="profitShare" 
                  name="profitShare" 
                  value={getDisplayValue('profitShare', formatPercent)} 
                  onChange={onFormChange}
                  onFocus={(e) => setFocusedField(e.target.name)}
                  onBlur={() => setFocusedField(null)}
                  required 
                />
            </div>
             <div>
                <Label htmlFor="endDate">結束時程 *</Label>
                <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={onFormChange} required />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="guaranteedMinimum">保底金額 (若無填「無」)</Label>
                <Input 
                  id="guaranteedMinimum" 
                  name="guaranteedMinimum" 
                  value={getDisplayValue('guaranteedMinimum', formatNumber)}
                  onChange={onFormChange}
                  onFocus={(e) => setFocusedField(e.target.name)}
                  onBlur={() => setFocusedField(null)}
                />
            </div>
             <div>
                <Label htmlFor="fanOffer">粉絲優惠 (若無填「無」)</Label>
                <Textarea id="fanOffer" name="fanOffer" value={formData.fanOffer} onChange={onFormChange} rows={1} autoResize={false} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="bonusAmount">加碼金額 (若無填「無」)</Label>
                <Input 
                  id="bonusAmount" 
                  name="bonusAmount" 
                  value={getDisplayValue('bonusAmount', formatNumber)}
                  onChange={onFormChange}
                  onFocus={(e) => setFocusedField(e.target.name)}
                  onBlur={() => setFocusedField(null)}
                />
            </div>
            <div>
              <Label htmlFor="sendHandle">是否補寄手把 *</Label>
              <Select id="sendHandle" name="sendHandle" value={formData.sendHandle} onChange={onFormChange}>
                <option value="是">是</option>
                <option value="否">否</option>
              </Select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="performanceThreshold">業績達標門檻 (若無填「無」)</Label>
                <Input 
                  id="performanceThreshold" 
                  name="performanceThreshold" 
                  value={getDisplayValue('performanceThreshold', formatNumber)}
                  onChange={onFormChange}
                  onFocus={(e) => setFocusedField(e.target.name)}
                  onBlur={() => setFocusedField(null)}
                />
            </div>
             <div>
                <Label htmlFor="profitShareBonus">門檻達標後分潤提升至 (例如: 20%)</Label>
                <Input 
                  id="profitShareBonus" 
                  name="profitShareBonus" 
                  value={getDisplayValue('profitShareBonus', formatPercent)}
                  onChange={onFormChange} 
                  onFocus={(e) => setFocusedField(e.target.name)}
                  onBlur={() => setFocusedField(null)}
                  required 
                />
            </div>
        </div>
        
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
          <Button type="button" onClick={onRestart} variant="secondary" disabled={isLoading}>
            重新開始
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Spinner /> 生成中...</> : '生成訊息'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default KOLMessageForm;
