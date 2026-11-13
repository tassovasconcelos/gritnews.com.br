import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Article, Category, Partner, Offer, AuthorProfile } from '../../types';

interface HomeViewProps {
  articles: Article[];
  categories: Category[];
  partners: Partner[];
  offers: Offer[];
  authors?: AuthorProfile[];
  onSelectArticle: (article: Article) => void;
  onSelectCategory: (slug: string) => void;
  onSelectPartner: (partner: Partner) => void;
  onSelectAuthor?: (author: AuthorProfile) => void;
  onNavigateOffers?: () => void;
  onNavigateImoveis?: () => void;
  onNavigatePlaybook?: () => void;
  onNavigateRadar?: () => void;
  onNavigateTenPets?: () => void;
  onNavigateOpiniao?: () => void;
  onNavigateFato?: () => void;
  onOpenLeadModal: (offer: Offer) => void;
  onShowToast: (msg: string, type?: 'success' | 'info') => void;
}

const solutionCards = [
  {
    icon: '/brand/grit/icons/grit-icon-inteligencia.svg',
    title: 'Inteligência Comercial',
    text: 'Prospecção, leads, mercado e oportunidades reais.',
    href: '/solucoes/inteligencia-comercial/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-vendas.svg',
    title: 'Revenue Operations',
    text: 'CRM, pipeline, funil, equipe e performance comercial.',
    href: '/solucoes/vendas-revenue-operations/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-atendimento.svg',
    title: 'Atendimento & Pós-venda',
    text: 'SAC, SLA, qualidade, assistência e experiência.',
    href: '/solucoes/atendimento-pos-venda/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-tecnologia.svg',
    title: 'Automação & IA',
    text: 'Processos, RPA, agentes e inteligência aplicada.',
    href: '/solucoes/automacao-ia/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-dados-bi.svg',
    title: 'Dados, BI & Performance',
    text: 'Dashboards, análise, relatórios e indicadores.',
    href: '/solucoes/dados-bi/',
  },
  {
    icon: '/brand/grit/icons/grit-icon-crescimento.svg',
    title: 'Produtos SaaS GRIT',
    text: 'Soluções prontas para você crescer mais rápido.',
    href: '/produtos/',
  },
];

const products = [
  {
    name: 'OportunidadesPro',
    subtitle: 'by GRIT',
    icon: '/brand/grit/icons/grit-icon-inteligencia.svg',
    description: 'Inteligência comercial e Revenue Operations para transformar dados em oportunidades acompanháveis.',
    bullets: ['Gestão de leads e oportunidades', 'Pipeline e forecast de vendas', 'Dashboards e indicadores'],
    href: 'https://oportunidadespro.gritnews.com.br',
  },
  {
    name: 'GRIT SAC 4.0',
    subtitle: 'Atendimento, qualidade e pós-venda',
    icon: '/brand/grit/icons/grit-icon-atendimento.svg',
    description: 'Centralize atendimentos, reclamações e assistência com rastreabilidade e inteligência.',
    bullets: ['Gestão de SAC e SLA', 'Qualidade, NPS e pesquisas', 'Assistência técnica e CAPA'],
    href: 'https://apps.sacproh.gritnews.com.br',
  },
  {
    name: 'Meu Espetinho',
    subtitle: 'Seu negócio no controle.',
    icon: '/brand/grit/icons/grit-icon-financeiro.svg',
    description: 'Gestão completa para donos de espetinho que querem mais controle e lucro.',
    bullets: ['Estoque e cardápio digital', 'Financeiro e vendas', 'Relatórios e indicadores'],
    href: 'https://meuespetinho.gritnews.com.br',
  },
];

const articleFallbacks = [
  { category: 'INTELIGÊNCIA COMERCIAL', title: 'Como transformar leads em oportunidades reais', icon: 'inteligencia' },
  { category: 'VENDAS', title: 'Pipeline saudável: práticas para previsibilidade', icon: 'vendas' },
  { category: 'AUTOMAÇÃO', title: 'Automação comercial: por onde começar', icon: 'tecnologia' },
  { category: 'ATENDIMENTO', title: 'SLA de atendimento: mais eficiência e satisfação', icon: 'atendimento' },
  { category: 'DADOS E BI', title: 'Dashboards que contam a história do seu negócio', icon: 'dados-bi' },
];

const BrandSeal: React.FC = () => (
  <img src="/brand/grit/seal/grit-carimbo-oficial.svg" alt="Selo oficial GRIT Soluções e Negócios" className="w-32 h-32 md:w-36 md:h-36 object-contain" />
);

