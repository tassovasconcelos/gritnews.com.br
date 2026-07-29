import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { FileText, Download, Check, Server, Shield, Database, Search, Edit3, Globe } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

const DOCS_DATA = {
  subdomain: {
    title: 'SUBDOMAIN_TENPETS.md',
    icon: Globe,
    content: `# Guia de Configuração do Subdomínio tenpets.gritnews.com.br no GitHub e DNS

## 1. O que foi ajustado no Código do App
- **Roteamento Automático de Subdomínio:** O aplicativo agora detecta automaticamente se o visitante acessa por \`tenpets.gritnews.com.br\`, \`/tenpets\` ou \`?view=tenpets\` e exibe diretamente a página **TenPets**.
- **Ajustes de SPA para GitHub Pages / Hostinger:** Adicionados os arquivos \`public/404.html\`, \`public/_redirects\` e \`public/.htaccess\` para evitar erro 404 em recarregamentos de página.

## 2. Configuração de DNS no Registro.br / Hostinger / Cloudflare
Para habilitar o subdomínio **tenpets.gritnews.com.br**:
1. Acesse a Zona DNS do domínio **gritnews.com.br**.
2. Adicione um novo registro **CNAME**:
   - **Nome / Host:** \`tenpets\`
   - **Alvo / Valor:** \`gritnews.com.br\` (ou \`seu-usuario.github.io\` se hospedado no GitHub Pages)
   - **TTL:** Auto ou 3600

## 3. Configuração no GitHub Pages (se utilizado)
1. No repositório GitHub em **Settings > Pages**:
   - Certifique-se de que o arquivo \`public/404.html\` está presente na branch de deploy.
   - O aplicativo direcionará qualquer tráfego vindo de \`tenpets.gritnews.com.br\` diretamente para o Portal TenPets assinado por Letícia Karla.`
  },
  hostinger: {
    title: 'DEPLOY_HOSTINGER.md',
    icon: Server,
    content: `# Guia de Implantação do GRIT NEWS na Hostinger (gritnews.com.br)

## 1. Pré-requisitos
- Acesso ao painel Hostinger (hPanel) ou Web App Hosting (Node.js).
- Domínio **gritnews.com.br** apontado para os DNS da Hostinger.
- Banco de dados MySQL criado no hPanel.
- Repositório GitHub do projeto conectado.

## 2. Configuração de Variáveis de Ambiente (.env)
\`\`\`env
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://usuario_grit:senha_segura@localhost:3306/gritnews_db"
NEXTAUTH_SECRET="chave_super_secreta_jwt_grit_2026"
NEXTAUTH_URL="https://gritnews.com.br"
APP_URL="https://gritnews.com.br"
GEMINI_API_KEY="sua_chave_gemini_api"
\`\`\`

## 3. Comandos de Build e Execution
- **Comando de Instalação:** \`npm install --production=false\`
- **Comando de Build:** \`npm run build\`
- **Comando de Inicialização:** \`npm run start\`

## 4. Redirecionamento SSL e WWW
Configure o arquivo \`.htaccess\` ou o proxy Nginx da Hostinger para forçar HTTPS e redirecionar \`www.gritnews.com.br\` para \`gritnews.com.br\`.`
  },
  architecture: {
    title: 'ARCHITECTURE.md',
    icon: Shield,
    content: `# Arquitetura do Sistema GRIT NEWS

## Visão Geral
Monólito modular construído em Next.js (React + TypeScript) com renderização híbrida (SSR, SSG e ISR) e API RESTful integrada.

## Camadas
1. **Apresentação:** React, Tailwind CSS, Lucide Icons, Motion Animations.
2. **Domínio & CMS:** Módulos de Artigos, Categorias, Ofertas B2B, Anúncios e Leads.
3. **Persistência:** MySQL com Prisma ORM + Abstração de Repositório preparada para migração PostgreSQL.
4. **Analytics & LGPD:** Sistema autônomo de eventos (\`page_view\`, \`offer_click\`, \`lead_submit\`) com suporte a anonymized IPs e consentimento via banner.`
  },
  seo: {
    title: 'SEO_GUIDE.md',
    icon: Search,
    content: `# Diretrizes de SEO Técnico e Editorial GRIT NEWS

## 1. Metadados e Open Graph
- Todas as páginas geram meta titles de até 60 caracteres e meta descriptions de até 155 caracteres.
- Imagens Open Graph dinâmicas para compartilhamento no LinkedIn, WhatsApp e X.

## 2. Dados Estruturados JSON-LD
- Artigos incluem schemas \`NewsArticle\`, \`BreadcrumbList\`, \`Organization\` e \`Person\` (Autor).
- Ofertas incluem schemas \`Product\` e \`Offer\`.

## 3. Sitemap e Robots.txt
- Sitemap dinâmico disponível no endpoint \`/api/sitemap.xml\`.
- Robots.txt configurado no endpoint \`/api/robots.txt\`.`
  },
  editorial: {
    title: 'EDITORIAL_GUIDE.md',
    icon: Edit3,
    content: `# Guia Editorial e E-E-A-T GRIT NEWS

## Pilares Editoriais
1. **Experiência e Especialização:** Autores credenciados com biografia e especialidades visíveis.
2. **Autoridade e Confiança:** Transparência obrigatória em conteúdos patrocinados e links de afiliados.
3. **Clareza de Leitura:** Formatação em blocos estruturados, títulos claros e sumário interativo.`
  },
  database: {
    title: 'DATABASE.md',
    icon: Database,
    content: `# Modelagem do Banco de Dados GRIT NEWS (MySQL / Prisma)

## Entidades Principais
- \`User\` & \`Role\` (Superadmin, Editor, Autor, Gestor Comercial)
- \`Article\` (status, slug, visualizações, blocos JSON, versão)
- \`Category\` (nome, slug, cor, ícone, destaque)
- \`Offer\` (preço original, preço promocional, cupom, comissionamento)
- \`AdCampaign\` & \`AdImpression\` & \`AdClick\` (gestão de anúncios)
- \`Lead\` & \`NewsletterSubscriber\` (registro LGPD)`
  }
};

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<keyof typeof DOCS_DATA>('subdomain');
  const [copied, setCopied] = useState(false);

  const doc = DOCS_DATA[activeTab];

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(doc.content);
      setCopied(true);
      onShowToast(`Conteúdo de ${doc.title} copiado!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual de Publicação & Arquitetura GRIT NEWS" maxWidth="4xl">
      <div className="space-y-6">
        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3">
          {(Object.keys(DOCS_DATA) as Array<keyof typeof DOCS_DATA>).map(key => {
            const item = DOCS_DATA[key];
            const IconC = item.icon;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#145EDB] text-white shadow-xs'
                    : 'bg-[#F7F9FC] text-[#5C6B7A] hover:bg-gray-200'
                }`}
              >
                <IconC className="w-3.5 h-3.5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Viewer */}
        <div className="bg-[#0B2343] text-gray-100 p-6 rounded-2xl font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-[#E2E8F0]">
          <pre className="whitespace-pre-wrap">{doc.content}</pre>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#5C6B7A]">
            Pronto para implantação no domínio <strong>gritnews.com.br</strong>
          </span>
          <button
            onClick={handleCopy}
            className="bg-[#FF8500] hover:bg-[#e07500] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
            <span>{copied ? 'Copiado para Área de Transferência' : `Copiar ${doc.title}`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
