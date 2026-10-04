import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cpu,
  RefreshCw
} from 'lucide-react';
import {
  AiProvider,
  AiApiConfig,
  loadAiConfig,
  saveAiConfig,
  testAiConnection,
  DEFAULT_AI_CONFIG
} from '../services/aiArticleService';

interface AdminAiSettingsProps {
  isAdmin: boolean;
  onSavedNotice?: (msg: string) => void;
}

const PROVIDER_METADATA: Record<
  AiProvider,
  { name: string; description: string; badge: string; badgeColor: string; defaultModel: string; envVar?: string }
> = {
  gemini: {
    name: 'Google Gemini',
    description: 'API nativa do Google GenAI com suporte multimodal direto para imagens e texto.',
    badge: 'Nativo / Padrão',
    badgeColor: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30',
    defaultModel: 'gemini-2.0-flash',
    envVar: 'VITE_GEMINI_API_KEY'
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Roteador universal de modelos AI (Gemini, Claude, Llama, Qwen, DeepSeek).',
    badge: 'Multi-Modelo',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    defaultModel: 'google/gemini-2.0-flash-001'
  },
  openai: {
    name: 'OpenAI (GPT-4o)',
    description: 'Modelos GPT-4o e GPT-4o-mini da OpenAI com suporte a visão computacional.',
    badge: 'OpenAI API',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    defaultModel: 'gpt-4o-mini'
  },
  claude: {
    name: 'Anthropic Claude',
    description: 'Modelos Claude 3.5 Sonnet e Haiku da Anthropic para escrita técnica refinada.',
    badge: 'Anthropic API',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    defaultModel: 'claude-3-5-sonnet-20241022'
  }
};

const getProviderApiKey = (provider: AiProvider, config: AiApiConfig): string => {
  switch (provider) {
    case 'gemini':
      return config.geminiApiKey;
    case 'openrouter':
      return config.openrouterApiKey;
    case 'openai':
      return config.openaiApiKey;
    case 'claude':
      return config.claudeApiKey;
  }
};

const getProviderModel = (provider: AiProvider, config: AiApiConfig): string => {
  switch (provider) {
    case 'gemini':
      return config.geminiModel || DEFAULT_AI_CONFIG.geminiModel;
    case 'openrouter':
      return config.openrouterModel || DEFAULT_AI_CONFIG.openrouterModel;
    case 'openai':
      return config.openaiModel || DEFAULT_AI_CONFIG.openaiModel;
    case 'claude':
      return config.claudeModel || DEFAULT_AI_CONFIG.claudeModel;
  }
};

const getProviderFields = (provider: AiProvider): { keyField: keyof AiApiConfig; modelField: keyof AiApiConfig } => {
  switch (provider) {
    case 'openrouter':
      return { keyField: 'openrouterApiKey', modelField: 'openrouterModel' };
    case 'openai':
      return { keyField: 'openaiApiKey', modelField: 'openaiModel' };
    case 'claude':
      return { keyField: 'claudeApiKey', modelField: 'claudeModel' };
    case 'gemini':
    default:
      return { keyField: 'geminiApiKey', modelField: 'geminiModel' };
  }
};

const getApiKeyPlaceholder = (provider: AiProvider): string => {
  switch (provider) {
    case 'gemini':
      return 'AIzaSy...';
    case 'openrouter':
      return 'sk-or-v1-...';
    case 'openai':
      return 'sk-proj-...';
    case 'claude':
      return 'sk-ant-...';
  }
};

const getTestStatusBadgeStyle = (status: 'idle' | 'testing' | 'success' | 'error'): string => {
  if (status === 'success') {
    return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
  }
  if (status === 'error') {
    return 'bg-rose-950/40 border-rose-500/30 text-rose-300';
  }
  return 'bg-[#181C26] border-white/10 text-[#94A3B8]';
};

