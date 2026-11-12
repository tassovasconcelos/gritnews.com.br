# CIP PRO 360° — auditoria de navegação, acessibilidade e PWA

Revisão de 20/10/2026 (Brasília). Escopo: frontend privado do CIP, sem mudanças de autenticação, banco, integrações, concessões de acesso ou marca oficial. Referências metodológicas: WCAG 2.2 (W3C) para foco/controles, MDN para instalação e ciclo de atualização do PWA. Não é laudo de conformidade WCAG.

## Evidência e alcance
- Navegador real: endereço publicado inspecionado; sessão disponível apresentou a tela de login. Não houve login autenticado em produção, uso de credenciais, criação de contas ou contorno da autenticação.
- Código atual sincronizado com cip/main, preservando campanhas, Marca-passo, apresentação, B2G, processos e Telegram existentes.
- Adaptador DOM isolado, identidades e permissões sintéticas, sem dados comerciais nem chamadas de gravação: 19 caminhos examinados. Frames dos módulos carregados onde disponíveis; apresentação exercitada como marcador de carregamento e estoque com frames sem carga de negócio.
- Fluxos examinados: foco/inert do menu móvel, Escape, busca Ctrl/⌘ K, filtro, favoritos/reordenação, texto/movimento, voltar, isolamento entre usuários e rotas não autorizadas.
- axe-core 4.10.3 executado em DOM isolado nas 19 rotas (regras WCAG 2 A/AA, 2.1 AA, 2.2 AA): nenhuma violação detectada nas regras executáveis nesse ambiente. Contraste de cor não executado pelo axe, porque requer renderização; posição física, recorte visual e tamanho real de toque não são comprovados por esse resultado.
- PWA testado com eventos/cache/rede simulados: APIs externas, POST, dados JSON e páginas de ativação/recuperação não são interceptados como shell; atualização somente mediante mensagem explícita; limpeza limitada ao namespace do CIP.

## Achados e alterações
| Área | Achado | Resultado implementado |
|---|---|---|
| Descoberta | Menu extenso, sem busca por objetivo | Central pesquisável, grupos e descrições curtas |
| Personalização | Todos recebem a mesma entrada | Favoritos por usuário/navegador, até seis; ordem pelos botões; recentes |
| Ícones | Glifos de famílias diferentes | SVGs locais consistentes na navegação, sempre acompanhados de texto |
| Entrada | Visão inicial com botões genéricos e status históricos | Entrada centrada no objetivo, favoritos e acesso aos módulos autorizados |
| Menu móvel | Painel fora da tela ainda podia receber foco; tela de trás não bloqueada | inert, diálogo móvel nomeado, ciclo de Tab, Escape e retorno ao acionador |
| Mudança de módulo | Foco não era anunciado nem movido ao novo conteúdo | Título focável, aria-current, anúncio de rota, título da aba |
| Retorno | Rota não preservada na URL | Histórico do navegador e fragmentos permitidos após autenticação |
| Leitura | Textos secundários claros e tamanhos pequenos | Texto secundário mais escuro, controles de leitura ampliada |
| Movimento | Preferência do aparelho sem controle local comum | Respeito ao sistema e opção manual de reduzir movimento |
| Tabelas | Rolagem com foco pouco claro | Regiões nomeadas/focáveis, cabeçalhos de coluna e rolagem localizada |
| Instalação | A ajuda não estava disponível de forma clara antes do login | Instrução pública acessível, Android/iOS e botão nativo quando oferecido |
| Atualização | Nova versão podia assumir controle imediatamente | Aviso, Atualizar aplicativo e Mais tarde; recarga somente após o usuário aplicar |
| Offline | Qualquer navegação podia receber index.html como fallback | Somente raiz/index do app recebem shell; recuperação/ativação preservam seu caminho |
| Desempenho | Apresentação pesada importada em cada entrada | Módulo/CSS da apresentação sob demanda e fora do pré-cache inicial |
| Mobile | Pouco tratamento de áreas seguras/rotação | Safe areas superior/inferior, paisagem permitida e grades de uma coluna |

Favoritos são organização explícita, sem embaralhamento automático do menu. A ordem das soluções permanece previsível; cabe ao usuário escolher os seus atalhos. Não se infere prioridade de negócio a partir da frequência de cliques.

## Desempenho medido
Orçamento local de gzip por arquivo do pré-cache, excluindo o SDK Supabase e fontes externas: antes, 238.832 bytes; após a revisão, aproximadamente 236 KB (variações mínimas por ajustes de texto). Apresentação/CSS adiados: 17.203 bytes gzip. Isso mede arquivos, não latência p95, Core Web Vitals, velocidade no aparelho ou transferência real do domínio.

## Proteções preservadas
A lista usa as rotas já concedidas pelo app. Backend e RLS continuam sendo a autoridade. URL, busca, favoritos e atalhos PWA não concedem privilégios. Preferências são validadas contra o catálogo e as rotas da sessão; não contêm consultas, valores, credenciais ou dados comerciais. Logout desmonta a navegação e limpa o estado de busca da sessão. O cache permanece limitado a arquivos estáticos explícitos.

## Próxima homologação em aparelhos
1. Android Chrome/PWA em 360/390 px e iPhone Safari/PWA, retrato/paisagem, teclado virtual, texto ampliado e zoom de 200%.
2. TalkBack e VoiceOver: entrada, busca, resultados, abertura de módulo, foco, tabelas, erros e formulários reais.
3. Sessão real de superadm, diretoria e leitura: verificar o catálogo efetivamente concedido, voltar/recarregar e logout.
4. Instalar, abrir pela tela inicial, perder/recuperar rede e aplicar atualização com rascunho ainda não salvo.
5. Contraste renderizado, Core Web Vitals e dados carregados após o login. DOM isolado e inspeção de código não substituem essas etapas.
