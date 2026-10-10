# CONSUMO PRO 360 | E-mails oficiais do Grupo Prohospital

**Responsável pela tecnologia:** GRIT Soluções e Negócios  
**Estado:** templates implementados no repositório; ainda é necessário publicar/validar os modelos no Supabase Auth e configurar/remeter via SMTP autorizado.

## Identidade
- Assinatura de exibição sugerida: **Grupo Prohospital | CONSUMO PRO 360**
- Nome da plataforma: **CONSUMO PRO 360 — Controle e Auditoria de Consumo**
- Paleta: vermelho corporativo `#B1263A`, grafite `#252D38`, branco `#FFFFFF` e cinza `#F4F5F7`.
- Identidade: cabeçalho tipográfico institucional; o **arquivo original do logo não foi incorporado**. Quando a equipe fornecer um ativo original publicamente servido sob HTTPS, substitua o bloco de texto pela imagem aprovada, mantendo alt e fallback. **Não recriar nem redesenhar a marca.**
- Rodapé: Grupo Prohospital como emissor da comunicação; **Tecnologia e desenvolvimento: GRIT Soluções e Negócios**.
- Tom: objetivo, respeitoso, profissional, sem marketing ou links de rastreamento.

## Mapa de templates Supabase Auth

| Arquivo | Painel Supabase Authentication > Email Templates | Assunto |
|---|---|---|
| `invite.html` | **Invite user** | CONSUMO PRO 360 \| Convite de acesso — Grupo Prohospital |
| `confirmation.html` | **Confirm sign up** | CONSUMO PRO 360 \| Confirme seu e-mail |
| `recovery.html` | **Reset password** | CONSUMO PRO 360 \| Redefinição segura de senha |
| `magic_link.html` | **Magic link** | CONSUMO PRO 360 \| Seu acesso seguro |
| `email_change.html` | **Change email address** | CONSUMO PRO 360 \| Confirme a alteração de e-mail |
| `password_changed.html` | **Security notifications > Password changed** | CONSUMO PRO 360 \| Sua senha foi alterada |

Os modelos utilizam somente os placeholders nativos:
- `{{ .ConfirmationURL }}`: link individual, gerado pelo Auth em cada envio.
- `{{ .Email }}`: endereço do destinatário.
- `{{ .NewEmail }}`: novo endereço, apenas na alteração de e-mail.
- `{{ .SiteURL }}`: URL do aplicativo definida no Supabase.

## Publicação no projeto correto
1. Entrar no [Supabase Dashboard do CONSUMO PRO](https://supabase.com/dashboard/project/xscxwazanootrdtyrumb/auth/templates).
2. Abrir **Authentication > Email Templates**, escolher o evento, inserir assunto da tabela acima e colar o conteúdo do respectivo HTML.
3. Em **Authentication > URL Configuration**, usar como Site URL **a URL de produção aprovada**; cadastrar somente os redirecionamentos necessários, com endereços HTTPS específicos. Evitar curingas amplos e domínios temporários não aprovados.
4. Em **Authentication > SMTP Settings**, configurar remetente de domínio corporativo **verificado** e DNS SPF, DKIM e DMARC aprovados. O endereço de origem ainda precisa ser definido; **não presumir** que `noreply@grupoprohospital.com.br` já exista.
5. Habilitar a notificação **Password changed** se desejada. Revisar limites de envio e regra de convite restrita.
6. Usar um e-mail de teste autorizado, receber um convite, confirmar destino e visual, verificar link válido e abertura no navegador/celular.
7. Verificar logs do Auth, recusa/expiração, recuperação de senha e permissões. Somente após os testes marcar a comunicação como homologada.

### Automação opcional por token de gestão seguro
O script `scripts/apply-auth-email-templates.mjs` lê estes arquivos e atualiza apenas os campos de templates/assuntos do projeto correto via Supabase Management API. O script executa **simulação por padrão**, e usa `--apply` explicitamente para publicar. Configurar `SUPABASE_ACCESS_TOKEN` em ambiente protegido, nunca enviar o token na conversa, no código ou em variáveis `VITE_`. Requer autorização e revisão da equipe administradora.

Exemplo:
```bash
export SUPABASE_PROJECT_REF=xscxwazanootrdtyrumb
# SUPABASE_ACCESS_TOKEN deve vir do gerenciador de segredos, não digitado em chat.
node scripts/apply-auth-email-templates.mjs
node scripts/apply-auth-email-templates.mjs --apply
```

## Segurança e compatibilidade
- Nunca codificar tokens de acesso, senhas ou links reais no HTML. Os modelos levam marcadores Supabase Go Template.
- A ação principal contém `{{ .ConfirmationURL }}`, com token gerado por envio, e deve ser usada apenas após autorização do remetente/destinatário.
- Alguns provedores fazem pré-acesso automático de links (Safe Links); se isso invalidar o token, considerar OTP ou confirmação intermediária no aplicativo, conforme documentação.
- Desabilitar *click tracking* de provedores SMTP para não reescrever URLs de autenticação.
- Não afirmar que e-mail foi enviado antes de confirmação do Supabase Auth; o layout no repositório sozinho **não altera** a configuração hospedada.
- Os templates são HTML de tabelas compatíveis com clientes comuns, com CSS inline e ajuste móvel. Dependem de ensaio real em Gmail, Outlook e dispositivos móveis.

Referência: https://supabase.com/docs/guides/auth/auth-email-templates
