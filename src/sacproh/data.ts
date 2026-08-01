import { SacProhProduct, SacProhTicket, SacProhHospitalContract, SacProhFaq } from './types';

export const INITIAL_SACPROH_PRODUCTS: SacProhProduct[] = [
  {
    id: 'sp-01',
    name: 'Bisturi Eletrônico Monopolar e Bipolar ProCirúrgica HighFreq 300W',
    code: 'PRO-BE-300',
    anvisaRegister: '80239100042',
    category: 'Equipamentos Cirúrgicos',
    description: 'Bisturi de alta frequência com tecnologia microprocessada para corte puro, blend, coagulação spray e modo bipolar. Indicado para cirurgias cardíacas, ortopédicas e vísceras profundas.',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1000',
    manualPdfUrl: '#download-manual-be300',
    technicalDataSheet: 'Potência: 300W RMS | Frequência: 480 kHz | Display Touch HD | Registro ANVISA Ativo',
    warrantyMonths: 24,
    stockStatus: 'DISPONIVEL'
  },
  {
    id: 'sp-02',
    name: 'Autoclave de Baixa Temperatura por Plasma de Peróxido de Hidrogênio 120L',
    code: 'PRO-AUT-120P',
    anvisaRegister: '80239100088',
    category: 'Insumos & Esterilização',
    description: 'Sistema avançado de esterilização a frio para óticas, videocirurgia, cateteres e instrumental sensível ao calor em ciclos rápidos de 35 a 50 minutos.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000',
    manualPdfUrl: '#download-manual-aut120p',
    technicalDataSheet: 'Volume: 120 Litros | Tempo de Ciclo: 35 min | Temperatura Máx: 55°C | ISO 13485',
    warrantyMonths: 36,
    stockStatus: 'DISPONIVEL'
  },
  {
    id: 'sp-03',
    name: 'Kit Cimento Ósseo Ortopédico com Gentamicina e Injetor de Vácuo OPME',
    code: 'PRO-OPME-88',
    anvisaRegister: '80239100105',
    category: 'OPME & Próteses',
    description: 'Insumo ortopédico biocompatível radiopaco com liberação controlada de antibiótico. Acompanha sistema fechado de mistura e aplicação sob vácuo.',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000',
    manualPdfUrl: '#download-manual-opme88',
    technicalDataSheet: 'Registro ANVISA de Prótese/OPME Válido até 2031 | Kit Esterilizado por Radiação Gama',
    warrantyMonths: 12,
    stockStatus: 'EM_TRANSITO'
  },
  {
    id: 'sp-04',
    name: 'Mesa Cirúrgica Eletro-Hidráulica Ergonômica ProCirúrgica Master-500',
    code: 'PRO-MC-500',
    anvisaRegister: '80239100019',
    category: 'Equipamentos Cirúrgicos',
    description: 'Mesa radiotransparente para C-Arm e arco cirúrgico com acionamento elétrico por controle remoto, suporte de carga até 320kg e baterias de emergência.',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000',
    manualPdfUrl: '#download-manual-mc500',
    technicalDataSheet: 'Capacidade Peso: 320 kg | Inclinação Trendelenburg ±30° | Tampo Translúcido para Raio-X',
    warrantyMonths: 24,
    stockStatus: 'DISPONIVEL'
  },
  {
    id: 'sp-05',
    name: 'Caixa de Instrumental Cirúrgico de Titânio para Videolaparoscopia Advanced',
    code: 'PRO-INST-LAP',
    anvisaRegister: '80239100062',
    category: 'Instrumental Cirúrgico',
    description: 'Conjunto completo de pinças, tesouras, trocartes e porta-agulhas de titânio autoclaváveis com acabamento anti-reflexo para procedimentos minimamente invasivos.',
    imageUrl: 'https://images.unsplash.com/photo-1583912267670-657592e19030?auto=format&fit=crop&q=80&w=1000',
    manualPdfUrl: '#download-manual-lap',
    technicalDataSheet: 'Material: Titânio Cirúrgico Grau Médico | 36 Peças com Estojo Inox Perfurado',
    warrantyMonths: 60,
    stockStatus: 'DISPONIVEL'
  }
];

