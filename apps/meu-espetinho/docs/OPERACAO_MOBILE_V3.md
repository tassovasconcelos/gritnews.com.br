# Operação Mobile V3

Objetivo: tornar o celular o terminal principal da operação sem esconder controles críticos.

## Princípios
- Venda deve exigir poucos toques e nenhum conhecimento técnico.
- Estoque deve refletir automaticamente o fechamento real da venda.
- Cadastro de cliente deve gerar histórico útil de relacionamento.
- Proprietário e gerente veem gestão; atendente vê operação.
- Alterações críticas ficam auditadas e isoladas por tenant.

## Entregas desta etapa
- baixa automática de estoque no fechamento da conta;
- histórico de movimentações de estoque por produto/pedido;
- RPC segura para histórico operacional de cada cliente;
- base pronta para exibir visitas, gasto acumulado, última visita, pedidos e saldo fiado na tela Clientes;
- nenhuma dependência de cálculos locais para dados financeiros/estoque críticos.

## Próxima interface
1. Drawer Cliente 360 dentro da operação com histórico e indicadores.
2. Entrada/ajuste de estoque por modal mobile em vez de edição de campo solto.
3. Upload de foto do produto por câmera/galeria.
4. Feedback por toast/bottom sheet no lugar de alert/prompt.
5. Onboarding guiado: identidade > cardápio > equipe > primeira venda.
