# Marca-passo — mesa de preços e programação assistida

Evolução de 27/10/2026. Grupo Prohospital · GRIT Soluções e Negócios. Preserva campanhas, simuladores e os 14 agentes existentes.

## Uso principal

O módulo Marca-passo abre a mesa com quatro áreas: **Comparar preços**, **Programações**, **Concorrência** e **Configurar agentes**. Ferramentas anteriores ficam em **Simuladores, campanhas e conferências avançadas**. Nenhum módulo foi removido.

A comparação apresenta, por SKU e loja: unidade, saldo observado, custo, nosso preço, concorrente equivalente com fonte/data, sugestão, contribuição atual e sugerida e diferença para a referência. A origem não fornece código de tabela de preço; por isso o campo é explicitamente identificado como preço observado, com tabela de origem a confirmar.

As despesas sobre venda e fixas por unidade são premissas do responsável. Sem custo, preço, despesas e política válidos, não há sugestão nem margem presumidas. Contribuição é calculada depois do custo e das despesas informadas; não é markup, lucro final ou resultado realizado. Alterar o preço planejado mostra contribuição, piso e variação imediatamente. O servidor recalcula antes da aprovação.

## Concorrência e equivalência

Cadastro assistido de oferta com empresa, SKU interno, concorrente, nossa unidade, preço total da oferta, frete total, quantidade de unidades equivalentes, canal, condição comercial, data, disponibilidade e link HTTPS. O cálculo é:

`preço equivalente = (preço da oferta completa + frete informado) / quantidade das nossas unidades contidas na oferta`

Exemplo conceitual: uma oferta de duas unidades deve ser dividida por duas, se a unidade interna for UN. Especificação, embalagem, tributação, prazo, pagamento e disponibilidade exigem validação humana; não presumir equivalência pelo nome.

Só entram na comparação automática referências ativas, disponíveis, equivalentes declaradas, do mesmo SKU/unidade e canal, dentro do prazo configurado (um a sete dias). A menor dessas referências é exibida com sua evidência. As últimas 100 evidências do filtro podem ser consultadas; retirar uma referência mantém seu histórico. Somente o autor ou a diretoria pode retirá-la.

Não foi implantado crawler contínuo nem coleta automática de preços de redes sociais. A evidência é registrada pelo time; o motor a utiliza de forma rastreável. Não foi cadastrado preço fictício em produção.

## Estratégias e regra financeira

- **Proteger contribuição:** preserva o preço atual se ele estiver acima do preço necessário para a contribuição alvo.
- **Buscar contribuição alvo:** calcula o preço para o alvo aprovado, consideradas as despesas informadas.
- **Comparar com concorrência válida:** avalia o menor valor entre o preço alvo e a referência, respeitando o piso. Referência abaixo do piso bloqueia essa estratégia e exige rever custo/estratégia.

Piso = `(custo + despesas fixas por unidade) / (1 − despesas% − contribuição mínima%)`, arredondado para cima em centavos. A variação do preço planejado deve respeitar a alçada aprovada; a vigência não pode ultrapassar o prazo da política. O plano de tabela não aplica automaticamente bônus de sell-out: despesas completas devem ser informadas e confirmadas. Campanhas com metas e bônus continuam na ferramenta específica.

A mesa reutiliza as políticas versionadas da diretoria. Seu editor mostra contribuição mínima/alvo, variação e duração máxima e abre a ferramenta financeira existente. Não foram publicados percentuais, despesas ou alçadas fictícios. Políticas e valores precisam ser aprovados pelos responsáveis.

## Quando e onde alterar

Cada rascunho registra obrigatoriamente:

- Empresa, SKU, unidade e loja de origem.
- Sistema de destino: Procfit, PDV, e-commerce ou marketplace, todos em modo assistido.
- Canal e código/nome da tabela exata no destino.
- Responsável pela aplicação.
- Novo preço, despesas, referência/estratégia e objetivo.
- Início e fim de vigência, interpretados em **America/Sao_Paulo** no servidor.

O código da tabela é informado e conferido pelo aprovador; não existe mapeamento automático confirmado entre esse código e uma tabela gravável do ERP. Um canal online não possui tabela conectada só porque foi selecionado no formulário.

