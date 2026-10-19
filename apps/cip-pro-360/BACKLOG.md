# Backlog consolidado — auditoria de 19/10/2026

| Prioridade | Entrega | Situação e aceite pendente |
|---|---|---|
| P0 | Consolidar bundle e evolução da escola | Código unificado; preservar segurança, extração automática e revisão humana |
| P0 | Administração e convites | Implementado no código/banco; testes transacionais e interface controlada; homologação com usuários reais pendente |
| P0 | Diretor, supervisor, gerente | Papéis por empresa implementados; login real em navegador/celular e acesso por loja pendentes |
| P0 | Banco dedicado | Runbook pronto; confirmar organização, cotação e aceite antes da criação |
| P0 | Procfit somente leitura | Contrato e exportador preparados; TI precisa fornecer views, acesso e códigos das lojas |
| P0 | Piloto: quatro lojas e quatro controles | Seleção e aprovação ainda pendentes. Não inventar filiais nem datas de início |
| P1 | Baseline e conciliação financeira | Conferir 100% das chaves e tolerância financeira proposta de 2%, sujeita ao Financeiro |
| P1 | Marca-passo operacional | Só após estoque/custo reais e atuais; até cinco ações diárias por loja é proposta da auditoria |
| P1 | Alçadas de preço | Matriz a definir e homologar; status manual atual não significa mudança no ERP |
| P1 | Origem estável do CIP | Main dedicada cip/main dentro do repositório atual, sem merge na main do portal |
| P1 | Segurança de cliente | SDK local, CSP ampliada e retirada da configuração Vercel consolidados; unsafe-inline ainda pendente |
| P2 | Avaliação 30/60/90 dias | Medir adesão, margem, giro, ruptura, estoque antigo e capital contra lojas de controle |

Nenhuma nova expansão de módulos até validar o núcleo. Manter escola, ingestão e squad já existentes, sem tratar atividade visual como execução autônoma.


## Evolução de 19/10 — competências, processos e mensageiro

- Implementados: planos avançados dos mesmos 14 especialistas; editor Processos vivos com histórico e auditoria por regras; primeiro modelo do Doquita no Telegram com vínculo seguro e consultas limitadas.
- Pendente de ativação externa: bot BotFather, segredos e webhook; não houve conversa real homologada.
- Próximos gates: validação dos processos com donos, testes por habilidade, piloto Telegram privado, Procfit conciliado e pesquisa atual de tendências com evidência.
- Documentação: `PROCESSES-AND-TELEGRAM.md`.

- Assistente de ativação Telegram no próprio CIP: token protegido, validação de identidade, configuração automática do webhook e armazenamento criptografado no Vault; uso restrito ao superadm. A conexão real depende do token inserido pelo titular e do teste /resumo.

- Vínculo Telegram explicitamente permanente; seleção persistente de empresa/todas no menu; voz e interpretação estruturada preparadas com IA opt-in, chave API no Vault, limites e respostas vinculadas ao cadastro real. Ativação de IA depende da chave própria e de teste real de texto/voz.

- Implementado: importação manual JSON/CSV em rascunho, conciliação por totais independentes, bases aprovadas por empresa, relatórios de venda líquida do mês/estoque/entrada >180 dias/ausência de venda na janela e propostas de giro/Marca-passo. Menu Procfit & relatórios exclusivo do superadm; bot usa somente base aprovada.
- Pendente: primeira exportação real do Procfit, conferência da TI/Financeiro e ativação da chave de IA pelo titular. Integração SQL Server direta e escalonamento além dos limites do piloto ainda não executados. Nenhum número de produção foi criado.
