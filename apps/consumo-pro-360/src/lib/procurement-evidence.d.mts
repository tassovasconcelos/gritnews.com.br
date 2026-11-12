type Row=Record<string,any>;
export function landedCost(offer:Row):number;
export function supplierCoverage(offers:Row[],lines:Row[]):Map<string,number>;
export function dossierHtml(batch:Row):string;
