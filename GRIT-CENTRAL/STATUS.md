# Status consolidado

| Sistema | Publicado | Código localizado | Leads/automação | Próxima ação |
|---|---:|---:|---:|---|
| GRIT News | sim | sim | ativo | acompanhar publicação do Centro de Controle V2 |
| Meu Cuidador | domínio público ativo, origem do frontend não localizada neste monorepo | não | backend/CRM ativo no Supabase; 907 leads e 727 ILPIs vinculadas | localizar/versionar frontend, homologar rotas, corrigir indexação e fechar E2E cadastro→perfil→conversão |
| Meu Espetinho | sim | sim | estruturado | concluir credenciais Google/Meta |
| Sr. Padeiro | sim | sim, integrado ao monorepo | coletor protegido e ativo | validar jornada completa periodicamente |
| SAC ProH | sim | repositório separado | operação própria | manter integração consentida |
| Moacir Rocha | sim | repositório separado | funil separado | preservar segregação jurídica |
| GRIT Propostas | landing | especificação | captura de interesse | evoluir para MVP |
| Meu Orçamento | landing no portal | scaffold e schema | integrado ao funil | homologar DNS e deploy do subdomínio |
| Oportunidades Procirúrgica | domínio pendente | repositório separado | planejado | confirmar URL pública |

## Meu Cuidador — estado operacional

- domínio canônico público: `https://meucuidadorapp.com.br`;
- `https://meucuidador.gritnews.com.br` tratado como legado/operacional e não deve ser divulgado publicamente;
- frontend/deploy ainda não localizado no repositório principal;
- backend Supabase e CRM estão ativos;
- ponte cadastro → `mc_profiles` implantada no banco;
- importador ILPI protegido e deduplicação ativa;
- Centro-Oeste reconciliado;
- cargas Nordeste/Sudeste ainda dependem da recuperação das fontes íntegras;
- indexação pública do domínio precisa de nova homologação após localização do frontend.

## Segurança

- inserção direta pública em `leads` bloqueada;
- captura somente pelo backend validado;
- proteção contra senhas vazadas ativa;
- segredos mantidos fora do Git;
- importador temporário do Meu Cuidador não possui mais segredo fixo no código e exige autenticação;
- alterações de RLS e funções privilegiadas devem continuar sob auditoria antes da abertura de novos endpoints.

## Monitoramento atual

GRIT News, Meu Espetinho, Sr. Padeiro, SAC ProH e Moacir Rocha integram o health check local.

O Meu Cuidador deve entrar no health check assim que o deploy que serve `meucuidadorapp.com.br` for identificado e versionado.

## Produção conferida

Os indicadores do Meu Cuidador devem sempre refletir dados reais do Supabase, sem contabilizar como implantadas bases que ainda não entraram no CRM.
