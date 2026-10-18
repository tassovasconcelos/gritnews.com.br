# CIP PRO 360° — Shopping Prohospital + Distribuidora Prohospital

## Estado de implantação
Versão **fundação visual navegável** (prévia, sem dados corporativos). A aplicação está isolada em `apps/cip-pro-360` numa branch de desenvolvimento. **Não existe autenticação real, banco, conta de superadmin ou integração ERP nesta versão**: o login é demonstrativo e nunca valida credenciais. Não colocar dados confidenciais no frontend.

## Publicação pretendida
`cip.gritnews.com.br` — requer criação/vinculação do subdomínio em Hostinger, SSL ativo e upload dos arquivos em pasta exclusiva do CIP. Não substituir `gritnews.com.br` nem `public_html` da raiz do portal.

## Duas empresas e primeiros módulos
- **Shopping Prohospital (varejo)**: estoque, cobertura, capital de giro, marca-passo de preços.
- **Distribuidora Prohospital (B2B)**: cotações, conversão, perdas, Caderninho Inteligente, demanda não atendida.
- **Grupo**: Doquita, cronograma, acessos e integrações.

## Identidade
Cores de interface inspiradas na família vinho/vermelho da operação; substitua o símbolo provisório `P+` pela arte oficial fornecida pelo Grupo, sem recriá-la. Rodapé de desenvolvimento: GRIT Soluções e Negócios.

## Requisitos obrigatórios antes de abrir o login
1. Escolher/provisionar backend próprio e provedor Auth corporativo; convidar `gritsolucoes@gmail.com` com perfil `superadm` via fluxo seguro de ativação.
2. Nenhuma senha existente deve ser reutilizada por cópia; reutilização só via autenticação federada ou senha definida pelo titular.
3. Tabelas separadas por `empresa_id`; RLS/back-end para impedir acesso cruzado. Log de auditoria, rate limiting, anti-CSRF, gestão de sessão.
4. Conector Procfit/BI homologado de leitura; inventário e preços por empresa/filial; histórico, reconciliação de valores de Rufino. Não escrever diretamente no ERP.
5. Módulos de proposta e Caderninho com banco, CRUD autenticado e controle de perfis.
6. Teste de aceitação de permissão, financeiro, responsividade, segurança e disponibilidade.

## Cronograma-alvo
- 18–24/10/2026: Fundação visual, login a integrar, módulos, cronograma.
- 25/10–07/11: Dados Procfit/BI.
- 08–21/11: Estoque + Marca-passo.
- 22/11–05/12: Conversão B2B e Caderninho.
- 06–19/12: Doquita.
- 20/12/2026–16/01/2027: piloto, validações.

## Simulação informada por Rufino
Estoque: R$ 6 milhões, vendas médias: R$ 3 milhões/mês, CMV: 47%. Cobertura aproximada de 128 dias. Para 90 dias, estoque alvo teórico R$ 4,23 milhões e potencial de liberação R$ 1,77 milhão. São **hipóteses não conciliadas**, nunca saldo real de uma empresa.

## Deploy Hostinger
É um app HTML estático na fase atual: publicar `index.html` em diretório dedicado ao subdomínio CIP. Em SPA, utilizar o `.htaccess` deste diretório; para esta versão de uma página, não há dependências de build. Não publicar arquivos de desenvolvimento com credenciais.

## Validação visual manual
Abra `index.html`: deve exibir login; ao clicar em "Conhecer cronograma e a interface" abre navegação da prévia; clique em Shopping, Distribuidora, Estoque, Marca-passo, Cotações e Cronograma; ajuste a cobertura no simulador; clique "Sair da prévia". Nenhum dado corporativo é persistido na prévia.
