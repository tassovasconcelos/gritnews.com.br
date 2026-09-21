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
  message: '', isError: false, needsPasswordSetup: false, socialCandidates: [], currentRole: null, currentRole: ''
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

// Supabase invite/recovery links establish a session via URL. The user must
// set a new password before entering the administrative interface.
function passwordSetupMarkup() {
  root.innerHTML = '<main class="login panel"><p class="tag">Primeiro acesso seguro</p>' +
    '<h1>Defina sua senha</h1><p class="muted">Conclua seu convite ou recuperação de acesso. ' +
    'Use uma senha exclusiva do Prospect 360.</p>' + notice() +
    '<form id="setup-password"><label for="new-password">Nova senha</label>' +
    '<input id="new-password" type="password" autocomplete="new-password" required minlength="12" />' +
    '<label for="confirm-password">Confirmar senha</label>' +
    '<input id="confirm-password" type="password" autocomplete="new-password" required minlength="12" />' +
    '<div class="actions"><button type="submit">Salvar senha</button>' +
    '<button type="button" class="secondary" id="setup-logout">Cancelar e sair</button></div></form></main>';
  document.querySelector('#setup-password').addEventListener('submit', finishPasswordSetup);
  document.querySelector('#setup-logout').addEventListener('click', logout);
}

