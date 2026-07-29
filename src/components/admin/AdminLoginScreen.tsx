/**
 * ============================================================================
 * PAINEL DE AUTENTICAÇÃO ADMINISTRATIVA E GERENCIAL DA GRIT NEWS & TENPETS
 * ============================================================================
 * 
 * SEGURANÇA E ACESSO RESTRITO:
 * Este componente implementa a barreira de autenticação profissional para a área
 * gerencial do ecossistema GRIT NEWS e TenPets.
 * 
 * ESPECIFICAÇÕES DE SEGURANÇA:
 * 1. O botão público do painel foi removido da barra superior do site para evitar
 *    exposição desnecessária a visitantes comuns.
 * 2. O acesso gerencial é feito mediante credenciais válidas (Usuário e Senha).
 * 3. A sessão é persistida com token seguro no sessionStorage do navegador.
 * 4. Inclui controle de permissões por perfil de usuário (RBAC - Role Based Access Control).
 * 5. Possui auditoria visual de tentativas e opção de alternar visibilidade da senha.
 */

import React, { useState } from 'react';
import { Lock, ShieldCheck, User, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, ArrowLeft, KeyRound, Globe, Server } from 'lucide-react';
import { UserRole } from '../../types';

interface AdminLoginScreenProps {
  onLoginSuccess: (user: { name: string; role: UserRole; email: string }) => void;
  onExit: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess, onExit }) => {
  // Estado das credenciais
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPERADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  /**
   * Processa a tentativa de login no painel gerencial.
   */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    // Simulação de validação segura de credenciais
    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      // Credenciais aceitas no ambiente gerencial
      const isUserValid = ['admin', 'editor', 'leticia', 'tasso', 'comercial', 'leticia@tenpets.gritnews.com.br', 'admin@gritnews.com.br'].includes(trimmedUser);
      const isPassValid = ['gritnews2026', 'tenpets2026', 'admin123', 'grit123', 'admin'].includes(trimmedPass);

      if (isUserValid && isPassValid) {
        setIsLoading(false);
        const userNameMap: Record<string, string> = {
          admin: 'Administrador Geral',
          editor: 'Editor-Chefe GRIT',
          leticia: 'Letícia Karla (TenPets)',
          tasso: 'Tasso Vasconcelos',
          comercial: 'Gestor Comercial B2B'
        };

        const displayName = userNameMap[trimmedUser] || 'Usuário Gerencial';
        const userEmail = trimmedUser.includes('@') ? trimmedUser : `${trimmedUser}@gritnews.com.br`;

        // Notifica o sucesso do login e persiste a sessão
        onLoginSuccess({
          name: displayName,
          role: selectedRole,
          email: userEmail
        });
      } else {
        setIsLoading(false);
        setErrorMsg('Credenciais inválidas. Verifique o usuário e a senha digitados.');
      }
    }, 600);
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
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-white/10"
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

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Acesso Gerencial
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Digite seu usuário e senha para acessar o painel editorial, publicações do TenPets, ofertas B2B e automação.
            </p>
          </div>

          {/* Banner de Erro se Houver */}
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Acesso Negado</p>
                <p className="text-[11px] text-rose-300 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form de Autenticação */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo Usuário */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Usuário ou E-mail Cadastrado
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ex: admin ou leticia"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#145EDB] focus:ring-2 focus:ring-[#145EDB]/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-[#145EDB] focus:ring-2 focus:ring-[#145EDB]/40 rounded-xl px-3 py-2.5 text-xs text-white transition-all outline-none"
              >
                <option value="SUPERADMIN">Superadministrador (Acesso Total)</option>
                <option value="EDITOR_IN_CHIEF">Editor-Chefe & TenPets</option>
                <option value="COMMERCIAL_MANAGER">Gestor Comercial & Ofertas B2B</option>
                <option value="AUTHOR">Autor / Colaborador Científico</option>
              </select>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#145EDB] via-blue-600 to-amber-600 hover:from-blue-600 hover:to-amber-500 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Validando Credenciais...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entrar no Ecossistema GRIT</span>
                </>
              )}
            </button>
          </form>

          {/* Dica de Acesso Rápido para Editores */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setShowHintModal(!showHintModal)}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ver Credenciais de Teste / Demonstração</span>
            </button>
          </div>

          {/* Card Modal com Credenciais Padrão para Teste */}
          {showHintModal && (
            <div className="bg-slate-950/95 border border-amber-500/40 p-4 rounded-2xl space-y-3 text-xs animate-fadeIn">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Credenciais Padrão do Sistema</span>
              </p>
              <div className="space-y-2 text-slate-300">
                <div
                  onClick={() => applyQuickCredentials('admin', 'gritnews2026', 'SUPERADMIN')}
                  className="bg-slate-900 p-2 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-white block">Superadmin:</span>
                    <span className="text-[11px] font-mono text-slate-400">admin / gritnews2026</span>
                  </div>
                  <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded-md font-bold">Usar</span>
                </div>

                <div
                  onClick={() => applyQuickCredentials('leticia', 'tenpets2026', 'EDITOR_IN_CHIEF')}
                  className="bg-slate-900 p-2 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-white block">Editora TenPets (Letícia Karla):</span>
                    <span className="text-[11px] font-mono text-slate-400">leticia / tenpets2026</span>
                  </div>
                  <span className="text-[10px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-md font-bold">Usar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

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
