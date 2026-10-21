# Procfit direto para o CIP — verificação a cada 10 minutos

Estado de 19/10/2026: **verificação de contrato ativa; sincronização financeira pendente da origem e do mapeamento**. Não apresentar este verificador como carga de vendas/estoque.

## Isolamento

- Mesma view autorizada: `st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO` no Procfit.
- Diretórios próprios: `/opt/cip-procfit`, `/etc/cip-procfit`, `/var/lib/cip-procfit`.
- Serviços: `cip-procfit-sync.service` e `cip-procfit-sync.timer`.
- Destino direto: `https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-procfit-gateway`.
- Nenhuma chamada ao gateway ou heartbeat do ROTA PRO. A rotina existente `procfit-sync.timer` não foi alterada.
- VPN, driver ODBC e ambiente Python existentes são infraestrutura compartilhada. Configuração SQL foi copiada uma vez para arquivo CIP com permissão 600; manutenção posterior é independente. A exceção SQL de confiança de certificado foi preservada, não ampliada; TI deve fornecer cadeia confiável para removê-la.
- Chave privada Ed25519 fica somente em `/etc/cip-procfit/signing.pem`; o endpoint possui apenas a chave pública. Não copiar a chave privada para repositório/chat. Troca da chave requer publicar a chave pública correspondente antes de retomar o executor.

## O que roda

Timer `OnCalendar=*-*-* *:00/10:00 America/Sao_Paulo`, persistente no boot; execução sem concorrência e timeout de três minutos. A consulta é `TOP (0)`: lê somente nomes das colunas, não linhas de locação, clientes ou valores. Confere permissão de leitura e ausência de privilégios de escrita/administração na origem.

A primeira leitura ao vivo retornou 45 colunas do contrato de locações/tombamentos, com campos como VALOR_DIARIA, VALOR_MENSAL e PRAZO_LOCACAO. Não contém o contrato completo de vendas e estoque requerido pelo CIP. Estado `contract_pending` foi recebido e persistido no banco CIP, com 600 segundos de intervalo. Uma mudança estrutural produz `mapping_required`, não liberação automática de dados.

Assinatura valida o corpo completo; timestamp fora de cinco minutos é recusado. Atualização no banco só aceita instante mais recente. Repetição não duplica linha. Limite 32 KB, sem corpo financeiro, tabela protegida por RLS e consulta apenas ao superadm ativo. Status do VPS não comprova atualização dos dados de negócio.

## Operação

```sh
systemctl status cip-procfit-sync.timer cip-procfit-sync.service --no-pager
TZ=America/Sao_Paulo systemctl list-timers cip-procfit-sync.timer --no-pager
cat /var/lib/cip-procfit/latest-status.json
journalctl -u cip-procfit-sync.service --since today --no-pager
```

Executar manualmente: `systemctl start cip-procfit-sync.service`.

Pausar somente a verificação CIP: `systemctl disable --now cip-procfit-sync.timer`.

Na plataforma: **Procfit & relatórios → Conexão direta Procfit → CIP**. A tela consulta o estado a cada minuto, enquanto a leitura da origem ocorre a cada dez minutos; após vinte minutos sem recebimento mostra atraso. A tabela guarda o último estado; não é histórico completo de execuções.

## Próxima entrega necessária

1. TI disponibiliza campos/linhas de todas as empresas/filiais, identifica grãos e entrega dicionário e totais independentes.
2. Mapear conjunto de vendas e saldo/lotes separadamente; nunca somar total de locação como receita de venda ou custo do ativo como estoque comercial.
3. Implementar carga particionada e validação por empresa/filial, preservando corte consistente. A função atual aceita somente metadados de contrato, não ingestão financeira.
4. Conciliar e homologar a primeira carga. Depois disso habilitar atualização financeira de dez em dez minutos e ferramentas do painel/bot com fonte e atraso reais.

Códigos de empresa/filial desconhecidos, novos campos ou joins não devem ser adivinhados. O motor e a importação manuais atuais permanecem disponíveis para bases conferidas enquanto a conexão financeira é concluída.

## Evidências e limites

105 testes locais passaram, incluindo assinatura válida, corpo alterado, prazo, contrato/cadência e rejeição de duplicatas de coluna. Endpoint sem assinatura/assinatura inválida deve retornar 401. Primeira execução real assinada chegou ao CIP com `contract_pending`/45 colunas; agenda habilitada e rotina ROTA PRO preservada ativa. Tela publicada via workflow do CIP; a sessão de navegador usada para conferir a interface estava no login, portanto não se declara homologação visual autenticada nesta entrega.
