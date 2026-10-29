export type CatalogRow = {
  name: string;
  price: number;
  category: string;
  unit: string;
  stock: number;
  cost: number | null;
  variant?: string;
  fulfillment?: string;
};
const normalize = (s: string) =>
  s
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function decimal(raw: string): number {
  const s = raw
    .trim()
    .replace(/^R\$\s*/, "")
    .replace(/\s/g, "");
  if (
    !/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,3})?$/.test(s) &&
    !/^\d+(?:\.\d{1,3})?$/.test(s)
  )
    return NaN;
  return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
}
// Quoted CSV (including escaped quotes and embedded newlines), semicolon or TSV.
export function parseCatalog(text: string): {
  rows: CatalogRow[];
  errors: string[];
} {
  if (text.length > 1024 * 1024)
    return { rows: [], errors: ["Arquivo acima de 1 MB."] };
  text = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const head = text.split("\n")[0] || "";
  const separator = head.includes("\t") ? "\t" : head.includes(";") ? ";" : ",";
  const cells: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === separator || c === "\n")) {
      row.push(value);
      value = "";
      if (c === "\n") {
        if (row.some((x) => x.trim())) cells.push(row);
        row = [];
      }
    } else value += c;
  }
  row.push(value);
  if (row.some((x) => x.trim())) cells.push(row);
  if (quoted) return { rows: [], errors: ["Aspas não fechadas no arquivo."] };
  if (cells.length < 2)
    return {
      rows: [],
      errors: ["Inclua o cabeçalho e pelo menos um produto."],
    };
  const aliases: Record<string, string> = {
    produto: "nome",
    product: "nome",
    name: "nome",
    price: "preco",
    valor: "preco",
    category: "categoria",
    unit: "unidade",
    stock: "estoque",
    cost: "custo",
  };
  const headers = cells
    .shift()!
    .map((v) => aliases[normalize(v)] || normalize(v));
  if (!headers.includes("nome") || !headers.includes("preco"))
    return { rows: [], errors: ["Colunas obrigatórias: nome e preco."] };
  if (new Set(headers).size !== headers.length)
    return { rows: [], errors: ["Existem colunas repetidas."] };
  if (cells.length > 500)
    return { rows: [], errors: ["Importe até 500 produtos por vez."] };
  const rows: CatalogRow[] = [],
    errors: string[] = [],
    seen = new Set<string>();
  cells.forEach((values, i) => {
    const field = (key: string) => values[headers.indexOf(key)]?.trim() || "";
    const name = field("nome"),
      price = decimal(field("preco")),
      stock = field("estoque") ? decimal(field("estoque")) : 0,
      cost = field("custo") ? decimal(field("custo")) : null;
    const unit = (field("unidade") || "UN").toUpperCase(),
      category = field("categoria") || "Outros";
    const variant = field("variante") || field("variant");
    const fulfillment = normalize(
      field("modalidade") || field("fulfillment") || "confirmar",
    ).replace(/\s+/g, "_");
    if (
      values.length !== headers.length ||
      !name ||
      name.length > 120 ||
      category.length > 80 ||
      variant.length > 120 ||
      !["confirmar", "pronta_entrega", "encomenda"].includes(fulfillment) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 999999 ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.00001 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      stock > 999999 ||
      (cost !== null &&
        (!Number.isFinite(cost) ||
          cost < 0 ||
          cost > 999999 ||
          Math.abs(cost * 100 - Math.round(cost * 100)) > 0.00001)) ||
      !["UN", "KG", "G", "L", "ML", "PACOTE", "CAIXA"].includes(unit)
    )
      errors.push(
        `Linha ${i + 2}: confira nome, preço positivo, custo, estoque e unidade. Preço e custo usam até 2 casas decimais.`,
      );
    else if (seen.has(normalize(name) + "|" + normalize(variant)))
      errors.push(`Linha ${i + 2}: produto repetido no arquivo (${name}).`);
    else {
      seen.add(normalize(name) + "|" + normalize(variant));
      rows.push({
        name,
        price,
        category,
        unit,
        stock,
        cost,
        variant,
        fulfillment,
      });
    }
  });
  return { rows, errors };
}
export const catalogTemplate = (bakery: boolean) =>
  bakery
    ? "nome;preco;categoria;unidade;estoque;custo;variante;modalidade\nPão francês;18,90;Pães;KG;20;9,50;;confirmar\n"
    : "nome;preco;categoria;unidade;estoque;custo\nEspetinho de carne;12,00;Espetinhos;UN;50;5,20\n";
