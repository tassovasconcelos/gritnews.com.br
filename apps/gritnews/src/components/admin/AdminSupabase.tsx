import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, Zap, Server, Terminal, Shield, ArrowRight, Layers, ExternalLink, Download } from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  generateSupabaseSQLScript,
  syncLocalDataToSupabase,
  SupabaseConfig
} from '../../lib/supabase';

interface AdminSupabaseProps {
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AdminSupabase: React.FC<AdminSupabaseProps> = ({ onShowToast }) => {
  const [config, setConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.anonKey);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'sql' | 'guide'>('settings');

  const sqlScript = generateSupabaseSQLScript();

  useEffect(() => {
    const current = getSupabaseConfig();
    setConfig(current);
    setUrlInput(current.url);
    setKeyInput(current.anonKey);
  }, []);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(urlInput, keyInput);
    const updated = getSupabaseConfig();
    setConfig(updated);
    setTestResult(null);
    onShowToast('Credenciais do Supabase salvas com sucesso!', 'success');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTesting(false);
    setTestResult(result);
    if (result.success) {
      onShowToast('Conexão com o Supabase verificada com sucesso!', 'success');
    } else {
      onShowToast('Falha ao conectar com o Supabase. Verifique a URL e a Chave.', 'info');
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    const res = await syncLocalDataToSupabase();
    setSyncing(false);
    if (res.success) {
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'info');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    onShowToast('Script SQL copiado! Cole no Editor SQL do seu painel Supabase.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#10233F] via-[#0B2343] to-[#145EDB] p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase">
          <Database className="w-3.5 h-3.5" />
          <span>Infraestrutura de Banco de Dados PostgreSQL / Supabase</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Banco de Dados & Conectividade Supabase
        </h1>
        <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed">
          Gerencie o banco de dados em nuvem PostgreSQL do portal GRIT NEWS. Configure as chaves de API, execute os scripts DDL de migração e sincronize dados em tempo real.
        </p>

        {/* Status Indicator */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
            config.isConfigured 
              ? 'bg-emerald-500 text-white' 
              : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
          }`}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>
              {config.isConfigured ? 'Supabase Configurado' : 'Aguardando Credenciais'}
            </span>
          </div>

          {config.source === 'custom' && (
            <span className="text-gray-300 bg-white/10 px-2.5 py-1 rounded-full text-[11px]">
              Origem: Painel Administrativo
            </span>
          )}
          {config.source === 'env' && (
            <span className="text-gray-300 bg-white/10 px-2.5 py-1 rounded-full text-[11px]">
              Origem: Variáveis de Ambiente (.env)
            </span>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-xs font-bold text-[#10233F]">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'settings' 
              ? 'border-[#145EDB] text-[#145EDB]' 
              : 'border-transparent text-gray-500 hover:text-[#10233F]'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Credenciais & Conexão</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sql' 
              ? 'border-[#145EDB] text-[#145EDB]' 
              : 'border-transparent text-gray-500 hover:text-[#10233F]'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Script SQL de Tabelas & RLS</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'guide' 
              ? 'border-[#145EDB] text-[#145EDB]' 
              : 'border-transparent text-gray-500 hover:text-[#10233F]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Guia de Implantação Supabase</span>
        </button>
      </div>

      {/* TAB 1: CREDENTIALS & CONNECTION */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-[#10233F] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#145EDB]" />
                  Chaves de Acesso da API Supabase
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Encontre a URL do Projeto e a Chave Pública Anon no painel do Supabase em Project Settings &gt; API.
                </p>
              </div>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#145EDB] hover:underline flex items-center gap-1"
              >
                Abrir Painel Supabase <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#10233F] mb-1">
                    URL do Projeto Supabase (Project URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzxyzxyz.supabase.co"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Exemplo: https://xxxxxxxxxxxx.supabase.co</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10233F] mb-1">
                    Chave Pública Anon (anon public key)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#145EDB]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Sua chave pública segura para chamadas da API do cliente no portal.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="bg-[#10233F] hover:bg-[#0B2343] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    {testing ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-[#FF8500]" />
                    )}
                    <span>Testar Conexão</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncData}
                    disabled={syncing || !config.isConfigured}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    {syncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    <span>Sincronizar Dados Locais para o Supabase</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Salvar Credenciais
                </button>
              </div>
            </form>

            {/* Test Result Message Box */}
            {testResult && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-xs">
                    {testResult.success ? 'Conexão Bem-Sucedida' : 'Falha no Teste de Conexão'}
                  </h4>
                  <p className="text-xs mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SQL SCHEMA SCRIPT */}
      {activeTab === 'sql' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-[#10233F] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#145EDB]" />
                Script de Criação de Tabelas, Índices e RLS
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Execute este código SQL no Editor SQL do Supabase para criar a estrutura completa do portal GRIT NEWS.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="bg-[#145EDB] hover:bg-[#0f4bb3] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copiedSql ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>

          <div className="relative bg-[#0F172A] text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[500px] leading-relaxed shadow-inner">
            <pre>{sqlScript}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: DEPLOYMENT GUIDE */}
      {activeTab === 'guide' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-[#10233F] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF8500]" />
            Passo a Passo de Integração Supabase no Ecossistema GRIT NEWS
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#10233F] text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-[#10233F]">Criar Projeto Gratuitamente no Supabase</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#145EDB] font-bold underline">supabase.com</a>, crie sua conta e inicie um novo projeto especificando um nome (ex: <code>grit-news-prod</code>) e senha do banco PostgreSQL.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#10233F] text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-[#10233F]">Executar o Script SQL das Tabelas</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  No menu lateral do Supabase, vá em <strong>SQL Editor</strong> &gt; <strong>New Query</strong>. Cole o script gerado na aba "Script SQL" acima e clique em <strong>Run</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#10233F] text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-[#10233F]">Copiar Credenciais de API</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Vá em <strong>Project Settings</strong> &gt; <strong>API</strong>. Copie a <strong>Project URL</strong> e a <strong>anon public key</strong>. Cole na aba "Credenciais & Conexão" deste painel.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-[#10233F]">Sincronizar Conteúdo Existente</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Clique no botão <strong>"Sincronizar Dados Locais para o Supabase"</strong> para popular as tabelas recém-criadas com todo o acervo de notícias, categorias, autores e anúncios do portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
