const num = (obj, key, min = 0, max = 1e12) => {
  const value = Number(obj?.[key]);
  if (obj?.[key] === null || obj?.[key] === undefined || String(obj[key]).trim() === '' || !Number.isFinite(value) || value < min || value > max) throw Error(`Confira ${key}.`);
  return value;
};

const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const ROLES = new Set(['ancora', 'complementar', 'giro']);
const CAMPAIGN_TYPES = new Set(['giro', 'preco', 'queima', 'sellout', 'b2b']);

/** Deterministic campaign planning. Inputs and outputs are scenarios, never sales forecasts. */
export function planCampaign(input) {
  if (!Array.isArray(input?.products) || input.products.length < 1 || input.products.length > 30) throw Error('Inclua de 1 a 30 produtos na cesta.');
  const days = num(input, 'campaign_days', 1, 90);
  const fixedCost = num(input, 'campaign_cost');
  const cannibalizationPct = num(input, 'cannibalization_pct', 0, 100);
  const targetMargin = num(input, 'minimum_margin_pct', 0, 99);
  if (!CAMPAIGN_TYPES.has(input.campaign_type)) throw Error('Escolha o objetivo da campanha.');
  const pilotStores = String(input.pilot_stores || '').split(/[;,\n]/).map(value => value.trim()).filter(Boolean);
  const controlStores = String(input.control_stores || '').split(/[;,\n]/).map(value => value.trim()).filter(Boolean);
  const uplifts = {
    conservador: num(input.scenarios, 'conservador', 0, 1000),
    base: num(input.scenarios, 'base', 0, 1000),
    otimista: num(input.scenarios, 'otimista', 0, 1000)
  };
  if (!(uplifts.conservador <= uplifts.base && uplifts.base <= uplifts.otimista)) throw Error('Ordene as premissas de volume: conservador ≤ base ≤ otimista.');

  const products = input.products.map((item, index) => {
    if (!ROLES.has(item.role)) throw Error(`Classifique o produto ${index + 1} como âncora, complementar ou giro.`);
    const sku = String(item.sku || '').trim().slice(0, 100);
    if (!sku) throw Error(`Informe o produto ${index + 1}.`);
    const cost = num(item, 'cost', 0.00000001);
    const price = num(item, 'price', 0.01);
    const expensePct = num(item, 'expense_pct', 0, 99.99);
    const baselineUnits = num(item, 'baseline_units', 0.00000001);
    const availableUnits = num(item, 'available_units', 0.00000001);
    const productFloorPct = num(item, 'minimum_margin_pct', 0, 99);
    const contributionUnit = price * (1 - expensePct / 100) - cost;
    const marginPct = contributionUnit / price * 100;
    return {
      sku, role: item.role, cost, price, expensePct, baselineUnits, availableUnits,
      productFloorPct, contributionUnit, marginPct,
      baselineContribution: contributionUnit * baselineUnits,
      inventoryCost: cost * availableUnits
    };
  });
  const floorViolations = products.filter(p => p.marginPct < Math.max(targetMargin, p.productFloorPct));
  const baselineContribution = products.reduce((sum, p) => sum + p.baselineContribution, 0);
  const contributionAtRisk = baselineContribution * cannibalizationPct / 100;
  const baselineUnits = products.reduce((sum, p) => sum + p.baselineUnits, 0);
  const extraUnitsCapacity = products.reduce((sum, p) => sum + Math.max(0, p.availableUnits - Math.min(p.baselineUnits, p.availableUnits)), 0);
  const incrementalContributionPerUpliftPct = products.reduce((sum, p) => sum + p.baselineUnits * p.contributionUnit, 0) / 100;
  const breakEvenUpliftPct = incrementalContributionPerUpliftPct > 0 ? (fixedCost + contributionAtRisk) / incrementalContributionPerUpliftPct : null;
  const breakEvenReachable = breakEvenUpliftPct !== null && breakEvenUpliftPct <= extraUnitsCapacity / Math.max(baselineUnits, 1e-9) * 100;

  const results = Object.entries(uplifts).map(([scenario, upliftPct]) => {
    const rows = products.map(p => {
      const requested = p.baselineUnits * (1 + upliftPct / 100);
      const volume = Math.min(p.availableUnits, requested);
      return { sku: p.sku, role: p.role, volume: round(volume), requested_volume: round(requested), stock_after: round(Math.max(0, p.availableUnits - volume)), stock_limited: requested > p.availableUnits, revenue: round(volume * p.price), contribution: round(volume * p.contributionUnit) };
    });
    const revenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const contribution = rows.reduce((sum, r) => sum + r.contribution, 0);
    const netIncremental = contribution - baselineContribution - contributionAtRisk - fixedCost;
    const campaignInvestment = fixedCost + contributionAtRisk;
    return {
      scenario, assumed_uplift_pct: upliftPct, revenue: round(revenue), contribution: round(contribution),
      baseline_contribution: round(baselineContribution), cannibalization_cost: round(contributionAtRisk),
      campaign_cost: round(fixedCost), net_incremental_contribution: round(netIncremental),
      roi_pct: campaignInvestment > 0 ? round(netIncremental / campaignInvestment * 100) : null,
      units: round(rows.reduce((sum, r) => sum + r.volume, 0)), products: rows,
      inventory_cost_released_scenario: round(rows.reduce((sum, r) => sum + r.volume * (products.find(p => p.sku === r.sku)?.cost || 0), 0)),
      stock_limited: rows.some(r => r.stock_limited)
    };
  });

  const checks = [
    { status: input.baseline_weeks >= 8 ? 'ok' : 'pendente', label: 'Linha de base de pelo menos 8 semanas', detail: input.baseline_weeks >= 8 ? `${input.baseline_weeks} semanas informadas` : 'Informar série histórica comparável antes da aprovação' },
    { status: controlStores.length >= 1 ? 'ok' : 'pendente', label: 'Lojas de controle comparáveis', detail: controlStores.length >= 1 ? `${controlStores.length} loja(s): ${controlStores.join(', ')}` : 'Definir lojas sem campanha para comparação' },
    { status: pilotStores.length >= 1 ? 'ok' : 'pendente', label: 'Lojas do piloto identificadas', detail: pilotStores.length >= 1 ? `${pilotStores.length} loja(s): ${pilotStores.join(', ')}` : 'Identificar as lojas e unidades que receberão a ação' },
    { status: floorViolations.length ? 'bloqueio' : 'ok', label: 'Piso de contribuição por produto', detail: floorViolations.length ? `${floorViolations.map(p => p.sku).join(', ')} abaixo do piso` : 'Todos os produtos atendem o piso informado' },
    { status: input.source_snapshot_at ? 'ok' : 'pendente', label: 'Fonte e data da posição', detail: input.source_snapshot_at || 'Vincular uma base aprovada e datada' },
    { status: String(input.hypothesis || '').trim().length >= 10 ? 'ok' : 'pendente', label: 'Hipótese de negócio', detail: String(input.hypothesis || '').trim() || 'Descrever por que a ação deve funcionar' },
    { status: input.success_metric ? 'ok' : 'pendente', label: 'Critério de sucesso pré-registrado', detail: input.success_metric || 'Definir métrica e limiar antes do piloto' },
    { status: breakEvenReachable ? 'ok' : 'pendente', label: 'Volume de equilíbrio compatível com o saldo', detail: breakEvenUpliftPct === null ? 'Sem contribuição positiva para estimar equilíbrio' : breakEvenReachable ? 'O saldo informado comporta o ponto de equilíbrio calculado' : 'O saldo limita o volume abaixo do ponto de equilíbrio calculado' }
  ];
  return {
    simulation: true, campaign_days: days, campaign_type: input.campaign_type, hypothesis: String(input.hypothesis || '').trim().slice(0, 1000), products, scenarios: results,
    summary: { basket_size: products.length, baseline_units: round(baselineUnits), baseline_contribution: round(baselineContribution), inventory_cost: round(products.reduce((sum, p) => sum + p.inventoryCost, 0)), break_even_uplift_pct: breakEvenUpliftPct === null ? null : round(breakEvenUpliftPct), break_even_reachable: breakEvenReachable, pilot_stores: pilotStores, control_stores: controlStores, best_practice_ready: checks.every(c => c.status === 'ok'), blocked: floorViolations.length > 0 },
    checks,
    notice: 'Premissas declaradas para simulação. O resultado real exige piloto, lojas de controle e conciliação das vendas, custos e despesas após a campanha.'
  };
}