export const INITIAL_SACPROH_TICKETS: SacProhTicket[] = [
  {
    id: 'ticket-101',
    protocolCode: 'SACPROH-2026-8942',
    requesterName: 'Dr. Roberto Meireles (Engenharia Clínica)',
    hospitalName: 'Hospital São Lucas - Centro Cirúrgico',
    cnpj: '01.234.567/0001-89',
    email: 'roberto.eng@saolucas.com.br',
    phone: '(85) 99123-4455',
    category: 'Suporte Técnico Equipamentos',
    subject: 'Solicitação de Calibração Preventiva de Bisturi Eletrônico HighFreq 300W',
    description: 'Necessitamos da calibração anual programada e emissão de certificado técnico do Bisturi SN: BE300-2025-998 em conformidade com as normas da vigilância sanitária.',
    serialNumber: 'BE300-2025-998',
    anvisaRegister: '80239100042',
    status: 'TECNICO_ALOCADO',
    priority: 'ALTA',
    createdAt: '2026-07-28T09:30:00Z',
    updatedAt: '2026-07-29T08:00:00Z',
    assignedTechnician: 'Eng. Carlos Eduardo (Especialista Biomédico)',
    estimatedResolutionTime: '30/07/2026 às 10:00h',
    responseNotes: 'Técnico Especialista Carlos Eduardo alocado para atendimento presencial dia 30/07 às 10:00h com emissão do laudo RDC/ANVISA.'
  },
  {
    id: 'ticket-102',
    protocolCode: 'SACPROH-2026-1029',
    requesterName: 'Dra. Fernanda Albuquerque (Setor de OPME/Compras)',
    hospitalName: 'Rede Hospitalar Pró-Cardíaco',
    cnpj: '98.765.432/0001-10',
    email: 'fernanda.opme@procardiaco.med.br',
    phone: '(11) 98765-1122',
    category: 'Rastreio & Entrega Centro Cirúrgico',
    subject: 'Urgência na entrega de Kit Cimento Ósseo Ortopédico com Gentamicina',
    description: 'Confirmar envio expresso do pedido #49202 para procedimento de emergência agendado para amanhã às 07h00 no Centro Cirúrgico Bloco B.',
    serialNumber: 'PED-49202-OPME',
    anvisaRegister: '80239100105',
    status: 'LOGISTICA_ENTREGA',
    priority: 'EMERGENCIA_CIRURGICA',
    createdAt: '2026-07-29T06:15:00Z',
    updatedAt: '2026-07-29T07:10:00Z',
    assignedTechnician: 'Equipe Logística Express Aérea ProCirúrgica',
    estimatedResolutionTime: 'Hoje às 21:30h',
    responseNotes: 'Carga despachada via Frete Aéreo Dedicado Hospitalar. Código de rastreamento da transportadora em trânsito com previsão de chegada às 21h30.'
  },
  {
    id: 'ticket-103',
    protocolCode: 'SACPROH-2026-3041',
    requesterName: 'Enf. Juliana Ramos (Almoxarifado Central)',
    hospitalName: 'Hospital Monte Klinikum',
    cnpj: '12.345.678/0001-99',
    email: 'juliana.almox@monteklinikum.com.br',
    phone: '(85) 98888-2233',
    category: 'Troca, Devolução & SAC',
    subject: 'Solicitação de substituição de cabo de caneta monopolar selado com avaria',
    description: 'Item entregue na nota #88412 apresentou fissura no isolamento sintético na embalagem externa. Solicitamos reposição imediata sob garantia.',
    serialNumber: 'CAB-MONO-8821',
    anvisaRegister: '80239100042',
    status: 'EM_ANALISE_TECNICA',
    priority: 'MEDIA',
    createdAt: '2026-07-30T11:20:00Z',
    updatedAt: '2026-07-30T11:20:00Z',
    assignedTechnician: 'SAC & Controle de Qualidade ProCirúrgica',
    estimatedResolutionTime: '24 horas',
    responseNotes: 'Em análise com o SAC para envio do código de logística reversa e despacho do novo lote.'
  },
  {
    id: 'ticket-104',
    protocolCode: 'SACPROH-2026-4190',
    requesterName: 'Carlos Mendonça (Gerência Financeira)',
    hospitalName: 'Complexo Hospitalar Santa Isabel',
    cnpj: '44.333.222/0001-55',
    email: 'carlos.fin@santaisabel.org.br',
    phone: '(21) 97111-3344',
    category: 'Faturamento, NFe & Financeiro',
    subject: 'Solicitação de 2ª via do boleto e espelho XML da NFe #9921',
    description: 'Ajuste de vencimento conforme contrato corporativo SLA de 45 dias para quitação de insumos cirúrgicos fornecidos.',
    status: 'CONCLUIDO',
    priority: 'BAIXA',
    createdAt: '2026-07-27T14:00:00Z',
    updatedAt: '2026-07-27T14:25:00Z',
    assignedTechnician: 'Dept. Financeiro & Faturamento',
    estimatedResolutionTime: 'Concluído',
    responseNotes: 'Segunda via com vencimento prorrogado e arquivo XML enviados diretamente ao e-mail informado.'
  },
  {
    id: 'ticket-105',
    protocolCode: 'SACPROH-2026-5521',
    requesterName: 'Dra. Patrícia Fontes (Garantia da Qualidade)',
    hospitalName: 'Instituto de Cirurgia Cardiovascular',
    cnpj: '77.888.999/0001-11',
    email: 'patricia.qualidade@iccardio.com.br',
    phone: '(31) 99444-5566',
    category: 'Documentação & Registro ANVISA',
    subject: 'Laudo de Validação RDC e Certificado ISO 13485 da Autoclave 120P',
    description: 'Solicitamos envio das últimas renovações de registros sanitários ANVISA e laudos de biocompatibilidade para auditoria hospitalar anual.',
    anvisaRegister: '80239100088',
    status: 'CONCLUIDO',
    priority: 'MEDIA',
    createdAt: '2026-07-28T16:40:00Z',
    updatedAt: '2026-07-28T17:10:00Z',
    assignedTechnician: 'Eng. Regulatória ProCirúrgica',
    estimatedResolutionTime: 'Concluído',
    responseNotes: 'Dossiê completo disponibilizado no portal com os links para download direto dos certificados validados.'
  },
  {
    id: 'ticket-106',
    protocolCode: 'SACPROH-2026-6712',
    requesterName: 'Dr. Lucas Viana (Coordenador de Bloco Cirúrgico)',
    hospitalName: 'Hospital Madre Teresa',
    cnpj: '33.222.111/0001-44',
    email: 'lucas.viana@madreteresa.med.br',
    phone: '(31) 98777-6655',
    category: 'Cotação Especial OPME & Insumos',
    subject: 'Cotação corporativa para 15 kits de Instrumental de Titânio Videolaparoscopia',
    description: 'Solicitação de proposta comercial B2B com parcelamento estendido para renovação completa dos arcos de laparoscopia.',
    anvisaRegister: '80239100062',
    status: 'ABERTO',
    priority: 'ALTA',
    createdAt: '2026-07-31T08:10:00Z',
    updatedAt: '2026-07-31T08:10:00Z',
    assignedTechnician: 'Consultor Comercial OPME ProCirúrgica',
    estimatedResolutionTime: '12 horas',
    responseNotes: 'Chamado aberto na mesa de negociações corporativas. Proposta em elaboração.'
  },
  {
    id: 'ticket-107',
    protocolCode: 'SACPROH-2026-7890',
    requesterName: 'Dr. Henrique Sampaio (Chefe UTI Adulto)',
    hospitalName: 'Hospital São Lucas - UTI Geral',
    cnpj: '01.234.567/0001-89',
    email: 'henrique.uti@saolucas.com.br',
    phone: '(85) 99123-9988',
    category: 'Suporte Técnico Equipamentos',
    subject: 'Falha intermitente no módulo de coagulação do Bisturi Eletrônico',
    description: 'Equipamento apresentando aviso de impedância elevada durante procedimento de ressecção. Requer intervenção técnica emergencial.',
    serialNumber: 'BE300-2024-412',
    anvisaRegister: '80239100042',
    status: 'TECNICO_ALOCADO',
    priority: 'EMERGENCIA_CIRURGICA',
    createdAt: '2026-07-31T10:00:00Z',
    updatedAt: '2026-07-31T10:20:00Z',
    assignedTechnician: 'Eng. Biomédico de Plantão 24/7',
    estimatedResolutionTime: '2 horas',
    responseNotes: 'Técnico em deslocamento emergencial com unidade de substituição temporária em cortesia.'
  }
];

