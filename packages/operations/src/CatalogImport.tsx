import { useMemo, useRef, useState } from "react";
import { catalogTemplate, parseCatalog } from "./catalog";
import type { OperationApp } from "./SettingsPanel";
export function CatalogImport({
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
  const [text, setText] = useState(""),
    [mode, setMode] = useState("skip"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const request = useRef(crypto.randomUUID());
  const parsed = useMemo(() => {
    const result = parseCatalog(text);
    if (app === "meu-espetinho" && result.rows.some((r) => r.unit !== "UN"))
      result.errors.push(
        "O Meu Espetinho trabalha com unidade UN. Confira a coluna unidade.",
      );
    return result;
  }, [text, app]);
  function update(v: string) {
    setText(v);
    setMessage("");
    request.current = crypto.randomUUID();
  }
  function template() {
    const blob = new Blob(["\uFEFF" + catalogTemplate(app === "sr-padeiro")], {
        type: "text/csv;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `modelo-${app}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function submit() {
    if (busy || parsed.errors.length || !parsed.rows.length) return;
    setBusy(true);
    try {
      const { data, error } = await client.rpc("ops_import_catalog", {
        a: app,
        s: scopeId,
        r: request.current,
        rows: parsed.rows,
        mode,
      });
      if (error) throw error;
      setMessage(
        `${data.created} cadastrados, ${data.updated} preços atualizados, ${data.skipped} ignorados. Estoque existente preservado.`,
      );
      onDone();
    } catch {
      setMessage(
        "Não foi possível concluir. Nenhuma alteração parcial é salva. Se houve falha de comunicação, repita sem editar o arquivo para consultar o mesmo lote.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ops-panel">
      <h2>
        {app === "sr-padeiro" ? "Importar catálogo" : "Importar cardápio"}
      </h2>
      {app === "sr-padeiro" && (
        <p>
          Colunas adicionais: variante e modalidade (pronta_entrega, encomenda
          ou confirmar). Sem modalidade definida, novos produtos ficam inativos
          até a conferência em Produtos.
        </p>
      )}
      <p>
        CSV de até 1 MB ou tabela copiada do Excel. Até 500 produtos. Colunas
        obrigatórias: nome e preco. Opcionais: categoria, unidade, estoque e
        custo. Preço brasileiro: 12,50; separador de colunas: ponto e vírgula.
      </p>
      <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
        <div className="ops-actions">
          <button onClick={template}>Baixar modelo CSV</button>
          <label>
            Escolher CSV
            <input
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 1024 * 1024)
                    setMessage("Arquivo acima de 1 MB.");
                  else update(await f.text());
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <label>
          Ou cole a tabela
          <textarea
            rows={6}
            value={text}
            onChange={(e) => update(e.target.value)}
            placeholder={catalogTemplate(app === "sr-padeiro")}
          />
        </label>
        <label>
          Produtos que já existem
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              request.current = crypto.randomUUID();
            }}
          >
            <option value="skip">Ignorar e preservar cadastro atual</option>
            <option value="update">
              Atualizar preço, custo e categoria pelo nome exato
            </option>
          </select>
        </label>
        <p>
          A unidade e o estoque de produtos existentes são preservados. Nomes
          ambíguos impedem a importação. Novos produtos do Meu Espetinho usam
          unidade UN.
        </p>
        {text && parsed.errors.length > 0 && (
          <ul className="ops-error" role="alert">
            {parsed.errors.slice(0, 15).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {parsed.rows.length > 0 && (
          <>
            <h3>Prévia — {parsed.rows.length} produtos</h3>
            <div className="ops-scroll">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Preço</th>
                    <th>Categoria</th>
                    <th>Unidade</th>
                    <th>Estoque inicial</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r, i) => (
                    <tr key={i}>
                      <td>
                        {r.name}
                        {r.variant ? ` • ${r.variant}` : ""}
                      </td>
                      <td>
                        {r.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td>{r.category}</td>
                      <td>{r.unit}</td>
                      <td>{r.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="ops-actions">
          <button
            className="ops-primary"
            disabled={
              busy || !text || !!parsed.errors.length || !parsed.rows.length
            }
            onClick={submit}
          >
            Confirmar importação
          </button>
        </div>
      </fieldset>
      <p role="status">{busy ? "Importando…" : message}</p>
    </section>
  );
}
