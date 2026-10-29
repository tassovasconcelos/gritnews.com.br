import { useCallback, useEffect, useState } from "react";
import {
  defaultPreferences,
  printReceipt,
  receiptLines,
  safeLogo,
  type ReceiptData,
  type ReceiptPreferences,
} from "./receipt";
import "./operations.css";
export type OperationApp = "meu-espetinho" | "sr-padeiro";
// Supabase clients are supplied by each app to preserve its session and runtime.
export function usePreferences(
  client: any,
  app: OperationApp,
  scopeId: string,
  fallback: Partial<ReceiptPreferences>,
) {
  const fallbackKey = JSON.stringify(fallback);
  const [value, setValue] = useState<ReceiptPreferences>({
    ...defaultPreferences,
    ...fallback,
  });
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const reload = useCallback(async () => {
    setReady(false);
    setError("");
    try {
      const { data, error: e } = await client
        .from("operation_preferences")
        .select("preferences")
        .eq("app", app)
        .eq("scope_id", scopeId)
        .maybeSingle();
      if (e) throw e;
      setValue({
        ...defaultPreferences,
        ...JSON.parse(fallbackKey),
        ...(data?.preferences || {}),
      });
      setReady(true);
    } catch {
      setError("Não foi possível carregar as configurações. Tente atualizar.");
    }
  }, [client, app, scopeId, fallbackKey]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { value, setValue, error, ready, reload };
}
export const sampleReceipt = (bakery: boolean): ReceiptData => ({
  label: "Teste de impressão",
  date: new Date().toISOString(),
  items: [
    {
      name: bakery ? "Pão francês" : "Espetinho de carne",
      quantity: bakery ? 0.5 : 2,
      unitPrice: bakery ? 18 : 12,
      unit: bakery ? "KG" : "UN",
    },
  ],
  total: bakery ? 9 : 24,
  payment: "PIX",
  operator: "Equipe",
});
export function SettingsPanel({
  client,
  app,
  scopeId,
  preferences,
  ready,
  error,
  onSaved,
}: {
  client: any;
  app: OperationApp;
  scopeId: string;
  preferences: ReceiptPreferences;
  ready: boolean;
  error: string;
  onSaved: (p: ReceiptPreferences) => void;
}) {
  const [draft, setDraft] = useState(preferences),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);
  const change = <K extends keyof ReceiptPreferences>(
    key: K,
    v: ReceiptPreferences[K],
  ) => setDraft((p) => ({ ...p, [key]: v }));
  async function save() {
    setBusy(true);
    try {
      const r = await client
        .from("operation_preferences")
        .upsert(
          { app, scope_id: scopeId, preferences: draft },
          { onConflict: "app,scope_id" },
        );
      if (r.error) throw r.error;
      onSaved(draft);
      setMessage("Configurações salvas para esta empresa.");
    } catch {
      setMessage(
        "Não foi possível salvar. Verifique sua permissão e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logo(file: File | undefined) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setMessage("Envie PNG, JPG ou WebP de até 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const ext =
          file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
              ? "webp"
              : "jpg",
        path = `${app}/${scopeId}/${crypto.randomUUID()}.${ext}`;
      const r = await client.storage
        .from("operation-logos")
        .upload(path, file, { contentType: file.type });
      if (r.error) throw r.error;
      const { data } = client.storage
        .from("operation-logos")
        .getPublicUrl(path);
      change("logoUrl", data.publicUrl);
      setMessage("Logo carregada. Salve as configurações para aplicar.");
    } catch {
      setMessage("Falha ao enviar a logo. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  const sample = sampleReceipt(app === "sr-padeiro");
  return (
    <section className="ops-panel">
      <h2>Marca, recibo e impressora</h2>
      <p>
        Personalize o recibo da sua empresa. A identificação não fiscal e a
        obrigação de emissão fiscal são preservadas.
      </p>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy || !ready} style={{ border: 0, padding: 0 }}>
        <div className="ops-grid">
          <label>
            Nome no recibo
            <input
              maxLength={120}
              value={draft.businessName}
              onChange={(e) => change("businessName", e.target.value)}
            />
          </label>
          <label>
            Endereço
            <input
              maxLength={240}
              value={draft.address}
              onChange={(e) => change("address", e.target.value)}
            />
          </label>
          <label>
            Telefone / WhatsApp
            <input
              maxLength={40}
              value={draft.phone}
              onChange={(e) => change("phone", e.target.value)}
            />
          </label>
          <label>
            CPF / CNPJ
            <input
              maxLength={30}
              value={draft.taxId}
              onChange={(e) => change("taxId", e.target.value)}
            />
          </label>
          <label>
            Logo da empresa
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                logo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <label>
            Mensagem no rodapé
            <textarea
              rows={3}
              maxLength={300}
              value={draft.footer}
              onChange={(e) => change("footer", e.target.value)}
            />
          </label>
        </div>
        <h3>Informações do recibo</h3>
        <div className="ops-grid">
          {(
            [
              ["showLogo", "Mostrar logo"],
              ["showAddress", "Mostrar endereço"],
              ["showPhone", "Mostrar contato"],
              ["showTaxId", "Mostrar CPF/CNPJ"],
              ["showOperator", "Mostrar atendente"],
            ] as const
          ).map(([key, label]) => (
            <label className="ops-toggle" key={key}>
              <input
                type="checkbox"
                checked={draft[key]}
                onChange={(e) => change(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <h3>Impressão pelo navegador</h3>
        <div className="ops-grid">
          <label>
            Largura do papel
            <select
              value={draft.paperWidth}
              onChange={(e) =>
                change("paperWidth", Number(e.target.value) as 58 | 80)
              }
            >
              <option value={58}>58 mm</option>
              <option value={80}>80 mm</option>
            </select>
          </label>
          <label>
            Tamanho da letra
            <select
              value={draft.fontSize}
              onChange={(e) => change("fontSize", Number(e.target.value))}
            >
              {[10, 12, 14, 16, 18].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Vias
            <select
              value={draft.copies}
              onChange={(e) => change("copies", Number(e.target.value))}
            >
              {[1, 2, 3].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Identificação da impressora
            <input
              maxLength={100}
              placeholder="Ex.: Balcão — térmica 80 mm"
              value={draft.printerHint}
              onChange={(e) => change("printerHint", e.target.value)}
            />
          </label>
        </div>
        <p>
          Escolha a impressora na janela de impressão do aparelho. Bluetooth/USB
          precisam estar configurados no sistema. Esta identificação ajuda a
          equipe e não instala drivers nem seleciona a impressora
          automaticamente.
        </p>
        <div className="ops-actions">
          <button className="ops-primary" onClick={save}>
            Salvar configurações
          </button>
          <button
            onClick={() =>
              printReceipt(sample, draft).catch((e) => setMessage(e.message))
            }
          >
            Testar impressão
          </button>
          <button onClick={() => change("logoUrl", "")}>
            Remover logo do recibo
          </button>
        </div>
      </fieldset>
      <p role="status">{busy ? "Processando…" : message}</p>
      <h3>Prévia</h3>
      <div className="ops-preview">
        {draft.showLogo && safeLogo(draft.logoUrl) && (
          <img src={safeLogo(draft.logoUrl)} alt="Logo do recibo" />
        )}
        {receiptLines(sample, draft).join("\n")}
      </div>
    </section>
  );
}
