import { useEffect, useRef, useState } from "react";
import {
  printReceipt,
  receiptLines,
  safeLogo,
  type ReceiptData,
  type ReceiptPreferences,
} from "./receipt";
export function ReceiptOutput({
  data,
  preferences,
  onClose,
  onFiscal,
  ready = true,
  error = "",
}: {
  data: ReceiptData;
  preferences: ReceiptPreferences;
  onClose: () => void;
  onFiscal?: () => void;
  ready?: boolean;
  error?: string;
}) {
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector("button")?.focus();
    return () => previous?.focus();
  }, []);
  const lines = receiptLines(data, preferences);
  async function image(share: boolean) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      const c = canvas.getContext("2d");
      if (!c) throw new Error("Imagem indisponível.");
      c.font = "22px monospace";
      const wrapped: string[] = [];
      for (const text of lines) {
        let line = "";
        for (const char of text) {
          if (c.measureText(line + char).width > 620) {
            wrapped.push(line);
            line = char;
          } else line += char;
        }
        wrapped.push(line);
      }
      let logo: HTMLImageElement | null = null;
      if (preferences.showLogo && safeLogo(preferences.logoUrl)) {
        logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = safeLogo(preferences.logoUrl);
        await Promise.race([
          logo.decode(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Falha ao carregar a logo.")),
              5000,
            ),
          ),
        ]);
      }
      const offset = logo ? 180 : 40;
      canvas.height = offset + wrapped.length * 34 + 40;
      c.fillStyle = "#fff";
      c.fillRect(0, 0, 720, canvas.height);
      c.fillStyle = "#111";
      c.font = "22px monospace";
      if (logo) {
        const scale = Math.min(220 / logo.width, 130 / logo.height);
        c.drawImage(
          logo,
          (720 - logo.width * scale) / 2,
          20,
          logo.width * scale,
          logo.height * scale,
        );
      }
      wrapped.forEach((line, i) => c.fillText(line, 40, offset + i * 34));
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Não foi possível gerar a imagem.");
      const file = new File([blob], `recibo-${data.id || "venda"}.png`, {
        type: "image/png",
      });
      if (share && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "Recibo não fiscal" });
        return;
      }
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível gerar o recibo.",
      );
    }
  }
  return (
    <div
      className="ops-receipt-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Recibo não fiscal"
    >
      <section
        ref={dialog}
        className="ops-panel"
        style={{ maxHeight: "90vh", overflow: "auto", maxWidth: 600 }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            );
            if (!buttons?.length) return;
            const first = buttons[0],
              last = buttons[buttons.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <button aria-label="Fechar recibo" onClick={onClose}>
          Fechar
        </button>
        <div className="ops-preview">
          {preferences.showLogo && safeLogo(preferences.logoUrl) && (
            <img src={safeLogo(preferences.logoUrl)} alt="Logo da empresa" />
          )}
          {lines.join("\n")}
        </div>
        <div className="ops-actions">
          <button
            className="ops-primary"
            disabled={!ready}
            onClick={() =>
              printReceipt(data, preferences).catch((e) =>
                setMessage(e.message),
              )
            }
          >
            Imprimir recibo não fiscal
          </button>
          {onFiscal && (
            <button onClick={onFiscal}>NFC-e / situação fiscal</button>
          )}
          <button disabled={!ready} onClick={() => image(true)}>
            Compartilhar imagem
          </button>
          <button disabled={!ready} onClick={() => image(false)}>
            Salvar imagem
          </button>
        </div>
        <p role="status">
          {error || (!ready ? "Carregando configurações do recibo…" : message)}
        </p>
      </section>
    </div>
  );
}
