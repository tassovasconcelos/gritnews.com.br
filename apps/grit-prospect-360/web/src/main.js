import { createClient } from '@supabase/supabase-js';
import './style.css';

const EXPECTED_HOST = 'qspluchjhnnzgbbgmsro.supabase.co';
const MAX_CSV_BYTES = 2_000_000;
const PAGE_SIZE = 50;

export function publicConfig(env) {
  let project, api;
  try { project = new URL(env.VITE_PROSPECT_SUPABASE_URL || ''); }
  catch { throw new Error('URL do Supabase exclusivo não configurada.'); }
  if (project.protocol !== 'https:' || project.hostname !== EXPECTED_HOST) {
    throw new Error('O frontend precisa apontar para o Supabase exclusivo.');
  }
  try { api = new URL(env.VITE_PROSPECT_API_BASE_URL || ''); }
  catch { throw new Error('URL da API não configurada.'); }
  const safeApi = api.protocol === 'https:' ||
    (api.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(api.hostname));
  if (!safeApi || api.username || api.password || api.search || api.hash) {
    throw new Error('A API exige HTTPS, exceto localhost para desenvolvimento.');
  }
  const anonKey = env.VITE_PROSPECT_SUPABASE_ANON_KEY || '';
  if (!anonKey || anonKey.length < 24) throw new Error('Chave pública Supabase não configurada.');
  return { projectUrl: project.origin, apiBase: api.origin + api.pathname.replace(/\/+$/, ''), anonKey };
}

