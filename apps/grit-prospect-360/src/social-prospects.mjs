// Corporate social-prospect normalization ONLY. No scraping or social network calls.
// LinkedIn member data must NEVER be imported to the CRM. Corporate page references
// are accepted only when independently supplied by company/customer or first-party inbound.
const SOURCES = {
  instagram: new Set(['manual_corporate_url','first_party_inbound','approved_meta_business_discovery']),
  linkedin: new Set(['manual_corporate_url','first_party_inbound'])
};
const DOMAIN = { instagram:'www.instagram.com', linkedin:'www.linkedin.com' };
const PATH = { instagram:'', linkedin:'company/' };

export function normalizeCorporateAccount(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_candidate');
  const platform = String(input.platform ?? '').toLowerCase().trim();
  const sourceKind = String(input.source_kind ?? '').trim();
  if (!SOURCES[platform]?.has(sourceKind)) throw new Error('unsupported_platform_or_source');
  let value = String(input.profile_url ?? input.account_key ?? '').trim();
  if (!value || value.length > 300) throw new Error('invalid_profile');
  const isUrl = /^https?:\/\//i.test(value);
  if (isUrl) {
    let url;
    try { url = new URL(value); } catch { throw new Error('invalid_profile_url'); }
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port
        || url.search || url.hash || ![DOMAIN[platform],DOMAIN[platform].slice(4)].includes(host)) {
      throw new Error('invalid_profile_url');
    }
    const match = platform === 'linkedin' ? /^\/company\/([a-z0-9-]+)\/?$/i.exec(url.pathname)
      : /^\/([a-z0-9._]+)\/?$/i.exec(url.pathname);
    if (!match) throw new Error('corporate_page_required');
    value = match[1];
  }
  if (value.startsWith('@')) value = value.slice(1);
  const key = value.toLowerCase();
  const format = platform === 'linkedin' ? /^[a-z0-9][a-z0-9-]{1,99}$/ : /^[a-z0-9._]{2,30}$/;
  if (!format.test(key)) throw new Error('invalid_account_key');
  const label = String(input.company_label ?? '').normalize('NFKC').trim().replace(/\s+/g,' ');
  if (label.length < 2 || label.length > 200) throw new Error('invalid_company_label');
  if (sourceKind === 'approved_meta_business_discovery' && input.api_approved !== true) {
    throw new Error('meta_api_approval_required');
  }
  const reference = String(input.source_reference ?? '').trim();
  if (reference.length > 500) throw new Error('source_reference_too_long');
  if (sourceKind === 'first_party_inbound' && !reference) throw new Error('inbound_reference_required');
  if (sourceKind === 'approved_meta_business_discovery' && !reference) throw new Error('api_evidence_required');
  const companyId = input.company_id == null ? null : String(input.company_id);
  if (companyId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
    throw new Error('invalid_company_id');
  }
  return {
    platform, account_key: key,
    profile_url: 'https://' + DOMAIN[platform] + '/' + PATH[platform] + key + '/',
    company_label: label, source_kind: sourceKind,
    source_reference: reference || null, company_id: companyId,
    review_status: 'pending'
  };
}

export function deduplicateCorporateCandidates(items, existing = []) {
  if (!Array.isArray(items) || items.length > 100) throw new Error('social_batch_limit');
  const used = new Set(existing.map(x=>String(x.platform)+':'+String(x.account_key).toLowerCase()));
  const accepted=[], skipped=[];
  items.forEach((input, index)=>{
    try {
      const candidate = normalizeCorporateAccount(input);
      const key = candidate.platform + ':' + candidate.account_key;
      if (used.has(key)) { skipped.push({index,reason:'duplicate_account'}); return; }
      used.add(key);accepted.push(candidate);
    } catch (error) { skipped.push({index,reason:error.message}); }
  });
  return {accepted,skipped,total:items.length};
}

export const SOCIAL_CHANNEL_POLICY = Object.freeze({
  instagram: Object.freeze({
    manual_corporate_url: true,
    first_party_inbound: true,
    approved_meta_business_discovery: false, // Enable only after Meta app review + approved scope.
    outbound: false
  }),
  linkedin: Object.freeze({
    manual_corporate_url: true,
    first_party_inbound: true, // Only owner-authorized form data, not scraped member records.
    search_members: false,
    automated_connect: false,
    outbound: false
  })
});
