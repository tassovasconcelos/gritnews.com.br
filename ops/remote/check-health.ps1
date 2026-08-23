$targets = @(
  @{ Name = 'GRIT News'; Url = 'https://gritnews.com.br/' },
  @{ Name = 'Meu Espetinho'; Url = 'https://meuespetinho.gritnews.com.br/' },
  @{ Name = 'Sr. Padeiro'; Url = 'https://srpadeiro.gritnews.com.br/' },
  @{ Name = 'SAC ProH'; Url = 'https://apps.sacproh.gritnews.com.br/' },
  @{ Name = 'Moacir Rocha'; Url = 'https://moacirrocha.adv.br/' }
)

$results = foreach ($target in $targets) {
  $started = Get-Date
  try {
    $response = Invoke-WebRequest -Uri $target.Url -Method Head -MaximumRedirection 5 -TimeoutSec 20 -UseBasicParsing
    $elapsed = [math]::Round(((Get-Date) - $started).TotalMilliseconds)
    [PSCustomObject]@{
      Projeto = $target.Name
      Status = $response.StatusCode
      TempoMs = $elapsed
      Resultado = 'OK'
    }
  } catch {
    $elapsed = [math]::Round(((Get-Date) - $started).TotalMilliseconds)
    [PSCustomObject]@{
      Projeto = $target.Name
      Status = '-'
      TempoMs = $elapsed
      Resultado = $_.Exception.Message
    }
  }
}

$results | Format-Table -AutoSize
