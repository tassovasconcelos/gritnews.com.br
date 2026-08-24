# GRIT SaaS Factory — Wave 01

Nomes de trabalho até aprovação de branding: **Meu Representante**, **Meu Serviço**, **Meu Personal** e **Minha Clínica**.

## Núcleo comum obrigatório
Todos os novos produtos devem reaproveitar o GRIT Control Center e compartilhar os mesmos padrões de autenticação, CRM, segurança e operação, sem duplicar o módulo `leads`.

### Core compartilhado
- autenticação e recuperação de acesso;
- organização/tenant e assinatura;
- usuários, perfis e permissões por módulo;
- trilha de auditoria;
- onboarding e trial;
- billing/planos;
- leads e oportunidades na Central GRIT via `product_key`;
- first/last touch, UTM, gclid/fbclid;
- lead scoring, segmentação, cadência e next best action;
- WhatsApp/e-mail via integrações autorizadas;
- painel mobile-first;
- notificações;
- exportação e relatórios;
- LGPD, opt-out, RLS e menor privilégio;
- health check/deploy/versionamento.

## 1. Meu Representante
### ICP
Representantes comerciais autônomos, pequenas representações, vendedores externos e microequipes comerciais.

### Proposta de valor
**Carteira, visitas, pedidos, comissão e oportunidades no celular.** Reduzir planilhas e esquecimento de follow-up, mantendo visão simples da rotina comercial.

### MVP
1. Dashboard do dia: visitas, follow-ups, pedidos, oportunidades e comissão prevista.
2. Clientes/carteira: cadastro, contato, localização, potencial e histórico.
3. Agenda/rota: visitas, tarefas e próxima ação.
4. Oportunidades: pipeline simples e valor potencial.
5. Catálogo/produtos representados: marca, SKU, preço de referência e material.
6. Pedido rápido/orçamento: itens, quantidade, observação e compartilhamento por WhatsApp/PDF.
7. Comissão: percentual/regra, previsto, faturado e recebido.
8. Despesas de campo: combustível, alimentação, hospedagem e outros.
9. Metas: mensal, realizado, gap e projeção.
10. Relatórios simples por cliente, produto e período.

### Perfis
- proprietário/supervisor;
- representante;
- assistente comercial;
- financeiro/consulta.

### Evoluções V2
Geolocalização opcional de visitas, roteirização, importação de tabela de preços, pedido offline, integração ERP, assinatura digital e ranking de carteira.

### Conversão
Material segmentado por `representante_autonomo`, `empresa_representacao`, `vendedor_externo` e `distribuidor_pequeno`.

## 2. Meu Serviço
### ICP
Prestadores de serviços em geral: manutenção, instalação, elétrica, hidráulica, refrigeração, limpeza, assistência técnica, pequenos reparos, beleza e serviços locais.

### Proposta de valor
**Orçamento, agenda, serviço, cobrança e cliente em um só lugar.** Operação simples no celular, sem exigir conhecimento de gestão.

### MVP
1. Dashboard: serviços hoje, orçamento pendente, contas a receber e agenda.
2. Clientes: cadastro, endereço, histórico, preferências e observações.
3. Solicitação/chamado: descrição, fotos, prioridade e endereço.
4. Orçamento rápido: serviço, material, mão de obra, desconto e validade.
5. Ordem de serviço: aceite, execução, fotos antes/depois, checklist e assinatura.
6. Agenda: dia/semana, profissional e status.
7. Catálogo de serviços: preço base, duração e materiais.
8. Financeiro simples: recebido, a receber, despesa e margem estimada.
9. WhatsApp: enviar orçamento, confirmação, lembrete e conclusão.
10. Relatórios: faturamento, ticket médio, conversão de orçamento e recorrência.

### Perfis
- proprietário;
- atendente;
- técnico/prestador;
- financeiro;
- cliente/consulta futura.

### Evoluções V2
Rota, recorrência/manutenção preventiva, contratos mensais, equipe em campo, estoque de peças, link de pagamento e avaliação do cliente.

