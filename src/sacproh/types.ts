export type SacProhPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA_CIRURGICA';

export type SacProhTicketStatus = 
  | 'ABERTO' 
  | 'EM_ANALISE_TECNICA' 
  | 'TECNICO_ALOCADO' 
  | 'LOGISTICA_ENTREGA' 
  | 'CONCLUIDO' 
  | 'CANCELADO';

export type SacProhTicketCategory = 
  | 'Suporte Técnico Equipamentos'
  | 'Rastreio & Entrega Centro Cirúrgico'
  | 'Troca, Devolução & SAC'
  | 'Faturamento, NFe & Financeiro'
  | 'Documentação & Registro ANVISA'
  | 'Cotação Especial OPME & Insumos';

export interface SacProhTicket {
  id: string;
  protocolCode: string;
  requesterName: string;
  hospitalName: string;
  cnpj?: string;
  email: string;
  phone: string;
  category: SacProhTicketCategory;
  subject: string;
  description: string;
  serialNumber?: string;
  anvisaRegister?: string;
  status: SacProhTicketStatus;
  priority: SacProhPriority;
  createdAt: string;
  updatedAt: string;
  responseNotes?: string;
  assignedTechnician?: string;
  estimatedResolutionTime?: string;
}

export interface SacProhProduct {
  id: string;
  name: string;
  code: string;
  anvisaRegister: string;
  category: 'Equipamentos Cirúrgicos' | 'OPME & Próteses' | 'Instrumental Cirúrgico' | 'Insumos & Esterilização' | 'Bisturis & Módulos';
  description: string;
  imageUrl: string;
  manualPdfUrl?: string;
  technicalDataSheet?: string;
  warrantyMonths: number;
  stockStatus: 'DISPONIVEL' | 'EM_TRANSITO' | 'SOB_CONSULTA';
}

export interface SacProhHospitalContract {
  id: string;
  hospitalName: string;
  cnpj: string;
  contractTier: 'Gold 24/7' | 'Platinum Surgical SLA' | 'Standard Care';
  activeEquipmentsCount: number;
  preventiveMaintenanceCount: number;
  emergencySlaHours: number;
  contactPerson: string;
  phone: string;
}

export interface SacProhFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
}
