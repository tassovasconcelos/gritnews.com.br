import { useRef, useState } from "react";
import { decimal } from "./catalog";
import type { OperationApp } from "./SettingsPanel";
export function QuickProduct({
  client,
  app,
  scopeId,
  onDone,
}: {
  client: any;
  app: OperationApp;
  scopeId: string;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
      name: "",
      price: "",
      category: app === "sr-padeiro" ? "Pães" : "Espetinhos",
      unit: "UN",
      stock: "0",
      cost: "",
    }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const request = useRef(crypto.randomUUID());
  function change(key: keyof typeof form, value: string) {
    setForm({ ...form, [key]: value });
    request.current = crypto.randomUUID();
  }
  async function save() {
    const price = decimal(form.price),
      stock = decimal(form.stock),
      cost = form.cost ? decimal(form.cost) : null;
    if (
      !form.name.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      (cost !== null && (!Number.isFinite(cost) || cost < 0))
    ) {
      setMessage("Confira nome, preço positivo e estoque/custo válidos.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const r = await client.rpc("ops_import_catalog", {
        a: app,
        s: scopeId,
        r: request.current,
        mode: "skip",
        rows: [{ ...form, name: form.name.trim(), price, stock, cost }],
      });
      if (r.error) throw r.error;
      if (r.data.skipped) {
        setMessage(
          "Já existe um produto com esse nome. Use a importação para atualizar os preços.",
        );
        return;
      }
      setForm({ ...form, name: "", price: "", stock: "0", cost: "" });
      request.current = crypto.randomUUID();
      setMessage("Produto cadastrado com estoque inicial.");
      onDone();
    } catch {
      setMessage(
        "Não foi possível cadastrar. Confira os dados e sua permissão.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ops-panel">
      <h3>Cadastro rápido de produto</h3>
      <fieldset disabled={busy} style={{ padding: 0, border: 0 }}>
        <div className="ops-grid">
          {(
            [
              ["name", "Nome"],
              ["price", "Preço de venda"],
              ["category", "Categoria"],
              ["stock", "Estoque inicial"],
              ["cost", "Custo (opcional)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                maxLength={key === "name" ? 120 : 80}
                inputMode={
                  ["price", "stock", "cost"].includes(key) ? "decimal" : "text"
                }
                value={form[key]}
                onChange={(e) => change(key, e.target.value)}
              />
            </label>
          ))}
          {app === "sr-padeiro" && (
            <label>
              Unidade
              <select
                value={form.unit}
                onChange={(e) => change("unit", e.target.value)}
              >
                {["UN", "KG", "G", "L", "ML", "PACOTE", "CAIXA"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="ops-actions">
          <button className="ops-primary" onClick={save}>
            Cadastrar produto
          </button>
        </div>
      </fieldset>
      <p role="status">{message}</p>
    </section>
  );
}
