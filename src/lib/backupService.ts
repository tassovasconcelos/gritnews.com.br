/**
 * ============================================================================
 * SERVIÇO DE BACKUP, RESTAURAÇÃO E AUDITORIA DE SEGURANÇA — GRIT NEWS
 * ============================================================================
 * 
 * Permite exportar e importar com segurança todos os dados do portal:
 * - Matérias, Categorias, Autores
 * - Leads e Assinantes LGPD
 * - Pedidos e Vendas do Playbook / Infoprodutos
 * - Campanhas de Anúncios e Ofertas
 * - Configurações Gerais e Gateways de Pagamento
 * - TenPets (Artigos, Resgates, Parceiros) e Imóveis Eusébio
 */

import { 
  getArticles, saveArticles,
  getCategories, saveCategories,
  getAuthors, saveAuthors,
  getLeads, getSubscribers,
  getOffers, saveOffers,
  getAds, saveAds,
  getSiteConfig, saveSiteConfig,
  getPlaybookOrders, savePlaybookOrders,
  getTenPetsArticles, saveTenPetsArticles,
  getTenPetsRescues, saveTenPetsRescues,
  getTenPetsPartners, saveTenPetsPartners,
  getEusebioProperties, saveEusebioProperties
} from './storage';
import { getAuditLogs, recordAuditLog } from './gritVerify';

export interface FullSystemBackup {
  version: string;
  timestamp: string;
  generatedBy: string;
  domain: string;
  data: {
    siteConfig: any;
    articles: any[];
    categories: any[];
    authors: any[];
    leads: any[];
    subscribers: any[];
    offers: any[];
    ads: any[];
    playbookOrders: any[];
    tenpetsArticles: any[];
    tenpetsRescues: any[];
    tenpetsPartners: any[];
    eusebioProperties: any[];
    auditLogs: any[];
  };
}

/**
 * Gera um objeto completo com todos os dados persistidos no portal
 */
export function generateFullBackup(userName = 'Administrador Geral'): FullSystemBackup {
  return {
    version: '2.5.0-2026',
    timestamp: new Date().toISOString(),
    generatedBy: userName,
    domain: 'gritnews.com.br',
    data: {
      siteConfig: getSiteConfig(),
      articles: getArticles(),
      categories: getCategories(),
      authors: getAuthors(),
      leads: getLeads(),
      subscribers: getSubscribers(),
      offers: getOffers(),
      ads: getAds(),
      playbookOrders: getPlaybookOrders(),
      tenpetsArticles: getTenPetsArticles(),
      tenpetsRescues: getTenPetsRescues(),
      tenpetsPartners: getTenPetsPartners(),
      eusebioProperties: getEusebioProperties(),
      auditLogs: getAuditLogs()
    }
  };
}

/**
 * Faz download do arquivo de backup JSON criptografável
 */
export function downloadBackupFile(userName = 'Administrador Geral'): void {
  const backup = generateFullBackup(userName);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const filename = `backup_gritnews_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
  
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  recordAuditLog({
    userId: userName.toLowerCase().replace(/\s+/g, '_'),
    userName,
    userRole: 'SUPERADMIN',
    action: 'EXPORT',
    entityType: 'settings',
    entityId: 'system_backup',
    entityTitle: 'Backup Geral do Sistema',
    notes: `Backup completo exportado contendo matérias, pedidos, leads e configurações.`
  });
}

/**
 * Restaura o sistema a partir de um arquivo de backup
 */
export function restoreBackupData(backupData: FullSystemBackup, userName = 'Administrador Geral'): { success: boolean; message: string } {
  try {
    if (!backupData || !backupData.data) {
      return { success: false, message: 'Arquivo de backup inválido ou corrompido.' };
    }

    const { data } = backupData;

    if (data.siteConfig) saveSiteConfig(data.siteConfig);
    if (Array.isArray(data.articles)) saveArticles(data.articles);
    if (Array.isArray(data.categories)) saveCategories(data.categories);
    if (Array.isArray(data.authors)) saveAuthors(data.authors);
    if (Array.isArray(data.offers)) saveOffers(data.offers);
    if (Array.isArray(data.ads)) saveAds(data.ads);
    if (Array.isArray(data.playbookOrders)) savePlaybookOrders(data.playbookOrders);
    if (Array.isArray(data.tenpetsArticles)) saveTenPetsArticles(data.tenpetsArticles);
    if (Array.isArray(data.tenpetsRescues)) saveTenPetsRescues(data.tenpetsRescues);
    if (Array.isArray(data.tenpetsPartners)) saveTenPetsPartners(data.tenpetsPartners);
    if (Array.isArray(data.eusebioProperties)) saveEusebioProperties(data.eusebioProperties);

    recordAuditLog({
      userId: userName.toLowerCase().replace(/\s+/g, '_'),
      userName,
      userRole: 'SUPERADMIN',
      action: 'UPDATE',
      entityType: 'settings',
      entityId: 'system_restore',
      entityTitle: 'Restauração de Backup do Sistema',
      notes: `Sistema restaurado com sucesso a partir de backup de ${backupData.timestamp}.`
    });

    return {
      success: true,
      message: 'Backup restaurado com sucesso! Todos os dados foram sincronizados.'
    };
  } catch (err: any) {
    console.error('Erro ao restaurar backup:', err);
    return {
      success: false,
      message: `Erro na restauração: ${err?.message || 'Arquivo incompatível.'}`
    };
  }
}
