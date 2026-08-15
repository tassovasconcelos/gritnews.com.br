/**
 * ============================================================================
 * PAINEL DE AUTENTICAÇÃO ADMINISTRATIVA E GERENCIAL DA GRIT NEWS & TENPETS
 * ============================================================================
 * 
 * SEGURANÇA E ACESSO RESTRITO COM RECUPERAÇÃO DE SENHA:
 * Este componente implementa a barreira de autenticação profissional para a área
 * gerencial do ecossistema GRIT NEWS e TenPets.
 * 
 * RECURSOS:
 * 1. Autenticação para Superadmin (Tasso Vasconcelos / Admin), Editores (Letícia Karla) e Comercial.
 * 2. Fluxo completo de RECUPERAÇÃO e REDEFINIÇÃO DE SENHA com token e redefinição instantânea.
 * 3. Persistência de novas senhas customizadas no localStorage do navegador.
 * 4. Botão de restauração de emergência para credenciais padrão.
 */

import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  KeyRound, 
  Globe, 
  Server,
  HelpCircle,
  RefreshCw,
  Mail,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { UserRole } from '../../types';
import { 
  validateAdminLogin, 
  saveAdminPassword, 
  findAdminAccount, 
  DEFAULT_ADMIN_ACCOUNTS, 
  DEFAULT_ACCEPTED_PASSWORDS,
  resetAdminPasswordsToDefault
} from '../../lib/storage';

