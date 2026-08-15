import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Search, 
  Send, 
  ShieldCheck, 
  FileCheck, 
  ExternalLink, 
  Scale, 
  Award, 
  Filter, 
  Clock, 
  UserCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FactCheckItem {
  id: string;
  title: string;
  claim: string;
  verdict: 'VERDADEIRO' | 'FALSO' | 'DISTORCIDO' | 'EM_ANALISE';
  verdictSummary: string;
  category: 'Economia' | 'Saúde' | 'Pets' | 'Tecnologia' | 'Política';
  date: string;
  author: string;
  origin: string; // e.g. "Áudio de WhatsApp", "Vídeo no TikTok", "Post no X"
  sourcesExamined: string[];
  fullExplanation: string[];
  evidenceImageUrl?: string;
}

const FACT_CHECKS: FactCheckItem[] = [
  {
    id: 'fc-1',
    title: 'Áudio com voz de economista prevendo confisco de investimentos na transição do IBS/CBS é falso e usa IA',
    claim: 'Áudio viralizado no WhatsApp afirma que o novo sistema tributário bloqueará automaticamente até 15% das contas bancárias corporativas para compensação fiscal.',
    verdict: 'FALSO',
    verdictSummary: 'A gravação é um deepfake sintético gerado por modelo de clonagem vocal. Não há qualquer previsão legal ou mecanismo de confisco monetário no texto da Reforma Tributária.',
    category: 'Economia',
    date: '14 de Agosto de 2026',
    author: 'Dr. Moacir Rocha & Núcleo GRIT Fato',
    origin: 'Áudios encaminhados em grupos de WhatsApp e Telegram',
    sourcesExamined: [
      'Texto aprovado da Emenda Constitucional da Reforma Tributária',
      'Análise espectral de áudio com ferramenta de detecção de IA',
      'Nota oficial do Ministério da Fazenda e Receita Federal'
    ],
    fullExplanation: [
      'Nossa equipe de perícia digital submeteu o áudio a três detectores neurais de sintetização de voz, obtendo 99,4% de probabilidade de geração artificial por software de clonagem.',
      'O texto legal do IBS e da CBS trata exclusivamente da incidência sobre o consumo de mercadorias e prestação de serviços, sem qualquer interferência na custódia de saldos bancários ou investimentos privados.',
      'A disseminação de boatos sobre retenção de ativos financeiros visa gerar pânico no varejo e induzir contratações fraudulentas de supostas "consultorias de blindagem ilegal".'
    ]
  },
  {
    id: 'fc-2',
    title: 'STJ reconheceu a possibilidade de guarda compartilhada e pensão alimentícia para animais de estimação',
    claim: 'Tribunais brasileiros agora obrigam ex-cônjuges a custear ração especial e plano de saúde veterinário para pets em processos de divórcio.',
    verdict: 'VERDADEIRO',
    verdictSummary: 'A 3ª e a 4ª Turmas do Superior Tribunal de Justiça consolidaram entendimento de que os animais integram a família multiespécie e possuem tutela afetiva específica.',
    category: 'Pets',
    date: '13 de Agosto de 2026',
    author: 'Letícia Karla (TenPets)',
    origin: 'Notícias jurídicas e debates em redes sociais',
    sourcesExamined: [
      'Acórdãos do Superior Tribunal de Justiça (REsp 1.713.167 e precedentes recentes)',
      'Jurisprudência dos Tribunais de Justiça de SP, RJ e CE',
      'Pareceres de comissões de Direito Animal da OAB'
    ],
    fullExplanation: [
      'O STJ entendeu que, embora o Código Civil ainda classifique animais como bens em alguns artigos, a dignidade dos seres sencientes impõe a divisão equilibrada dos encargos de criação.',
      'A decisão estabelece que o bem-estar do pet deve prevalecer, permitindo ao magistrado fixar dias de convivência e rateio de despesas comprovadas de saúde e nutrição.'
    ]
  },
  {
    id: 'fc-3',
    title: 'Receita Federal acabou com toda e qualquer isenção para medicamentos importados',
    claim: 'Publicação no Instagram afirma que pacientes que importam remédios de alto custo pagarão 60% de imposto compulsoriamente a partir deste mês.',
    verdict: 'DISTORCIDO',
    verdictSummary: 'A portaria federal manteve a alíquota zero para medicamentos destinados a pessoas físicas cadastrados na Anvisa ou importados sob prescrição médica nominal.',
    category: 'Saúde',
    date: '12 de Agosto de 2026',
    author: 'Dra. Camila Torres',
    origin: 'Carrossel patrocinado no Instagram e Meta Ads',
    sourcesExamined: [
      'Diário Oficial da União (Portaria Conjunta RFB/Anvisa)',
      'Lista oficial de medicamentos com regime de tributação simplificada com isenção',
      'Associação Brasileira de Importadores de Medicamentos'
    ],
    fullExplanation: [
      'O post mistura o fim da isenção geral de bens de consumo do comércio eletrônico comum com as regras estritas de insumos e fármacos essenciais de saúde.',
      'Pacientes portadores de laudo médico e receita continuam amparados pelo regime de alíquota zero para importações de caráter humanitário e terapêutico.'
    ]
  },
  {
    id: 'fc-4',
    title: 'Ceará atingiu autossuficiência de 100% em geração de energia renovável na matriz diurna',
    claim: 'Estado do Nordeste gerou mais eletricidade eólica e solar do que toda a sua demanda de consumo durante o horário comercial.',
    verdict: 'VERDADEIRO',
    verdictSummary: 'Dados do ONS comprovam que o volume gerado nos complexos eólicos e usinas fotovoltaicas cearenses ultrapassou o consumo instantâneo do estado, exportando excedente.',
    category: 'Tecnologia',
    date: '10 de Agosto de 2026',
    author: 'Renato Silva',
    origin: 'Relatório do Operador Nacional do Sistema Elétrico',
    sourcesExamined: [
      'Boletim Diário de Operação do ONS',
      'Secretaria de Infraestrutura e Energia do Estado do Ceará',
      'Associação Brasileira de Energia Solar Fotovoltaica (ABSOLAR)'
    ],
    fullExplanation: [
      'Durante a chamada "safra dos ventos" e nos horários de pico solar (11h às 15h), a geração renovável atinge até 115% da carga total exigida pelo estado do Ceará.',
      'O excedente elétrico é injetado no Sistema Interligado Nacional (SIN), abastecendo outros estados e habilitando a infraestrutura de data centers verdes no litoral.'
    ]
  },
  {
    id: 'fc-5',
    title: 'Mistura caseira com vinagre e limão em jejum reverte gordura no fígado avançada em 7 dias',
    claim: 'Vídeo com mais de 3 milhões de visualizações no TikTok garante que receita caseira substitui exames e tratamento para esteatose hepática.',
    verdict: 'FALSO',
    verdictSummary: 'Não há respaldo fisiológico ou ensaio clínico comprovando ação desengordurante hepática por vinagre. A esteatose exige reeducação alimentar, exercício e acompanhamento médico.',
    category: 'Saúde',
    date: '08 de Agosto de 2026',
    author: 'Dra. Camila Torres',
    origin: 'Vídeo viral no TikTok e Shorts do YouTube',
    sourcesExamined: [
      'Sociedade Brasileira de Hepatologia (SBH)',
      'Diretrizes da Associação Americana para o Estudo de Doenças do Fígado (AASLD)',
      'Bases de dados PubMed e SciELO'
    ],
    fullExplanation: [
      'A ingestão excessiva de ácidos em jejum pode provocar gastrite, esofagite e erosão do esmalte dentário sem alterar o acúmulo de triglicerídeos nos hepatócitos.',
      'O tratamento eficaz baseia-se na perda gradual de peso (7% a 10%), restrição de açúcares refinados, controle da resistência à insulina e atividade física regular.'
    ]
  }
];

