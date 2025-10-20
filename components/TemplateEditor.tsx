import React, { useRef, useState } from 'react';
import type { KOLFormData } from '../types';
import Textarea from './ui/Textarea';
import Button from './ui/Button';

interface TemplateEditorProps {
  formData: KOLFormData;
  isPreviewMode: boolean;
  onPreviewModeChange: (isPreview: boolean) => void;
  template: string;
  onTemplateChange: (template: string) => void;
  onReset: () => void;
  processTemplate: (template: string, data: KOLFormData) => string;
}

const placeholderDetails = [
  { variable: 'contactPerson', label: '聯絡人' },
  { variable: 'kolName', label: 'KOL' },
  { variable: 'profitShare', label: '分潤方案' },
  { variable: 'guaranteedMinimum', label: '保底金額' },
  { variable: 'bonusAmount', label: '加碼金額' },
  { variable: 'performanceThreshold', label: '業績達標門檻' },
  { variable: 'profitShareBonus', label: '門檻達標後分潤' },
  { variable: 'fanOffer', label: '粉絲優惠' },
  { variable: 'endDate', label: '結束時程' },
  { variable: 'sendHandle', label: '是否補寄手把' }
];

const symbols = ['🔺','🔹','🔸','◾','▶️','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','⚠️','⛔','✅','⭕'];


const ToggleSwitch: React.FC<{ checked: boolean, onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
    <span className="ml-3 text-sm font-medium text-slate-300">
      {checked ? '預覽模式 (使用表單實際值)' : '編輯模式 (顯示變數名稱)'}
    </span>
  </label>
);


const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
  formData,
  isPreviewMode,
  onPreviewModeChange,
  template, onTemplateChange,
  onReset,
  processTemplate
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const insertText = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = `${text.substring(0, start)}${textToInsert}${text.substring(end)}`;
    
    onTemplateChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    }, 0);
  };
  
  const insertPlaceholder = (placeholder: string) => {
    insertText(`{${placeholder}}`);
  };

  const templatePreview = processTemplate(template, formData);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-slate-800 py-4 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-cyan-300">訊息範本編輯器</h2>
            <p className="text-slate-400 mt-2 text-sm">
              自由編輯訊息範本。所有變數皆可使用，變更會自動儲存。
            </p>
          </div>
          <div>
            <ToggleSwitch checked={isPreviewMode} onChange={onPreviewModeChange} />
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <>
          <div className="mb-4 bg-slate-900/60 rounded-md border border-slate-600">
              <button 
                  onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
                  className="w-full flex justify-between items-center p-3 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md"
                  aria-expanded={isInstructionsOpen}
                  aria-controls="instructions-content"
              >
                  <h4 className="text-sm font-semibold text-slate-300">使用說明</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transform transition-transform duration-200 ${isInstructionsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
              </button>
              {isInstructionsOpen && (
                  <div id="instructions-content" className="p-3 pt-2 border-t border-slate-700 text-xs text-slate-400 space-y-4">
                      <div>
                          <h5 className="font-semibold text-slate-200 mb-1">✨ 變數說明</h5>
                          <p>文案可自由編輯，亦可將變數(樂高積木)置入到文案中</p>
                          <p>以符合合作條件輸入的內容</p>
                      </div>
                      <div>
                          <h5 className="font-semibold text-slate-200 mb-1">✨ 條件式說明</h5>
                          <p className="mb-2">
                              <strong className="text-slate-200">基本用法：</strong>
                              <code className="bg-slate-700 text-cyan-300 px-1 rounded font-mono">[if:變數|內容]</code>
                              <br />
                              當「變數」不為空或「無」時，才會顯示「內容」。
                          </p>
                          <div className="p-2 bg-slate-800/50 rounded text-xs">
                              <p className="font-semibold mb-1">範例:</p>
                              <pre className="font-mono text-cyan-400 whitespace-pre-wrap">{`[if: bonusAmount|🔹當銷售額達到 {performanceThreshold}，將額外提供 {bonusAmount} 作為加碼獎勵]`}</pre>
                          </div>
                          
                          <hr className="border-slate-700 my-3" />

                          <p className="mb-2">
                              <strong className="text-slate-200">進階用法：</strong>
                              <code className="bg-slate-700 text-cyan-300 px-1 rounded font-mono">[if:變數=值|內容]</code>
                              <br />
                              當「變數」完全等於「值」時，才會顯示「內容」。
                          </p>
                           <div className="p-2 bg-slate-800/50 rounded text-xs space-y-1">
                              <p className="font-semibold mb-1">範例:</p>
                              <pre className="font-mono text-cyan-400 whitespace-pre-wrap">{`[if: sendHandle=是|🔹會再補 7DS-ZAPA 手把，日後也可以評估薩爾達無雙的合作案喔]`}</pre>
                              <pre className="font-mono text-cyan-400 whitespace-pre-wrap">{`[if: sendHandle=否|🔹如果有需要素材，我們都可以提供免費的素材包]`}</pre>
                          </div>
                      </div>
                  </div>
              )}
          </div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">點擊插入變數 (樂高積木)：</h4>
            <div className="flex flex-wrap gap-2">
              {placeholderDetails.map(p => (
                <button
                  key={p.variable}
                  onClick={() => insertPlaceholder(p.variable)}
                  className="flex items-center gap-2 bg-slate-900/70 text-slate-200 px-3 py-1.5 rounded-lg hover:bg-cyan-900/50 transition-colors cursor-pointer"
                  aria-label={`插入變數 ${p.label}`}
                >
                  <span className="font-mono text-sm text-cyan-300">{`{${p.variable}}`}</span>
                  <span className="text-xs text-slate-400 font-sans border-l border-slate-600 pl-2">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">插入常用符號：</h4>
            <div className="flex flex-wrap gap-2">
              {symbols.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => insertText(symbol)}
                  className="bg-slate-900/70 text-slate-200 px-3 py-1.5 rounded-lg hover:bg-cyan-900/50 transition-colors cursor-pointer text-lg"
                  aria-label={`插入符號 ${symbol}`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </>

        <Textarea
          ref={textareaRef}
          id="main-template-editor"
          value={isPreviewMode ? templatePreview : template}
          onChange={(e) => onTemplateChange(e.target.value)}
          aria-label="主訊息範本編輯器"
          className="text-sm font-mono leading-relaxed"
        />
      </div>


      <div className="flex justify-end pt-4 border-t border-slate-700">
        <Button onClick={onReset} variant="secondary">
          重置範本
        </Button>
      </div>
    </div>
  );
};

export default TemplateEditor;