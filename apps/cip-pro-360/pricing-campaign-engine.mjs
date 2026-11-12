import { brazilDay, day } from './erp-engine.mjs';

export const MP_CAMPAIGN_RULE_VERSION = 'mp-sellout-2026-10-20.1';
const ceilMoney = value => Math.ceil((value - 1e-9) * 100) / 100;
const value = (input, key, label, min = 0, max = 1e12) => {
  const result = Number(input[key]);
  if (input[key] === null || input[key] === undefined || String(input[key]).trim() === '' || !Number.isFinite(result) || result < min || result > max) throw Error(`Confira ${label}.`);
  return result;
};

function normalizeTiers(tiers) {
  if (!Array.isArray(tiers) || tiers.length > 8) throw Error('Informe até oito faixas de bônus.');
  const normalized = tiers.map((tier, index) => ({
    minimum_units: value(tier, 'minimum_units', `quantidade mínima da faixa ${index + 1}`, 0.0001),
    bonus_per_unit: value(tier, 'bonus_per_unit', `bônus por unidade da faixa ${index + 1}`)
  })).sort((a, b) => a.minimum_units - b.minimum_units);
  if (normalized.some((tier, index) => index && tier.minimum_units === normalized[index - 1].minimum_units)) throw Error('As faixas de bônus precisam ter metas diferentes.');
  return normalized;
}

