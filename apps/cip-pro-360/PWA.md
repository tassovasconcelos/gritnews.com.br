# CIP 360° no celular

O CIP pode ser instalado como aplicativo pela tela de acesso. No Android, use **Instalar app** quando o navegador oferecer a instalação. No iPhone, abra no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

O modo sem conexão mantém a tela já aberta e avisa quando a rede caiu. O service worker guarda somente o HTML, os estilos, os módulos estáticos e os ícones do aplicativo. Respostas do Supabase, cargas do Procfit, consultas, tokens e dados comerciais não são gravados para uso offline. É preciso voltar à rede para autenticar ou atualizar informações; os dados exibidos numa aba aberta podem ficar desatualizados.

Na tela pequena, a barra inferior mantém até cinco acessos: Início, Estoque, Preços, B2B e Mais. Cada rota direta continua sujeita às permissões já concedidas pelo servidor; “Mais” abre os demais módulos autorizados. Em telas maiores, o menu lateral existente permanece.

Este é o primeiro bloco de instalação e navegação móvel. O recorte por empresa/período, snapshots offline de negócio, metas de carregamento, instalação em aparelhos reais e medições de acessibilidade/desempenho dependem de etapas próprias e não são declarados concluídos por este shell.

O orçamento automatizado dos arquivos locais do shell compactados fica abaixo de 250 KB, sem incluir a biblioteca Supabase. Fontes carregadas do Google e a transferência real no domínio não entram nessa medição; confirmar no Lighthouse após a publicação.