### Segmentos iniciais
`manutencao`, `eletrica`, `hidraulica`, `refrigeracao`, `limpeza`, `assistencia_tecnica`, `beleza`, `servico_geral`.

## 3. Meu Personal
### ICP
Personal trainer, educador físico, assessoria de corrida e microacademias/estúdios com atendimento personalizado.

### Proposta de valor
**Agenda, alunos, treino e financeiro no celular**, com área simples para o aluno acompanhar sua evolução e rotina.

### MVP
1. Dashboard: alunos ativos, aulas hoje, mensalidades e alertas.
2. Alunos: cadastro, contato, objetivo, observações e status.
3. Agenda: aula, avaliação, treino, recorrência e confirmação.
4. Ficha de treino: exercícios, séries, repetições, carga, tempo e observações.
5. Biblioteca de exercícios: cadastro e mídia própria/licenciada.
6. Evolução: medidas e indicadores definidos pelo profissional; gráficos simples.
7. Financeiro: plano, mensalidade, vencimento, recebido e inadimplência.
8. Área do aluno: agenda, ficha, pagamentos e progresso.
9. Comunicação: lembrete de aula, treino atualizado e cobrança amigável.
10. Relatórios: retenção, frequência, receita e alunos em risco.

### Perfis
- proprietário/gestor;
- treinador/educador;
- administrativo;
- aluno.

### Guardrails de saúde
O produto não deve diagnosticar doenças nem substituir avaliação clínica. Campos de saúde devem ser mínimos, necessários, protegidos e tratados como dados sensíveis. Treinos e orientações profissionais exigem responsabilidade humana do educador físico.

### Evoluções V2
Assessoria de corrida, grupos/turmas, integração com wearables quando autorizada, testes físicos, vídeos próprios, desafios, cobrança recorrente e indicação.

### Segmentos iniciais
`personal_individual`, `assessoria_corrida`, `studio`, `microacademia`, `educador_autonomo`.

## 4. Minha Clínica
### ICP
Clínicas, consultórios, postos/unidades de coleta e pequenos serviços de saúde que precisam organizar evidências operacionais, coletas, equipamentos, documentos, prazos e auditorias.

### Proposta de valor
**Protocolar, rastrear e comprovar a rotina sensível da clínica em um único lugar.** A ferramenta deve facilitar conformidade operacional e preparação para inspeções, sem substituir responsável técnico, assessoria jurídica/regulatória ou os sistemas oficiais dos órgãos públicos.

### MVP regulatório-operacional
1. **Protocolos e coletas**: número único, paciente/atendimento minimizado, tipo de coleta, solicitante, coletador, data/hora, material, lote/kit quando aplicável, condições de coleta, acondicionamento, destino e status.
2. **Rastreabilidade da amostra**: etiquetas/identificador, cadeia de custódia, origem/destino, recebimento, rejeição, motivo, armazenamento e transporte.
3. **Controle de temperatura e condições ambientais**: equipamento/local, faixa esperada, leitura, horário, responsável, desvio e ação corretiva.
4. **Equipamentos e metrologia**: patrimônio, fabricante/modelo/série, criticidade, manutenção, calibração/verificação, certificado, laboratório executor, rastreabilidade metrológica, vencimento e alerta.
5. **Documentos regulatórios**: licença/alvará sanitário, CNES quando aplicável, responsável técnico, certificados, contratos, POPs, registros de treinamento e demais documentos definidos por tipo de serviço e jurisdição.
6. **POP e documentos controlados**: versão, aprovação, vigência, revisão, ciência de usuários e histórico imutável.
7. **Não conformidades e CAPA**: ocorrência, risco, causa, ação imediata, ação corretiva/preventiva, responsável, prazo, evidência e encerramento.
8. **Treinamentos e competências**: colaborador, função, treinamento, validade, evidência e reciclagem.
9. **Resíduos e biossegurança**: registro de rotina/checklists, segregação e evidências; PGRSS e exigências locais devem ser configuráveis, não presumidas pelo sistema.
10. **Auditoria e inspeção**: checklist por requisito, evidências anexas, pendências, plano de ação, prazo e exportação de dossiê.
11. **Alertas críticos**: licença/calibração/treinamento/POP vencendo, temperatura fora de faixa, amostra pendente, CAPA atrasada e documento ausente.
12. **Relatórios**: coletas por período, rejeição de amostras, desvios, CAPAs, equipamentos vencidos, documentos próximos do vencimento e trilha de auditoria.