export const INITIAL_SACPROH_CONTRACTS: SacProhHospitalContract[] = [
  {
    id: 'contract-01',
    hospitalName: 'Hospital São Lucas Fortaleza',
    cnpj: '01.234.567/0001-89',
    contractTier: 'Platinum Surgical SLA',
    activeEquipmentsCount: 18,
    preventiveMaintenanceCount: 4,
    emergencySlaHours: 2,
    contactPerson: 'Eng. Roberto Meireles',
    phone: '(85) 99123-4455'
  },
  {
    id: 'contract-02',
    hospitalName: 'Rede Hospitalar Pró-Cardíaco',
    cnpj: '98.765.432/0001-10',
    contractTier: 'Gold 24/7',
    activeEquipmentsCount: 32,
    preventiveMaintenanceCount: 8,
    emergencySlaHours: 4,
    contactPerson: 'Dra. Fernanda Albuquerque',
    phone: '(11) 98765-1122'
  },
  {
    id: 'contract-03',
    hospitalName: 'Hospital Monte Klinikum',
    cnpj: '12.345.678/0001-99',
    contractTier: 'Platinum Surgical SLA',
    activeEquipmentsCount: 24,
    preventiveMaintenanceCount: 6,
    emergencySlaHours: 2,
    contactPerson: 'Dr. Otávio Vasconcelos',
    phone: '(85) 98888-2233'
  }
];

