# CIP PRO 360° — estado consolidado em 19/10/2026

Centro de Inteligência Prohospital, com Shopping Prohospital e Distribuidora Prohospital. Domínio: https://cip.gritnews.com.br.

## Fonte e publicação

- Repositório: tassovasconcelos/gritnews.com.br. Main dedicada ao CIP: `cip/main`. A `main` do portal não é alterada.
- Consolidação: segurança e preparação do bundle `9af35cc` / `2c69b5d`, somadas à ingestão automática da release `6fbc7ca` e à administração desta entrega. Históricos de implementação permanecem no Git.
- Workflow `.github/workflows/cip-pro360.yml`: valida somente o escopo CIP; publicação isolada via FTPS, manifesto e SHA-256 por arquivo, sem limpeza de diretórios.
- Publicação por commit com `[cip:publish]` em `cip/main`, ou workflow manual com publish=true. PRs para `cip/main` só validam.
- Cadência proposta pela auditoria: uma release semanal. Esta consolidação corrige a divergência entre versões e implementa o primeiro bloco de acessos; registrar releases adicionais e seu motivo.

## Implementado

| Área | Estado verificável |
|---|---|
| Identidade | Logo oficial original, vermelho/amarelo/branco do Grupo Prohospital; hash preservado |
| Shopping | Estoque e capital em simulação; Marca-passo com registros manuais |
| Comercial | Caderninho manual com foco principal no Varejo e fila separada para demandas da Distribuidora; Cotações B2B e Radar Íris com evidências PNCP |
| Doquita | Análise explicável de registros manuais, orientações aprovadas e busca nos textos da escola |
| Escola | Materiais, habilidades, avaliação, versões, revisão e vencimentos |
| Ingestão | PDF textual, DOCX, XLSX, TXT/MD e HTML público; fila a cada 2 minutos; conferência diária dos links; alteração invalida fonte e habilidades dependentes |
| Administração | Convites por link, papéis, alteração e suspensão somente no CIP, revogação e histórico |
| Segurança | RLS, SDK Supabase local fixado por hash, CSP ampliada, HSTS, Permissions-Policy; Vercel removido da origem |

Banco atual: Supabase GRIT compartilhado, ref `pcrwtoddavpvkaxwtstc`. O isolamento por tabelas/RLS não equivale a um projeto dedicado. Auth GRIT permanece intacto.

## Administração

Em Integrações & acessos, somente superadm prepara convites e altera acessos. Papéis disponíveis: diretor e supervisor (consulta), gerente (operação e revisão), analista (consulta), vendedor (operação), leitura. Convite nunca cria superadm e não permite rebaixar ou suspender contas superadm protegidas.

- Convites são links confidenciais, exibidos uma única vez, com validade máxima de uma hora e uso único. Não há disparo automático de e-mail nesta entrega.
- Contas GRIT existentes usam a senha atual. Somente uma identidade nova pode receber o fluxo de definição de senha por convite.
- A ativação confirma o e-mail da identidade com o e-mail convidado; token inválido, vencido, revogado ou reutilizado é rejeitado.
- Suspender o perfil CIP não bloqueia a conta Auth nem outros aplicativos do Grupo/GRIT.
- **Escopo atual é por empresa.** Não declarar acesso restrito à filial: cadastros e RLS por loja ainda dependem da integração e dos códigos oficiais.

## Testes

```bash
npm ci --prefix apps/cip-pro-360/ingestion --ignore-scripts --no-audit --no-fund
node --test apps/cip-pro-360/*.test.mjs apps/cip-pro-360/deploy/upload.test.mjs apps/cip-pro-360/ingestion/extract.test.mjs
```

Testes transacionais de banco com rollback: papéis e empresas, suspensão com sessão ainda válida, bloqueio de escalada, superadm protegido, ativação atômica por convite, token incorreto e replay. Testes de interface com adaptador controlado não equivalem à homologação real de usuários no domínio.

## Segurança e limitações conhecidas

- `script-src` ainda contém unsafe-inline devido aos handlers legados do index.html. Retirar após migração dos eventos, sem quebrar o app.
- Nenhuma chave privilegiada aparece no cliente. Edge Functions validam identidade e permissões no servidor.
- PDFs com páginas sem texto requerem OCR. Limites de leitura: arquivo 10 MB, PDF 200 páginas, texto 1 milhão de caracteres. Sem truncamento silencioso nem liberação automática de fonte incompleta.
- O Doquita não executa ações autônomas no ERP. Aprovar habilidade ou material não concede permissões de negócio.

