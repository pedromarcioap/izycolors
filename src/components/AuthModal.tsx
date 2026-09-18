import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  LogIn, 
  UserPlus, 
  Check, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  LogOut,
  Mail,
  Lock,
  AtSign,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { authenticateUser, registerUser, switchDemoRole, logoutAuthUser } from '../services/authService';
import { getSupabaseCredentials } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUserChange: (user: AuthUser) => void;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToUserPortal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onLogout,
  onNavigateToAdmin,
  onNavigateToUserPortal
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'quick'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseCreds = getSupabaseCredentials();

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Informe o endereço de e-mail.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await authenticateUser(email, password);
    setLoading(false);

    if (res.success && res.user) {
      setSuccessMsg(
        res.viaSupabase
          ? `Autenticado com sucesso via Supabase Cloud como ${res.user.role === 'admin' ? 'Administrador' : 'Usuário'}!`
          : `Sessão iniciada como ${res.user.role === 'admin' ? 'Administrador' : 'Usuário'} (${res.user.name})`
      );
      onUserChange(res.user);
      setTimeout(() => {
        onClose();
      }, 750);
    } else {
      setErrorMsg(res.error || 'Erro ao autenticar.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Preencha os campos obrigatórios.');
      return;
    }
    if (supabaseCreds.isConfigured && password && password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres para o Supabase Auth.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await registerUser({
      name: name.trim(),
      email: email.trim(),
      password: password.trim() || undefined,
      role: selectedRole,
      handle: handle.trim() || undefined
    });
    setLoading(false);

    if (res.success && res.user) {
      setSuccessMsg(res.message || 'Conta criada com sucesso!');
      onUserChange(res.user);
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setErrorMsg(res.error || 'Erro ao criar conta.');
    }
  };

  const handleQuickSwitch = (role: UserRole) => {
    const user = switchDemoRole(role);
    onUserChange(user);
    onClose();
  };

  const handleLogoutClick = async () => {
    await logoutAuthUser();
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#141822] border border-white/[0.12] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0E131E]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#06B6D4] uppercase bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 rounded font-semibold">
                Controle de Acesso & Sessão
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                supabaseCreds.isConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <Cloud className="w-3 h-3" />
                {supabaseCreds.isConfigured ? 'Supabase Conectado' : 'Modo Local'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Geist'] mt-1.5">
              Autenticação Izy Colors
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Account Banner */}
        <div className="px-6 py-3.5 bg-[#181E2C] border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-9 h-9 rounded-full object-cover border border-white/20"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">{currentUser.name}</span>
                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40'
                }`}>
                  {currentUser.role === 'admin' ? 'Administrador' : 'Usuário Comum'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#64748B] block">{currentUser.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' ? (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAdmin?.();
                }}
                className="px-2.5 py-1 text-[11px] font-mono text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded transition-colors cursor-pointer"
              >
                Abrir Admin
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToUserPortal?.();
                }}
                className="px-2.5 py-1 text-[11px] font-mono text-[#06B6D4] hover:text-white bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 rounded transition-colors cursor-pointer"
              >
                Abrir Painel
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/[0.06] bg-[#10141D]">
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login'
                ? 'border-[#6366F1] text-white bg-white/[0.02]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-[#6366F1]" />
            <span>Entrar com E-mail</span>
          </button>

          <button
            onClick={() => { setTab('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'border-[#EC4899] text-white bg-white/[0.02]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>Criar Nova Conta</span>
          </button>

          <button
            onClick={() => { setTab('quick'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-xs font-medium text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'quick'
                ? 'border-[#06B6D4] text-white bg-white/[0.02]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Acesso Rápido Demo</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login with Email Tab */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder={supabaseCreds.isConfigured ? "Sua senha do Supabase" : "Qualquer senha no modo local"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Autenticando via Supabase...' : 'Entrar na Plataforma'}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-[11px] text-[#64748B]">
                  Contas demo: <code className="text-purple-300">admin@izycolors.com</code> ou <code className="text-cyan-300">pedromarcioap@gmail.com</code>
                </p>
              </div>
            </form>
          )}

          {/* Register New Account Tab */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clara Mendes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#EC4899]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="clara@design.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#EC4899]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                    Handle / Usuário
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="@clara_m"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#EC4899]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                  Senha de Acesso {supabaseCreds.isConfigured && '(mínimo 6 caracteres)'} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#EC4899]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                  Cargo Inicial
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('user')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      selectedRole === 'user'
                        ? 'bg-[#06B6D4]/10 border-[#06B6D4] text-white'
                        : 'bg-[#10141D] border-white/[0.08] text-[#94A3B8]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Usuário Comum</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      selectedRole === 'admin'
                        ? 'bg-purple-500/10 border-purple-500 text-white'
                        : 'bg-[#10141D] border-white/[0.08] text-[#94A3B8]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Administrador</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  {selectedRole === 'admin' 
                    ? 'O cargo Administrador concede acesso aos painéis Admin e CMS Editorial.' 
                    : 'O cargo Usuário Comum tem acesso à Área do Usuário, Cofre e Gerador.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-[#EC4899] hover:bg-[#D93D87] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-pink-600/30 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Criando usuário no Supabase...' : 'Criar Conta e Acessar'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Access Tab */}
          {tab === 'quick' && (
            <div className="space-y-4">
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Alterne instantaneamente entre os perfis de demonstração para testar as permissões de Administrador e a experiência do Usuário Comum:
              </p>

              {/* Admin Card */}
              <div 
                onClick={() => handleQuickSwitch('admin')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-950/30 border-purple-500/60 ring-1 ring-purple-500/40 shadow-lg'
                    : 'bg-[#181C26] border-white/[0.08] hover:border-purple-500/40 hover:bg-[#1E2330]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Perfil Administrador</span>
                    {currentUser.role === 'admin' ? (
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-purple-400 flex items-center gap-0.5">
                        Entrar <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Conta: <strong className="text-white">Helena Vance</strong> (admin@izycolors.com)
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Acesso total: Painel administrativo, gestão de usuários, curadoria de paletas e CMS editorial.
                  </p>
                </div>
              </div>

              {/* Regular User Card */}
              <div 
                onClick={() => handleQuickSwitch('user')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                  currentUser.role === 'user'
                    ? 'bg-cyan-950/30 border-[#06B6D4]/60 ring-1 ring-[#06B6D4]/40 shadow-lg'
                    : 'bg-[#181C26] border-white/[0.08] hover:border-[#06B6D4]/40 hover:bg-[#1E2330]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Perfil Usuário Comum</span>
                    {currentUser.role === 'user' ? (
                      <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/20 px-2 py-0.5 rounded border border-[#06B6D4]/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[#06B6D4] flex items-center gap-0.5">
                        Entrar <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Conta: <strong className="text-white">Pedro Márcio</strong> (pedromarcioap@gmail.com)
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Área do Usuário: Gerador, paletas salvas, tokens favoritos, histórico de submissões e perfil de criador.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0E131E] border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
          <span className="text-[#64748B]">Izy Colors Auth & RBAC</span>
          <button
            onClick={handleLogoutClick}
            className="text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Encerrar sessão atual"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Desconectar Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
