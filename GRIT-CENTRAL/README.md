# GRIT Central

Ponto único local para acessar aplicações, painéis, documentação, identidade visual e operação do ecossistema GRIT.

## Acesso rápido

- [Todos os apps e links](./APPS-E-LINKS.md)
- [Status e responsabilidades](./STATUS.md)
- [Operação diária](../docs/ecosystem-audit/MANUAL-OPERACIONAL.md)
- [Manual dos apps](../docs/ecosystem-audit/MANUAL-APPS.md)
- [Segurança](../docs/ecosystem-audit/SEGURANCA.md)
- [Integrações e credenciais](../docs/ecosystem-audit/INTEGRACOES-E-CREDENCIAIS.md)
- [Comparativo local x publicado](../docs/ecosystem-audit/COMPARATIVO-LOCAL-PUBLICADO.md)
- [Logos e identidade](../docs/ecosystem-audit/CATALOGO-DE-MARCA.md)
- [Atalhos do Windows](./atalhos/)

## Estrutura local

| Área | Caminho |
|---|---|
| Portal GRIT produtivo | `src/`, `public/`, `index.html` |
| Meu Espetinho | `apps/meu-espetinho/` |
| GRIT News duplicado em revisão | `apps/gritnews/` |
| GRIT Propostas | `apps/grit-propostas/` |
| Sr. Padeiro | fonte ainda não versionada; issue #92 |
| Operação remota | `ops/remote/` |
| Growth e roteamento | `ops/growth/` |
| Dossiê e manuais | `docs/ecosystem-audit/` |

## Preparar o ambiente

```powershell
powershell -ExecutionPolicy Bypass -File ops/remote/setup-environment.ps1
```

## Verificar produção

```powershell
powershell -ExecutionPolicy Bypass -File ops/remote/check-health.ps1
```

Credenciais não ficam nesta pasta. Use o Supabase Vault e os secrets dos provedores.