### Perfis e segregação de função
- proprietário/direção;
- responsável técnico;
- coleta/enfermagem/técnico habilitado;
- qualidade/regulatório;
- recepção com dados mínimos;
- manutenção/metrologia;
- auditor/consulta com acesso temporário e restrito.

### Compliance by design
- dados de saúde tratados como **dados pessoais sensíveis**;
- menor privilégio, RLS por tenant e por função;
- logs de visualização/alteração para dados críticos;
- anexos privados, URLs temporárias e controle de download;
- retenção configurável e trilha de auditoria;
- campos clínicos mínimos: o produto não deve virar prontuário eletrônico por acidente;
- criptografia em trânsito e controles de segredo no backend;
- assinatura/aprovação de registros críticos com identidade e timestamp;
- nenhuma exclusão física de registro regulatório crítico sem política e trilha apropriadas.

### Base regulatória configurável
A matriz de requisitos deve ser **versionada por norma, tipo de estabelecimento, atividade, UF e município**. Não codificar uma regra como universal apenas porque vale para um tipo de clínica. Para serviços que executam atividades relacionadas a exames de análises clínicas, considerar a RDC 786/2023 e suas alterações aplicáveis; para equipamentos e medições, manter documentação de calibração/verificação e rastreabilidade metrológica conforme a exigência aplicável; requisitos locais da Vigilância Sanitária devem ser cadastráveis e versionados.

### Roadmap V2
- QR/barcode para cadeia de custódia;
- assinatura eletrônica;
- integração com laboratório parceiro/LIS via API quando disponível;
- portal seguro para documentos de auditoria;
- inventário de produtos/insumos com lote, validade e alerta de regularização ANVISA quando aplicável;
- matriz de risco por processo;
- checklist offline de inspeção;
- dashboard executivo de compliance.

### Segmentos iniciais
`clinica_ambulatorial`, `consultorio`, `posto_coleta`, `clinica_exames`, `saude_ocupacional`, `clinica_estetica` — cada segmento deve habilitar somente módulos/requisitos pertinentes.

## Arquitetura modular proposta
`GRIT SaaS Core` → Auth/Tenant → RBAC → Billing → CRM → Notifications → Audit → Analytics

Cada app adiciona somente módulos verticais. O CRM de aquisição permanece central e o dado operacional do cliente fica isolado por tenant/app. Para Minha Clínica, dados sensíveis e registros regulatórios exigem camada adicional de segregação, auditoria e retenção.

## Ordem recomendada de construção
1. **Meu Representante** — maior reaproveitamento do CRM/OportunidadesPro e menor complexidade de domínio.
2. **Meu Serviço** — grande mercado e excelente aderência a orçamento/agenda/WhatsApp.
3. **Meu Personal** — forte potencial de recorrência, com cuidado adicional de dados sensíveis.
4. **Minha Clínica** — alto valor e aderência à expertise GRIT em saúde, mas exige validação regulatória por escopo e implementação de segurança/auditoria mais rigorosa antes da homologação.

## Gates de produto
Nenhum app avança para mídia paga sem: login/recuperação funcionando, RLS, perfis, formulário→CRM, trial/onboarding, billing, páginas legais, tracking, suporte, health check e fluxo comercial testado.

Para **Minha Clínica**, acrescentar gates obrigatórios: modelagem de dados sensíveis aprovada, DPIA/relatório de impacto quando aplicável, matriz regulatória validada pelo responsável técnico/consultoria competente, testes de segregação por perfil, backup/restauração testados, auditoria de acessos e política de retenção definida.
