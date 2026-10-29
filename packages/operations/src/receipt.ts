export type ReceiptPreferences = {
  businessName: string;
  address: string;
  phone: string;
  taxId: string;
  logoUrl: string;
  footer: string;
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showTaxId: boolean;
  showOperator: boolean;
  paperWidth: 58 | 80;
  fontSize: number;
  copies: number;
  printerHint: string;
};
export type ReceiptData = {
  id?: string;
  label: string;
  date: string;
  items: { name: string; quantity: number; unitPrice: number; unit?: string }[];
  total: number;
  payment: string;
  operator?: string;
};
export const defaultPreferences: ReceiptPreferences = {
  businessName: "",
  address: "",
  phone: "",
  taxId: "",
  logoUrl: "",
  footer: "Obrigado pela preferência!",
  showLogo: true,
  showAddress: true,
  showPhone: true,
  showTaxId: false,
  showOperator: true,
  paperWidth: 80,
  fontSize: 12,
  copies: 1,
  printerHint: "",
};
export const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const safeLogo = (url: string) => {
  try {
    return new URL(url).protocol === "https:" ? url : "";
  } catch {
    return "";
  }
};
export function receiptLines(d: ReceiptData, p: ReceiptPreferences): string[] {
  return [
    p.businessName,
    "RECIBO NÃO FISCAL",
    "Não substitui a NFC-e obrigatória.",
    ...(p.showAddress && p.address ? [p.address] : []),
    ...(p.showPhone && p.phone ? [`Contato: ${p.phone}`] : []),
    ...(p.showTaxId && p.taxId ? [`CPF/CNPJ: ${p.taxId}`] : []),
    d.label,
    new Date(d.date).toLocaleString("pt-BR"),
    ...(d.id ? [`Venda: ${d.id}`] : []),
    "",
    ...d.items.map(
      (i) =>
        `${i.quantity.toLocaleString("pt-BR")} ${i.unit || "x"} ${i.name} • ${currency(i.unitPrice)} = ${currency(i.quantity * i.unitPrice)}`,
    ),
    "",
    `TOTAL: ${currency(d.total)}`,
    `Pagamento: ${d.payment}`,
    ...(p.showOperator && d.operator ? [`Atendimento: ${d.operator}`] : []),
    p.footer,
  ];
}
export function renderReceipt(d: ReceiptData, p: ReceiptPreferences): string {
  const width = p.paperWidth === 58 ? 58 : 80,
    size = Math.max(10, Math.min(18, Number(p.fontSize) || 12));
  const charactersPerLine = Math.max(
    16,
    Math.floor(((width - 6) * 3.78) / (size * 0.62)),
  );
  const lineCount = receiptLines(d, p).reduce(
    (sum, line) =>
      sum + Math.max(1, Math.ceil(line.length / charactersPerLine)),
    0,
  );
  const height = Math.max(
    80,
    Math.min(
      2000,
      Math.ceil(
        (lineCount * size * 1.4) / 3.78 +
          (p.showLogo && safeLogo(p.logoUrl) ? 30 : 0) +
          12,
      ),
    ),
  );
  const content = `${p.showLogo && safeLogo(p.logoUrl) ? `<img alt="Logo" src="${esc(safeLogo(p.logoUrl))}">` : ""}<pre>${receiptLines(d, p).map(esc).join("\n")}</pre>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Recibo não fiscal</title><style>@page{size:${width}mm ${height}mm;margin:3mm}body{margin:0;color:#111;font: ${size}px monospace}section{width:${width - 6}mm;break-after:page}section:last-child{break-after:auto}img{display:block;max-width:40mm;max-height:25mm;margin:auto}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body>${Array.from({ length: Math.max(1, Math.min(3, p.copies || 1)) }, () => `<section>${content}</section>`).join("")}</body></html>`;
}
export async function printReceipt(d: ReceiptData, p: ReceiptPreferences) {
  const w = window.open("", "_blank", "width=440,height=760");
  if (!w)
    throw new Error(
      "Permita a abertura da janela de impressão neste navegador.",
    );
  w.opener = null;
  w.document.open();
  w.document.write(renderReceipt(d, p));
  w.document.close();
  await Promise.all(
    Array.from(w.document.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
          }),
    ),
  );
  w.focus();
  w.print();
}
