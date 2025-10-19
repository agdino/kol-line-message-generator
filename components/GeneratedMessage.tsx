
import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

interface GeneratedMessageProps {
  message: string;
  isLoading: boolean;
  error: string;
}

const GeneratedMessage: React.FC<GeneratedMessageProps> = ({ message, isLoading, error }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    if (message) {
      navigator.clipboard.writeText(message);
      setCopied(true);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <Spinner />
          <p className="mt-4 text-lg">生成中，請稍候...</p>
        </div>
      );
    }

    if (error) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-lg font-semibold">發生錯誤</p>
            <p className="text-center mt-2">{error}</p>
        </div>
      );
    }

    if (!message) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
           <p className="mt-4 text-lg">填寫左方欄位即可生成訊息</p>
        </div>
      );
    }

    return (
        <pre className="text-left text-base font-sans whitespace-pre-wrap text-slate-300 p-4 rounded-md bg-slate-900/50">
            {message}
        </pre>
    );
  };


  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 flex flex-col min-h-[500px] lg:min-h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-cyan-300">生成結果</h2>
        {message && !isLoading && !error && (
            <Button onClick={handleCopy} variant="secondary" size="sm">
            {copied ? '已複製!' : '複製訊息'}
            </Button>
        )}
      </div>
      <div className="flex-grow bg-slate-800/50 rounded-lg p-4 border border-slate-700 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default GeneratedMessage;