async function finishPasswordSetup(event) {
  event.preventDefault();
  const newInput = document.querySelector('#new-password');
  const confirmInput = document.querySelector('#confirm-password');
  const password = newInput.value;
  const same = password === confirmInput.value;
  newInput.value = ''; confirmInput.value = '';
  if (!same || password.length < 12 || password.length > 128) {
    setMessage('As senhas devem coincidir e conter entre 12 e 128 caracteres.', true);
    passwordSetupMarkup(); return;
  }
  if (!state.session) { setMessage('O link expirou. Solicite novo convite.', true); loginMarkup(); return; }
  const { error } = await state.client.auth.updateUser({ password });
  if (error) { setMessage('Não foi possível definir a senha. Solicite novo link ou tente novamente.', true);
    passwordSetupMarkup(); return; }
  state.needsPasswordSetup = false;
  window.history.replaceState(null, '', window.location.pathname);
  setMessage('Senha definida. Verificando sua organização...');
  await loadOrganizations();
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

async function loadSocialCandidates() {
  if (!state.organizationId) { state.socialCandidates = []; state.currentRole = ''; return; }
  const {data:member,error:memberError}=await state.client.from('memberships')
    .select('role,active').eq('organization_id',state.organizationId)
    .eq('user_id',state.session?.user?.id).maybeSingle();
  state.currentRole = memberError || !member?.active ? '' : member.role;
  const {data,error} = await state.client.from('social_prospect_candidates')
    .select('id,platform,company_label,profile_url,source_kind,review_status,company_id,created_at')
    .eq('organization_id',state.organizationId).order('created_at',{ascending:false}).limit(100);
  if (error) {
    state.socialCandidates = [];
    setMessage('Falha ao consultar candidatos de redes sociais.',true);
  } else state.socialCandidates = data ?? [];
}

async function loadCompanies() {
  if (!state.organizationId) {
    state.companies = []; state.total = 0; state.socialCandidates = []; state.currentRole = null;
    renderDashboard(); return;
  }
  const {data: member, error: memberError} = await state.client.from('memberships')
    .select('role,active').eq('organization_id',state.organizationId)
    .eq('user_id',state.session?.user?.id).maybeSingle();
  state.currentRole = !memberError && member?.active ? member.role : null;
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
  await loadSocialCandidates();
  renderDashboard();
}

function socialMarkup() {
  const reviewer = ['owner','admin'].includes(state.currentRole);
  const rows = state.socialCandidates.map(candidate => {
    const id=escapeHtml(candidate.id);
    const review = reviewer && candidate.review_status === 'pending'
      ? '<form class="social-review-form stack" data-candidate-id="'+id+'">' +
        '<label for="review-cnpj-'+id+'">CNPJ confirmado (para aprovação)</label>' +
        '<input id="review-cnpj-'+id+'" name="cnpj" inputmode="numeric" maxlength="18" ' +
        'placeholder="00.000.000/0000-00" />' +
        '<label for="review-reason-'+id+'">Justificativa da revisão (mínimo 12 caracteres)</label>' +
        '<input id="review-reason-'+id+'" name="reason" minlength="12" maxlength="500" required ' +
        'placeholder="Empresa e página conferidas em fonte independente" />' +
        '<div class="actions"><button type="submit" name="decision" value="approved" ' +
        (state.busy ? 'disabled' : '') + '>Aprovar</button>' +
        '<button type="submit" name="decision" value="rejected" class="secondary" ' +
        (state.busy ? 'disabled' : '') + '>Reprovar</button></div></form>'
      : '<span class="muted">' + (candidate.review_status === 'pending'
        ? 'Aguardando administrador' : 'Decisão registrada') + '</span>';
    return '<tr><td>' + escapeHtml(candidate.company_label) + '</td><td>' +
      escapeHtml(candidate.platform) + '</td><td><a target="_blank" rel="noopener noreferrer" href="' +
      escapeHtml(candidate.profile_url) + '">' + escapeHtml(candidate.profile_url) +
      '</a></td><td>' + escapeHtml(candidate.review_status) + '</td><td>' + review + '</td></tr>';
  }).join('');
  return '<section id="social-prospects" class="panel" aria-labelledby="social-title">' +
    '<h3 id="social-title">Prospecção por redes sociais</h3>' +
    '<p class="muted">Cadastre páginas corporativas do Instagram e do LinkedIn. A associação ao CNPJ ' +
    'só ocorre após revisão de administrador. Não há raspagem de perfis ou disparos automáticos.</p>' +
    '<form id="social-form" class="stack"><div class="two"><div><label for="social-platform">Plataforma</label>' +
    '<select id="social-platform"><option value="instagram">Instagram empresarial</option>' +
    '<option value="linkedin">LinkedIn — página de empresa</option></select></div>' +
    '<div><label for="social-name">Nome da empresa</label>' +
    '<input id="social-name" maxlength="200" required placeholder="Razão social ou nome empresarial"/></div></div>' +
    '<label for="social-url">URL da página corporativa</label>' +
    '<input id="social-url" type="url" required maxlength="300" placeholder="https://www.instagram.com/empresa/"/>' +
    '<div class="actions"><button type="submit" ' + (state.busy ? 'disabled' : '') +
    '>Adicionar à triagem</button></div></form>' +
    '<div class="table-wrap"><table><thead><tr><th>Empresa</th><th>Rede</th><th>Página corporativa</th>' +
    '<th>Triagem</th><th>Revisão</th></tr></thead><tbody>' + (rows ||
    '<tr><td colspan="5">Nenhum perfil empresarial registrado.</td></tr>') +
    '</tbody></table></div><p class="muted">A coleta oficial e o acompanhamento de respostas somente ' +
    'serão ativados após permissão das plataformas e homologação independente.</p></section>';
}

async function reviewSocialCandidate(event) {
  event.preventDefault();
  if (state.busy || !state.session?.access_token || !['owner','admin'].includes(state.currentRole)) return;
  const form=event.currentTarget;
  const candidateId=form.dataset.candidateId;
  const decision=event.submitter?.value;
  if (!['approved','rejected'].includes(decision)) return;
  const reason=form.elements.namedItem('reason')?.value.trim();
  const cnpj=form.elements.namedItem('cnpj')?.value.replace(/\D/g,'') || '';
  const org=state.organizationId;
  if (!reason || reason.length < 12 || reason.length > 500) {
    setMessage('Justificativa obrigatória de 12 a 500 caracteres.',true);renderDashboard();return;
  }
  let companyId=null;
  state.busy=true;
  try {
    if (decision === 'approved') {
      if (cnpj.length !== 14) throw new Error('Informe o CNPJ confirmado para aprovação.');
      const {data,error}=await state.client.from('companies').select('id,tax_id')
        .eq('organization_id',org).eq('tax_id',cnpj).maybeSingle();
      if (error || !data?.id) throw new Error('CNPJ não cadastrado nesta organização. Importe a empresa antes.');
      companyId=data.id;
    }
    if (org!==state.organizationId) throw new Error('Organização alterada. Recarregue a triagem.');
    const response=await fetch(state.apiBase+'/api/v1/social-candidates/review',{
      method:'POST',headers:{'Content-Type':'application/json',
        Authorization:'Bearer '+state.session.access_token},
      body:JSON.stringify({organization_id:org,candidate_id:candidateId,decision,
        company_id:companyId,reason})
    });
    const result=await response.json().catch(()=>null);
    if (!response.ok) throw new Error('Revisão não concluída ('+response.status+'). Código: '+
      (result?.request_id || 'não disponível'));
    setMessage(result.status==='already_reviewed'?'Decisão já registrada.':
      'Revisão registrada com auditoria. Nenhuma mensagem foi enviada.');
    await loadCompanies();
  } catch(error){setMessage(error.message,true);} finally {state.busy=false;renderDashboard();}
}

async function registerSocialCandidate(event) {
  event.preventDefault();
  if (state.busy || !state.session?.access_token || !state.organizationId) return;
  const companyLabel=document.querySelector('#social-name')?.value.trim();
  const profileUrl=document.querySelector('#social-url')?.value.trim();
  const platform=document.querySelector('#social-platform')?.value;
  const organization=state.organizationId;
  state.busy=true;
  try {
    const response=await fetch(state.apiBase+'/api/v1/social-candidates', {
      method:'POST',headers:{'Content-Type':'application/json',
        Authorization:'Bearer '+state.session.access_token},
      body:JSON.stringify({organization_id:organization,candidate:{platform,profile_url:profileUrl,
        company_label:companyLabel,source_kind:'manual_corporate_url'}})
    });
    const result=await response.json().catch(()=>null);
    if (!response.ok) throw new Error('Falha no cadastro do perfil empresarial ('+response.status+'). Código: '+
      (result?.request_id || 'não disponível'));
    if (organization!==state.organizationId) throw new Error('A organização mudou. Atualize a lista.');
    setMessage(result.status==='already_exists' ? 'Página corporativa já registrada nesta organização.' :
      'Página empresarial encaminhada para triagem. Nenhuma mensagem foi enviada.');
    await loadCompanies();
  } catch(error){setMessage(error.message,true);} finally { state.busy=false;renderDashboard(); }
}

async function reviewSocialCandidate(event) {
  event.preventDefault();
  if(state.busy || !['owner','admin'].includes(state.currentRole) || !state.session?.access_token) return;
  const form=event.currentTarget;
  const decision=event.submitter?.value;
  const companyId=decision==='approved' ? form.querySelector('.review-company')?.value || null : null;
  const reason=form.querySelector('.review-reason')?.value.trim();
  if(!form.querySelector('.review-confirm')?.checked) {
    setMessage('Confirme a verificação manual antes de decidir.',true);renderDashboard();return;
  }
  if(decision==='approved'&&!companyId) {
    setMessage('Selecione uma empresa da carteira para aprovar.',true);renderDashboard();return;
  }
  const organization=state.organizationId;
  state.busy=true;
  try {
    const response=await fetch(state.apiBase+'/api/v1/social-candidates/review',{
      method:'POST',headers:{'Content-Type':'application/json',
        Authorization:'Bearer '+state.session.access_token},
      body:JSON.stringify({organization_id:organization,candidate_id:form.dataset.candidate,
        decision,company_id:companyId,reason})
    });
    const result=await response.json().catch(()=>null);
    if(!response.ok) throw new Error('Falha na decisão ('+response.status+'). Código: '+
      (result?.request_id || 'não disponível'));
    if(organization!==state.organizationId) throw new Error('A organização mudou. Atualize os registros.');
    setMessage(result.status==='already_reviewed' ? 'Registro já revisado.' :
      'Decisão registrada no banco. Nenhuma mensagem foi enviada.');
    await loadCompanies();
  } catch(error){setMessage(error.message,true);} finally {state.busy=false;renderDashboard();}
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
    '<button type="button" id="nav-companies" class="nav-item" aria-current="page">Empresas</button>' +
    '<button type="button" id="nav-social" class="nav-item">Redes sociais</button>' +
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
        '>Validar arquivo</button></div></section>' + preview + socialMarkup()) +
    '<p class="foot">Sem disparos automáticos. Nenhum dado do Meu Cuidador é acessado.</p></main></div>';
}

