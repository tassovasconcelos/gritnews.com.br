# Minha Clínica — Blueprint Regulatório e de Operação Sensível

> Nome de trabalho. O produto apoia controle, evidência e rastreabilidade; não substitui sistemas oficiais, responsável técnico, avaliação clínica, assessoria jurídica ou validação regulatória aplicável ao estabelecimento.

## Objetivo
Criar um SaaS mobile-first para clínicas, consultórios e unidades de coleta controlarem processos sensíveis, documentos, equipamentos, coletas, evidências e planos de ação com trilha de auditoria.

## Princípios
1. Compliance by design.
2. Configuração por atividade, tipo de estabelecimento e jurisdição.
3. Registro cronológico e auditável.
4. Menor privilégio e segregação de função.
5. Dados clínicos mínimos necessários; não transformar o produto em prontuário eletrônico sem projeto específico.
6. Nenhuma regra regulatória é tratada como universal sem versão, fonte, vigência e escopo.

## Módulos MVP
### 1. Central regulatória
- cadastro de requisito/norma;
- órgão: Vigilância Sanitária, Anvisa, Inmetro ou outro aplicável;
- número/versão/vigência;
- esfera: federal/estadual/municipal;
- tipo de estabelecimento/atividade afetada;
- responsável interno;
- evidência exigida;
- periodicidade e prazo;
- status: conforme, pendente, não aplicável, em adequação;
- histórico de revisões.

### 2. Coletas e cadeia de rastreabilidade
- protocolo único;
- identificador da coleta/amostra;
- atendimento/paciente com minimização de dados;
- tipo de material;
- profissional responsável;
- data/hora e local;
- lote/kit/insumo quando pertinente;
- condição de coleta;
- acondicionamento;
- origem/destino;
- recebimento e aceite/rejeição;
- motivo de rejeição;
- temperatura/condição quando pertinente;
- eventos de custódia com usuário/timestamp;
- anexos/evidências.

### 3. Equipamentos, manutenção e metrologia
- patrimônio;
- fabricante/modelo/série;
- localização;
- criticidade;
- manutenção preventiva/corretiva;
- calibração/verificação;
- certificado e prestador/laboratório;
- grandeza/faixa quando aplicável;
- rastreabilidade metrológica declarada no certificado;
- vencimento e alertas;
- bloqueio operacional configurável quando equipamento crítico estiver vencido.

### 4. Temperatura e ambiente
- equipamento/local monitorado;
- limite mínimo/máximo configurável;
- leitura, usuário e horário;
- captura manual ou integração futura;
- desvio gera ocorrência;
- ação imediata e CAPA;
- relatório de tendência.

### 5. Documentos controlados e POPs
- código e título;
- versão;
- elaborador/aprovador;
- vigência;
- revisão prevista;
- arquivo privado;
- ciência dos usuários;
- versão anterior preservada;
- motivo de revisão.

### 6. Licenças, certificados e cadastro institucional
- licença/alvará sanitário;
- responsável técnico e documentos aplicáveis;
- CNES quando aplicável;
- certificados de equipamentos/serviços;
- contratos críticos;
- vencimento e alertas;
- documento + fonte + órgão emissor.

### 7. Não conformidade e CAPA
- protocolo;
- processo afetado;
- classificação de risco;
- descrição e evidência;
- contenção imediata;
- análise de causa;
- ação corretiva;
- ação preventiva quando aplicável;
- responsável/prazo;
- validação da eficácia;
- encerramento com auditoria.

### 8. Treinamento e competência
- colaborador/função;
- treinamento requerido;
- data e validade;
- instrutor;
- evidência;
- avaliação quando pertinente;
- alerta de reciclagem.

### 9. Biossegurança e resíduos
- checklists de rotina;
- incidentes/acidentes;
- controle documental relacionado ao PGRSS e demais exigências aplicáveis;
- evidência de coleta/destinação quando exigida;
- conteúdo configurável por jurisdição e atividade.

### 10. Auditoria e inspeção
- checklist versionado;
- requisito vinculado;
- evidência;
- achado;
- criticidade;
- plano de ação;
- responsável e prazo;
- exportação de dossiê com trilha.

## Perfis
- direção/proprietário;
- responsável técnico;
- qualidade/regulatório;
- coleta/técnico/enfermagem conforme habilitação;
- recepção com acesso mínimo;
- manutenção/metrologia;
- auditor temporário read-only;
- administrador GRIT sem acesso padrão a conteúdo clínico do tenant.

## Segurança
- RLS por tenant e papel;
- separação entre dados de aquisição (CRM GRIT) e dados operacionais da clínica;
- anexos privados;
- URLs assinadas/temporárias;
- logs de leitura e escrita em registros críticos;
- MFA para perfis privilegiados quando disponível;
- service role apenas backend;
- backups e restauração testados;
- retenção configurável por classe de registro;
- exportação e atendimento de direitos LGPD;
- `break glass` apenas se implementado com justificativa, tempo limitado e auditoria reforçada.

## Base regulatória inicial a validar por escopo
- Serviços que executam exames de análises clínicas: mapear RDC Anvisa 786/2023 e alterações aplicáveis, incluindo fluxos de coleta/distribuição conforme o tipo de serviço.
- Metrologia: manter evidências de calibração/verificação e rastreabilidade metrológica quando exigidas para equipamentos/processos.
- LGPD: dados de saúde são sensíveis e exigem controles reforçados.
- Vigilância Sanitária local: criar matriz configurável por UF/município; não assumir uniformidade nacional para requisitos locais.

## Gate de homologação
Antes de uso produtivo com dados sensíveis:
- matriz regulatória validada por profissional competente/RT;
- modelo de dados e RLS testados por perfil;
- logs e anexos privados validados;
- política de retenção definida;
- backup/restauração testados;
- incident response definido;
- termos/privacidade/DPA revisados;
- homologação com dados fictícios antes de dados reais.
