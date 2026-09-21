// Standalone, isolated B2B API. No shared GRIT production DB access.
// DO NOT launch until dedicated-project secrets and authorization are reviewed.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createCompanyImportService } from './company-service.mjs';
import { createSocialProspectingService } from './social-service.mjs';

const DEDICATED_PROJECT_HOST = 'qspluchjhnnzgbbgmsro.supabase.co';
const MAX_HTTP_BYTES = 2_200_000;

export function createApi({ supabase, allowedOrigin = '', logger = console }) {
  const service = createCompanyImportService({
    authenticate: async token => {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user?.id) return null;
      return { id: data.user.id };
    },
    membershipFor: async (organizationId, userId) => {
      const { data, error } = await supabase.from('memberships')
        .select('role,active').eq('organization_id', organizationId)
        .eq('user_id', userId).maybeSingle();
      if (error) throw new Error('membership_query_failed');
      return data;
    },
    existingCnpjs: async (organizationId, ids) => {
      const found = [];
      for (let i = 0; i < ids.length; i += 100) {
        const { data, error } = await supabase.from('companies').select('tax_id')
          .eq('organization_id', organizationId).in('tax_id', ids.slice(i, i + 100));
        if (error) throw new Error('existing_company_query_failed');
        found.push(...data.map(company => company.tax_id));
      }
      return found;
    },
    applyAtomic: async params => {
      const { data, error } = await supabase.rpc('apply_company_import', params);
      if (error) {
        if (error.code === '42501') throw Object.assign(new Error('access_denied'), { status: 403 });
        if (error.code === '23505') throw Object.assign(new Error('import_conflict'), { status: 409 });
        if (error.code === '22023') throw Object.assign(new Error('invalid_import_payload'), { status: 400 });
        throw new Error('import_write_failed');
      }
      return data;
    }
  });

  const social = createSocialProspectingService({
    authenticate: async token => {
      const { data, error } = await supabase.auth.getUser(token);
      return error ? null : data?.user ?? null;
    },
    membershipFor: async (organizationId,userId) => {
      const {data,error}=await supabase.from('memberships').select('role,active')
        .eq('organization_id',organizationId).eq('user_id',userId).maybeSingle();
      if(error) throw new Error('social_membership_query_failed');
      return data;
    },
    findExisting: async (organizationId,platform,key) => {
      const {data,error}=await supabase.from('social_prospect_candidates').select('id')
        .eq('organization_id',organizationId).eq('platform',platform)
        .eq('account_key',key).maybeSingle();
      if(error) throw new Error('social_candidate_query_failed');
      return data;
    },
    insertCandidate: async payload => {
      const {data,error}=await supabase.from('social_prospect_candidates').insert(payload)
        .select('id').single();
      if(error) throw error;
      return data;
    },
    reviewAtomic: async params => {
      const {data,error}=await supabase.rpc('review_social_candidate',params);
      if(error) throw error;
      return data;
    }
  });

  return http.createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin;
    if (origin && (!allowedOrigin || origin !== allowedOrigin)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'origin_not_allowed', request_id: requestId }));
      return;
    }
    if (origin && allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', app: 'grit-prospect-360', database_target: 'dedicated', database_verified: false }));
      return;
    }
    const isPreview = req.url === '/api/v1/company-imports/preview';
    const isApply = req.url === '/api/v1/company-imports/apply';
    const isSocial = req.url === '/api/v1/social-candidates';
    const isSocialReview = req.url === '/api/v1/social-candidates/review';
    if ((!isPreview && !isApply && !isSocial && !isSocialReview) || req.method !== 'POST') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found', request_id: requestId }));
      return;
    }
    if (!req.headers['content-type']?.startsWith('application/json')) {
      res.writeHead(415, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'json_required', request_id: requestId }));
      return;
    }

    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_HTTP_BYTES) throw Object.assign(new Error('request_too_large'), { status: 413 });
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw Object.assign(new Error('invalid_json'), { status: 400 }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw Object.assign(new Error('invalid_json'), { status: 400 });
      }
      const input = {
        authorization: req.headers.authorization,
        organizationId: body.organization_id,
        csv: body.csv,
        expectedSha256: body.expected_sha256
      };
      const response = isSocialReview ? await social.reviewCandidate({
        authorization: req.headers.authorization,
        organizationId: body.organization_id,
        candidateId: body.candidate_id,
        decision: body.decision,
        companyId: body.company_id ?? null,
        reason: body.reason
      }) : isSocial ? await social.registerManual({
        authorization: req.headers.authorization,
        organizationId: body.organization_id,
        candidate: body.candidate
      }) : isPreview ? await service.preview(input) : await service.apply(input);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ...response, request_id: requestId }));
    } catch (error) {
      const status = error.status ?? (['invalid_csv_size', 'csv_row_limit'].includes(error.message) ? 413
        : ['invalid_csv_quote', 'unclosed_csv_quote', 'required_columns_cnpj_legal_name',
          'duplicate_csv_header', 'csv_header_required'].includes(error.message) ? 400 : 500);
      const publicError = status >= 500 ? 'internal_error' : error.message;
      if (status >= 500) logger.error('prospect_operation_error', { request_id: requestId, type: 'internal_error' });
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: publicError, request_id: requestId }));
    }
  });
}

export async function createConfiguredApi(env = process.env) {
  const url = env.PROSPECT_SUPABASE_URL ?? '';
  const key = env.PROSPECT_SUPABASE_SERVICE_ROLE_KEY ?? '';
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('invalid_supabase_url'); }
  if (parsed.protocol !== 'https:' || parsed.hostname !== DEDICATED_PROJECT_HOST
      || !key || key.length < 24) {
    throw new Error('dedicated_supabase_environment_required');
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return createApi({ supabase, allowedOrigin: env.PROSPECT_ALLOWED_ORIGIN ?? '' });
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const api = await createConfiguredApi();
  const port = Number(process.env.PORT || 3400);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('invalid_port');
  api.listen(port, process.env.HOST || '127.0.0.1', () =>
    console.log('GRIT Prospect 360 API ready on configured host and port; no raw CSV logging'));
}
