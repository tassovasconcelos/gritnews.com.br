# Isolamento do CIP — plano de execução e reversão

Estado: preparação concluída; projeto dedicado ainda não criado. O ambiente atual permanece no Supabase GRIT compartilhado.

## Decisões antes de criar recursos

- Confirmar organização Supabase e cotação. O conector exige escolha explícita da organização e aceite de qualquer custo não zero.
- Região proposta: São Paulo, sujeita à disponibilidade e à política do Grupo.
- Responsáveis: TI/segurança, Produto, Financeiro e administrador CIP. Códigos das lojas e contrato de dados ainda precisam de homologação.

## Migração segura

1. Inventariar as tabelas `cip_`, funções, RLS, grants, policies Storage, auditoria, marcos e contagens. Fazer backup antes de qualquer corte.
2. Criar destino dedicado; reproduzir a fundação e as migrações da Escola, ingestão e administração. Scripts em schema são referências de implantação, não substituem um dump completo validado.
3. Recriar bucket privado e copiar anexos com contagem e hashes. Não copiar segredos do Vault ou tokens: gerar credenciais e token do worker novos.
4. Manter Auth do GRIT intacto. No destino, ativar usuários por convite e mapear os UUIDs antigos e novos. Não copiar, exportar ou redefinir senhas de aplicativos compartilhados.
5. Migrar registros autorizados do CIP, preservando origem e autoria por tabela de correspondência e trilha da migração. Reconciliar contagens, vínculos e hashes; executar testes de isolamento por empresa/filial e papéis.
6. Publicar Edge Functions no novo projeto e configurar cron somente após evitar processamento duplicado. Validar envio e aceite dos convites sem expor tokens em logs.
7. Alterar URL/chave pública e CSP nos arquivos do cliente; conferir o manifesto, login, recuperação, ativação, escola e permissões em navegador e celular.
8. Fazer o corte em janela controlada, registrar SHA da release e snapshot de referência. Confirmar o plano de exportação do Procfit antes de receber custos reais.

## Reversão

Preservar a release e o ambiente anterior até aceite. Se falhar: interromper o worker novo, restaurar os endpoints e CSP da release anterior e reconciliar qualquer escrita feita na janela antes de liberar a operação. Não excluir dados, usuários ou o projeto anterior durante o piloto.

## Critérios que continuam bloqueando o piloto

Sem custo/destino aprovados, sem conexão Procfit homologada, sem escopo por filial e sem testes reais dos papéis em navegador/celular, não declarar implantação operacional concluída.