export const HomeView: React.FC<HomeViewProps> = ({
  articles,
  onSelectArticle,
}) => {
  const featuredArticles = articles.slice(0, 5);
  const goToDiagnostic = () => document.getElementById('captar')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="bg-[#F7F5F3] text-[#1B2F42]">
      <section id="inicio" className="relative overflow-hidden bg-[#081A30] text-white">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_73%_10%,rgba(251,122,24,.14),transparent_43%),linear-gradient(125deg,#081A30,#14334D)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 lg:py-20 grid lg:grid-cols-[1fr_.96fr] gap-9 lg:gap-12 items-start">
          <div className="lg:pt-8">
            <p className="text-[#FF9B4B] text-xs md:text-sm font-black uppercase tracking-[0.12em] mb-5">GRIT Soluções e Negócios • Impulsionando o crescimento</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[66px] font-black tracking-[-.055em] leading-[1.04] max-w-2xl">
              Empresário, sua empresa merece <span className="text-[#FB7A18]">crescer sem depender de você para tudo.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-200 leading-relaxed mt-6 max-w-xl">
              Clientes perdidos no WhatsApp? Estoque sem controle? Vendas sem acompanhamento?
              Transformamos esses desafios em gestão, tecnologia, automação e inteligência artificial útil para sua empresa.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href="#captar" className="bg-[#FB7A18] hover:bg-[#ff9a49] text-[#10243A] font-extrabold px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                Quero melhorar meu negócio <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/solucoes/" className="border border-white/40 hover:bg-white/10 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                Conhecer as soluções <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="flex flex-wrap gap-2 mt-7">
              {['Padarias e conveniências', 'Bares e restaurantes', 'Lojas e e-commerce', 'Escritórios e serviços'].map((label) => (
                <a key={label} href="#captar" className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-slate-200 hover:border-[#FB7A18]">{label}</a>
              ))}
            </div>
            <p className="mt-7 text-xs text-slate-300">✓ Conversa inicial sem compromisso &nbsp; ✓ Soluções prontas e personalizadas &nbsp; ✓ Atendimento humano</p>
          </div>
          <form id="captar" method="POST" action="https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/commercial-lead"
            className="bg-white text-[#142B42] rounded-[26px] shadow-2xl overflow-hidden border border-white/20" aria-label="Solicitar atendimento GRIT">
            <div className="bg-[#FFF5E9] px-6 py-6">
              <span className="inline-block bg-[#FFE6CA] text-[#A34C0C] rounded-full px-3 py-1 text-xs font-extrabold">Diagnóstico inicial para o seu negócio</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-[-.035em] leading-tight mt-3">Diga o que sua empresa precisa. <span className="text-[#DA6817]">A GRIT ajuda a encontrar o caminho.</span></h2>
              <p className="text-sm text-[#596C7E] mt-2">Leva cerca de um minuto. O contato será feito sobre a solução escolhida.</p>
            </div>
            <div className="px-6 py-6 space-y-3">
              <input type="hidden" name="source" value="grit-home" />
              <input type="hidden" name="medium" value="site" />
              <input type="hidden" name="campaign" value="grit-home-conversao-pme" />
              <input type="hidden" name="source_type" value="grit_landing_segment" />
              <input type="hidden" name="source_form_id" value="grit-solucoes-360" />
              <input type="hidden" name="privacy_notice_url" value="https://gritnews.com.br/solucoes/privacidade.html" />
              <input type="hidden" name="consent_version" value="grit-home-2026-11" />
              <input type="hidden" name="landing_page" value="https://gritnews.com.br/" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-extrabold">Seu nome *
                  <input name="name" required maxLength={120} autoComplete="name" placeholder="Como podemos chamar você?"
                    className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]" />
                </label>
                <label className="block text-xs font-extrabold">WhatsApp com DDD *
                  <input name="whatsapp" required type="tel" inputMode="tel" maxLength={22} autoComplete="tel" placeholder="(85) 99999-9999"
                    className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]" />
                </label>
              </div>
              <label className="block text-xs font-extrabold">Qual é o seu negócio? *
                <select name="segment" required defaultValue="" className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]">
                  <option value="" disabled>Selecione seu segmento</option>
                  <option value="padaria">Padaria e confeitaria</option>
                  <option value="mercadinho">Mercadinho e conveniência</option>
                  <option value="alimentacao">Espetinho, hamburgueria, bar ou restaurante</option>
                  <option value="varejo">Lojas e varejo</option>
                  <option value="ecommerce">E-commerce e loja virtual</option>
                  <option value="juridico">Escritório de advocacia</option>
                  <option value="saude">Saúde e equipamentos</option>
                  <option value="servicos">Prestação de serviços</option>
                  <option value="outro">Outro segmento</option>
                </select>
              </label>
              <label className="block text-xs font-extrabold">Qual solução mais interessa? *
                <select name="product" required defaultValue="diagnostico" className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]">
                  <option value="diagnostico">Quero uma recomendação da GRIT</option>
                  <option value="sr-padeiro">Sr. Padeiro — padarias</option>
                  <option value="meu-espetinho">Meu Espetinho — alimentação</option>
                  <option value="sac-4-0">SAC 4.0 — atendimento</option>
                  <option value="crm-ia">CRM, prospecção e IA</option>
                  <option value="ecommerce">Gestão de e-commerce</option>
                  <option value="marca-site">Sites e landing pages</option>
                  <option value="branding">Logomarca e identidade visual</option>
                  <option value="juridico">Soluções para escritórios jurídicos</option>
                  <option value="consultoria">Consultoria e automação</option>
                  <option value="bi">Indicadores, dados e BI</option>
                  <option value="propostas">Propostas comerciais</option>
                </select>
              </label>
              <label className="block text-xs font-extrabold">O que mais precisa melhorar?
                <textarea name="message" maxLength={600} rows={2} placeholder="Ex.: preciso vender mais e organizar meus clientes"
                  className="block w-full mt-1 border border-slate-300 bg-white p-3 rounded-lg text-sm text-[#142B42]" />
              </label>
              <div className="absolute -left-[9999px]" aria-hidden="true"><label htmlFor="grit-website-honey">Não preencher</label><input id="grit-website-honey" name="website" tabIndex={-1} autoComplete="off" /></div>
              <label className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                <input type="checkbox" name="consent_lgpd" value="true" required className="mt-1 accent-[#FB7A18]" />
                <span>Autorizo a GRIT a entrar em contato pelo WhatsApp sobre esta solicitação e estou ciente da <a href="/solucoes/privacidade.html" target="_blank" rel="noopener noreferrer" className="underline text-[#AD520C]">política de privacidade</a>. *</span>
              </label>
              <button type="submit" className="w-full min-h-14 bg-[#FB7A18] hover:bg-[#ff9b4b] text-[#081A30] font-black rounded-xl px-4 py-3 flex justify-center items-center gap-2">
                Quero receber o contato da GRIT <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-[11px] text-center text-slate-500">Sem obrigação de contratar. Atendimento comercial com seus dados protegidos.</p>
            </div>
          </form>
        </div>
      </section>
      <section className="bg-[#F4F7FA] border-b border-slate-200 py-10" aria-label="Projetos e experiências GRIT">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-[#D46414] uppercase font-black tracking-[.15em]">Experiência aplicada • Projetos e negócios reais</p>
          <h2 className="text-2xl md:text-3xl font-black text-[#10273D] mt-2 mb-6">Tecnologia que entende o dia a dia do empresário.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><strong className="text-[#17354E] text-sm">Distribuidora Prohospital</strong><span className="text-xs text-slate-500 mt-2">Distribuição B2B e gestão comercial</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><strong className="text-[#17354E] text-sm">Shopping Prohospital</strong><span className="text-xs text-slate-500 mt-2">Varejo e soluções operacionais</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/sr-padeiro.svg" alt="Sr. Padeiro" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Padarias e conveniências</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/meu-espetinho.svg" alt="Meu Espetinho" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Bares e alimentação</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/tenpets-oficial-usuario.webp" alt="TenPets" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Projeto de e-commerce</span></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center text-center min-h-36"><img src="/solucoes/assets/moacir-rocha-oficial-usuario.webp" alt="Dr. Moacir Rocha" className="max-h-16 w-full object-contain" /><span className="text-xs text-slate-500 mt-2">Tecnologia jurídica</span></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Referências a projetos e experiências. Não representam depoimentos, aval formal ou resultados atribuídos a terceiros.</p>
        </div>
      </section>

      <section id="solucoes" className="bg-white border-b border-[#E3E7EA]">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {solutionCards.map(({ icon, title, text, href }, index) => (
            <a href={href} key={title} className={`group px-5 py-8 text-center hover:bg-[#FFF8F2] transition-colors ${index > 0 ? 'lg:border-l border-[#E3E7EA]' : ''}`}>
              <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center text-[#071B2C] mb-4 group-hover:scale-105 transition-transform">
                <img src={icon} alt="" className="w-12 h-12 object-contain" />
              </div>
              <h2 className="font-black text-[17px] leading-tight min-h-[42px]">{title}</h2>
              <p className="mt-3 text-xs text-[#5D6873] leading-relaxed min-h-[48px]">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#FB7A18]">Saiba mais <ArrowRight className="w-3.5 h-3.5" /></span>
            </a>
          ))}
        </div>
      </section>

      <section id="metodo" className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-10 items-center">
          <div><p className="text-[#FB7A18] text-xs font-semibold tracking-[.2em] uppercase">Método GRIT</p><h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-.04em]">Clareza antes da ferramenta. Método antes da entrega.</h2><p className="mt-5 text-[#5B6B7A] leading-relaxed">Conectamos estratégia, processos, tecnologia e análise para transformar o desafio real do negócio em execução mensurável.</p></div>
          <div className="grid sm:grid-cols-2 gap-4">{[['estrategia','Diagnosticar','Entender contexto, gargalos e prioridades.'],['processos','Estruturar','Organizar fluxo, responsabilidades e indicadores.'],['tecnologia','Implementar','Aplicar tecnologia útil ao processo.'],['analise','Medir e evoluir','Acompanhar resultados e orientar a próxima decisão.']].map(([icon,title,text], index)=><article key={title} className="bg-white border border-[#1B2F42]/10 rounded-xl p-6"><span className="text-[#FB7A18] text-xs font-semibold">0{index+1}</span><img src={`/brand/grit/icons/grit-icon-${icon}.svg`} alt="" className="w-12 h-12 my-4"/><h3 className="font-bold text-xl">{title}</h3><p className="mt-2 text-sm text-[#5B6B7A]">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="produtos" className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="rounded-xl bg-[#0A1930] border border-[#1B2F42] p-5 md:p-7 shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="h-px w-10 bg-[#FF6A00]" />
            <p className="text-white text-sm font-black tracking-[0.12em]">NOSSOS PRODUTOS SAAS</p>
            <span className="h-px w-10 bg-[#FF6A00]" />
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {products.map(({ name, subtitle, icon, description, bullets, href }) => (
              <article key={name} className="rounded-xl border border-white/10 bg-[#0A1F31] p-6 text-white flex flex-col min-h-[280px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl border border-white/10 bg-white grid place-items-center"><img src={icon} alt="" className="w-11 h-11" /></div>
                  <div><h3 className="text-xl font-black">{name}</h3><p className="text-sm text-slate-300">{subtitle}</p></div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed mb-4">{description}</p>
                <ul className="space-y-2 text-sm text-slate-200 mb-5">{bullets.map(item => <li key={item}>• {item}</li>)}</ul>
                <a href={href} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 text-[#FB7A18] font-bold text-sm">Conheça {name} <ArrowRight className="w-4 h-4" /></a>
              </article>
            ))}
          </div>
          <div className="flex justify-center mt-4"><a href="/produtos/" className="min-w-[280px] text-center border border-[#FF6A00] text-[#FF6A00] px-5 py-3 rounded-md font-extrabold text-sm hover:bg-[#FF6A00] hover:text-white transition-colors">Ver todos os produtos →</a></div>
        </div>
      </section>

      <section id="insights" className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div><p className="text-[#FF6A00] text-xs font-black tracking-widest">GRIT INSIGHTS</p><h2 className="text-2xl md:text-3xl font-black tracking-[-0.03em]">Conteúdo que gera inteligência e impulsiona resultados.</h2></div>
          <a href="/insights/" className="hidden sm:inline-flex items-center gap-2 text-[#FF6A00] font-extrabold text-sm">Ver todos os artigos <ArrowRight className="w-4 h-4" /></a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(featuredArticles.length ? featuredArticles : articleFallbacks).slice(0, 5).map((item: any, index) => {
            const article = featuredArticles[index];
            const fallbackIcon = articleFallbacks[index]?.icon || 'analise';
            return (
              <button key={article?.id || item.title} onClick={() => article && onSelectArticle(article)} className="text-left bg-white border border-[#E3E7EA] rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="h-28 bg-gradient-to-br from-[#F7F5F3] to-[#E8EDF0] grid place-items-center"><img src={`/brand/grit/icons/grit-icon-${fallbackIcon}.svg`} alt="" className="w-12 h-12" /></div>
                <div className="p-4">
                  <p className="text-[9px] text-[#FF6A00] font-black tracking-wide mb-2">{articleFallbacks[index]?.category || 'INSIGHTS'}</p>
                  <h3 className="font-black leading-snug line-clamp-3">{article?.title || articleFallbacks[index]?.title}</h3>
                  <p className="mt-4 text-xs text-[#6A7480]">Leitura estratégica • GRIT Insights</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="diagnostico" className="bg-[#1B2F42] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-5">
          {[['estrategia','Metodologia própria GRIT','Diagnóstico que revela o que realmente importa.'],['crescimento','Soluções para PMEs e grandes empresas','Do tamanho do seu desafio.'],['tecnologia','Tecnologia com propósito e resultado','Ferramentas que geram valor real.'],['seguranca','Segurança e governança de dados','Proteção, conformidade e confiança.']].map(([icon,title,text])=><div key={title} className="flex gap-3"><img src={`/brand/grit/icons/grit-icon-${icon}.svg`} alt="" className="w-9 h-9 shrink-0 brightness-0 invert"/><div><b className="block">{title}</b><span className="text-sm text-slate-300">{text}</span></div></div>)}
        </div>
      </section>
    </div>
  );
};

