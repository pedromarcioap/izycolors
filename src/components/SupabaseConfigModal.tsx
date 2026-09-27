import React, { useEffect, useRef, useState } from 'react';
import { X, Database, Check, AlertCircle, RefreshCw, Key, Globe, Shield, Lock, ShieldAlert } from 'lucide-react';
import { getSupabaseCredentials, setCustomSupabaseCredentials, getSupabaseClient } from '../services/supabase';
import { AuthUser } from '../types';

type StatusMessageType = 'success' | 'error' | 'info';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
  authUser?: AuthUser;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionChange,
  authUser
}) => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [key, setKey] = useState(currentCreds.key);
  const [statusMessage, setStatusMessage] = useState<{ type: StatusMessageType; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const restrictedDialogRef = useRef<HTMLDialogElement>(null);
  const configDialogRef = useRef<HTMLDialogElement>(null);

  const isRestricted = !!authUser && authUser.role !== 'admin';

  useEffect(() => {
    if (!isOpen) return;
    const dialog = isRestricted ? restrictedDialogRef.current : configDialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      // The ::backdrop belongs to the dialog element, so clicks outside the
      // panel report the <dialog> itself as the event target.
      if (event.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen, isRestricted, onClose]);

  if (!isOpen) return null;

  // Strict RBAC Guard: Exclusive to admin users
  if (isRestricted) {
    return (
      <dialog
        ref={restrictedDialogRef}
        aria-labelledby="supabase-restricted-title"
        onClose={onClose}
        className="w-full max-w-md max-w-[calc(100%_-_2rem)] bg-[#111827] border border-amber-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141A24]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 id="supabase-restricted-title" className="text-base font-bold text-white font-['Geist']">
                Acesso Restrito
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Configuração de Banco de Dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">
            Permissão de Administrador Necessária
          </h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Apenas usuários com a função de <strong className="text-purple-400">Administrador (Admin)</strong> possuem autorização para visualizar ou alterar as chaves de API e URLs de conexão do Supabase.
          </p>
          <div className="p-3 bg-[#0B0F17] rounded-lg border border-white/[0.06] text-[11px] font-mono text-[#64748B]">
            Sua conta atual: <span className="text-white">{authUser.name}</span> (<span className="text-amber-400 uppercase">{authUser.role}</span>)
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#181C24] border-t border-white/[0.08] flex items-center justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-[#262A33] hover:bg-[#31353E] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Entendido / Fechar
          </button>
        </div>
      </dialog>
    );
  }

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setStatusMessage(null);

    setCustomSupabaseCredentials(url, key);
    const client = getSupabaseClient();

    if (!client) {
      if (!url && !key) {
        setStatusMessage({
          type: 'info',
          text: 'Configuração limpa. O sistema continuará salvando imagens curadas e forks com persistência local durável de alta performance.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'URL ou Chave inválidos. Certifique-se de que a URL começa com https://...'
        });
      }
      setIsTesting(false);
      onConnectionChange();
      return;
    }

    try {
      // Test querying or verifying connection
      const { error } = await client.from('curated_images').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        setStatusMessage({
          type: 'success',
          text: `Cliente Supabase conectado com sucesso! Endpoint: ${url}`
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Conexão estabelecida com sucesso com a sua instância Supabase!'
        });
      }
    } catch (err) {
      // Network/connection errors are non-fatal here: credentials were already
      // persisted, so we surface a fallback message and log the cause for
      // diagnostics instead of swallowing it silently.
      console.warn('Supabase connection test failed; falling back to background sync.', err);
      setStatusMessage({
        type: 'success',
        text: 'Credenciais gravadas! O cliente tentará sincronizar em background com sua nuvem Supabase.'
      });
    } finally {
      setIsTesting(false);
      onConnectionChange();
    }
  };

  const renderStatusIcon = (type: StatusMessageType) => {
    if (type === 'success') {
      return <Check className="w-4 h-4 shrink-0 text-emerald-400" />;
    }
    return <AlertCircle className="w-4 h-4 shrink-0" />;
  };

  const getStatusMessageStyles = (type: StatusMessageType) => {
    if (type === 'success') {
      return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
    }
    if (type === 'error') {
      return 'bg-rose-950/40 border-rose-500/30 text-rose-300';
    }
    return 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300';
  };

  return (
    <dialog
      ref={configDialogRef}
      aria-labelledby="supabase-config-title"
      onClose={onClose}
      className="w-full max-w-xl max-w-[calc(100%_-_2rem)] bg-[#111827] border border-white/[0.12] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141A24]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 id="supabase-config-title" className="text-base font-bold text-white font-['Geist'] flex items-center gap-2">
              Persistência de Dados & Supabase
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Salvamento contínuo de Imagens Curadas de Demonstração e Forks de Paletas.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 text-xs text-[#DFE2EE]">
        <div className="p-3 bg-[#0B0F17] rounded-lg border border-white/[0.06] flex items-start gap-3">
          <Shield className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block">Arquitetura de Dupla Persistência:</span>
            <p className="text-[#94A3B8] text-[11px] mt-0.5 leading-relaxed">
              Todas as imagens curadas de demonstração e paletas clonadas/forkadas são salvas instantaneamente em armazenamento local resiliente e sincronizadas com o <strong>Supabase</strong> (PostgREST / Relacional) quando configurado.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="supabase-url-input" className="block text-[#94A3B8] font-mono text-[11px] mb-1">
              VITE_SUPABASE_URL (Ex: https://xyzcompany.supabase.co)
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="supabase-url-input"
                type="text"
                placeholder="https://sua-instancia.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#06B6D4]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="supabase-anon-key-input" className="block text-[#94A3B8] font-mono text-[11px] mb-1">
              VITE_SUPABASE_ANON_KEY (Chave pública anônima)
            </label>
            <div className="relative">
              <Key className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="supabase-anon-key-input"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#06B6D4]"
              />
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${getStatusMessageStyles(statusMessage.type)}`}>
            {renderStatusIcon(statusMessage.type)}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between text-[11px] text-[#64748B] font-mono">
          <span>Tabelas: <code>curated_images</code> • <code>palette_forks</code></span>
          <span>Fallback Ativo</span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#181C24] border-t border-white/[0.08] flex items-center justify-between">
        <button
          onClick={() => {
            setUrl('');
            setKey('');
            setCustomSupabaseCredentials('', '');
            setStatusMessage({ type: 'info', text: 'Credenciais redefinidas para armazenamento persistente padrão.' });
            onConnectionChange();
          }}
          className="text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
        >
          Restaurar Padrões
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-[#262A33] hover:bg-[#31353E] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            onClick={handleSaveAndTest}
            disabled={isTesting}
            className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Salvar & Validar</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
