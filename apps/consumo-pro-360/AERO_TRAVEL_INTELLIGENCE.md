# CONSUMO PRO 360 | GRIT — Laboratório IA e AERO Viagens
**Status de engenharia:** implementado em código. Publicação Hostinger, login real e credenciais de pesquisa ainda exigem homologação.

## Módulos disponíveis
- `/gestao/lab`: agentes AERO, RADAR, PRISMA, SENTINELA para estudos de práticas de mercado; métricas, hipóteses e registro por empresa.
- `/gestao/travel`: quatro roteiros, comparação de passagens e ônibus, dias flexíveis, despesas, custo da jornada, teto, risco de fadiga e resultados.
- Rota do exemplo novembro 2026: Fortaleza (FOR) → São Luís (SLZ) avião → Teresina (THE) ônibus → Fortaleza ônibus. Alternativas: 100% avião, 100% ônibus e ordem invertida se a agenda permitir.
- Datas iniciais 10, 12 e 14 de novembro de 2026 são **exemplos editáveis**, jamais recomendação automática de compra.
- Sem tarifas de origem, duração e cotações vinculadas: comparador mostra **sem cotação**, não inventa valores.
- Histórico de tarifas com link da fonte e carimbo de hora; referência fresca durante 48 horas é uma observação, não garantia de bilhete.
- Estudos e cotações gravados em `cp_lab_studies` e `cp_travel_quotes`, com Row Level Security por empresa e perfis corporativos. A cotação fica imutável e pode ser reaproveitada nos cenários.

## AERO: pesquisa real de passagens aéreas
- Função Supabase `cp-travel-flight-search` publicada com `verify_jwt=true`, valida sessão real, e-mail confirmado, empresa, papel e parâmetros.
- Implementação consulta apenas a API Amadeus de **produção**; fontes, datas e preços são identificados com hora, quantidade de segmentos e companhia.
- **Ainda faltam os segredos do fornecedor:** `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` e `AMADEUS_ENV=production`. Configurar em Supabase → Edge Functions → Secrets; nunca no frontend, GitHub, chat, ou variáveis `VITE_`.
- Sem chaves reais ou sem modo produção a função responde `503` com mensagem explícita, e não simula tarifas. A pesquisa exibe até cinco dias próximos à data selecionada.
- Os resultados são voláteis, não confirmam preço final, assento, bagagem, emissão, disponibilidade nem abrangem necessariamente todas as empresas aéreas.
- Ônibus: cotação assistida com fonte HTTPS, ainda **sem API de bilheteria contratada**; não afirmar pesquisa automática de preços de ônibus.

## Evidências e referência
- LATAM Fortaleza–São Luís: https://www.latamairlines.com/br/pt/destinos/voos-de-fortaleza-para-sao-luis
- ClickBus São Luís–Teresina: https://parcerias.clickbus.com.br/onibus/sao-luis-ma/teresina-pi
- Pesquisa de ônibus Teresina–Fortaleza: https://www.clickbus.com.br/
- Boas práticas de viagens corporativas Deloitte 2026: https://www.deloitte.com/us/en/insights/industry/transportation/corporate-business-travel-survey.html
- Pesquisa e reprecificação Amadeus: https://github.com/amadeus4dev/developer-guides/blob/master/docs/resources/flights.md

## Política de viagens recomendada
1. Confirmar clientes, horários e tempo de reunião antes de procurar o menor custo.
2. Comparar **custo porta a porta**, bagagem, taxa de bagagem, alimentação, hotel, transfer, tarifa reembolsável, escala, tempo do colaborador e risco.
3. Usar cotação com fornecedor, classe, origem, destino, data, fuso, bagagem, regras de cancelamento, URL e horário.
4. Bloquear sugestão automática de "melhor dia" quando não existem cotações comparáveis de datas reais.
5. Definir política de aprovação e teto por empresa e centro de custo; estudos jamais aprovam gastos ou emitem bilhetes.
6. Manter auditoria, propriedade corporativa, segregação dos dados, guarda mínima de dados pessoais e revisão humana.
7. Futuro: conector GDS/TMC de bilhetagem, API contratada para ônibus, calendário/CRM para reuniões, comparador de hotéis, alertas de tarifas e despesa real×planejada.

## Governança e testes
- Testes de regressão: `npm run test:travel` (não inventar tarifas, cotações incompletas não ranqueadas, contas, data, fontes vencidas, segurança rodoviária).
- Build: `npm run build`. Publicar no Hostinger via `consumo-pro-hostinger.yml` somente com diretório isolado e segredos aprovados.
- As funções e o SQL são infraestrutura pronta. **O subdomínio Hostinger informado como criado pelo usuário ainda precisa comprovar HTTPS e retornar o aplicativo.**
- A Vercel permanece como contingência. Não apagar/alterar registros do Grupo Prohospital nem migrar o banco.
