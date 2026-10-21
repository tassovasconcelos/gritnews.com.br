# CIP 360° no celular

O CIP pode ser instalado como aplicativo pela tela de acesso. No Android, use **Instalar app** quando o navegador oferecer a instalação. No iPhone, abra no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

O modo sem conexão mantém a tela já aberta e avisa quando a rede caiu. O service worker guarda somente o HTML, os estilos, os módulos estáticos e os ícones do aplicativo. Respostas do Supabase, cargas do Procfit, consultas, tokens e dados comerciais não são gravados para uso offline. É preciso voltar à rede para autenticar ou atualizar informações; os dados exibidos numa aba aberta podem ficar desatualizados.

Na tela pequena, a barra inferior mantém até cinco acessos: Início, Estoque, Preços, B2B e Mais. Cada rota direta continua sujeita às permissões já concedidas pelo servidor; “Mais” abre os demais módulos autorizados. Em telas maiores, o menu lateral existente permanece.

Este é o primeiro bloco de instalação e navegação móvel. O recorte por empresa/período, snapshots offline de negócio, metas de carregamento, instalação em aparelhos reais e medições de acessibilidade/desempenho dependem de etapas próprias e não são declarados concluídos por este shell.

O orçamento automatizado dos arquivos locais do shell compactados fica abaixo de 250 KB, sem incluir a biblioteca Supabase. Fontes carregadas do Google e a transferência real no domínio não entram nessa medição; confirmar no Lighthouse após a publicação.


## Auditoria de navegação e acessibilidade — 20/10/2026

A Central **Todas as soluções** e a busca global por nome/objetivo incluem somente rotas autorizadas. **Acessibilidade e aplicativo** oferece texto ampliado, redução de movimento, favoritos com ordem manual e instruções de instalação. Atalhos e acessos recentes ficam neste navegador, separados por usuário; não contêm dados comerciais. Ctrl/⌘ K abre a busca. O menu móvel controla foco e bloqueia interação com a tela de trás; Esc fecha e devolve o foco.

A instalação também possui instrução visível antes do login. O manifesto permite retrato e paisagem e possui atalhos de abertura; todos continuam exigindo autenticação/permissão. O aplicativo respeita áreas seguras do celular e preferências de movimento do aparelho.

Atualizações do service worker aguardam o botão **Atualizar aplicativo**; não forçam recarga no meio de um formulário. O shell busca código novo pela rede e só usa o cache estático quando a rede falha. A recuperação offline se limita à entrada do app; ativação e recuperação de senha não são redirecionadas ao shell quando offline. Avisos distinguem conexão restabelecida de dados atualizados.

A apresentação executiva e seu CSS agora carregam sob demanda, após verificar a rota e o papel. São cerca de 17 KB gzip adiados, e não uma medição do tempo de rede. O pré-cache inicial medido nesta revisão é de aproximadamente 236 KB gzip (sem Supabase e fontes externas), abaixo do orçamento de 250 KB. O roteiro da auditoria e os limites de verificação estão em `NAVIGATION-AUDIT.md`.