export const INITIAL_SACPROH_FAQS: SacProhFaq[] = [
  {
    id: 'faq-1',
    category: 'Atendimento & Plantão',
    question: 'Como acionar o Plantão de Emergência 24/7 para Centro Cirúrgico?',
    answer: 'Para urgências em andamento no centro cirúrgico ou falhas críticas de equipamentos durante procedimentos, acione o canal direto via WhatsApp do Plantão Hospitalar ProCirúrgica ou ligue para 0800-PRO-SURG (0800 776 7874) informando o CNPJ do hospital e número de patrimônio.'
  },
  {
    id: 'faq-2',
    category: 'ANVISA & Qualidade',
    question: 'Onde encontro o Registro ANVISA e Certificado de Calibração dos equipamentos?',
    answer: 'Todos os registros ANVISA, laudos de biocompatibilidade e certificados de aferição das autoclaves, bisturis e kits OPME ficam disponíveis na aba "Catálogo Técnico & ANVISA" no portal SACPROH, com download direto do PDF.'
  },
  {
    id: 'faq-3',
    category: 'Assistência Técnica & Garantia',
    question: 'Qual o prazo de garantia e tempo de resposta técnico (SLA)?',
    answer: 'Os equipamentos ProCirúrgica contam com garantia oficial de 24 a 60 meses. O SLA de atendimento técnico é de até 2 horas para hospitais com contrato Platinum e até 24 horas para manutenção preventiva regular.'
  },
  {
    id: 'faq-4',
    category: 'Faturamento & Troca de Insumos',
    question: 'Como solicitar segunda via de Nota Fiscal ou alteração de boleto hospitalar?',
    answer: 'Acesse o menu "Abrir Chamado SACPROH", selecione a opção "Faturamento, NFe & Financeiro" e informe o número do Pedido ou CNPJ da instituição. Nosso depto financeiro enviará o PDF e XML em menos de 15 minutos.'
  }
];
