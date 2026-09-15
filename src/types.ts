export type { GovernanceConfig, GovernanceSettings } from './config/governanceConfig';

export type RiskLevel = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type ActionStatus = 'Aguardando' | 'Em andamento' | 'Concluído' | 'Cancelado';
export type ActionPriority = 'Crítica' | 'Alta' | 'Média' | 'Baixa';

export type UserRole = 'admin' | 'padrao';

export type ProjectStage =
  | 'Levantamento & Ficha'
  | 'Diagnóstico de Risco'
  | 'Plano de Ação / Adequação'
  | 'Homologação TI'
  | 'Em Produção / Operação'
  | 'Sustentação'
  | 'Bloqueado / Aguardando';

export type ExecutivePriority =
  | 'P0 - Urgente'
  | 'P1 - Alta'
  | 'P1 - Alta Prioridade'
  | 'P2 - Média'
  | 'P3 - Baixa'
  | 'Backlog';

// --- Navegação Mestre-Detalhe ---
export type ProjectTab = 'glpi' | 'diagnostic' | 'action_plan' | 'evolution' | 'estimation';

export type Route =
  | { name: 'portfolio' }
  | { name: 'project'; projectId: string; tab: ProjectTab }
  | { name: 'settings' };

// --- Eixo 2 & Governança Low-Code / Vibe Coding ATTO ---
export type ProjectType = 'A' | 'B' | 'C'; // A=Google Workspace/App Script · B=Container/VPS · C=No-code/externo
export type GenerationTool = 'Codex' | 'Claude Code' | 'Gemini (copia-e-cola)' | 'ChatGPT' | 'Manual' | 'Outro';
export type GovStage = 'E0' | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'Concluído';

export interface ModuleToggle {
  id: string;
  label: string;
  applied: boolean;
}

export interface DiscountToggle {
  id: string;
  label: string;
  declared: boolean;
  confirmed: boolean;
}

export interface EstimationInputs {
  projectType: ProjectType;
  generationTool?: GenerationTool;
  startDate: string;
  modules: ModuleToggle[];
  discounts: DiscountToggle[];
}

export interface StageSchedule {
  stageId: GovStage;
  stageName: string;
  baseHours: number;
  modulesHours: number;
  discountHours: number;
  totalHours: number;
  meetingsCount: number;
  externalDepsCount: number;
  workDays: number;
  waitDays: number;
  startDate: string;
  endDate: string;
}

export interface EstimationResult {
  effortBaseHours: number;
  effortModulesHours: number;
  effortDiscountHours: number;
  effortTotalHours: number;
  effortPotentialHours: number;
  meetingsCount: number;
  externalDepsCount: number;
  optimistic: {
    activeDays: number;
    agendaDays: number;
    totalDays: number;
    deliveryDate: string;
  };
  realistic: {
    activeDays: number;
    agendaDays: number;
    totalDays: number;
    deliveryDate: string;
  };
  stages: StageSchedule[];
}

export interface ActionItem {
  id: number;
  title: string;
  responsible: string;
  deadline: string;
  priority: ActionPriority;
  status: ActionStatus;
  riskPointsImpact: number; // How many points this action reduces
  dimension: 'Segurança' | 'LGPD' | 'Operacional' | 'Governança';
  notes?: string;
  completionDate?: string;
  evidence?: string;
}

export interface RiskCriterion {
  id: string;
  criterion: string;
  evidence: string;
  points: number;
  dimension: 'Segurança' | 'LGPD' | 'Operacional';
  mitigatedByActionIds?: number[];
}

export interface SheetBaseInfo {
  name: string;
  category: 'Operacional' | 'Origem / Normalização' | 'Integrações / ERP' | 'Transferências' | 'Fórmula' | 'Histórico / Logs';
  purpose: string;
  sensitivity: 'Alta' | 'Média' | 'Baixa';
  linesEstimated?: string;
}

export interface ProjectActivityLog {
  id: string;
  date: string;
  description: string;
  hours: number;
  stage: GovStage;
  registeredBy: string;
  timestamp?: string;
  author?: string;
  action?: string;
  details?: string;
}

export interface SolutionProject {
  id: string;
  name: string;
  glpiTicketId: string;
  assetId: string;
  department: string;
  businessResponsible: string;
  technicalResponsible: string;
  status: 'Uso' | 'Homologação' | 'Em Adequação' | 'Descontinuado';
  stage?: ProjectStage;
  // Novo Eixo 2 e Governança
  projectType?: ProjectType;
  generationTool?: GenerationTool;
  govStage?: GovStage;
  estimation?: EstimationInputs;
  executivePriority?: ExecutivePriority;
  isPriorityForManagement?: boolean;
  notes?: string;
  notificationStatus?: string;
  hasImpediment?: boolean;
  impedimentDetails?: string;
  actionRequiredFromManagement?: string;
  scheduledDate?: string;
  scheduledSubject?: string;
  createdAt: string;
  lastUpdated: string;
  registeredBy: string;
  groupEncargado: string;
  userGroup: string;
  objective: string;
  initialDoc: string;
  qrCodeUrl: string;
  activityLogs?: ProjectActivityLog[];
  activityLog?: ProjectActivityLog[];
  exitCriteriaChecked?: Record<string, boolean>;
  links: {
    spreadsheet?: string;
    script?: string;
    internalPanel?: string;
    externalPortal?: string;
    githubRepo?: string;
  };
  initialScore: number;
  initialRisk: RiskLevel;
  dimensionsInitial: {
    seguranca: number;
    lgpd: number;
    operacional: number;
  };
  criteria: RiskCriterion[];
  actionPlan: ActionItem[];
  sheetsCatalog: SheetBaseInfo[];
  technicalDoc: {
    version: string;
    classification: string;
    frontend: string;
    backend: string;
    database: string;
    integrations: string;
    pdfGeneration: string;
    emailDispatch: string;
    hosting: string;
    environments: string;
    domain: string;
    aiAssistance: string;
    backupData: string;
    backupCode: string;
    incidentHandling: string;
    featureRollout: string;
    versionControl: string;
    contingency: string;
    maturity: string;
    personalDataSummary: string;
    pdfStorageSummary: string;
    legalBasis: string;
    confidentialDataSummary: string;
    retentionPolicy: string;
    logsSummary: string;
    accessControlSummary: string;
    accountsSummary: string;
    credentialsSummary: string;
  };
}