Fluxo: **rascunho → programação aprovada → fila de aplicação assistida → aplicação informada pelo responsável → vigência encerrada/revisão**. Mudanças de premissa podem levar a bloqueio; cancelamento mantém histórico. Datas, tabela, canal e loja ficam visíveis em cada cartão.

A aprovação exige diretoria/superadm e confirmação de destino/tabela, despesas e disponibilidade/reservas/lote/validade. Exige carga financeira aprovada, completa e com até 36 horas, custo/preço/saldo/unidade válidos, regra vigente e referência válida quando aplicável. A conferência usa a posição do SKU/loja, sem presumir que o preço observado já identifica a tabela de destino.

Programações do mesmo SKU, empresa, loja, canal, sistema e tabela não podem se sobrepor. Códigos de tabela são comparados sem diferença de maiúsculas/minúsculas. Horários usam intervalos com início incluído e fim excluído. Estado e versão são conferidos sob bloqueio; alterações concorrentes exigem atualização.

**A programação não grava no Procfit nem publica no PDV/e-commerce/marketplace.** O conector existente é de leitura. O responsável aplica no destino e registra o preço observado e protocolo/comprovante. Esse registro é declaração humana, não conciliação automática de ERP. Ao fim, o CIP encerra a vigência e pede revisão; não reverte preço automaticamente. Reversão deve ter nova validação e plano específico.

CSV é plano assistido com identificação, escopo, preço, responsável e horários em Brasília; não é arquivo contratado de importação do ERP nem comprovante de execução. Valores textuais têm escape para evitar fórmulas na planilha.

## Rotina real dos agentes

Prisma reavalia os rascunhos por regras versionadas, com intervalo configurável entre uma e 24 horas (padrão seis). Um agendador verifica as programações a cada cinco minutos. Na data, revalida política, origem, custo/preço, referência, contribuição, alçada e unidade antes de liberar a fila assistida. Mudanças incompatíveis bloqueiam o plano e ficam no histórico.

Pausar a rotina impede novas aprovações/liberações; encerramentos de vigência continuam registrados. Registrar uma aplicação já feita é evidência do responsável, não autorização para o sistema escrever no destino. Mudar a estratégia padrão afeta novos planos; não troca silenciosamente a estratégia de uma programação aprovada.

Faro/Atlas orientam a conferência de evidências; Giro/Cifra orientam disponibilidade e economia; diretoria valida e o operador aplica; Sofia/Doquita acompanham revisão e resultado. Os nomes indicam responsabilidades no fluxo. O motor não é composto por 14 modelos executando ações externas e não mede aumento de vendas automaticamente. Não há chamadas pagas de IA nessa rotina.

## Situação da implantação

A mesa pode consultar a referência de estoque existente e permitir cadastrar concorrência e salvar rascunhos. Na inspeção desta entrega, ainda não havia base financeira aprovada nem política publicada; portanto a aprovação de preço permanece bloqueada até os responsáveis concluírem essas etapas. Referência antiga é identificada com data e pendência; não é promovida a fonte financeira aprovada.

## Verificação

351 testes automatizados passaram. Teste transacional com rollback cobriu normalização, rascunho, piso, unidade, aprovação com confirmações, isolamento, versão concorrente, conflito de agenda, liberação na data, registro manual, encerramento, mudança de origem, RLS e executor privado. Nenhuma referência, política ou aplicação sintética foi mantida em produção.

Verificação isolada da interface conferiu comparação, escape de texto, cálculo, foco, rascunho, destino/tabela, confirmações, troca de empresa que limpa despesas, abertura das ferramentas anteriores e descarte de dados após falha. Axe conferiu regras estruturais no JSDOM, sem avaliar contraste visual. Sessão autenticada de operação real, dispositivo móvel e integração de escrita ao ERP não foram homologados nessa etapa.

Implementação: `pricing-desk-ui.mjs`, `pricing-desk-engine.mjs`, `pricing-desk.css` e `schema/pricing-desk.sql`. A nova mesa e seu CSS carregam somente ao abrir Marca-passo; o pacote inicial do PWA mantém o limite já testado. APIs e dados comerciais não entram no cache offline.
