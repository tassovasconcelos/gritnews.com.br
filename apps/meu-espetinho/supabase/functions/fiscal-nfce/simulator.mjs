// Test adapter only. Never returns an authorization, access key, XML or DANFE.
export async function simulateCeara(document, scenario = 'success') {
  if (document.environment !== 'homologacao') throw new Error('production_blocked');
  if (!document.attempt_id) throw new Error('attempt_required');
  if (scenario === 'timeout') throw new Error('communication_unknown');
  if (scenario === 'reject' || !document.snapshot?.items?.length || Number(document.snapshot.total) <= 0) {
    return { status: 'rejected', code: 'SIMULATED_539' };
  }
  if (scenario !== 'success') throw new Error('invalid_scenario');
  return { status: 'simulated', code: 'SIMULATED_100' };
}
