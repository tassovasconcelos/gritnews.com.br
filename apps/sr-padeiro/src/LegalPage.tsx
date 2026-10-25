import { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import './landing-brand.css';
import './landing-conversion-v3.css';

const WA='https://wa.me/5585921716546?text='+encodeURIComponent('Olá! Preciso falar com a GRIT sobre o Sr. Padeiro.');

type LegalKind='privacy'|'terms';

const privacySections=[
  ['1. Quem somos','O Sr. Padeiro é uma solução digital da GRIT Soluções e Negócios para apoiar a gestão de pequenos negócios. Para assuntos de privacidade e atendimento, utilize contato@gritnews.com.br.'],
  ['2. Dados coletados','Podemos coletar dados informados voluntariamente em formulários e cadastros, como nome, empresa, telefone/WhatsApp, e-mail, cidade e informações necessárias para prestação do serviço. Também podemos registrar dados técnicos e de origem de campanha, como página acessada, UTM, gclid e fbclid, quando disponíveis.'],
  ['3. Finalidades','Os dados são utilizados para responder solicitações, realizar atendimento comercial, liberar e operar o serviço, prestar suporte, melhorar a experiência, medir campanhas e cumprir obrigações legais e de segurança.'],
  ['4. Base e consentimento','Quando aplicável, o tratamento ocorre mediante consentimento, execução de contrato, legítimo interesse ou cumprimento de obrigação legal, observando a Lei Geral de Proteção de Dados (LGPD).'],
  ['5. Compartilhamento','Dados podem ser processados por fornecedores de infraestrutura, autenticação, pagamentos, comunicação e analytics estritamente necessários à operação. Não comercializamos dados pessoais.'],
  ['6. Segurança','Adotamos controles técnicos e organizacionais compatíveis com a operação, incluindo autenticação, segregação de acesso e práticas de menor privilégio. Nenhum sistema é absolutamente imune a incidentes; por isso mantemos processos de revisão e melhoria contínua.'],
  ['7. Retenção','Os dados são mantidos pelo período necessário às finalidades informadas, à relação contratual e às obrigações legais e de defesa de direitos.'],
  ['8. Seus direitos','Você pode solicitar confirmação de tratamento, acesso, correção, informação sobre compartilhamento, portabilidade quando aplicável, oposição, revogação de consentimento e eliminação nos limites legais.'],
  ['9. Contato','Para solicitações relacionadas à privacidade: contato@gritnews.com.br.'],
];

const termsSections=[
  ['1. Objeto','Estes termos regulam o uso do Sr. Padeiro, solução de apoio à gestão comercial e operacional de pequenos negócios.'],
  ['2. Conta e acesso','O usuário é responsável pela veracidade das informações fornecidas e pela guarda de suas credenciais. Cada pessoa deve utilizar seu próprio acesso quando houver perfis individuais.'],
  ['3. Trial e contratação','O período de teste, quando oferecido, é temporário e pode possuir limites operacionais. A contratação comercial vigente deve ser confirmada na página de planos ou proposta emitida pela GRIT.'],
  ['4. Uso adequado','Não é permitido utilizar o serviço para fraude, acesso indevido, violação de direitos de terceiros, tentativa de exploração de vulnerabilidades ou qualquer atividade ilícita.'],
  ['5. Dados do negócio','O cliente é responsável pela qualidade e legalidade dos dados lançados na plataforma. Indicadores e relatórios dependem da consistência desses registros.'],
  ['6. Disponibilidade e manutenção','A GRIT busca manter o serviço disponível e seguro, podendo realizar manutenções, atualizações e correções. Incidentes de terceiros, internet ou infraestrutura externa podem afetar temporariamente a disponibilidade.'],
  ['7. Suporte','O suporte padrão utiliza os canais comerciais e de atendimento informados pela GRIT, especialmente contato@gritnews.com.br e WhatsApp +55 85 92171-6546.'],
  ['8. Propriedade intelectual','Marca, interface, software, textos e materiais do Sr. Padeiro pertencem à GRIT ou a seus respectivos licenciadores e não podem ser copiados ou explorados fora das permissões concedidas.'],
  ['9. Alterações','Os termos podem ser atualizados para refletir mudanças legais, técnicas ou comerciais. A versão vigente será mantida nesta página.'],
  ['10. Contato','Dúvidas contratuais ou operacionais podem ser encaminhadas para contato@gritnews.com.br.'],
];

export function isLegalPath(path:string){return path==='/privacidade'||path==='/termos';}

export default function LegalPage({kind}:{kind:LegalKind}){
  const privacy=kind==='privacy';
  const title=privacy?'Política de Privacidade | Sr. Padeiro':'Termos de Uso | Sr. Padeiro';
  const description=privacy?'Política de Privacidade do Sr. Padeiro e informações sobre tratamento de dados pessoais.':'Termos de Uso do Sr. Padeiro.';
  const sections=privacy?privacySections:termsSections;
  useEffect(()=>{
    document.title=title;
    let meta=document.querySelector('meta[name="description"]');
    if(!meta){meta=document.createElement('meta');meta.setAttribute('name','description');document.head.appendChild(meta)}
    meta.setAttribute('content',description);
    let robots=document.querySelector('meta[name="robots"]');
    if(!robots){robots=document.createElement('meta');robots.setAttribute('name','robots');document.head.appendChild(robots)}
    robots.setAttribute('content','noindex,follow');
    let canonical=document.querySelector('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.setAttribute('rel','canonical');document.head.appendChild(canonical)}
    canonical.setAttribute('href',`https://srpadeiro.gritnews.com.br/${privacy?'privacidade':'termos'}`);
  },[title,description,privacy]);
  return <div className="sp-landing"><header className="sp-header"><div className="sp-header-inner"><a className="sp-logo" href="/"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/></a><div className="sp-header-actions"><a className="sp-whatsapp-link" href={WA}><MessageCircle size={17}/> WhatsApp</a><a className="sp-primary small" href="/">Voltar ao site</a></div></div></header><main><section className="sp-section"><div className="sp-container" style={{maxWidth:900}}><div className="sp-section-head"><span>GRIT SOLUÇÕES</span><h1>{privacy?'Política de Privacidade':'Termos de Uso'}</h1><p>Última atualização: 23 de agosto de 2026.</p></div>{sections.map(([h,b])=><article key={h} style={{marginBottom:24}}><h2 style={{fontSize:'1.2rem'}}>{h}</h2><p>{b}</p></article>)}<div className="sp-hero-actions"><a className="sp-secondary" href="mailto:contato@gritnews.com.br">contato@gritnews.com.br</a><a className="sp-primary" href={WA}>Falar no WhatsApp</a></div></div></section></main><footer className="sp-footer"><div className="sp-container sp-footer-grid"><img src="/sr-padeiro-logo.svg" alt="Sr. Padeiro"/><div><b>GRIT Soluções</b><span>contato@gritnews.com.br</span></div><div><a href="/privacidade">Privacidade</a> · <a href="/termos">Termos</a></div></div></footer></div>;
}
