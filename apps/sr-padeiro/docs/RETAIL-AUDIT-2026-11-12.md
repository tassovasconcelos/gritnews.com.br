# Auditoria e módulos de operação — 12/11/2026

## Diagnóstico comprovado

O usuário informou que Atendimento fica parado na conta de administrador. No site publicado, o acesso `?organization=...` abriu em **Suporte · consulta**, com o botão Atendimento e venda desabilitado. Pela ação Entrar na operação completa, a sessão auditada abriu e o atendimento carregou catálogo e pedidos. O travamento não foi observado nessa sessão operacional; o bloqueio de consulta foi reproduzido. Não foi usado login da equipe nem alterada a permissão do administrador para contornar a proteção.

Também foi reproduzida uma falha de renderização no código real: um rascunho persistido contendo quantidade inválida provocava `RangeError: The number NaN cannot be converted to a BigInt`. O teste `scripts/test-retail.mjs` falhou antes da correção e passou depois. Isso é uma vulnerabilidade de estabilidade comprovada, mas não prova que era a causa do incidente no aparelho do usuário.

Verificações de sessão, suporte, leitura da operação e pedidos não tinham prazo de resposta. Uma requisição sem resposta podia manter o carregamento. Foram adicionados prazos de erro recuperável, sem tratar timeout como confirmação de falha de gravação. A confirmação de pedido continua persistida e precisa ser reconciliada antes de repetir.

## Implementação

- **Frente de caixa:** balcão simplificado, somente pronta entrega, busca por nome/código, cliente opcional, quantidades e recebimento integral. Usa o mesmo checkout transacional e idempotente dos pedidos; exige caixa aberto e saldo real.
- **Atendimento e pedidos:** mantém retirada, encomenda, fila, retomada, rascunho por usuário/empresa/loja, versão concorrente e confirmação recuperável.
- **Vendas e cupons:** histórico por loja/período/cliente/número, páginas de 50 registros e reabertura do cupom da venda já registrada.
- **Clientes e histórico:** nome, telefone opcional com DDD, autorização explícita para relacionamento, compras vinculadas e últimas 50 observações. Não inclui campanhas automáticas nem cobrança de fiado.
- **Caixa:** abertura com identificação idempotente, fechamento conferido no servidor, valores por meio de pagamento e dinheiro esperado separado de PIX/cartão. Um índice impede dois caixas abertos na mesma loja. Escrita direta em caixa/clientes é retirada; o novo RPC valida empresa, loja, perfil e sessão.
- **WhatsApp:** destinatário conferível e texto do cupom codificado. Abre `wa.me` para revisão e envio manual; não transmite automaticamente, não confirma entrega e não é integração com WhatsApp Business API. O telefone sugerido vem do cliente da venda confirmada, nunca do último cliente usado na tela.
- **Administrador:** as áreas de venda podem ser selecionadas na consulta e explicam como entrar no suporte auditado. Nenhuma URL concede permissão. A navegação mantém a seção no endereço, permitindo recarregar na mesma área.
- **Celular:** atalhos de módulos, busca de produtos acessível, carrinho e ações de toque. O app instalado continua online para confirmar vendas. Não foi implementada venda offline.

## Dados, segurança e compatibilidade

Novo SQL: `supabase/retail-modules.sql`. Acrescenta cliente ao pedido, preserva nomes/preços dos itens do pedido e vincula a venda ao cliente na mesma transação. A implementação atual de `private.srp_counter` foi comparada ao banco hospedado e era idêntica à base antes de preparar a extensão. Nada reclassifica vendas antigas como pertencentes a um cliente.

O RPC `srp_retail` usa wrapper invoker e implementação privada com `search_path` vazio, guard de conta/senha, acesso e perfil. Contatos ficam em tabela privada com RLS e sem grants diretos. Consulta não pode cadastrar; estoque não acessa CRM nem caixa. Não há execução anônima. O catálogo, saldo e cobranças reais não são ativados por esta alteração.

A atualização de banco e frontend deve ser coordenada: a versão antiga do caixa usava escrita direta e não poderá abrir/fechar após a retirada dos grants. Clientes instalados precisam atualizar o aplicativo. Em reversão, preservar dados e usar uma interface compatível com o RPC novo; não reabrir escrita direta apenas para contornar erros.

O relatório histórico de cliente resume todas as lojas, mas sua lista de compras segue a loja selecionada e o período informado. Há páginas de 50 vendas/clientes e limite de 50 observações recentes. Nomes de produtos de vendas anteriores ao atendimento por pedidos usam o cadastro atual quando não existe snapshot; preços/quantidades continuam os registrados na venda. O cupom continua não fiscal e preserva a informação fiscal existente.

## Evidências

- 43 testes compartilhados de operações aprovados, incluindo três novos testes de banco para CRM/caixa/checkout; 35 testes de administração/gestão/estabilidade aprovados. Os novos casos executam o SQL real em PostgreSQL local/PGlite.
- Casos: outra empresa/loja/cliente recusados; perfil de estoque e consulta sem escrita; senha obrigatória; normalização e telefone duplicado; repetição de cadastro/contato/recebimento; PIX excluído da gaveta; fechamento repetido preservado; abertura duplicada e escrita direta recusadas; cupom recuperado com cliente e itens.
- TypeScript, Vite e smoke de artefatos aprovados. Aviso de pacote maior que 500 kB permanece; não representa teste de carga.
- Navegador com os componentes reais e API conectada ao PGlite local: cliente fictício cadastrado, venda de R$ 0,80, estoque 10 → 9, compra no histórico do cliente, contato salvo, cupom não fiscal e caixa fechado com fundo de R$ 20,00 e diferença zero. Nenhuma venda ou cadastro de cliente real foi criado nessa validação.
- Layout de 390 × 844: conteúdo medido em 375 px, sem transbordamento horizontal. Equipamento físico, teclado de balança/leitor, impressão física e envio pelo WhatsApp no aparelho da equipe continuam pendentes.
- Supabase hospedado: políticas de clientes/caixa/vendas inspecionadas; nenhum caixa aberto duplicado encontrado. Advisors antes da alteração indicavam apenas avisos informativos das duas tabelas privadas de pedidos/metas do Sr. Padeiro sem políticas diretas, compatíveis com o acesso por funções privadas. Isso não certifica o restante do banco compartilhado.

Capturas locais: `audit/retail-cupom-local-2026-11-12.png` e `audit/retail-mobile-local-2026-11-12.png` no diretório de trabalho. São evidência local, não prova de publicação.

## Treinamento curto

1. Entre na empresa e confira a loja e o aviso do ambiente. Administrador em consulta deve entrar pelo suporte auditado para operar.
2. Abra o turno com o fundo contado. Na Frente de caixa, busque ou leia o código, toque nos produtos e confira as quantidades.
3. Vincule o cliente se desejar histórico; cadastre-o em Clientes sem inventar telefone ou autorização de mensagens.
4. Confira o pagamento recebido antes de concluir. Se houver espera ou erro, consulte a confirmação e a fila; não comece outra venda para substituir uma confirmação incerta.
5. No cupom, confira o número do cliente, abra o WhatsApp, revise e envie. Vendas permite reabrir um cupom sem lançar outra venda.
6. No fim do turno, conte somente o dinheiro da gaveta e confira a diferença. PIX e cartões têm totais separados.

## Situação de entrega

Código e testes locais preparados. A publicação e a aplicação do SQL hospedado serão registradas somente depois da comprovação. Permanece necessária a validação pela equipe no aparelho e impressora usados no balcão.