// Deterministic per-store campaign proposal. It never predicts demand or writes a price to Procfit.
export function simulateSelloutCampaign(input, now = new Date()) {
  const cost = value(input, 'cost', 'custo unitário', 0.00000001);
  const currentPrice = value(input, 'current_price', 'preço atual', 0.01);
  const expenses = value(input, 'expense_pct', 'despesas variáveis (%)', 0, 99);
  const fixedCost = value(input, 'fixed_cost', 'despesas fixas por unidade');
  const minimumMargin = value(input, 'minimum_margin_pct', 'contribuição mínima (%)', 0, 99);
  const targetMargin = value(input, 'target_margin_pct', 'contribuição alvo (%)', 0, 99);
  const maxChange = value(input, 'max_change_pct', 'variação máxima autorizada (%)', 0, 100);
  const available = value(input, 'available_units', 'saldo disponível', 0);
  const targetUnits = value(input, 'target_units', 'meta da loja', 0.0001);
  const days = value(input, 'campaign_days', 'duração da campanha', 1, 365);
  const carryRate = value(input, 'monthly_carry_rate_pct', 'taxa mensal de capital imobilizado', 0, 100);
  const cofunding = value(input, 'supplier_funding_per_unit', 'custeio do fornecedor por unidade');
  const tiers = normalizeTiers(input.bonus_tiers ?? []);
  if (minimumMargin > targetMargin || expenses + targetMargin >= 100) throw Error('A meta deve ser maior ou igual ao piso; despesas + meta devem ficar abaixo de 100%.');
  if (targetUnits > available) throw Error('Meta da loja excede o saldo disponível informado.');

  const tier = tiers.filter(item => targetUnits >= item.minimum_units).at(-1) ?? null;
  const grossBonusPerUnit = tier?.bonus_per_unit ?? 0;
  const netBonusPerUnit = Math.max(0, grossBonusPerUnit - cofunding);
  const netBonusTotal = netBonusPerUnit * targetUnits;
  const grossBonusTotal = grossBonusPerUnit * targetUnits;
  const supplierFundingTotal = Math.min(grossBonusTotal, cofunding * targetUnits);
  const unitBase = cost + fixedCost + netBonusPerUnit;
  const floor = ceilMoney(unitBase / (1 - (expenses + minimumMargin) / 100));
  const targetPrice = ceilMoney(unitBase / (1 - (expenses + targetMargin) / 100));
  const maxAllowedPrice = currentPrice * (1 + maxChange / 100);
  const blockers = [];
  const warnings = [];
  let reference = null;

  if (input.reference_price !== undefined && String(input.reference_price).trim() !== '') {
    const referencePrice = value(input, 'reference_price', 'preço concorrente', 0.01);
    const referenceDate = day(input.reference_date);
    const age = referenceDate ? Math.round((Date.parse(`${brazilDay(now)}T00:00:00Z`) - Date.parse(`${referenceDate}T00:00:00Z`)) / 86400000) : null;
    if (!referenceDate || age < 0 || age > 7 || input.equivalent !== true || typeof input.reference_source !== 'string' || !input.reference_source.trim()) blockers.push('Concorrência exige fonte, data de até 7 dias e equivalência de produto, embalagem, unidade e condição comercial.');
    else reference = {
      price: referencePrice,
      date: referenceDate,
      age_days: age,
      source: input.reference_source.trim().slice(0, 300),
      channel: String(input.reference_channel || '').trim().slice(0, 40) || null,
      location: String(input.reference_location || '').trim().slice(0, 120) || null,
      contact_role: String(input.reference_contact_role || '').trim().slice(0, 120) || null,
      evidence: String(input.reference_evidence || '').trim().slice(0, 500) || null
    };
  }

  let suggestedPrice = reference ? Math.min(targetPrice, Math.max(floor, reference.price)) : targetPrice;
  if (suggestedPrice > maxAllowedPrice) {
    warnings.push(`A alçada de variação limita o preço proposto a ${ceilMoney(maxAllowedPrice).toFixed(2)}; confirme uma nova alçada se precisar recompor margem.`);
    suggestedPrice = ceilMoney(maxAllowedPrice);
  }
  if (suggestedPrice < floor) blockers.push('Preço possível dentro da alçada fica abaixo do piso após descontar o bônus líquido.');
  if (grossBonusPerUnit > cofunding) warnings.push('A parcela do bônus sem custeio do fornecedor reduz a contribuição da campanha.');
  if (targetUnits < available) warnings.push(`${(available - targetUnits).toLocaleString('pt-BR')} unidades ficam fora da meta e permanecem em estoque.`);
  if (input.reference_price === undefined || String(input.reference_price).trim() === '') warnings.push('Sem concorrência equivalente validada; sugestão usa o preço necessário para a margem alvo.');
  if (input.demand_history_complete !== true) warnings.push('Histórico por loja não está validado; a meta é um cenário declarado, não uma previsão de venda.');

  const contribution = price => price * (1 - expenses / 100) - cost - fixedCost - netBonusPerUnit;
  const baselineContributionUnit = currentPrice * (1 - expenses / 100) - cost - fixedCost;
  const nextContributionUnit = contribution(suggestedPrice);
  const scenarioRevenue = suggestedPrice * targetUnits;
  const scenarioContribution = nextContributionUnit * targetUnits;
  const baseContribution = baselineContributionUnit * targetUnits;
  const carryReliefScenario = cost * targetUnits * carryRate / 100 * days / 30;
  const breakEvenUnitsVsBaseline = nextContributionUnit > 0 ? (baseContribution > 0 ? baseContribution / nextContributionUnit : 0) : null;
  const extraUnitsNeeded = breakEvenUnitsVsBaseline === null ? null : Math.max(0, breakEvenUnitsVsBaseline - targetUnits);

  return {
    simulation: true,
    rule_version: MP_CAMPAIGN_RULE_VERSION,
    campaign_days: days,
    available_units: available,
    target_units: targetUnits,
    remaining_units: available - targetUnits,
    applied_bonus_tier: tier,
    gross_bonus_per_unit: grossBonusPerUnit,
    net_bonus_per_unit: netBonusPerUnit,
    gross_bonus_total: grossBonusTotal,
    supplier_funding_total: supplierFundingTotal,
    company_bonus_cost_total: netBonusTotal,
    break_even_floor: floor,
    margin_target_price: targetPrice,
    suggested_price: suggestedPrice,
    max_allowed_price: ceilMoney(maxAllowedPrice),
    candidate_margin_pct: suggestedPrice ? nextContributionUnit / suggestedPrice * 100 : null,
    candidate_contribution_per_unit: nextContributionUnit,
    scenario_revenue: scenarioRevenue,
    scenario_contribution: scenarioContribution,
    baseline_contribution_same_volume: baseContribution,
    contribution_delta: scenarioContribution - baseContribution,
    gross_stock_cost_released_scenario: cost * targetUnits,
    carrying_cost_relief_scenario: carryReliefScenario,
    break_even_units_vs_baseline: breakEvenUnitsVsBaseline,
    additional_units_needed_to_preserve_baseline: extraUnitsNeeded,
    reference,
    blockers,
    warnings,
    status: blockers.length ? 'bloqueado' : 'revisao_humana',
    notice: 'Cenário determinístico por loja. Receita depende da venda; caixa depende do recebimento. Custo de capital é cenário e não representa perda contábil realizada. Nenhum preço ou bônus foi aplicado no ERP.'
  };
}
