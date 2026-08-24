import React from 'react';
import { getLeads } from '../../lib/storage';
import { AdminControlCenterV2 } from './AdminControlCenterV2';

/**
 * Entrada oficial da rota /admin/apps.
 * Mantém compatibilidade com o AdminLayout existente e delega a visualização
 * para a Central V2, que combina telemetria técnica com dados comerciais reais.
 */
export const AdminControlCenter: React.FC = () => {
  const leads = getLeads();
  return <AdminControlCenterV2 leads={leads} />;
};
