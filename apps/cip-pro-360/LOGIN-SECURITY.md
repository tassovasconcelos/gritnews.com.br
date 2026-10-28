# Segurança de login do CIP — 27/10/2026

## Alterações implementadas

- Removidos o botão e a função de revelar senha. Campos de login, ativação e recuperação continuam mascarados; ocultação do controle nativo legado do Edge. Gerenciadores de senha e recursos do próprio sistema operacional continuam sob controle do usuário.
- Credenciais do CIP usam chave própria `cip-auth-session-v2` em sessionStorage da aba, com memória como alternativa quando o armazenamento estiver indisponível. Não há fallback para armazenamento persistente. A chave legada do login é removida do localStorage neste domínio; os usuários precisam entrar novamente após a atualização.
- Sessões por aba: nova aba pode solicitar novo login. Navegadores podem restaurar sessionStorage ao restaurar abas; os prazos locais são conferidos novamente no carregamento. Duplicar uma aba pode copiar sua sessão.
- Bloqueio da interface após 30 minutos sem interação ou 8 horas desde o login. Verificação a cada 30 segundos e ao voltar à aba; tarefas em segundo plano não contam como interação. O prazo sobrevive ao recarregamento, quando sessionStorage está disponível. Relógios locais não substituem prazos impostos no servidor.
- Uma única tentativa de login em andamento; mensagens específicas para limite de tentativas, sem registrar senha ou resposta sensível. O limite efetivo contra ataques é do servidor, não do botão.
- Respostas de login/perfil anteriores ao logout são descartadas. O logout oculta a interface e remove o conteúdo, identifica o usuário como desconectado, encerra os componentes e tenta revogar a sessão atual. As credenciais locais são apagadas após a tentativa de revogação. Erros de rede não deixam a tela corporativa aberta.
- Validação de identidade e permissões a cada cinco minutos enquanto a sessão está aberta; suspensão, mudança de perfil ou empresas exigem nova autenticação. Falha de validação bloqueia a tela. As regras de acesso no banco continuam independentes dessa atualização visual.
- Login principal não aceita sessão recebida pela URL. Recuperação e convites continuam nas páginas específicas e com seus fluxos existentes.
- Referrer-Policy no-referrer em todo o CIP. Ativação e recuperação têm Cache-Control no-store e uma política de scripts sem inline; são excluídas do cache do service worker. O shell público do aplicativo continua disponível para PWA, sem cache de respostas financeiras ou APIs.

## Auditoria do banco (somente leitura)

- 54 de 54 tabelas públicas `cip_*` com RLS habilitada.
- Nenhuma política de escrita para `anon`/`public` identificada nessas tabelas.
- Perfis e vínculos possuem leitura do próprio usuário; alterações de autorização continuam pelas funções administrativas.
- As quatro funções públicas apontadas pelo advisor como SECURITY DEFINER autenticadas têm verificações explícitas de identidade e empresa. Esse apontamento exige revisão contínua; não significa acesso anônimo confirmado.
- Tabelas internas sem política RLS permanecem inacessíveis aos clientes por esse mecanismo; não foram abertas para eliminar avisos.
- Nenhuma alteração no banco ou na autenticação dos outros aplicativos foi feita nesta entrega.

## Limites e próximas ações

Não se promete ausência de violações. Os limites de inatividade acima bloqueiam o cliente; não impõem validade absoluta a um JWT roubado. Um access token já emitido pode continuar válido até expirar, mesmo após revogação do refresh token. Permissões no banco continuam sendo a barreira para os dados.

Prioridades para a próxima etapa:

1. Implementar cadastro, desafio e recuperação de segundo fator (TOTP), começando pelo superadm e diretores, e exigir AAL2 nas operações sensíveis do servidor. Não ativar exigência antes de cadastrar e testar os fatores para evitar bloqueio dos administradores.
2. Configurar CAPTCHA no provedor e integrar o token nos fluxos de login, ativação e recuperação; revisar limites de tentativas e envio de e-mails. Não houve ativação sem credenciais/configuração do CAPTCHA.
3. Revisar proteção contra senhas vazadas e requisitos de senha no provedor. O requisito atual de 12 caracteres nas telas de definição não substitui a política de senha do servidor.
4. Configurar limites de sessão no provedor, considerando que o projeto de autenticação é compartilhado e certas opções dependem do plano. Não alterar o projeto inteiro sem avaliar os outros aplicativos.
5. Migrar manipuladores inline da aplicação principal para eventos externos e então remover `unsafe-inline` da política de scripts global. As páginas de credenciais já possuem política mais restrita.
6. Homologar dispositivos PWA, restauração de abas e segundo fator com contas autorizadas. Nenhuma senha real, convite ou mensagem foi utilizado nos testes desta entrega.

Documentação oficial usada: [sessões](https://supabase.com/docs/guides/auth/sessions), [limites](https://supabase.com/docs/guides/auth/rate-limits), [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).
