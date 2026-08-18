import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Receipt, Smartphone, WalletCards } from 'lucide-react';
import './hero-carousel.css';

type Slide={
  eyebrow:string;
  title:string;
  highlight:string;
  description:string;
  benefits:string[];
  visual:'sale'|'checkout'|'dashboard';
};

const slides:Slide[]=[
  {
    eyebrow:'VENDA RÁPIDA PELO CELULAR',
    title:'Lance pedidos em',
    highlight:'poucos toques.',
    description:'Atenda no balcão, na mesa ou perto da churrasqueira sem depender de computador ou caderninho.',
    benefits:['Produtos na tela','Comanda organizada','Mais agilidade no atendimento'],
    visual:'sale'
  },
  {
    eyebrow:'FECHAMENTO SEM CONFUSÃO',
    title:'Feche a conta',
    highlight:'na frente do cliente.',
    description:'Confira os itens e registre PIX, cartão, dinheiro ou fiado no mesmo fluxo, sem calculadora e sem retrabalho.',
    benefits:['Conta conferida','Formas de pagamento','Histórico da venda'],
    visual:'checkout'
  },
  {
    eyebrow:'VISÃO DO DONO EM TEMPO REAL',
    title:'Saiba como o negócio está',
    highlight:'de onde estiver.',
    description:'Acompanhe faturamento, pedidos, ticket médio e movimento da operação diretamente no celular.',
    benefits:['Indicadores simples','Decisão mais rápida','Negócio no controle'],
    visual:'dashboard'
  }
];

function PhoneVisual({kind}:{kind:Slide['visual']}){
  return <div className="carousel-phone" aria-hidden="true">
    <div className="carousel-notch"/>
    <div className="carousel-screen">
      <div className="carousel-app-head"><img src="/favicon.svg" alt=""/><span><b>Meu Espetinho</b><small>{kind==='sale'?'Nova venda':kind==='checkout'?'Mesa 07 • Fechar conta':'Visão do dono • Hoje'}</small></span></div>
      {kind==='sale'&&<><div className="carousel-search">Buscar produto...</div><div className="carousel-products"><button><span>🥩</span><b>Espeto bovino</b><small>R$ 12,00</small></button><button><span>🍗</span><b>Frango</b><small>R$ 10,00</small></button><button><span>🥤</span><b>Refrigerante</b><small>R$ 6,00</small></button><button><span>🍺</span><b>Cerveja</b><small>R$ 8,00</small></button></div><div className="carousel-cart"><span>3 itens</span><strong>R$ 34,00</strong><button>Adicionar à comanda</button></div></>}
      {kind==='checkout'&&<><div className="carousel-bill"><p><span>2× Espeto bovino</span><b>R$ 24,00</b></p><p><span>1× Refrigerante</span><b>R$ 6,00</b></p><p><span>1× Cerveja</span><b>R$ 8,00</b></p><hr/><p className="carousel-total"><span>Total</span><strong>R$ 38,00</strong></p></div><small className="carousel-label">Como recebeu?</small><div className="carousel-pay"><button>PIX</button><button>Cartão</button><button>Dinheiro</button><button>Fiado</button></div><button className="carousel-finish">Fechar conta</button></>}
      {kind==='dashboard'&&<><div className="carousel-dash"><small>Faturamento de hoje</small><strong>R$ 1.284,00</strong><span>Acompanhe de onde estiver</span></div><div className="carousel-kpis"><div><small>Pedidos</small><b>47</b></div><div><small>Ticket médio</small><b>R$ 27,32</b></div></div><div className="carousel-bars"><i style={{height:'35%'}}/><i style={{height:'56%'}}/><i style={{height:'47%'}}/><i style={{height:'78%'}}/><i style={{height:'65%'}}/><i style={{height:'92%'}}/></div><div className="carousel-note"><BarChart3/> Movimento por horário</div></>}
    </div>
  </div>
}

export default function HeroCarousel(){
  const[index,setIndex]=useState(0);
  const[paused,setPaused]=useState(false);
  useEffect(()=>{if(paused)return;const id=window.setInterval(()=>setIndex(i=>(i+1)%slides.length),4500);return()=>window.clearInterval(id)},[paused]);
  const slide=slides[index];
  const go=(next:number)=>setIndex((next+slides.length)%slides.length);
  return <div className="hero-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} aria-roledescription="carrossel" aria-label="Benefícios do Meu Espetinho">
    <div className={`hero-carousel-slide slide-${slide.visual}`} key={index}>
      <div className="carousel-copy">
        <span className="carousel-eyebrow">{slide.eyebrow}</span>
        <h2>{slide.title} <em>{slide.highlight}</em></h2>
        <p>{slide.description}</p>
        <div className="carousel-benefits">{slide.benefits.map(item=><span key={item}><CheckCircle2/>{item}</span>)}</div>
      </div>
      <div className="carousel-visual"><div className="carousel-glow"/><PhoneVisual kind={slide.visual}/><div className="carousel-floating-card">{slide.visual==='sale'?<><Smartphone/><span><b>Rápido de usar</b><small>Feito para a correria</small></span></>:slide.visual==='checkout'?<><Receipt/><span><b>Conta organizada</b><small>Menos erro no fechamento</small></span></>:<><WalletCards/><span><b>Gestão na mão</b><small>Veja o resultado do dia</small></span></>}</div></div>
    </div>
    <button className="carousel-arrow prev" onClick={()=>go(index-1)} aria-label="Imagem anterior"><ChevronLeft/></button>
    <button className="carousel-arrow next" onClick={()=>go(index+1)} aria-label="Próxima imagem"><ChevronRight/></button>
    <div className="carousel-dots" role="tablist" aria-label="Escolher benefício">{slides.map((s,i)=><button key={s.visual} className={i===index?'active':''} onClick={()=>setIndex(i)} aria-label={`Ver ${s.eyebrow.toLowerCase()}`} aria-selected={i===index}/>)}</div>
    <div className="carousel-progress" key={`progress-${index}`}><i/></div>
  </div>
}