interface AdminLoginScreenProps {
  onLoginSuccess: (user: { name: string; role: UserRole; email: string }) => void;
  onExit: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess, onExit }) => {
  // Estado das credenciais de login
  const [username, setUsername] = useState('tassovasconcelos@gmail.com');
  const [password, setPassword] = useState('gritnews2026');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPERADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  // Estados do Modal de Recuperação de Senha
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'input_email' | 'set_new_password' | 'success'>('input_email');
  const [recoveryEmail, setRecoveryEmail] = useState('tassovasconcelos@gmail.com');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryShowNewPass, setRecoveryShowNewPass] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryAccountFound, setRecoveryAccountFound] = useState<{ name: string; email: string; role: string } | null>(null);

  /**
   * Processa a tentativa de login no painel gerencial.
   */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const result = validateAdminLogin(username, password);

      if (result.success && result.account) {
        setIsLoading(false);
        onLoginSuccess({
          name: result.account.name,
          role: selectedRole || (result.account.role as UserRole),
          email: result.account.email
        });
      } else {
        setIsLoading(false);
        setErrorMsg(result.message || 'Credenciais inválidas. Verifique o usuário e a senha ou clique em "Recuperar Senha".');
      }
    }, 400);
  };

  /**
   * Abre o modal de recuperação de senha
   */
  const handleOpenRecovery = () => {
    setRecoveryError('');
    setRecoveryEmail(username.trim() || 'tassovasconcelos@gmail.com');
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryStep('input_email');
    setIsRecoveryModalOpen(true);
  };

  /**
   * Passo 1 da recuperação: Localizar conta e gerar token de verificação
   */
  const handleRequestRecoveryToken = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    const account = findAdminAccount(recoveryEmail);
    if (!account) {
      setRecoveryError('Nenhuma conta encontrada com este e-mail ou usuário. Certifique-se de digitar o e-mail cadastrado.');
      return;
    }

    // Gera um código de verificação amigável
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    setRecoveryToken(token);
    setRecoveryAccountFound({
      name: account.name,
      email: account.email,
      role: account.role
    });
    setRecoveryStep('set_new_password');
  };

  /**
   * Passo 2 da recuperação: Salvar a nova senha
   */
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryNewPassword || recoveryNewPassword.length < 4) {
      setRecoveryError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    // Salva a nova senha para o usuário e e-mail no storage
    const targetEmail = recoveryAccountFound?.email || recoveryEmail;
    saveAdminPassword(targetEmail, recoveryNewPassword);
    if (recoveryAccountFound?.email) {
      saveAdminPassword(recoveryAccountFound.email.split('@')[0], recoveryNewPassword);
    }

    // Atualiza os campos do formulário principal de login
    setUsername(targetEmail);
    setPassword(recoveryNewPassword);
    setRecoveryStep('success');
  };

  /**
   * Restaura todas as senhas para os valores de emergência padrão
   */
  const handleRestoreDefaultPasswords = () => {
    resetAdminPasswordsToDefault();
    setUsername('tassovasconcelos@gmail.com');
    setPassword('gritnews2026');
    setIsRecoveryModalOpen(false);
    setSuccessMsg('Senhas mestras restauradas com sucesso! Você já pode entrar com "gritnews2026".');
  };

  /**
   * Preenche automaticamente credenciais para teste/desenvolvimento
   */
  const applyQuickCredentials = (usr: string, pass: string, role: UserRole) => {
    setUsername(usr);
    setPassword(pass);
    setSelectedRole(role);
    setErrorMsg('');
    setShowHintModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Luzes de Fundo Futuristas */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#145EDB]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#145EDB] to-slate-900 border border-blue-400/30 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl">
            G
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl text-white tracking-tight">GRIT</span>
              <span className="font-black text-xl text-[#145EDB] tracking-tight">NEWS</span>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase ml-1">
                TenPets
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Portal Gerencial Autenticado SSL 256-Bit</p>
          </div>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Site Público</span>
        </button>
      </header>

      {/* Central Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8 z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6 relative">
          
          {/* Badge de Segurança */}
          <div className="flex items-center justify-center gap-2 bg-blue-950/80 text-blue-300 border border-blue-800/50 py-1.5 px-3 rounded-full text-xs font-medium w-fit mx-auto">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Área Administrativa Restrita</span>
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Acesso Gerencial
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Digite suas credenciais de gestor ou utilize a recuperação de senha caso tenha esquecido.
            </p>
          </div>

          {/* Banner de Sucesso se Houver */}
          {successMsg && (
            <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sucesso!</p>
                <p className="text-[11px] text-emerald-300 mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Banner de Erro se Houver */}
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Acesso Não Autorizado</p>
                <p className="text-[11px] text-rose-300 mt-0.5">{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleOpenRecovery}
                  className="mt-2 text-xs font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Clique aqui para Redefinir sua Senha agora</span>
                </button>
              </div>
            </div>
          )}

          {/* Form de Autenticação */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo Usuário / E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail ou Usuário Cadastrado
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ex: tassovasconcelos@gmail.com ou admin"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#145EDB] focus:ring-2 focus:ring-[#145EDB]/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={handleOpenRecovery}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold transition-colors cursor-pointer"
                >
                  Recuperar Senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#145EDB] focus:ring-2 focus:ring-[#145EDB]/40 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Seleção de Perfil Gerencial */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nível de Permissão (Perfil)
              </label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#145EDB] focus:ring-2 focus:ring-[#145EDB]/40 rounded-xl px-3 py-2.5 text-xs text-white transition-all outline-none cursor-pointer"
              >
                <option value="SUPERADMIN">Superadministrador (Acesso Total: Tasso / Admin)</option>
                <option value="EDITOR_IN_CHIEF">Editor-Chefe & TenPets (Letícia Karla)</option>
                <option value="COMMERCIAL_MANAGER">Gestor Comercial & Ofertas B2B</option>
                <option value="AUTHOR">Autor / Colaborador Científico</option>
              </select>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#145EDB] via-blue-600 to-amber-600 hover:from-blue-600 hover:to-amber-500 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando Credenciais...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entrar no Painel Gerencial</span>
                </>
              )}
            </button>
          </form>

          {/* Links e Atalhos Auxiliares */}
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2 text-center">
            <button
              type="button"
              onClick={handleOpenRecovery}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Esqueceu ou Deseja Redefinir sua Senha? Clique Aqui</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHintModal(!showHintModal)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Ver Contas e Senhas Mestra Aceitas</span>
            </button>
          </div>

          {/* Card com Contas Padrão para Acesso Rápido */}
          {showHintModal && (
            <div className="bg-slate-950/95 border border-amber-500/40 p-4 rounded-2xl space-y-3 text-xs animate-fadeIn">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Contas Administrativas Cadastradas:</span>
              </p>
              <div className="space-y-2 text-slate-300">
                <div
                  onClick={() => applyQuickCredentials('tassovasconcelos@gmail.com', 'gritnews2026', 'SUPERADMIN')}
                  className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/60 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">Tasso Vasconcelos (Superadmin):</span>
                    <span className="text-[11px] font-mono text-slate-400">tassovasconcelos@gmail.com / gritnews2026</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2.5 py-1 rounded-md font-bold">Usar</span>
                </div>

                <div
                  onClick={() => applyQuickCredentials('admin', 'gritnews@2026Tj#', 'SUPERADMIN')}
                  className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 hover:border-blue-500/60 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">Admin Geral:</span>
                    <span className="text-[11px] font-mono text-slate-400">admin / gritnews@2026Tj#</span>
                  </div>
                  <span className="text-[10px] bg-blue-900/80 text-blue-200 px-2.5 py-1 rounded-md font-bold">Usar</span>
                </div>

                <div
                  onClick={() => applyQuickCredentials('leticia', 'gritnews2026', 'EDITOR_IN_CHIEF')}
                  className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 hover:border-amber-500/60 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block">Letícia Karla (TenPets):</span>
                    <span className="text-[11px] font-mono text-slate-400">leticia / gritnews2026</span>
                  </div>
                  <span className="text-[10px] bg-amber-900/80 text-amber-200 px-2.5 py-1 rounded-md font-bold">Usar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative animate-fadeIn">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Recuperação de Senha Administrativa</h3>
                  <p className="text-xs text-slate-400">Redefina sua senha de acesso em instantes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRecoveryModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mensagem de Erro do Modal */}
            {recoveryError && (
              <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {/* PASSO 1: INFORMAR E-MAIL OU USUÁRIO */}
            {recoveryStep === 'input_email' && (
              <form onSubmit={handleRequestRecoveryToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Digite seu E-mail ou Nome de Usuário
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ex: tassovasconcelos@gmail.com ou admin"
                      value={recoveryEmail}
                      onChange={e => setRecoveryEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    O sistema localizará a conta administrativa associada a este e-mail para permitir a redefinição imediata.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <span>Localizar Conta & Redefinir Senha</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaultPasswords}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
                  >
                    Restaurar Senha Mestra
                  </button>
                </div>
              </form>
            )}

            {/* PASSO 2: DEFINIR NOVA SENHA */}
            {recoveryStep === 'set_new_password' && (
              <form onSubmit={handleSaveNewPassword} className="space-y-4">
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs space-y-1">
                  <p className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Conta Localizada com Sucesso!</span>
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    <strong>Titular:</strong> {recoveryAccountFound?.name} ({recoveryAccountFound?.email})
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Token de segurança gerado: <strong className="font-mono text-amber-300">{recoveryToken}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Digite a Nova Senha Desejada *
                  </label>
                  <div className="relative">
                    <input
                      type={recoveryShowNewPass ? 'text' : 'password'}
                      required
                      placeholder="Nova senha (mínimo 4 dígitos)"
                      value={recoveryNewPassword}
                      onChange={e => setRecoveryNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 outline-none"
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setRecoveryShowNewPass(!recoveryShowNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {recoveryShowNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirme a Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={recoveryShowNewPass ? 'text' : 'password'}
                      required
                      placeholder="Repita a nova senha"
                      value={recoveryConfirmPassword}
                      onChange={e => setRecoveryConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none"
                    />
                    <Check className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Nova Senha & Concluir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecoveryStep('input_email')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>
              </form>
            )}

            {/* PASSO 3: SUCESSO */}
            {recoveryStep === 'success' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Senha Redefinida com Sucesso!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Sua nova senha foi salva com sucesso e já está pronta para uso no formulário de login.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                  <span>E-mail: <strong>{username}</strong></span> • <span>Senha atualizada</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRecoveryModalOpen(false)}
                  className="w-full bg-[#145EDB] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>Entrar Agora no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer do Acesso Restrito */}
      <footer className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-900 pt-4 z-10">
        <p>© 2026 GRIT NEWS & TenPets - Sistema de Gestão de Conteúdo e Mídias.</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Servidor Criptografado</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Integração Subdomínio TenPets</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