export const AdminAiSettings: React.FC<AdminAiSettingsProps> = ({ isAdmin, onSavedNotice }) => {
  const [config, setConfig] = useState<AiApiConfig>(DEFAULT_AI_CONFIG);
  const [selectedProviderTab, setSelectedProviderTab] = useState<AiProvider>('gemini');
  const [showKeys, setShowKeys] = useState<Record<AiProvider, boolean>>({
    gemini: false,
    openrouter: false,
    openai: false,
    claude: false
  });
  const [testStatus, setTestStatus] = useState<Record<AiProvider, 'idle' | 'testing' | 'success' | 'error'>>({
    gemini: 'idle',
    openrouter: 'idle',
    openai: 'idle',
    claude: 'idle'
  });
  const [testMessage, setTestMessage] = useState<Record<AiProvider, string>>({
    gemini: '',
    openrouter: '',
    openai: '',
    claude: ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAiConfig()
      .then(setConfig)
      .catch((err: unknown) => {
        console.warn('Não foi possível carregar a configuração de IA:', err);
      });
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const toggleShowKey = (provider: AiProvider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleFieldChange = (field: keyof AiApiConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await saveAiConfig(config);
      setSavedSuccess(true);
      if (onSavedNotice) {
        onSavedNotice(`Configurações de IA salvas! Provedor ativo: [${PROVIDER_METADATA[config.activeProvider].name}]`);
      }
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Falha ao salvar a configuração de IA:', err);
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar a configuração de IA.');
    }
  };

  const handleTestConnection = async (provider: AiProvider) => {
    const apiKey = getProviderApiKey(provider, config);
    const model = getProviderModel(provider, config);

    if (!apiKey.trim()) {
      setTestStatus((prev) => ({ ...prev, [provider]: 'error' }));
      setTestMessage((prev) => ({ ...prev, [provider]: 'Forneça uma Chave de API antes de testar.' }));
      return;
    }

    setTestStatus((prev) => ({ ...prev, [provider]: 'testing' }));
    setTestMessage((prev) => ({ ...prev, [provider]: 'Conectando ao provedor...' }));

    try {
      const res = await testAiConnection(provider, apiKey.trim(), model.trim());
      setTestStatus((prev) => ({ ...prev, [provider]: res.success ? 'success' : 'error' }));
      setTestMessage((prev) => ({ ...prev, [provider]: res.message }));
    } catch (err) {
      setTestStatus((prev) => ({ ...prev, [provider]: 'error' }));
      setTestMessage((prev) => ({
        ...prev,
        [provider]: err instanceof Error ? err.message : 'Erro desconhecido ao testar conexão.'
      }));
    }
  };

  return (
    <div className="bg-[#181C24] border border-[#6366F1]/30 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#6366F1]/10 via-[#06B6D4]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1]/20 to-[#06B6D4]/20 border border-[#6366F1]/40 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-['Geist']">
                Configurações da API de IA (Geração de Artigos)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                Somente Admin
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Gerencie as chaves de API e modelos para a geração semiautomatizada de artigos no CMS (Gemini, OpenRouter, OpenAI e Claude).
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Configurações Salvas</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Active Provider Selector */}
        <div>
          <span className="text-xs font-mono uppercase text-[#94A3B8] block mb-2 font-semibold">
            Provedor Ativo de IA para o CMS:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['gemini', 'openrouter', 'openai', 'claude'] as AiProvider[]).map((p) => {
              const meta = PROVIDER_METADATA[p];
              const isActive = config.activeProvider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, activeProvider: p }))}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${isActive
                      ? 'bg-[#1C2232] border-[#06B6D4] shadow-lg shadow-cyan-500/10 ring-1 ring-[#06B6D4]/50'
                      : 'bg-[#111827] border-white/[0.08] hover:border-white/20 text-[#94A3B8]'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold font-['Geist'] ${isActive ? 'text-white' : 'text-[#DFE2EE]'}`}>
                        {meta.name}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" title="Provedor Ativo" />
                      )}
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block ${meta.badgeColor}`}>
                      {meta.badge}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B] mt-2 block">
                    {isActive ? '✓ Em uso' : 'Clique para ativar'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider Detail Configuration Tabs */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
            {(['gemini', 'openrouter', 'openai', 'claude'] as AiProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedProviderTab(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedProviderTab === p
                    ? 'bg-[#202534] text-white border border-white/10'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <span>{PROVIDER_METADATA[p].name}</span>
                {config.activeProvider === p && (
                  <span className="text-[9px] font-bold text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-1 py-0.2 rounded">
                    ATIVO
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Current Selected Provider Tab Form Content */}
          {(() => {
            const p = selectedProviderTab;
            const meta = PROVIDER_METADATA[p];
            const isCurrentActive = config.activeProvider === p;
            const { keyField, modelField } = getProviderFields(p);

            const currentKey = config[keyField] as string;
            const currentModel = (config[modelField] as string) || meta.defaultModel;

            return (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white font-['Geist']">{meta.name}</h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{meta.description}</p>
                  </div>
                  {!isCurrentActive && (
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, activeProvider: p }))}
                      className="px-3 py-1 bg-[#181C26] hover:bg-[#202534] border border-white/[0.1] text-xs font-mono text-[#06B6D4] rounded-lg transition-colors cursor-pointer"
                    >
                      Definir como Ativo
                    </button>
                  )}
                </div>

                {/* API Key Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor={`ai-key-input-${p}`} className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#06B6D4]" />
                      Chave de API ({meta.name}):
                    </label>
                    {p === 'gemini' && currentKey && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Chave armazenada no Supabase (somente administradores têm acesso)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id={`ai-key-input-${p}`}
                      type={showKeys[p] ? 'text' : 'password'}
                      value={currentKey}
                      onChange={(e) => handleFieldChange(keyField, e.target.value)}
                      placeholder={getApiKeyPlaceholder(p)}
                      className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none focus:border-[#06B6D4]"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                      title={showKeys[p] ? 'Ocultar Chave' : 'Exibir Chave'}
                    >
                      {showKeys[p] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Model Selection */}
                <div>
                  <label htmlFor={`ai-model-input-${p}`} className="text-xs font-mono text-[#94A3B8] block mb-1">
                    Modelo Utilizado:
                  </label>
                  <input
                    id={`ai-model-input-${p}`}
                    type="text"
                    value={currentModel}
                    onChange={(e) => handleFieldChange(modelField, e.target.value)}
                    placeholder={`Padrão: ${meta.defaultModel}`}
                    className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#06B6D4]"
                  />
                  <span className="text-[10px] font-mono text-[#64748B] mt-1 block">
                    Modelo recomendado: <code className="text-[#06B6D4]">{meta.defaultModel}</code>
                  </span>
                </div>

                {/* Test Connection Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleTestConnection(p)}
                      disabled={testStatus[p] === 'testing'}
                      className="h-8 px-3 bg-[#1C2230] hover:bg-[#262E40] border border-white/[0.1] rounded-lg text-xs font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {testStatus[p] === 'testing' ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#06B6D4] animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-[#06B6D4]" />
                      )}
                      <span>Testar Conexão com {meta.name}</span>
                    </button>
                  </div>

                  {testMessage[p] && (
                    <div
                      className={`text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 border ${getTestStatusBadgeStyle(testStatus[p])}`}
                    >
                      {testStatus[p] === 'success' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="truncate max-w-xs">{testMessage[p]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saveError && (
            <span className="text-[11px] font-mono text-rose-300 bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-lg">
              {saveError}
            </span>
          )}
          <button
            type="submit"
            className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Salvar Configurações de IA</span>
          </button>
        </div>
      </form>
    </div>
  );
};

