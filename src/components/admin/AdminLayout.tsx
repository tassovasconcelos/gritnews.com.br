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
  Database, PawPrint, LogOut, Lock, HelpCircle, Flame, Building2, ShoppingBag,
  CreditCard, ShieldCheck, Columns, Briefcase, Activity
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
import { AdminImoveis } from './AdminImoveis';
import { AdminPlaybookOrders } from './AdminPlaybookOrders';
import { AdminPayments } from './AdminPayments';
import { AdminLoginScreen } from './AdminLoginScreen';
import { adminSignOut, getAdminSession } from '../../lib/adminAuth';
import { AdminGritVerify } from './AdminGritVerify';
import { AdminNewsCandidates } from './AdminNewsCandidates';
import { AdminSources } from './AdminSources';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminOpportunities } from './AdminOpportunities';
import { DocumentationModal } from '../views/DocumentationModal';
import { GritNewsLogo } from '../ui/GritNewsLogo';

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
  | 'verify'
  | 'candidates'
  | 'sources'
  | 'audit'
  | 'opportunities'
  | 'guide'
  | 'articles'
  | 'imoveis'
  | 'playbook'
  | 'payments'
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
  const [authState,setAuthState]=useState<'loading'|'anonymous'|'authenticated'>('loading');
  const [authUser,setAuthUser]=useState<{name:string;role:UserRole;email:string}|null>(null);
  const [activeTab,setActiveTab]=useState<AdminTab>('dashboard');
  const [isDocModalOpen,setIsDocModalOpen]=useState(false);
  const currentRole:UserRole=authUser?.role||'READER';

  useEffect(()=>{
    let active=true;
    getAdminSession().then(user=>{
      if(!active)return;
      if(user){setAuthUser(user);setAuthState('authenticated')}
      else{setAuthUser(null);setAuthState('anonymous')}
    }).catch(()=>{
      if(active){setAuthUser(null);setAuthState('anonymous')}
    });
    return()=>{active=false};
  },[]);

  const handleLoginSuccess=(user:{name:string;role:UserRole;email:string})=>{
    setAuthUser(user);
    setAuthState('authenticated');
    onShowToast(`Bem-vindo, ${user.name}! Sessão autenticada.`);
  };

  const handleLogout=async()=>{
    try{await adminSignOut()}catch{}
    setAuthUser(null);
    setAuthState('anonymous');
    onShowToast('Sessão encerrada com segurança.');
    onExitAdmin();
  };

  if(authState==='loading'){
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="text-sm text-slate-300">Validando sessão administrativa…</div></div>;
  }

  if(authState!=='authenticated'||!authUser){
    return <AdminLoginScreen onLoginSuccess={handleLoginSuccess} onExit={onExitAdmin}/>;
  }

  // Itens de Menu do Painel Gerencial (Hierarquia Editorial GRIT 2.0)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'COMMERCIAL_MANAGER', 'ANALYST'] },
    { id: 'verify', label: '🛡️ GRIT Verify (Checagem)', icon: ShieldCheck, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'ANALYST'] },
    { id: 'candidates', label: '📋 Banco de Pautas (Kanban)', icon: Columns, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR', 'ANALYST'] },
    { id: 'sources', label: '🏛️ Fontes Homologadas', icon: Building2, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'ANALYST'] },
    { id: 'opportunities', label: '💼 Oportunidades B2B', icon: Briefcase, roles: ['SUPERADMIN', 'ADMIN', 'COMMERCIAL_MANAGER', 'EDITOR_IN_CHIEF', 'PARTNER'] },
    { id: 'audit', label: '🔒 Trilha de Auditoria (Logs)', icon: Activity, roles: ['SUPERADMIN', 'ADMIN'] },
    { id: 'viral', label: 'Estratégia 1M Views (Virais)', icon: Flame, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'guide', label: 'Guia Mídias & Banners', icon: HelpCircle, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR', 'COMMERCIAL_MANAGER'] },
    { id: 'articles', label: 'CMS Artigos & Notícias', icon: FileText, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR', 'AUTHOR'] },
    { id: 'imoveis', label: 'Imóveis no Eusébio', icon: Building2, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'COMMERCIAL_MANAGER', 'PARTNER'] },
    { id: 'playbook', label: 'Vendas Playbook (R$ 29,90)', icon: ShoppingBag, roles: ['SUPERADMIN', 'ADMIN', 'COMMERCIAL_MANAGER', 'EDITOR_IN_CHIEF'] },
    { id: 'payments', label: '💳 PIX & Mercado Pago', icon: CreditCard, roles: ['SUPERADMIN', 'ADMIN', 'COMMERCIAL_MANAGER'] },
    { id: 'tenpets', label: 'TenPets (Resgates & Ciência)', icon: PawPrint, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'trends', label: 'Automação Trends & IA', icon: Sparkles, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'media', label: 'Gerenciador de Mídia', icon: Image, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'seo', label: 'SEO & Indexação Google', icon: Globe, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF'] },
    { id: 'supabase', label: 'Banco Supabase', icon: Database, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF'] },
    { id: 'categories', label: 'Categorias', icon: FolderPlus, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF'] },
    { id: 'ads', label: 'Anúncios & Mídia', icon: Megaphone, roles: ['SUPERADMIN', 'ADMIN', 'COMMERCIAL_MANAGER'] },
    { id: 'offers', label: 'Ofertas & Afiliados', icon: Tag, roles: ['SUPERADMIN', 'ADMIN', 'COMMERCIAL_MANAGER', 'PARTNER'] },
    { id: 'leads', label: 'Leads & Newsletter', icon: Users, roles: ['SUPERADMIN', 'ADMIN', 'COMMERCIAL_MANAGER', 'EDITOR_IN_CHIEF'] },
    { id: 'comments', label: 'Moderação Comentários', icon: MessageSquare, roles: ['SUPERADMIN', 'ADMIN', 'EDITOR_IN_CHIEF', 'EDITOR'] },
    { id: 'settings', label: 'Configurações & SEO', icon: Settings, roles: ['SUPERADMIN', 'ADMIN'] }
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
              <GritNewsLogo variant="light" size="sm" showSlogan={false} />
              <p className="text-[10px] text-amber-300 font-mono mt-1 uppercase font-bold tracking-wider">Painel de Gestão & Editoria</p>
            </div>

            <button
              onClick={onExitAdmin}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
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

          <div className="bg-white/5 p-3 rounded-xl space-y-1.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-gray-300 block">Permissão validada pelo servidor</span>
            <div className="w-full bg-[#145EDB] text-white text-xs font-bold p-2 rounded-lg border border-white/20">
              {currentRole}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
            {allowedTabs.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#145EDB] text-white shadow-md'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
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

        {activeTab === 'verify' && (
          <AdminGritVerify
            currentRole={currentRole}
            currentUserName={authUser.name}
            onRefreshData={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'candidates' && (
          <AdminNewsCandidates
            currentRole={currentRole}
            currentUserName={authUser.name}
            onRefreshData={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'sources' && (
          <AdminSources
            currentRole={currentRole}
            currentUserName={authUser.name}
            onRefreshData={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'audit' && (
          <AdminAuditLogs
            currentRole={currentRole}
            currentUserName={authUser.name}
            onRefreshData={onRefreshData}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'opportunities' && (
          <AdminOpportunities
            currentRole={currentRole}
            currentUserName={authUser.name}
            onRefreshData={onRefreshData}
            onShowToast={onShowToast}
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

        {activeTab === 'imoveis' && (
          <AdminImoveis
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'playbook' && (
          <AdminPlaybookOrders
            onShowToast={onShowToast}
          />
        )}

        {activeTab === 'payments' && (
          <AdminPayments
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
