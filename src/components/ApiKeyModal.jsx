import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { testApiKey } from '../services/anthropicService';

const ApiKeyModal = ({ isOpen, onClose, onSave, currentKey }) => {
  const [key, setKey] = useState(currentKey || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen && !showSuccess) return null;

  const handleSave = () => {
    if (!key) return;
    onSave(key);
    setShowSuccess(true);
    setTestResult(null);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleTest = async () => {
    if (!key) return;
    setIsTesting(true);
    setTestResult(null);
    const result = await testApiKey(key);
    setTestResult(result);
    setIsTesting(false);
  };

  // Success toast
  if (showSuccess) {
    return (
      <div className="fixed top-6 right-6 z-50 animate-slide-in">
        <div className="bg-green-900/90 border border-green-600 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-100 font-medium">API Key saved successfully!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md shadow-xl border border-white/10">
        <h2 className="text-xl font-semibold mb-4 text-white">Anthropic API Key</h2>
        <p className="text-gray-400 text-sm mb-4">
          Your API key is stored in memory only and sent directly to Anthropic through our local proxy.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setTestResult(null); }}
          placeholder="sk-ant-api03-..."
          className="w-full bg-[#0F172A] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-accent)] mb-4"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        {/* Test result feedback */}
        {testResult && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
            testResult.success 
              ? 'bg-green-900/30 border border-green-800 text-green-200' 
              : 'bg-red-900/30 border border-red-800 text-red-200'
          }`}>
            {testResult.success 
              ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-400" />
              : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            }
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleTest}
            disabled={!key || isTesting}
            className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isTesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</> : 'Test Connection'}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={!key}
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