export function escapeHtml(input) {
  return String(input ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

const root = document.querySelector('#app');
const state = {
  client: null, apiBase: '', session: null, organizationId: '', organizations: [],
  companies: [], total: 0, page: 0, filter: '', file: null, preview: null, busy: false,
  message: '', isError: false
};

const notice = () => state.message
  ? '<div role="status" aria-live="polite" class="notice ' + (state.isError ? 'error' : 'ok') + '">' +
    escapeHtml(state.message) + '</div>' : '';

function setMessage(message, error = false) {
  state.message = message; state.isError = error;
}

function showUnavailable(message) {
  root.innerHTML = '<main class="login panel"><h1>GRIT Prospect 360</h1>' +
    '<p class="notice error">' + escapeHtml(message) + '</p>' +
    '<p>Ambiente não configurado. Nenhuma operação comercial foi iniciada.</p></main>';
}

function loginMarkup() {
  root.innerHTML = '<main class="login panel"><p class="tag">Ambiente restrito · GRIT</p>' +
    '<h1>Prospect 360</h1><p class="muted">Entre com sua conta exclusiva do Prospect 360. ' +
    'O acesso depende de liberação do administrador.</p>' + notice() +
    '<form id="login-form"><label for="email">E-mail</label>' +
    '<input type="email" id="email" autocomplete="username" required />' +
    '<label for="password">Senha</label>' +
    '<input type="password" id="password" autocomplete="current-password" required />' +
    '<div class="actions"><button id="login-button" type="submit">Entrar com segurança</button></div></form>' +
    '<p class="foot">Nenhum cadastro é criado automaticamente. Caso não possua acesso, solicite ao administrador.</p></main>';
  document.querySelector('#login-form').addEventListener('submit', login);
}

async function login(event) {
  event.preventDefault();
  const button = document.querySelector('#login-button');
  if (button.disabled) return;
  button.disabled = true;
  const email = document.querySelector('#email').value.trim();
  const passwordInput = document.querySelector('#password');
  const password = passwordInput.value;
  passwordInput.value = '';
  try {
    const { data, error } = await state.client.auth.signInWithPassword({ email, password });
    if (error || !data?.session) throw new Error('Não foi possível autenticar. Verifique o acesso autorizado.');
    setMessage('');
    state.session = data.session;
    await loadOrganizations();
  } catch (error) {
    setMessage(error.message, true);
    loginMarkup();
  } finally {
    button.disabled = false;
  }
}

async function loadOrganizations() {
  if (!state.session) { loginMarkup(); return; }
  const { data, error } = await state.client.from('organizations')
    .select('id,name,slug').order('name').limit(50);
  if (error) { setMessage('Não foi possível consultar suas organizações.', true); state.organizations = []; }
  else { state.organizations = data ?? []; setMessage(''); }
  if (!state.organizations.some(org => org.id === state.organizationId)) {
    state.organizationId = state.organizations[0]?.id || '';
  }
  state.page = 0;
  await loadCompanies();
}

async function loadCompanies() {
  if (!state.organizationId) {
    state.companies = []; state.total = 0; renderDashboard(); return;
  }
  let query = state.client.from('companies').select(
    'id,legal_name,trade_name,tax_id,city,state,verification_status,created_at', { count: 'exact' }
  ).eq('organization_id', state.organizationId).order('created_at', { ascending: false })
    .range(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE - 1);
  if (state.filter) {
    const safeFilter = state.filter.slice(0, 70).replace(/[%_\\]/g, '\\$&');
    query = query.ilike('legal_name', '%' + safeFilter + '%');
  }
  const { data, count, error } = await query;
  if (error) {
    state.companies = []; state.total = 0;
    setMessage('Falha ao consultar empresas. Nenhum total foi presumido.', true);
  } else { state.companies = data ?? []; state.total = count ?? 0; }
  renderDashboard();
}

function dashboardMarkup() {
  const orgOptions = state.organizations.map(org =>
    '<option value="' + escapeHtml(org.id) + '"' +
    (org.id === state.organizationId ? ' selected' : '') + '>' +
    escapeHtml(org.name) + '</option>').join('');
  const tableRows = state.companies.map(company =>
    '<tr><td><strong>' + escapeHtml(company.legal_name) + '</strong>' +
    (company.trade_name ? '<br><small>' + escapeHtml(company.trade_name) + '</small>' : '') +
    '</td><td>' + escapeHtml(company.tax_id) +
    '</td><td>' + escapeHtml([company.city, company.state].filter(Boolean).join(' / ')) +
    '</td><td><span class="pill">' + escapeHtml(company.verification_status) + '</span></td></tr>'
  ).join('');
  const preview = state.preview
    ? '<section class="panel" aria-labelledby="preview-title"><h3 id="preview-title">Prévia da importação</h3>' +
      '<div class="grid"><div><div class="metric">' + state.preview.total_rows + '</div><small>Linhas analisadas</small></div>' +
      '<div><div class="metric">' + state.preview.accepted_count + '</div><small>Elegíveis para cadastro</small></div>' +
      '<div><div class="metric">' + state.preview.skipped_count + '</div><small>Ignoradas</small></div></div>' +
      '<p class="muted">A prévia ainda não grava informações. A confirmação abaixo realizará a importação no banco exclusivo.</p>' +
      '<div class="actions"><button id="apply-import" ' +
      (state.busy || !state.preview.accepted_count || state.preview.organization_id !== state.organizationId ? 'disabled ' : '') +
      '>Confirmar importação</button><button id="cancel-import" class="secondary">Cancelar</button></div></section>' : '';
  return '<div class="layout"><aside class="sidebar"><h1>GRIT<br>Prospect 360</h1>' +
    '<p>Inteligência comercial B2B</p><nav class="nav" aria-label="Módulos">' +
    '<div class="nav-item" aria-current="page">Empresas</div>' +
    '<div class="nav-item">CRM · futuro</div><div class="nav-item">Campanhas · futuro</div>' +
    '</nav><p class="foot">Ambiente de desenvolvimento</p></aside>' +
    '<main class="main"><header class="top"><div><p class="tag">Cadastro empresarial</p>' +
    '<h2>Empresas e importações</h2><p class="muted">Organize sua base antes da prospecção.</p>' +
    '</div><button id="logout" class="secondary">Sair</button></header>' + notice() +
    (state.organizations.length === 0
      ? '<section class="panel"><h3>Aguardando liberação</h3><p>Seu usuário não possui organização vinculada. ' +
        'Solicite ao administrador a ativação da sua conta no Prospect 360.</p></section>'
      : '<section class="panel"><label for="org">Organização</label><select id="org">' +
        orgOptions + '</select></section>' +
        '<section class="panel"><div class="top"><h3>Carteira de empresas</h3>' +
        '<span class="tag">' + state.total.toLocaleString('pt-BR') + ' empresas</span></div>' +
        '<form id="search-form" class="actions"><label for="filter">Razão social</label>' +
        '<input id="filter" style="max-width:330px" placeholder="Buscar empresa" value="' +
        escapeHtml(state.filter) + '"/><button type="submit">Buscar</button>' +
        '<button type="button" id="refresh" class="secondary">Atualizar</button></form>' +
        '<div class="table-wrap"><table><thead><tr><th>Empresa</th><th>CNPJ</th><th>Cidade / UF</th>' +
        '<th>Validação</th></tr></thead><tbody>' + (tableRows || '<tr><td colspan="4">Nenhuma empresa encontrada.</td></tr>') +
        '</tbody></table></div><div class="actions"><button id="prev-page" class="secondary" ' +
        (state.page <= 0 ? 'disabled' : '') + '>Anterior</button><small>Página ' + (state.page + 1) +
        ' · ' + state.total + ' resultados</small><button id="next-page" class="secondary" ' +
        ((state.page + 1) * PAGE_SIZE >= state.total ? 'disabled' : '') +
        '>Próxima</button></div></section>' +
        '<section class="panel"><h3>Importar empresas</h3>' +
        '<p class="muted">Arquivo CSV com CNPJ e razão social; cidade, UF e nome fantasia são opcionais. ' +
        'Limite: 2 MB e 5.000 empresas. A origem e a finalidade dos dados devem ser autorizadas.</p>' +
        '<label for="csv">Selecione o arquivo</label><input id="csv" type="file" accept=".csv,text/csv"/>' +
        (state.file ? '<p class="muted" role="status">Arquivo selecionado: ' + escapeHtml(state.file.name) + '</p>' : '') +
        '<div class="actions"><button id="preview-import" ' + (state.busy ? 'disabled' : '') +
        '>Validar arquivo</button></div></section>' + preview) +
    '<p class="foot">Sem disparos automáticos. Nenhum dado do Meu Cuidador é acessado.</p></main></div>';
}

function renderDashboard() {
  root.innerHTML = dashboardMarkup();
  document.querySelector('#logout').addEventListener('click', logout);
  if (!state.organizations.length) return;
  document.querySelector('#org').addEventListener('change', async event => {
    if (state.busy) return;
    state.organizationId = event.target.value; state.page = 0; state.filter = '';
    state.file = null; state.preview = null; await loadCompanies();
  });
  document.querySelector('#search-form').addEventListener('submit', async event => {
    event.preventDefault(); state.filter = document.querySelector('#filter').value.trim();
    state.page = 0; await loadCompanies();
  });
  document.querySelector('#refresh').addEventListener('click', loadCompanies);
  document.querySelector('#prev-page').addEventListener('click', async () => {
    if (state.page > 0) { state.page--; await loadCompanies(); }
  });
  document.querySelector('#next-page').addEventListener('click', async () => {
    if ((state.page + 1) * PAGE_SIZE < state.total) { state.page++; await loadCompanies(); }
  });
  document.querySelector('#csv').addEventListener('change', event => {
    if (state.busy) return;
    state.file = event.target.files?.[0] ?? null; state.preview = null;
    setMessage(''); renderDashboard();
  });
  document.querySelector('#preview-import').addEventListener('click', previewImport);
  document.querySelector('#apply-import')?.addEventListener('click', applyImport);
  document.querySelector('#cancel-import')?.addEventListener('click', () => {
    state.preview = null; state.file = null; renderDashboard();
  });
}

async function apiCall(path, file, expectedSha256 = null) {
  if (!state.session?.access_token) throw new Error('Sua sessão expirou. Entre novamente.');
  const res = await fetch(state.apiBase + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.session.access_token },
    body: JSON.stringify({ organization_id: state.organizationId, csv: file, expected_sha256: expectedSha256 })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Sessão inválida. Entre novamente.');
    if (res.status === 403) throw new Error('Você não tem permissão para esta organização.');
    if (res.status === 413) throw new Error('Arquivo excede o limite permitido.');
    throw new Error('Falha no processamento (' + res.status + '). Código: ' +
      (data?.request_id || 'não disponível'));
  }
  return data;
}

async function previewImport() {
  if (state.busy) return;
  if (!state.file) { setMessage('Selecione um arquivo CSV.', true); renderDashboard(); return; }
  if (state.file.size > MAX_CSV_BYTES) {
    setMessage('Arquivo maior que 2 MB.', true); renderDashboard(); return;
  }
  state.busy = true;
  try {
    const csv = await state.file.text();
    const approvedOrganization = state.organizationId;
    const result = await apiCall('/api/v1/company-imports/preview', csv);
    if (approvedOrganization !== state.organizationId) {
      throw new Error('A organização mudou durante a prévia. Valide novamente.');
    }
    state.preview = { ...result, organization_id: approvedOrganization };
    setMessage('Prévia concluída. Confirme somente após verificar os resultados.');
  } catch (error) { state.preview = null; setMessage(error.message, true); }
  finally { state.busy = false; renderDashboard(); }
}

async function applyImport() {
  if (state.busy || !state.preview || !state.file || !state.organizationId) return;
  if (state.preview.organization_id !== state.organizationId) {
    state.preview = null;
    setMessage('Organização alterada. Valide novamente o arquivo.', true);
    renderDashboard();
    return;
  }
  state.busy = true;
  try {
    const csv = await state.file.text();
    const result = await apiCall('/api/v1/company-imports/apply', csv, state.preview.file_sha256);
    state.preview = null; state.file = null;
    setMessage(result.status === 'already_applied'
      ? 'Este arquivo já foi importado nesta organização.'
      : 'Importação concluída: ' + result.applied_count + ' empresa(s) cadastrada(s); ' +
        result.skipped_count + ' ignorada(s).');
    state.page = 0;
    await loadCompanies();
  } catch (error) { setMessage(error.message, true); }
  finally { state.busy = false; renderDashboard(); }
}

async function logout() {
  await state.client.auth.signOut();
  state.session = null; state.organizationId = ''; state.organizations = [];
  state.companies = []; state.file = null; state.preview = null;
  setMessage('Sessão encerrada.'); loginMarkup();
}

async function boot() {
  try {
    const config = publicConfig(import.meta.env);
    state.apiBase = config.apiBase;
    state.client = createClient(config.projectUrl, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    state.client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        state.session = null; state.file = null; state.preview = null;
        setMessage('Sessão encerrada.'); loginMarkup();
      } else if (event === 'TOKEN_REFRESHED') {
        state.session = session;
      }
    });
    const { data, error } = await state.client.auth.getSession();
    if (error) throw error;
    state.session = data.session;
    if (state.session) await loadOrganizations();
    else loginMarkup();
  } catch (error) { showUnavailable(error.message); }
}

if (root) boot();
