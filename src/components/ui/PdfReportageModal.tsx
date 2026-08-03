import React, { useState } from 'react';
import { Download, Printer, Share2, ChevronLeft, ChevronRight, X, FileText, Check, ZoomIn, ZoomOut, Sparkles, BookOpen } from 'lucide-react';

interface PdfReportageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const REPORTAGE_PAGES = [
  {
    pageNumber: 1,
    chapter: 'CAPA HERO',
    bgDark: true,
    heroImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
    headerText: 'G R I T  N E W S  ·  T E N P E T S  —  R E P O R T A G E M  E S P E C I A L',
    badge: 'R E S G A T E  A N I M A L  ·  A  H I S T Ó R I A  D E  V I D A',
    title: 'A Vida da Vida',
    subtitle: 'Ela foi deixada para morrer entre sacos de lixo. Hoje é a princesa da casa.',
    bodyText: 'Quando o silêncio da dor encontra o eco do cuidado. Tudo porque uma mulher decidiu não seguir em frente sem agir.'
  },
  {
    pageNumber: 2,
    chapter: 'INTRODUÇÃO',
    bgDark: true,
    title: 'Ninguém ouviu nada. Era exatamente esse o problema.',
    subtitle: 'A VIDA DA VIDA · CAPÍTULO I A VIII',
    bodyText: 'G R I T  N E W S  ·  T E N P E T S  —  0 2'
  },
  {
    pageNumber: 3,
    chapter: 'CAPÍTULO I · O SILÊNCIO',
    bgDark: true,
    title: 'O grito que ninguém escutou',
    subtitle: 'A dor tem um hábito cruel: quando é grande demais, ela emudece. E o mundo atravessa a calçada sem virar o rosto.',
    bodyText: `Não houve latido de socorro, não houve um único ruído capaz de furar o barulho comum de uma rua qualquer. Havia apenas um corpo branco encostado num colchão que alguém tinha jogado fora, entre sacos pretos e restos de mudança, respirando devagar para gastar menos do pouco que sobrava.

O animal que sente demais para de reclamar. Encolhe. Escolhe um canto de sombra, apoia o queixo no chão e espera — não a ajuda, porque já não acredita nela, mas o fim do dia.

Ela estava ali havia tempo suficiente para o pelo perder o brilho e as patas perderem a firmeza. Suficiente para o lixo virar paisagem e o colchão virar casa. Um fio azul de varal, esquecido no chão, corria ao lado dela como uma linha desenhada por engano — a única coisa reta numa história torta.`,
    highlightQuote: 'Havia ali uma vida inteira à espera de alguém que reparasse.'
  },
  {
    pageNumber: 4,
    chapter: 'DIA ZERO · ONDE TUDO COMEÇOU',
    bgDark: true,
    imageOnly: true,
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
    title: 'Descartada junto com o lixo',
    caption: 'Deitada sobre um colchão jogado fora, entre sacos pretos e restos de mudança. O fio azul de varal caído no chão viraria, sem que ninguém combinasse, o símbolo desta reportagem.'
  },
  {
    pageNumber: 5,
    chapter: 'CAPÍTULO II · A PROTETORA',
    bgDark: true,
    title: 'A mulher que ouviu o que ninguém ouviu',
    subtitle: 'Existe a coragem de quem escolhe parar, olhar e fazer a diferença. Foi ela que atravessou aquela calçada.',
    bodyText: `Letícia Karla não escutou com os ouvidos — não havia o que ouvir. Escutou com aquilo que só quem resgata desenvolve: a leitura de um corpo que se dobra. Anos atendendo mensagens de madrugada, dirigindo até endereços improváveis e negociando com o próprio bolso ensinam um tipo de escuta que reconhece sofrimento antes de qualquer exame.

Protetor independente é uma categoria que não existe em nenhum organograma. Não tem salário, não tem plantão pago, não tem folga. Tem uma caixa de mensagens que nunca esvazia, uma fila de resgates que nunca encurta e uma conta de clínica que sempre chega antes da doação. E, ainda assim, atende.

Ela agachou. Falou baixo. Estendeu a mão devagar, do jeito que se estende a mão para quem já apanhou da vida e aprendeu a desconfiar de mãos. E então fez a única pergunta que importa nesse instante — a que separa quem observa de quem age.

Não levou uma cachorra. Levou uma decisão. Porque resgate não termina no colo nem na foto: começa ali.`,
    quoteCallout: '“Se eu não levar essa cachorra agora, quem leva?” — O instante em que uma testemunha vira responsável.',
    highlightQuote: 'Ninguém salva ninguém de passagem. Salva-se quem para.'
  },
  {
    pageNumber: 6,
    chapter: 'CAPÍTULO III · A CLÍNICA',
    bgDark: true,
    imageOnly: true,
    imageUrl: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=1200',
    stickerText: 'Estamos aqui com ela na clínica 🙏',
    title: '“Estamos aqui com ela”',
    caption: 'Cinco palavras, um plural e uma prece. O plural é o que muda tudo: nenhum resgate se sustenta sozinho.'
  },
  {
    pageNumber: 7,
    chapter: 'CAPÍTULO III · UM NOME',
    bgDark: true,
    title: 'O dia em que ela passou a existir',
    subtitle: 'Mesa de inox, azulejo branco, o cheiro que todo mundo que já esperou por um diagnóstico reconhece. Ela não sabia o que era aquilo. Só sabia que alguém tinha ficado.',
    bodyText: `E ficar, aqui, é a palavra inteira. Enquanto os profissionais trabalhavam, do lado de fora corria a outra metade do resgate: as mensagens, as fotos enviadas para quem acompanhava, o pedido de ajuda, o grupo mobilizado. Um resgate é sempre duas coisas ao mesmo tempo — um procedimento clínico e uma corrente de gente.

Ali ela ganhou o que nunca tinha tido: um nome, uma ficha, um horário de medicação. Passou a existir para o sistema.

E, quando alguém precisou preencher o cabeçalho do prontuário, escolheram a palavra mais óbvia e mais improvável para quem tinha sido encontrada no lixo:`,
    bigWord: 'Vida.'
  },
  {
    pageNumber: 8,
    chapter: 'CAPÍTULO IV · A ROTINA',
    bgDark: true,
    imageOnly: true,
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=1200',
    title: 'Um mundo do tamanho de um tapete',
    caption: 'Faixa branca no corpo, toalha dobrada ao lado, uma almofada de rosquinhas virando travesseiro e o potinho rosa sempre no mesmo lugar. Pequeno, sim. E, pela primeira vez em muito tempo, seguro.'
  },
  {
    pageNumber: 9,
    chapter: 'CAPÍTULO IV · FAIXA E CHÃO',
    bgDark: true,
    title: 'A parte da história que ninguém fotografa',
    subtitle: 'O heroísmo é fotogênico. A rotina não é. E é na rotina que a maioria das histórias bonitas se perde.',
    bodyText: `A recuperação não é um momento: é uma sequência longa de dias iguais. Quem cuida sabe que o corpo melhora antes da confiança. Muito antes de voltar a andar, ela precisou voltar a acreditar que a porta que se abre não é ameaça.

Isso não se trata com medicamento. Trata-se com repetição — a mesma voz, o mesmo cheiro, a mesma mão, todos os dias, até que o susto desaprenda.

Depois vieram as agulhas. Finas, quase invisíveis, espetadas na cabeça e no dorso: acupuntura veterinária, aliada silenciosa do controle da dor. Alguém prendeu dois lacinhos coloridos no pelo — detalhe irrelevante do ponto de vista clínico, enorme do ponto de vista humano.

Foi ali, em algum dia sem importância, que ela deixou de ser um caso e virou alguém.`,
    quoteCallout: 'Alguém que ganha laço. Alguém que dorme durante a sessão. (O que não cabe no prontuário)'
  },
  {
    pageNumber: 10,
    chapter: 'CAPÍTULO V · AGULHAS QUE NÃO DOEM',
    bgDark: true,
    imageOnly: true,
    imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200',
    title: 'Dormir sem vigiar a rua',
    caption: 'Para um animal resgatado, isso é uma conquista clínica tão real quanto qualquer exame. Aqui, o sono não é de exaustão: é de descanso.'
  },
  {
    pageNumber: 11,
    chapter: 'CAPÍTULO VI · REABILITAÇÃO',
    bgDark: true,
    title: 'Aqui, a vitória se mede em milímetros',
    subtitle: 'Aparelho, eletrodos, faixas no tronco, bola laranja encostada na parede. De um lado, tecnologia. Do outro, uma veterinária sentada no chão.',
    bodyText: `Reabilitação é engenharia aplicada à esperança. Mede-se em amplitude de movimento, em tempo de sustentação, em número de repetições. E se comemora em detalhes mínimos: hoje ela apoiou a pata. Hoje ficou de pé três segundos a mais. Hoje andou até a porta sozinha.

Nada disso vira manchete. Tudo isso é o que devolve uma vida.

Aquilo que começou como socorro virou protocolo. E protocolo, quando há quem o cumpra todos os dias, é outro nome para amor.`,
    timeline: [
      { step: 'Rua', detail: 'Onde ela foi encontrada no lixo' },
      { step: 'Clínica', detail: 'Estabilização e diagnóstico' },
      { step: 'Casa', detail: 'Curativos, medicação e rotina' },
      { step: 'Reabilitação', detail: 'Acupuntura e fisioterapia' }
    ]
  },
  {
    pageNumber: 12,
    chapter: 'CAPÍTULO VI · A EQUIPE',
    bgDark: true,
    imageOnly: true,
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200',
    stickerText: 'Tô fazendo minha fisioterapia, titios!\n@dramarciasm @renatapessoa.vet',
    title: '“Tô fazendo minha fisioterapia, titios!”',
    caption: 'Acompanhamento clínico e sessões de reabilitação conduzidas pela equipe veterinária responsável pelo caso. Cada sessão, um milímetro a mais de autonomia.'
  },
  {
    pageNumber: 13,
    chapter: 'CAPÍTULO VII · A COROA',
    bgDark: true,
    imageOnly: true,
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1200',
    stickerText: '👑 Princesa Vida',
    title: 'Ninguém coroa quem se desistiu de salvar',
    caption: 'Um adesivo de coroa cor-de-rosa na testa, torto e brilhante. É a fotografia mais boba deste especial e, por isso mesmo, a mais importante: coroa se coloca em quem está de volta.'
  },
  {
    pageNumber: 14,
    chapter: 'CAPÍTULO VIII · VIDA',
    bgDark: true,
    title: 'O pelo voltou. O nome ficou.',
    subtitle: 'Cachorro ri — quem convive sabe. É a boca aberta, a língua pendurada e o corpo relaxado de quem já não precisa vigiar nada.',
    bodyText: `Hoje ela senta no corredor, entre a parede de tijolinho e o muro azul, fecha os olhos de tanto sol e ri. Usa uma coleira colorida que alguém escolheu com carinho num dia comum de semana.

Hoje ela deita na varanda com uma bandana florida e ocupa o espaço inteiro sem pedir licença, do jeito que faz quem tem certeza de que aquele chão é dela.

Nada nessa cena lembra o colchão da calçada. Tudo nessa cena depende dele.`,
    highlightQuote: '“O silêncio da dor não pede ajuda. Ele só espera que alguém repare.”'
  },
  {
    pageNumber: 15,
    chapter: 'ANTES E DEPOIS · A MESMA CADELA',
    bgDark: true,
    comparison: true,
    leftImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800',
    leftLabel: 'O DIA EM QUE FOI ACHADA (Praça / Sacos de Lixo)',
    rightImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
    rightLabel: 'O DIA DE HOJE (Princesa Recuperada na Varanda)',
    highlightQuote: 'Antes e depois não é um par de fotos. É uma fila de dias em que alguém não desistiu.'
  },
  {
    pageNumber: 16,
    chapter: 'CONCLUSÃO & FICHA TÉCNICA',
    bgDark: true,
    title: 'Ela não precisou de um milagre',
    subtitle: 'Precisou de alguém que parasse, olhasse e agisse. Tudo o que você viu nestas páginas existe porque uma mulher decidiu não seguir em frente sem fazer nada.',
    bodyText: `No Brasil, o resgate animal é sustentado em grande parte por pessoas físicas que fazem sozinhas o trabalho de uma estrutura inteira: capturam, transportam, custeiam, medicam, reabilitam e ainda encontram lar. Letícia Karla é uma delas.

Cada história como a de Vida se apoia em uma cadeia real de custos — consulta, exames, internação, medicação contínua, sessões de fisioterapia e acupuntura, alimentação e transporte. Não é sentimento: é orçamento. E é por isso que apoiar quem resgata vale mais do que compartilhar quem resgata.`,
    howToHelpBox: true,
    credits: {
      special: 'ESPECIAL GRIT NEWS · TENPETS',
      textEdition: 'TASSO VASCONCELOS',
      rescueTracking: 'LETÍCIA KARLA',
      images: 'ACERVO DA PROTETORA'
    }
  }
];

