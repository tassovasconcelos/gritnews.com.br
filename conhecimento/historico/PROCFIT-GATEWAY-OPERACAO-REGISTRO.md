# Procfit — sincronização horária no VPS

Servidor: `srv2065879.hstgr.cloud` (`179.236.82.215`), Ubuntu 24.04.

Origem: SQL Server `172.17.0.11:1433`, banco `PBS_PROHOSPITAL_DADOS`, view `st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO`.

Destino: gateway HTTPS já existente do ROTA PRO, projeto `pvldaqxblirmgoixselx`. Nenhuma mudança no esquema Supabase foi necessária.

Agenda: cada hora cheia, fuso `America/Sao_Paulo`. Execuções perdidas durante indisponibilidade do VPS são recuperadas uma vez ao retornar. O serviço executa uma carga de cada vez; falhas não apagam o último lote confirmado. A rotina consulta somente a view aprovada e não altera o SQL Server.

Serviços no VPS:

- `openvpn-client@procfit.service`: VPN persistente, habilitada no boot, com nova tentativa após falha.
- `procfit-sync.timer`: agenda horária habilitada no boot.
- `procfit-sync.service`: executor da carga; limite de 12 minutos.

Credenciais ficam somente no VPS, com permissão `600` e diretórios restritos: `/etc/openvpn/client/procfit.auth`, `/etc/procfit/connection.json`, `/etc/procfit/gateway.secret`. Não copie esses arquivos para o site público ou para o repositório. O pacote local contém apenas código e instruções.

Exceção autorizada pelo responsável: SQL usa `Encrypt=yes;TrustServerCertificate=yes` até a TI disponibilizar certificado confiável. Após instalar a cadeia confiável e conferir o nome do servidor, ajustar a configuração e repetir a validação antes de retirar a exceção. O tráfego do gateway HTTPS continua com validação normal do certificado.

Consulta operacional no VPS:

```sh
systemctl status openvpn-client@procfit.service procfit-sync.timer --no-pager
TZ=America/Sao_Paulo systemctl list-timers procfit-sync.timer --no-pager
cat /var/lib/procfit/latest-status.json
journalctl -u procfit-sync.service --since today --no-pager
```

Executar uma atualização manual usando o mesmo serviço:

```sh
systemctl start procfit-sync.service
```

Pausar apenas a agenda de dados:

```sh
systemctl disable --now procfit-sync.timer
```

Logs contêm identificadores técnicos, contagens e resultados; não registram as linhas de clientes nem as senhas. Limites: 20 mil registros, 8 MB por lote, 90 segundos por consulta. Lotes vazios, campos de identidade ausentes e identidades duplicadas são bloqueados. Novas tentativas HTTP reutilizam a mesma identificação de lote e corpo para evitar duplicações.

Homologação inicial em 15/10/2026: 96 registros, 45 colunas, status `PROCESSED`, 96 válidos e atualizados, zero rejeições e zero erros. Uma repetição retornou `duplicate=true`, confirmando a idempotência.
