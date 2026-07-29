/**
 * ============================================================================
 * PAINEL ADMINISTRATIVO E GERENCIAL INTEGRADO DA GRIT NEWS & TENPETS
 * ============================================================================
 * 
 * SEGURANÇA E FLUXO DE AUTENTICAÇÃO:
 * - O acesso a esta interface exige autenticação por Usuário e Senha através do
 *   componente AdminLoginScreen.
 * - A sessão permanece ativa no sessionStorage do navegador enquanto o usuário edita.
 * - Inclui botão de Logout ("Sair do Painel") para encerrar a sessão com segurança.
 * - Inclui o módulo "Guia do Editor" com diretrizes sobre tamanhos de fotos (1200x600, 800x450, 400x400),
 *   embeds de vídeo do YouTube, fontes externas e parametrizador de afiliados.
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, FolderPlus, Megaphone, Tag, Users, MessageSquare,
  Settings, ArrowLeft, Shield, UserCheck, BookOpen, Image, Sparkles, Globe,
  Database, PawPrint, LogOut, Lock, HelpCircle, Flame
} from 'lucide-react';
import { ViralPautasWidget } from '../ui/ViralPautasWidget';
import { UserRole, Article, Category, Lead, NewsletterSubscriber, Offer, AdCampaign, AuthorProfile } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminArticles } from './AdminArticles';
import { AdminCategories } from './AdminCategories';
import { AdminAds } from './AdminAds';
import { AdminOffers } from './AdminOffers';
import { AdminLeads } from './AdminLeads';
import { AdminComments } from './AdminComments';
import { AdminSettings } from './AdminSettings';
import { AdminMedia } from './AdminMedia';
import { AdminTrendsAI } from './AdminTrendsAI';
import { AdminSEO } from './AdminSEO';
import { AdminSupabase } from './AdminSupabase';
import { AdminTenPets } from './AdminTenPets';
import { AdminGuide } from './AdminGuide';
import { AdminLoginScreen } from './AdminLoginScreen';
import { DocumentationModal } from '../views/DocumentationModal';

interface AdminLayoutProps {
  articles: Article[];
  categories: Category[];
  authors: AuthorProfile[];
  leads: Lead[];
  subscribers: NewsletterSubscriber[];
  offers: Offer[];
  ads: AdCampaign[];
  onRefreshData: () => void;
  onExitAdmin: () => void;
  onShowToast: (msg: string) => void;
}

type AdminTab =
  | 'dashboard'
  | 'guide'
  | 'articles'
  | 'tenpets'
  | 'viral'
  | 'categories'
  | 'media'
  | 'trends'
  | 'seo'
  | 'supabase'
  | 'ads'
  | 'offers'
  | 'leads'
  | 'comments'
  | 'settings';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  articles,
  categories,
  authors,
  leads,
  subscribers,
  offers,
  ads,
  onRefreshData,
  onExitAdmin,
  onShowToast
}) => {
  // Estado de Autenticação na Sessão
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('grit_admin_authenticated') === 'true';
  });

  const [authUser, setAuthUser] = useState<{ name: string; role: UserRole; email: string }>(() => {
    const savedName = sessionStorage.getItem('grit_admin_user_name');
    const savedRole = (sessionStorage.getItem('grit_admin_user_role') as UserRole) || 'SUPERADMIN';
    const savedEmail = sessionStorage.getItem('grit_admin_user_email') || 'admin@gritnews.com.br';

    return {
      name: savedName || 'Administrador Geral',
      role: savedRole,
      email: savedEmail
    };
  });

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(authUser.role);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Sincroniza role ativo se alterar usuário
  useEffect(() => {
    setCurrentRole(authUser.role);
  }, [authUser]);

  /**
   * Executa a entrada no painel após autenticação bem-sucedida no login
   */
  const handleLoginSuccess = (user: { name: string; role: UserRole; email: string }) => {
    sessionStorage.setItem('grit_admin_authenticated', 'true');
    sessionStorage.setItem('grit_admin_user_name', user.name);
    sessionStorage.setItem('grit_admin_user_role', user.role);
    sessionStorage.setItem('grit_admin_user_email', user.email);

    setAuthUser(user);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    onShowToast(`Bem-vindo, ${user.name}! Sessão autenticada.`);
  };

  /**
   * Encerra a sessão administrativa com segurança
   */
  const handleLogout = () => {
    sessionStorage.removeItem('grit_admin_authenticated');
    sessionStorage.removeItem('grit_admin_user_name');
    sessionStorage.removeItem('grit_admin_user_role');
    sessionStorage.removeItem('grit_admin_user_email');

    setIsAuthenticated(false);
    onShowToast('Sessão encerrada com segurança.');
    onExitAdmin();
  };

  // Se não estiver autenticado, exige login com Usuário e Senha
  if (!isAuthenticated) {
    return (
      <AdminLoginScreen
        onLoginSuccess={handleLoginSuccess}
        onExit={onExitAdmin}
      />
    );
  }

  // Itens de Menu do Painel Gerencial
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'COMMERCIAL_MANAGER'] },
    { id: 'viral', label: 'Estratégia 1M Views (Virais)', icon: Flame, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'guide', label: 'Guia Mídias & Banners', icon: HelpCircle, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR', 'COMMERCIAL_MANAGER'] },
    { id: 'articles', label: 'CMS Artigos & Notícias', icon: FileText, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'tenpets', label: 'TenPets (Resgates & Ciência)', icon: PawPrint, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'trends', label: 'Automação Trends & IA', icon: Sparkles, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'media', label: 'Gerenciador de Mídia', icon: Image, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'seo', label: 'SEO & Indexação Google', icon: Globe, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF'] },
    { id: 'supabase', label: 'Banco Supabase', icon: Database, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF'] },
    { id: 'categories', label: 'Categorias', icon: FolderPlus, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF'] },
    { id: 'ads', label: 'Anúncios & Mídia', icon: Megaphone, roles: ['SUPERADMIN', 'COMMERCIAL_MANAGER'] },
    { id: 'offers', label: 'Ofertas & Afiliados', icon: Tag, roles: ['SUPERADMIN', 'COMMERCIAL_MANAGER'] },
    { id: 'leads', label: 'Leads & Newsletter', icon: Users, roles: ['SUPERADMIN', 'COMMERCIAL_MANAGER', 'EDITOR_IN_CHIEF'] },
    { id: 'comments', label: 'Moderação Comentários', icon: MessageSquare, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF'] },
    { id: 'settings', label: 'Configurações & SEO', icon: Settings, roles: ['SUPERADMIN'] }
  ];

  const allowedTabs = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#0B2343] text-white flex-shrink-0 p-4 border-r border-[#0B2343]/30 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          {/* Header do Sidebar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-white tracking-wider">GRIT</span>
                <span className="bg-[#145EDB] text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase">PAINEL</span>
              </div>
              <p className="text-[10px] text-gray-300 font-mono">Gestão Editorial & Comercial</p>
            </div>

            <button
              onClick={onExitAdmin}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              title="Voltar ao Portal Público"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* User Info Bar */}
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider">Sessão Autenticada</span>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-white truncate">{authUser.name}</p>
            <p className="text-[10px] text-slate-300 font-mono truncate">{authUser.email}</p>
          </div>

          {/* Role Switcher RBAC */}
          <div className="bg-white/5 p-3 rounded-xl space-y-1.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-gray-300 block">Nível de Permissão (RBAC)</span>
            <select
              value={currentRole}
              onChange={e => {
                const newRole = e.target.value as UserRole;
                setCurrentRole(newRole);
                setActiveTab('dashboard');
                onShowToast(`Perfil de permissão ajustado para ${newRole}`);
              }}
              className="w-full bg-[#145EDB] text-white text-xs font-bold p-1.5 rounded-lg border border-white/20 focus:outline-none"
            >
              <option value="SUPERADMIN">Superadmin (Acesso Total)</option>
              <option value="EDITOR_IN_CHIEF">Editor-Chefe & TenPets</option>
              <option value="AUTHOR">Autor / Colaborador</option>
              <option value="COMMERCIAL_MANAGER">Gestor Comercial</option>
            </select>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {allowedTabs.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#145EDB] text-white shadow-md'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons at Sidebar Bottom */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-white/10"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Documentação do Subdomínio</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-rose-600/80 hover:bg-rose-700 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            articles={articles}
            leads={leads}
            subscribers={subscribers}
            offers={offers}
            ads={ads}
          />
        )}

        {activeTab === 'viral' && (
          <ViralPautasWidget
            onShowToast={onShowToast}
            onArticleCreated={() => onRefreshData()}
          />
        )}

        {activeTab === 'guide' && (
          <AdminGuide />
        )}

        {activeTab === 'articles' && (
          <AdminArticles
            articles={articles}
            categories={categories}
            authors={authors}
            onRefresh={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'tenpets' && (
          <AdminTenPets
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'trends' && (
          <AdminTrendsAI
            onRefreshData={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'media' && (
          <AdminMedia
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'seo' && (
          <AdminSEO
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'supabase' && (
          <AdminSupabase
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategories
            categories={categories}
            onRefresh={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'ads' && (
          <AdminAds
            ads={ads}
            onRefresh={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'offers' && (
          <AdminOffers
            offers={offers}
            categories={categories}
            onRefresh={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'leads' && (
          <AdminLeads
            leads={leads}
            subscribers={subscribers}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'comments' && (
          <AdminComments
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettings
            onShowToast={onShowToast}
          />
        )}
      </main>

      {/* Documentation Modal */}
      <DocumentationModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
