import { normalizeCorporateAccount } from './social-prospects.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WRITE_ROLES=new Set(['owner','admin','operator']);

export function createSocialProspectingService({ authenticate,membershipFor,findExisting,insertCandidate,clock=Date.now }) {
  if (![authenticate,membershipFor,findExisting,insertCandidate].every(x=>typeof x==='function')) {
    throw new Error('invalid_social_dependencies');
  }
  const usage=new Map();
  return {
    async registerManual({authorization,organizationId,candidate}) {
      if (!UUID.test(String(organizationId ?? ''))) {
        throw Object.assign(new Error('invalid_organization_id'),{status:400});
      }
      if (typeof authorization!=='string'|| !/^Bearer [^\s]+$/i.test(authorization)) {
        throw Object.assign(new Error('authentication_required'),{status:401});
      }
      const user=await authenticate(authorization.replace(/^Bearer /i,''));
      if (!UUID.test(String(user?.id ?? ''))) {
        throw Object.assign(new Error('invalid_session'),{status:401});
      }
      const membership=await membershipFor(organizationId,user.id);
      if (!membership?.active || !WRITE_ROLES.has(membership.role)) {
        throw Object.assign(new Error('access_denied'),{status:403});
      }
      // No client can impersonate Meta/LinkedIn official API or inbound webhooks.
      if (candidate?.source_kind!=='manual_corporate_url') {
        throw Object.assign(new Error('manual_corporate_only'),{status:400});
      }
      let normalized;
      try { normalized=normalizeCorporateAccount(candidate); }
      catch { throw Object.assign(new Error('invalid_corporate_profile'),{status:400}); }
      const now=clock();
      const bucket=user.id+':'+organizationId;
      const previous=usage.get(bucket);
      const next=!previous||now-previous.started>=60_000
        ? {started:now,count:1}:{started:previous.started,count:previous.count+1};
      usage.set(bucket,next);
      if (next.count>20) throw Object.assign(new Error('rate_limited'),{status:429});
      if (usage.size>2000) for(const [key,b] of usage) if(now-b.started>=60_000) usage.delete(key);

      const existing=await findExisting(organizationId,normalized.platform,normalized.account_key);
      if (existing) return {status:'already_exists',candidate_id:existing.id};
      // The database unique index is authoritative if two requests race.
      try {
        const data=await insertCandidate({
          ...normalized,organization_id:organizationId,created_by:user.id
        });
        return {status:'pending_review',candidate_id:data.id};
      } catch(error) {
        if (error?.code==='23505') {
          const found=await findExisting(organizationId,normalized.platform,normalized.account_key);
          if (found) return {status:'already_exists',candidate_id:found.id};
          throw Object.assign(new Error('duplicate_candidate'),{status:409});
        }
        if (error?.code==='23503') throw Object.assign(new Error('invalid_company_for_tenant'),{status:400});
        throw error;
      }
    }
  };
}
