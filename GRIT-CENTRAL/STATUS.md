# Status consolidado

| Sistema | Publicado | Código localizado | Leads/automação | Próxima ação |
|---|---:|---:|---:|---|
| GRIT News | sim | sim | ativo | acompanhar publicação do Centro de Controle V2 |
| Meu Espetinho | sim | sim | estruturado | concluir credenciais Google/Meta |
| Sr. Padeiro | sim | sim, integrado ao monorepo | coletor protegido e ativo | validar jornada completa periodicamente |
| SAC ProH | sim | repositório separado | operação própria | manter integração consentida |
| Moacir Rocha | sim | repositório separado | funil separado | preservar segregação jurídica |
| GRIT Propostas | landing | especificação | captura de interesse | evoluir para MVP |
| Meu Orçamento | landing no portal | scaffold e schema | integrado ao funil | homologar DNS e deploy do subdomínio |
| Oportunidades Procirúrgica | domínio pendente | repositório separado | planejado | confirmar URL pública |

## Segurança

- inserção direta pública em `leads` bloqueada;
- captura somente pelo backend validado;
- proteção contra senhas vazadas ativa;
- zero vulnerabilidades conhecidas nas dependências de produção;
- segredos mantidos fora do Git.

## Monitoramento atual

GRIT News, Meu Espetinho, Sr. Padeiro, SAC ProH e Moacir Rocha integram o health check local.

## Produção conferida em 24/08/2026

- 40 leads: 34 Meu Espetinho e 6 Sr. Padeiro;
- 6 campanhas em planejamento: 3 Meta, 2 Google Search e 1 outro canal;
- Meta Ads e Google Ads cadastrados, porém ainda desconectados;
- inteligência, cadências e segmentação de leads aplicadas no Supabase.
