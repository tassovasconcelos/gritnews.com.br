# Run inside the authorized Prohospital network/VPN. No credentials are persisted.
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$Server,
 [Parameter(Mandatory=$true)][string]$Database,
 [Parameter(Mandatory=$true)][string[]]$PilotStoreIds,
 [string]$OutputDirectory=(Join-Path $PWD 'cip-procfit-export'),
 [switch]$WindowsAuthentication
)
$ErrorActionPreference='Stop'
if($PilotStoreIds.Count -ne 4 -or ($PilotStoreIds | Select-Object -Unique).Count -ne 4){throw 'Informe os quatro códigos reais e distintos das lojas piloto.'}
if(@($PilotStoreIds | Where-Object {[string]::IsNullOrWhiteSpace($_) -or $_.Length -gt 80}).Count){throw 'Código de loja vazio ou maior que 80 caracteres.'}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$builder=New-Object System.Data.SqlClient.SqlConnectionStringBuilder
$builder.DataSource=$Server;$builder.InitialCatalog=$Database;$builder.Encrypt=$true
$builder.TrustServerCertificate=$false;$builder.ApplicationIntent='ReadOnly';$builder.ConnectTimeout=15
$connection=New-Object System.Data.SqlClient.SqlConnection($builder.ConnectionString)
if($WindowsAuthentication){$builder.IntegratedSecurity=$true;$connection.ConnectionString=$builder.ConnectionString}
else{$credential=Get-Credential -Message 'Conta Procfit autorizada somente para leitura das views CIP';$connection.Credential=New-Object System.Data.SqlClient.SqlCredential($credential.UserName,$credential.Password)}
$state=[ordered]@{captured_at=[DateTime]::UtcNow.ToString('o');server=$Server;database=$Database;status='not_connected';vpn_status='Conectividade deve ser homologada pela TI; não inferida pelo nome da interface.';rows=@{}}
$transaction=$null
try{
 $connection.Open()
 $check=$connection.CreateCommand();$check.CommandText="SELECT IS_SRVROLEMEMBER('sysadmin') AS sysadmin, IS_ROLEMEMBER('db_owner') AS db_owner, IS_ROLEMEMBER('db_datawriter') AS db_datawriter"
 $reader=$check.ExecuteReader();$reader.Read() | Out-Null
 $privileged=($reader.GetValue(0) -eq 1 -or $reader.GetValue(1) -eq 1 -or $reader.GetValue(2) -eq 1);$reader.Close()
 if($privileged){throw 'Use uma conta sem privilégios de escrita/administração. A TI deve conceder SELECT apenas nas views homologadas.'}
 # Snapshot must be enabled by the DBA; never change database settings here.
 $transaction=$connection.BeginTransaction([System.Data.IsolationLevel]::Snapshot)
 $queries=[ordered]@{
  products='SELECT company_id, sku, ean, description, unit, category, observed_at FROM cip.vw_products';
  inventory='SELECT company_id, store_id, sku, quantity_available, average_cost, stock_value, stock_age_days, observed_at FROM cip.vw_inventory WHERE store_id IN (@s0,@s1,@s2,@s3)';
  sales='SELECT company_id, store_id, sale_date, sku, quantity, net_revenue, cost_of_goods, observed_at FROM cip.vw_sales_daily WHERE store_id IN (@s0,@s1,@s2,@s3)';
  prices='SELECT company_id, store_id, sku, current_price, average_cost, expense_pct, observed_at FROM cip.vw_prices WHERE store_id IN (@s0,@s1,@s2,@s3)'
 }
 $payload=[ordered]@{schema='cip-procfit-v1';captured_at=$state.captured_at;pilot_stores=$PilotStoreIds;source_mode='read_only_export';datasets=[ordered]@{}}
 foreach($name in $queries.Keys){
  $command=$connection.CreateCommand();$command.Transaction=$transaction;$command.CommandText=$queries[$name];$command.CommandTimeout=90
  if($name -ne 'products'){for($i=0;$i -lt 4;$i++){$parameter=$command.Parameters.Add("@s$i",[System.Data.SqlDbType]::NVarChar,80);$parameter.Value=$PilotStoreIds[$i]}}
  $table=New-Object System.Data.DataTable;$reader=$command.ExecuteReader();$table.Load($reader);$reader.Close()
  $rows=@(foreach($row in $table.Rows){$item=[ordered]@{};foreach($column in $table.Columns){$v=$row[$column.ColumnName];$item[$column.ColumnName]=if($v -is [System.DBNull]){$null}elseif($v -is [DateTime]){$v.ToString('o')}else{$v}};[pscustomobject]$item})
  $payload.datasets[$name]=$rows;$state.rows[$name]=$rows.Count
 }
 $transaction.Commit();$transaction=$null
 $temporary=Join-Path $OutputDirectory 'procfit-snapshot.pending.json';$destination=Join-Path $OutputDirectory 'procfit-snapshot.json'
 $payload | ConvertTo-Json -Depth 12 | Set-Content -Path $temporary -Encoding UTF8
 Move-Item -Force -Path $temporary -Destination $destination
 $state.status='exported';$state.file='procfit-snapshot.json'
 Write-Host 'Exportação somente leitura concluída. Nenhum dado foi enviado ao CIP ou alterado no ERP.'
}catch{$state.status='failed';$state.error='Falha de conexão, permissão ou contrato das views. Consulte a TI; nenhuma credencial foi registrada.';throw}
finally{if($transaction){$transaction.Rollback()};$connection.Dispose();$state | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $OutputDirectory 'last-connection.json') -Encoding UTF8}