export const PdfReportageModal: React.FC<PdfReportageModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const page = REPORTAGE_PAGES[currentPage - 1];

  const handleDownloadPdf = () => {
    onShowToast('Aguarde... Baixando Edição Especial em PDF (16 Páginas)...', 'info');
    // Open dedicated printable PDF HTML view or trigger print
    const win = window.open('/artigo-vida-especial.html', '_blank');
    if (win) {
      win.focus();
    } else {
      window.print();
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      onShowToast('Link da Edição Especial em PDF copiado com sucesso!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-fadeIn">
      {/* Modal Box Container */}
      <div className="bg-[#0b1727] text-slate-100 w-full max-w-5xl h-[94vh] flex flex-col rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="bg-[#0f2137] px-4 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
              PDF
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>A Vida da Vida</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                  Edição Impressa 16 Páginas
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Special Editorial Reportage · GRIT NEWS & TENPETS</p>
            </div>
          </div>

          {/* Quick Page Jump Selector */}
          <div className="flex items-center gap-2">
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {REPORTAGE_PAGES.map((p) => (
                <option key={p.pageNumber} value={p.pageNumber}>
                  Pág. {p.pageNumber} de 16 — {p.chapter}
                </option>
              ))}
            </select>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-white cursor-pointer"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-amber-400">
                {currentPage} / 16
              </span>
              <button
                disabled={currentPage === 16}
                onClick={() => setCurrentPage((p) => Math.min(16, p + 1))}
                className="p-1 rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-white cursor-pointer"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions: Download / Print / Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-600 cursor-pointer hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleShare}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-xl text-xs font-bold border border-slate-600 cursor-pointer"
              title="Compartilhar Link PDF"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Page Canvas Viewer Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#070e17] flex justify-center items-start">
          <div
            className="w-full max-w-2xl bg-[#0B1A2C] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-10 space-y-6 relative text-slate-100 transition-all duration-300 min-h-[600px] flex flex-col justify-between"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Page Header Indicator */}
            <div className="flex justify-between items-center text-[10px] font-extrabold tracking-widest text-amber-400/80 uppercase border-b border-slate-800 pb-3">
              <span>{page.chapter}</span>
              <span>G R I T  N E W S  ·  T E N P E T S</span>
            </div>

            {/* Page Body Content */}
            <div className="flex-1 space-y-6">
              {/* Cover Page Special Layout */}
              {page.pageNumber === 1 && (
                <div className="space-y-6 text-center py-6">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                    <img src={page.heroImage} alt="Vida Capa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase bg-slate-900/80 px-2.5 py-1 rounded-md border border-amber-500/40">
                        {page.badge}
                      </span>
                    </div>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-amber-300 font-serif leading-tight">
                    {page.title}
                  </h1>
                  <p className="text-lg italic text-slate-200 font-serif border-l-2 border-amber-400 pl-4 text-left">
                    “{page.subtitle}”
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed text-left">
                    {page.bodyText}
                  </p>
                </div>
              )}

              {/* Standard Text Chapter */}
              {page.title && page.pageNumber !== 1 && (
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-300 border-l-4 border-amber-500 pl-3">
                    {page.title}
                  </h2>
                  {page.subtitle && (
                    <p className="text-sm sm:text-base italic text-amber-200/90 font-serif bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      {page.subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Body Text */}
              {page.bodyText && page.pageNumber !== 1 && (
                <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line space-y-4">
                  {page.bodyText}
                </div>
              )}

              {/* Highlight Quotes */}
              {page.highlightQuote && (
                <div className="my-4 p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-r-2xl font-serif text-amber-200 text-lg italic">
                  “{page.highlightQuote}”
                </div>
              )}

              {/* Big Word Callout */}
              {page.bigWord && (
                <div className="py-6 text-center">
                  <span className="text-5xl font-black font-serif text-amber-400 tracking-wider">
                    {page.bigWord}
                  </span>
                </div>
              )}

              {/* Quote Callout */}
              {page.quoteCallout && (
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-amber-300 text-sm font-semibold italic">
                  {page.quoteCallout}
                </div>
              )}

              {/* Full Image Block */}
              {page.imageOnly && page.imageUrl && (
                <div className="space-y-3 my-4">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 shadow-xl group">
                    <img src={page.imageUrl} alt={page.title} className="w-full h-full object-cover" />
                    {page.stickerText && (
                      <div className="absolute bottom-3 left-3 bg-slate-900/90 text-amber-300 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-lg whitespace-pre-line">
                        {page.stickerText}
                      </div>
                    )}
                  </div>
                  {page.caption && (
                    <p className="text-xs text-slate-300 italic text-center px-2">
                      📸 {page.caption}
                    </p>
                  )}
                </div>
              )}

              {/* Timeline Display for Page 11 */}
              {page.timeline && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 pt-4 border-t border-slate-800">
                  {page.timeline.map((t, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-center">
                      <span className="block font-bold text-amber-400 text-xs">{t.step}</span>
                      <span className="text-[11px] text-slate-300 leading-tight">{t.detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Comparison Page 15 */}
              {page.comparison && (
                <div className="space-y-4 my-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-700 space-y-2">
                      <img src={page.leftImage} alt="Antes" className="w-full h-44 object-cover rounded-xl" />
                      <span className="block text-[10px] font-bold text-amber-400 text-center">
                        {page.leftLabel}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-700 space-y-2">
                      <img src={page.rightImage} alt="Hoje" className="w-full h-44 object-cover rounded-xl" />
                      <span className="block text-[10px] font-bold text-emerald-400 text-center">
                        {page.rightLabel}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* How to help box page 16 */}
              {page.howToHelpBox && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl space-y-2 text-xs">
                  <span className="font-extrabold text-emerald-400 uppercase tracking-wider block">
                    ❤️ COMO AJUDAR PROTETORES INDEPENDENTES
                  </span>
                  <p className="text-emerald-100">
                    Acompanhe e divulgue o trabalho de protetores independentes da sua cidade. Contribua com o custeio dos tratamentos em curso. Ofereça lar temporário. E, quando for a hora, adote.
                  </p>
                </div>
              )}

              {/* Credits page 16 */}
              {page.credits && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] space-y-1 text-slate-300">
                  <div className="font-bold text-amber-400">{page.credits.special}</div>
                  <div>• Texto e Edição: <strong>{page.credits.textEdition}</strong></div>
                  <div>• Resgate e Acompanhamento: <strong>{page.credits.rescueTracking}</strong></div>
                  <div>• Imagens: <strong>{page.credits.images}</strong></div>
                </div>
              )}
            </div>

            {/* Page Footer Navigation */}
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>PÁGINA {page.pageNumber} DE 16</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-white text-[11px] font-bold cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  disabled={currentPage === 16}
                  onClick={() => setCurrentPage((p) => Math.min(16, p + 1))}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-30 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Próxima Pág.
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
