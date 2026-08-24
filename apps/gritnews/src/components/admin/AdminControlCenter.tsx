import React, { useEffect, useState } from 'react';
import type { Lead } from '@gritnews/types';
import { getLeads } from '../../lib/storage';
import { getSupabaseClient } from '../../lib/supabase';
import { AdminControlCenterV2 } from './AdminControlCenterV2';

/**
 * Entrada oficial da rota /admin/apps.
 * A fonte preferencial passa a ser o CRM central no Supabase.
 * O storage local permanece somente como fallback de continuidade operacional.
 */
export const AdminControlCenter: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(() => getLeads());

  useEffect(() => {
    let active = true;

    const loadCommercialData = async () => {
      const client = getSupabaseClient();
      if (!client) return;

      const { data, error } = await client
        .from('leads')
        .select('id,name,email,whatsapp,business_name,status,product,product_key,score,source,campaign,owner_email,next_action,next_action_at,priority,temperature,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error || !data || !active) return;

      const mapped = data.map((row: any) => ({
        id: row.id,
        name: row.name || row.business_name || 'Lead',
        email: row.email || '',
        phone: row.whatsapp || '',
        company: row.business_name || '',
        message: '',
        status: row.status || 'NEW',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        appId: row.product_key || row.product || undefined,
        source: row.source || undefined,
        campaign: row.campaign || undefined,
        owner: row.owner_email || undefined,
        nextAction: row.next_action || undefined,
        nextActionAt: row.next_action_at || undefined,
        score: row.score,
        priority: row.priority,
        temperature: row.temperature
      })) as unknown as Lead[];

      setLeads(mapped);
    };

    loadCommercialData();
    const timer = window.setInterval(loadCommercialData, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return <AdminControlCenterV2 leads={leads} />;
};