function renderDashboard() {
  root.innerHTML = dashboardMarkup();
  document.querySelector('#logout').addEventListener('click', logout);
  document.querySelector('#nav-social')?.addEventListener('click',()=>
    document.querySelector('#social-prospects')?.scrollIntoView({behavior:'smooth'}));
  document.querySelector('#nav-companies')?.addEventListener('click',()=>
    document.querySelector('.main')?.scrollIntoView({behavior:'smooth'}));
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
  document.querySelector('#social-form')?.addEventListener('submit', registerSocialCandidate);
  document.querySelectorAll('.social-review-form').forEach(form =>
    form.addEventListener('submit',reviewSocialCandidate));
  document.querySelectorAll('.social-review').forEach(form=>
    form.addEventListener('submit',reviewSocialCandidate));
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
  state.needsPasswordSetup = false;
  setMessage('Sessão encerrada.'); loginMarkup();
}

async function boot() {
  try {
    const config = publicConfig(import.meta.env);
    state.apiBase = config.apiBase;
    state.needsPasswordSetup = /(?:[?#&])type=(?:invite|recovery)(?:&|$)/.test(window.location.href);
    state.client = createClient(config.projectUrl, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    state.client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        state.session = null; state.file = null; state.preview = null;
        state.needsPasswordSetup = false;
        setMessage('Sessão encerrada.'); loginMarkup();
      } else if (event === 'TOKEN_REFRESHED') {
        state.session = session;
      } else if (event === 'PASSWORD_RECOVERY') {
        state.session = session;
        state.needsPasswordSetup = true;
      }
    });
    const { data, error } = await state.client.auth.getSession();
    if (error) throw error;
    state.session = data.session;
    if (state.session && state.needsPasswordSetup) passwordSetupMarkup();
    else if (state.session) await loadOrganizations();
    else loginMarkup();
  } catch (error) { showUnavailable(error.message); }
}

if (root) boot();
