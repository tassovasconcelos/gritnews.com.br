import React, { useState } from 'react';
import { LayoutDashboard, FileText, FolderPlus, Megaphone, Tag, Users, MessageSquare, Settings, ArrowLeft, Shield, UserCheck, BookOpen, Image, Sparkles, Globe } from 'lucide-react';
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

type AdminTab = 'dashboard' | 'articles' | 'categories' | 'media' | 'trends' | 'seo' | 'ads' | 'offers' | 'leads' | 'comments' | 'settings';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPERADMIN');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'COMMERCIAL_MANAGER'] },
    { id: 'articles', label: 'CMS Artigos', icon: FileText, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'trends', label: 'Automação Trends & IA', icon: Sparkles, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'media', label: 'Gerenciador de Mídia', icon: Image, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF', 'AUTHOR'] },
    { id: 'seo', label: 'SEO & Indexação Google', icon: Globe, roles: ['SUPERADMIN', 'EDITOR_IN_CHIEF'] },
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
      <aside className="w-full md:w-64 bg-[#0B2343] text-white flex-shrink-0 p-4 border-r border-[#0B2343]/30 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white tracking-wider">GRIT</span>
              <span className="bg-[#145EDB] text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase">PAINEL</span>
            </div>
            <p className="text-[10px] text-gray-300">Sistema Editorial & Comercial</p>
          </div>

          <button
            onClick={onExitAdmin}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            title="Voltar ao Portal Público"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Role Switcher RBAC Simulator */}
        <div className="bg-white/10 p-3 rounded-xl space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-gray-300 block">Perfil Ativo (RBAC Test)</span>
          <select
            value={currentRole}
            onChange={e => {
              const newRole = e.target.value as UserRole;
              setCurrentRole(newRole);
              setActiveTab('dashboard');
              onShowToast(`Perfil alternado para ${newRole}`);
            }}
            className="w-full bg-[#145EDB] text-white text-xs font-bold p-1.5 rounded-lg border border-white/20 focus:outline-none"
          >
            <option value="SUPERADMIN">Superadmin (Acesso Total)</option>
            <option value="EDITOR_IN_CHIEF">Editor-Chefe</option>
            <option value="AUTHOR">Autor / Colunista</option>
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

        {/* Manuals and Documentation Button */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="w-full bg-[#FF8500] hover:bg-[#e07500] text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Manual Hostinger & SEO</span>
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

        {activeTab === 'articles' && (
          <AdminArticles
            articles={articles}
            categories={categories}
            authors={authors}
            onRefresh={onRefreshData}
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
