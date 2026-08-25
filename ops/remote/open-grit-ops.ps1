$urls = @(
  'https://gritnews.com.br/?view=admin',
  'https://gritnews.com.br/produtos/',
  'https://gritnews.com.br/produtos/meu-espetinho/',
  'https://meuespetinho.gritnews.com.br/',
  'https://developers.facebook.com/apps/',
  'https://business.facebook.com/',
  'https://ads.google.com/',
  'https://search.google.com/search-console/',
  'https://console.cloud.google.com/',
  'https://supabase.com/dashboard',
  'https://github.com/tassovasconcelos/gritnews.com.br',
  'https://hpanel.hostinger.com/'
)

foreach ($url in $urls) {
  Start-Process $url
  Start-Sleep -Milliseconds 250
}

Write-Host 'GRIT Remote Ops aberto no navegador.'
