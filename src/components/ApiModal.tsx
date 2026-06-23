import React, { useState } from 'react';
import { useStore } from '../store';
import { X, KeyRound, Check } from 'lucide-react';

export function ApiModal() {
  const { isApiModalOpen, setIsApiModalOpen, geminiApiKey, setGeminiApiKey } = useStore();
  const [apiKey, setApiKey] = useState(geminiApiKey);

  if (!isApiModalOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(apiKey);
    setIsApiModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--bg-card-solid)] border border-[var(--border-divider)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border-divider)]">
          <div className="flex items-center gap-2">
            <KeyRound size={20} className="text-[var(--accent)]" />
            <h3 className="font-semibold text-[16px]">API 设置</h3>
          </div>
          <button 
            onClick={() => setIsApiModalOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[14px] font-medium text-[var(--text-primary)] block">
              AI API Key
            </label>
            <p className="text-[12px] text-[var(--text-secondary)]">
              输入您的 API Key 启用智能提取。
              您的密钥仅保存在本地存储中，下次无需重复填写。
            </p>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1">
              推荐使用 DeepSeek API Key，您可以前往 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">这里获取</a>。
            </p>
          </div>
          
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入您的 API Key (如 sk-...)"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-3 rounded-xl focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none text-[14px]"
          />
        </div>

        <div className="p-5 border-t border-[var(--border-divider)] flex justify-end gap-3 bg-[var(--bg-hover)]">
          <button 
            onClick={() => setIsApiModalOpen(false)}
            className="px-4 py-2 rounded-xl text-[14px] font-medium bg-[var(--bg-card-solid)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-[14px] font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-1.5"
          >
            <Check size={16} /> 保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