## Pendências que bloqueiam o piloto

1. Confirmar organização/custo e implantar o banco dedicado: ISOLATION-RUNBOOK.md.
2. Homologar usuário novo e existente, gerente, supervisor e diretor no navegador e no celular.
3. Definir quatro lojas piloto e quatro de controle e implementar escopo efetivo por filial.
4. TI validar as views, acessos e campos Procfit: PROCFIT-CONTRACT.md. Exportador preparado, sem execução no ERP.
5. Reconciliar linha de base com Financeiro e definir alçadas de preço. Somente então liberar o piloto de 90 dias.

## Política dos números

R$ 6 mi de estoque, R$ 3 mi/mês de vendas, CMV 47%, cobertura estimada de 128 dias, alvo de 90 dias e capital potencial de R$ 1,77 mi são informações de simulação, não valores conciliados nem economia realizada.


### Competências, processos e Doquita no Telegram

O Quartel e a Escola apresentam planos avançados dos 14 agentes. O módulo **Processos vivos** permite desenhar, conectar, simular, auditar e versionar mapas por empresa. O primeiro modelo do **Doquita no Telegram** oferece consultas limitadas em chat privado de superadm e diretores ativos; cada diretor vincula sua própria conta após aceitar o convite; somente o superadm configura token/webhook. Veja `PROCESSES-AND-TELEGRAM.md` para operação, limites e homologação.

### Procfit & relatórios

Superadm pode importar JSON/CSV, conferir rascunho, conciliar totais independentes e liberar uma referência para relatórios no app/Telegram. `/vendas`, `/estoque`, `/parados`, `/semvendas` e `/giro` usam cálculo determinístico e origem explícita; sem base aprovada os valores ficam indisponíveis. Não há conexão direta ao ERP nesta entrega. Consulte `ERP-REPORTS.md`.

## Diretoria e Marca-passo avançado

Diretores consultam bases aprovadas nas empresas autorizadas pelo CIP e pelo Telegram. Marca-passo traz fila por SKU/loja e simulador de contribuição, piso, alçada e referência com origem. Veja `PLATFORM-EVOLUTION.md` para entrega, limites e prioridades. As análises aguardam a carga real; nenhuma alteração automática de preço.

### Rotas e módulos

`route-manifest.mjs` é a fonte única de rotas, requisitos de papel/empresa e módulos de página. A auditoria PR1, incluindo a contagem estática de chamadas iniciais por rota e seus limites de medição, está em `ROUTE-AUDIT.md`. A Central de ações, posição Shopping e referências históricas são montadas em Estoque Inteligente; Marca-passo concentra preço e campanhas; Varejo/B2B são resumos; Doquita não remonta telas de estoque. Linhas históricas reutilizam cache de sessão somente após conferir empresa, escopo e hash atual da origem.

### Prorrogar convites

Em Integrações & acessos, o superadm pode prorrogar convites prontos por mais uma hora. Válidos: uma hora adicional sobre o vencimento atual. Vencidos: uma hora a partir da operação no servidor. Aceitos ou revogados não podem ser prorrogados. O link CIP é preservado e a alteração de prazo é registrada atomicamente no histórico. A prorrogação não renova o token independente de autenticação inicial do provedor; se ele também expirou, usar Preparar novo link. Nenhum convite real foi prorrogado automaticamente nesta implantação.

## Radar B2G nacional por produto

Pesquisa oficial por família PDM/CATMAT, Brasil/UF, período e filtros de marca/fornecedor nas páginas carregadas. Referências distinguem vencedor conferido no PNCP, porte e datas de origem; histórico mensal separa produto, embalagem e marca. Leia `B2G-PRODUCT-INTELLIGENCE.md` para uso, cobertura e limitações.

### Estoque no Telegram

Doquita consulta as referências privadas de CD100 e lojas por /bases, /cd, /lojas, /produto, /unidades, /conferencia e /prioridades. Não confunde estas planilhas com inventário completo ou financeiro aprovado. /rotina permite briefing diário opcional da Shopping; ninguém foi inscrito automaticamente. Operação e limites: `TELEGRAM-STOCK-REPORTS.md`.
