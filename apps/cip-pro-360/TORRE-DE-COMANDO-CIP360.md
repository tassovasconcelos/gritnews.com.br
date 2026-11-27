# CIP360 — Torre de Comando Prohospital | Escopo operacional da versão 1

## Objetivo e referência visual
O ambiente foi desenhado tomando como referência a imagem de Torre de Comando fornecida pelo usuário. A identidade oficial é aplicada por **arquivo de marca original** em `logo-grupo-prohospital.jpg` (SHA Git `4832b8d26b6c6567793b81a23dbfb82ff9f9071e`, idêntico ao arquivo da conversa). A sala gráfica `command-room.svg` representa pessoas/agentes trabalhando, sem se fazer passar por operação autônoma. O portal usa o nome **CIP360**.

**Empresas exibidas:** exclusivamente Shopping Prohospital e Distribuidora Prohospital. Não incluir Procirúrgica, Icleanpro ou outras empresas nesta versão.

## Funcionalidades entregues no código
1. Nova solução `torre` no catálogo e rota protegida pela sessão Supabase, com entrada pelo portal.
2. Sala visual responsiva com 12 agentes clicáveis e painel lateral para responsabilidades, origem de dados, atividades e acesso ao módulo real.
3. Seletor de empresa com fontes e tarefas limitadas ao perfil autorizado.
4. Dados consultados com RLS em tabelas existentes: `cip_stock_actions`, `cip_market_offers`, `cip_faro_signals`, `cip_market_directory`, `cip_mp_price_plans`, `cip_mp_campaign_proposals`, `cip_demands`, `cip_quotes`, `cip_agent_missions`. Falhas/ausência retornam **—**, não números fictícios.
5. Alertas de origem existentes: planos/análises de estoque e ofertas candidatas (nunca preços homologados sem validação).
6. Nova tabela `cip_tower_tasks`: abrir ações por agente, responsável, prioridade, status, evidência e histórico; gravação auditada e bloqueada por RLS empresa/perfil.
7. Alteração de andamento das tarefas; a conclusão exige evidência humana de pelo menos dez caracteres. O sistema não altera estoque/preço/ERP por isso.
8. Exportação CSV por agente e empresa, com proteção contra fórmulas no Excel e sem misturar dados da outra empresa.
9. Dados operacionais sem fonte real não são apresentados como margem, lucro, vendas ou bonificação.
10. Assets incluídos no manifest de release e no cache opcional da PWA, sem aumentar a carga crítica do login.

## Funções dos 12 agentes
| Agente | Função principal | Módulo relacionado |
|---|---|---|
| Doquita 360 | Priorização, explicação e coordenação de tarefas | Doquita |
| Marca-passo | Custos, margens e propostas de preço com aprovação | Marca-passo |
| Radar Digital | Concorrência e ofertas candidatas por SKU/fonte | Radar B2B2C |
| Radar Físico | Mapa territorial de concorrentes e fontes | Concorrentes |
| Estoque Inteligente | Giro, cobertura, ruptura e capital | Estoque |
| Compras | Reposição e fornecedores | Estoque |
| Transferências | Redistribuição de excesso/ruptura entre lojas | Estoque |
| Produtos | SKU/EAN, cadastro e similaridade | Estoque/Catálogo |
| Campanhas | Promoções e cenários de contribuição | Marca-passo |
| Caderninho | Procura não atendida e recuperação de vendas | Caderninho |
| Vendas & CRM | Cotações e relacionamento B2B | Cotações |
| Gamificação | Missões, ranking e qualidade da execução | Quartel |

## Dados de mercado e preços
Comparação de concorrentes, localização e preço dinâmico só pode ser classificada como **homologada** se houver fonte rastreável, timestamp, identificação e compatibilidade comercial do produto, unidade de medida, frete, condição promocional e disponibilidade. A versão inicial da Torre mostra ofertas **candidatas** e encaminha ao motor Marca-passo existente, sem publicar alteração de preço.

## Requisitos do próximo ciclo
- Vincular a planilha ABC/ERP por SKU, EAN, categoria, giro, estoque e loja com reconciliação.
- Configurar políticas de piso de margem por curva A/B/C e família, com alçadas por empresa/canal.
- Incorporar custo atualizado, tributos, comissão, frete, preço e estoque em fonte comum e testar cálculo item a item.
- Construir rotina de pesquisa territorial por cidade, bairro/raio e canais digitais permitidos; registrar fonte e política de coleta.
- Usar apenas integrações oficiais acessíveis e permitidas com marketplaces; não afirmar automação de consulta sem job monitorado.
- Telemetria de agentes: ciclos reais, status, evidência, execução e desempenho mensurável, distinta de representação visual.
- Relatórios exportáveis com linhas de origem, filtros por período/loja e pareceres antes de reconhecimento de ganhos.
- Homologar perfis reais, mobile, permissões, concorrência de atualização e operação em Hostinger.

## Segurança e publicação
A migração `cip360_torre_de_comando_v1` foi aplicada ao projeto Supabase do CIP. A tabela está isolada por empresa, sem acesso anônimo; escrita depende da função `cip_can_access(company_id,true)`. Registros criados e alterados são auditados por `cip_track_change`. O login principal mantém `gritsolucoes@gmail.com` como superadm no provedor existente — sem repetir senhas.

A publicação de produção depende de teste de PR, homologação de login e autorização de deploy com destino Hostinger isolado e HTTPS válido. **Não usar imagem demonstrativa com números inventados como painel operacional.** Não confundir merge no GitHub com deploy bem-sucedido.

## Critérios de aceite
- [ ] Validar em navegador real o acesso de superadm e dos perfis Shopping/Distribuidora.
- [ ] Navegar por todos os 12 agentes; cada botão abre o módulo permitido ou recusa acesso.
- [ ] Alterar empresa e confirmar que tarefas/contagens não vazam para a outra operação.
- [ ] Criar tarefa e registrar uma atualização com trilha, mas sem executar ERP.
- [ ] Conclusão sem evidência deve ser recusada no servidor.
- [ ] CSV correto e escopado; injeção de fórmula neutralizada.
- [ ] Verificar responsividade com viewport celular/tablet/desktop.
- [ ] Conferir fontes parciais e dados ausentes, sem KPIs fabricados.
- [ ] Executar CI e preparar pacote de publicação versionado.
- [ ] Publicar após testes e verificar URL com HTTP 200/SSL/login, registrando evidência.
