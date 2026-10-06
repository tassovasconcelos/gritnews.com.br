import React, { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, Database, Layers, RefreshCw, Shield, Terminal, Zap } from 'lucide-react';
import {
  generateSupabaseSQLScript,
  getSupabaseConfig,
  syncLocalDataToSupabase,
  testSupabaseConnection
} from '../../lib/supabase';

interface AdminSupabaseProps {
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AdminSupabase: React.FC<AdminSupabaseProps> = ({ onShowToast }) => {
  const config = getSupabaseConfig();
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'guide'>('status');
  const sqlScript = generateSupabaseSQLScript();

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTesting(false);
    setTestResult(result);
    onShowToast(
      result.success ? 'Conexão segura com o banco verificada.' : 'Não foi possível validar a conexão segura.',
      result.success ? 'success' : 'info'
    );
  };

  const handleSyncData = async () => {
    setSyncing(true);
    const result = await syncLocalDataToSupabase();
    setSyncing(false);
    onShowToast(result.message, result.success ? 'success' : 'info');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    onShowToast('Script SQL copiado.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#10233F] via-[#0B2343] to-[#145EDB] p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5" />
          Segurança de infraestrutura
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Banco de dados & conectividade segura</h1>
        <p className="text-xs sm:text-sm text-gray-200 max-w-3xl leading-relaxed">
          Credenciais, tokens, chaves e URLs privadas não são exibidos, editados ou persistidos neste navegador.
          A configuração é administrada exclusivamente no ambiente seguro de hospedagem.
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-bold">
          <span className={`px-3 py-1 rounded-full ${config.isConfigured ? 'bg-emerald-500 text-white' : 'bg-amber-500/30 text-amber-100 border border-amber-400/40'}`}>
            {config.isConfigured ? 'Configuração de produção disponível' : 'Configuração de produção indisponível'}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200">Nenhum segredo armazenado no browser</span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 gap-6 text-xs font-bold text-[#10233F] overflow-x-auto">
        <button onClick={() => setActiveTab('status')} className={`pb-3 border-b-2 flex items-center gap-2 ${activeTab === 'status' ? 'border-[#145EDB] text-[#145EDB]' : 'border-transparent text-gray-500'}`}>
          <Database className="w-4 h-4" /> Status seguro
        </button>
        <button onClick={() => setActiveTab('sql')} className={`pb-3 border-b-2 flex items-center gap-2 ${activeTab === 'sql' ? 'border-[#145EDB] text-[#145EDB]' : 'border-transparent text-gray-500'}`}>
          <Terminal className="w-4 h-4" /> Estrutura SQL
        </button>
        <button onClick={() => setActiveTab('guide')} className={`pb-3 border-b-2 flex items-center gap-2 ${activeTab === 'guide' ? 'border-[#145EDB] text-[#145EDB]' : 'border-transparent text-gray-500'}`}>
          <Layers className="w-4 h-4" /> Governança
        </button>
      </div>

      {activeTab === 'status' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-bold text-[#10233F]">Diagnóstico de conexão sem exposição de credenciais</h2>
            <p className="text-xs text-slate-500 mt-1">O teste informa somente disponibilidade. Valores de configuração nunca são renderizados.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleTestConnection} disabled={testing || !config.isConfigured} className="bg-[#10233F] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#FF8500]" />}
              {testing ? 'Validando...' : 'Testar conexão'}
            </button>
            <button type="button" onClick={handleSyncData} disabled={syncing || !config.isConfigured} className="bg-emerald-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {syncing ? 'Sincronizando...' : 'Sincronizar dados'}
            </button>
          </div>
          {testResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <p className="text-xs">{testResult.message}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#10233F]">Estrutura SQL & RLS</h2>
              <p className="text-xs text-slate-500 mt-1">Somente estrutura. Nenhum segredo ou valor de autenticação é incluído.</p>
            </div>
            <button onClick={handleCopySql} className="bg-[#145EDB] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedSql ? 'Copiado' : 'Copiar SQL'}
            </button>
          </div>
          <div className="bg-[#0F172A] text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[500px]">
            <pre>{sqlScript}</pre>
          </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#10233F]">Política de configuração segura</h2>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><strong className="block text-[#10233F] mb-1">Hospedagem</strong>Configure valores somente nas variáveis de ambiente/secret manager do servidor e do pipeline de deploy.</div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><strong className="block text-[#10233F] mb-1">Navegador</strong>Não use localStorage, sessionStorage, campos do painel ou código-fonte para armazenar senhas, tokens ou chaves privadas.</div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><strong className="block text-[#10233F] mb-1">Rotação</strong>Qualquer segredo anteriormente exposto deve ser invalidado e substituído no provedor correspondente.</div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><strong className="block text-[#10233F] mb-1">Auditoria</strong>O painel deve mostrar somente estado da integração, nunca o valor de uma credencial.</div>
          </div>
        </div>
      )}
    </div>
  );
};