interface GritFatoViewProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const GritFatoView: React.FC<GritFatoViewProps> = ({ onShowToast }) => {
  const [selectedVerdict, setSelectedVerdict] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>('fc-1');

  // Submit claim state
  const [claimUrl, setClaimUrl] = useState('');
  const [claimText, setClaimText] = useState('');
  const [claimSenderName, setClaimSenderName] = useState('');
  const [isClaimSubmitted, setIsClaimSubmitted] = useState(false);

  const filteredChecks = FACT_CHECKS.filter(item => {
    const matchesVerdict = selectedVerdict === 'TODOS' || item.verdict === selectedVerdict;
    const matchesCategory = selectedCategory === 'TODAS' || item.category === selectedCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.verdictSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVerdict && matchesCategory && matchesSearch;
  });

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) {
      onShowToast('Descreva a afirmação ou boato que você deseja checar.', 'info');
      return;
    }
    setIsClaimSubmitted(true);
    onShowToast('Solicitação de checagem enviada à redação do GRIT Fato!', 'success');
  };

  const getBadgeVerdict = (verdict: FactCheckItem['verdict']) => {
    switch (verdict) {
      case 'VERDADEIRO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full border border-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>VERDADEIRO</span>
          </span>
        );
      case 'FALSO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 font-black text-xs rounded-full border border-rose-300">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>FALSO</span>
          </span>
        );
      case 'DISTORCIDO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 font-black text-xs rounded-full border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>DISTORCIDO</span>
          </span>
        );
      case 'EM_ANALISE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 font-black text-xs rounded-full border border-blue-300">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>EM ANÁLISE</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Header Fact-Checking */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white pt-10 pb-12 border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Agência Independente de Checagem de Fatos</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                <span>GRIT Fato</span>
                <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-md uppercase tracking-wide align-middle">
                  Verificado
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Desmascarando desinformação, deepfakes e mitos com rigor científico, verificação documental e transparência de fontes.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-700/60 p-4 rounded-2xl flex flex-col gap-2 min-w-[260px] shadow-xl text-xs">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>Critérios Editoriais E-E-A-T</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-slate-300">
                Auditamos cada pauta com no mínimo <strong>3 fontes primárias</strong> e ferramentas de perícia digital.
              </p>
            </div>
          </div>

          {/* Quick Search and Filter Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar boato, notícia ou alegação..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="text-slate-400 text-[11px] uppercase mr-1">Veredito:</span>
              {(['TODOS', 'FALSO', 'VERDADEIRO', 'DISTORCIDO'] as const).map(verdict => (
                <button
                  key={verdict}
                  onClick={() => setSelectedVerdict(verdict)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedVerdict === verdict 
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {verdict}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 relative z-20 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Principal: Lista de Checagens */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Checagens Recentes</h2>
                <p className="text-xs text-slate-500">Exibindo {filteredChecks.length} investigações concluídas com selo de verificação</p>
              </div>
            </div>

            <div className="space-y-4">
              {filteredChecks.map(item => {
                const isExpanded = expandedCheckId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div 
                      onClick={() => setExpandedCheckId(isExpanded ? null : item.id)}
                      className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getBadgeVerdict(item.verdict)}
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.date}</span>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      {/* Alegação em Destaque */}
                      <div className="mt-3 p-3.5 bg-slate-50 border-l-4 border-slate-300 rounded-r-xl text-xs text-slate-700 italic">
                        <strong>O que diz o boato:</strong> “{item.claim}”
                      </div>

                      {/* Resumo do Veredito */}
                      <div className="mt-3 text-xs text-slate-800 leading-relaxed font-medium">
                        <strong>Por que chegamos a essa conclusão:</strong> {item.verdictSummary}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Checado por: <strong>{item.author}</strong></span>
                        </span>
                        <button className="font-bold text-blue-600 flex items-center gap-1">
                          <span>{isExpanded ? 'Ocultar detalhes' : 'Ver evidências e fontes'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Bloco Expandido de Evidências */}
                    {isExpanded && (
                      <div className="bg-slate-50/80 p-5 sm:p-6 border-t border-slate-200 space-y-4 text-xs">
                        <div>
                          <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            <span>Análise Detalhada das Evidências</span>
                          </h4>
                          <div className="space-y-2 text-slate-700 leading-relaxed">
                            {item.fullExplanation.map((p, idx) => (
                              <p key={idx}>{p}</p>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-blue-600" />
                            <span>Documentos e Fontes Oficiais Consultadas</span>
                          </h4>
                          <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            {item.sourcesExamined.map((src, idx) => (
                              <li key={idx}>{src}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 text-[11px] text-slate-400">
                          Origem inicial da circulação: <strong>{item.origin}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Lateral: Envio de Boatos & Metodologia */}
          <div className="lg:col-span-4 space-y-6">
            {/* Form de Envio de Boatos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">Envie um Boato para Checagem</h3>
                  <p className="text-[11px] text-slate-500">Viu algo suspeito no WhatsApp ou nas redes?</p>
                </div>
              </div>

              {isClaimSubmitted ? (
                <div className="mt-4 p-4 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Solicitação Protocolada com Sucesso!</span>
                  </div>
                  <p className="font-normal text-slate-600 text-[11px]">
                    Nossa equipe de checadores investigará a alegação. Agradecemos sua colaboração no combate à desinformação!
                  </p>
                  <button
                    onClick={() => setIsClaimSubmitted(false)}
                    className="text-blue-600 text-xs font-bold hover:underline pt-1 block cursor-pointer"
                  >
                    Enviar outro conteúdo
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitClaim} className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Qual é a afirmação suspeita? *</label>
                    <textarea
                      rows={3}
                      placeholder="Cole aqui o texto, mensagem ou resumo do vídeo..."
                      value={claimText}
                      onChange={e => setClaimText(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Link ou Fonte (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: https://tiktok.com/@..."
                      value={claimUrl}
                      onChange={e => setClaimUrl(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Seu Nome ou E-mail (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Para receber o resultado da checagem"
                      value={claimSenderName}
                      onChange={e => setClaimSenderName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar para a Redação</span>
                  </button>
                </form>
              )}
            </div>

            {/* Metodologia de Checagem */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Nossos 5 Passos de Rigor</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">1.</span>
                  <span><strong>Identificação:</strong> Triagem de alegações virais com potencial de dano econômico ou à saúde.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">2.</span>
                  <span><strong>Fontes Primárias:</strong> Acesso direto a autos judiciais, diários oficiais e dados do BC/IBGE.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">3.</span>
                  <span><strong>Perícia Digital:</strong> Análise de metadados, espectrogramas de áudio e engenharia reversa de imagens.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">4.</span>
                  <span><strong>Revisão Cruzada:</strong> Dois editores seniores validam as conclusões antes da publicação.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">5.</span>
                  <span><strong>Direito de Resposta:</strong> Atualização imediata com correções transparentes se novos fatos surgirem.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
