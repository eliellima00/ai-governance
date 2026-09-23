import { GovStage, ProjectType } from '../types';
import {
  ESTIMATION_CONFIG,
  STAGES_BASE_CONFIG,
  MODULES_CATALOG,
  DISCOUNTS_CATALOG,
  STAGE_NAMES,
  STAGE_DESCRIPTIONS,
  MEETINGS_CHECKLIST,
  CRITICAL_FINDINGS_CHECKLIST,
  EXIT_CRITERIA_CHECKLIST,
  PROJECT_TYPE_INFO,
  ModuleDefinition,
  DiscountDefinition
} from '../data/estimationCatalog';

export interface RiskCriteriaWeights {
  personalData: number; // 5
  confidentialData: number; // 5
  erpSenior: number; // 5
  manySheetsOrDb: number; // 3
  externalUsers: number; // 4
  noBackup: number; // 4
  criticalProcess: number; // 5
  thirdPartyDev: number; // 3
}

export interface GovernanceSettings {
  estimationConfig: {
    horasPorManha: number;
    fatorOtimista: number;
    fatorRealista: number;
    leadReuniaoOtimista: number;
    leadReuniaoRealista: number;
    bufferDepOtimista: number;
    bufferDepRealista: number;
  };
  stagesBaseConfig: Record<ProjectType, Record<GovStage, { hours: number; meetings: number; externalDeps: number }>>;
  modulesCatalog: ModuleDefinition[];
  discountsCatalog: DiscountDefinition[];
  stageNames: Record<GovStage, string>;
  stageDescriptions: Record<GovStage, string>;
  meetingsChecklist: Record<ProjectType, string[]>;
  criticalFindingsChecklist: Record<ProjectType, string[]>;
  exitCriteriaChecklist: { id: string; title: string; description: string }[];
  projectTypeInfo: Record<ProjectType, { label: string; shortDesc: string; technologyHint: string; statusBadge?: string }>;
  riskThresholds: {
    baixoMax: number;
    medioMax: number;
    altoMax: number;
  };
  riskCriteriaWeights: RiskCriteriaWeights;
  auxiliaryLists: {
    departments: string[];
    statuses: string[];
    priorities: string[];
    generationTools: string[];
    artifactCategories: string[];
    meetingEntryTypes: string[];
  };
  /** Funcionalidades avançadas desligadas por padrão (visão sucinta); reativáveis aqui sem alterar código. */
  featureFlags: {
    /** Gráfico de burn-down na aba Evolução (além do resumo sucinto padrão). */
    detailedEvolution: boolean;
    /** Item "Minha Semana" no Sidebar (planner semanal com arrastar-e-soltar) — ainda em beta. */
    myWeekEnabled: boolean;
  };
}

export function getDefaultGovernanceSettings(): GovernanceSettings {
  return {
    estimationConfig: { ...ESTIMATION_CONFIG },
    stagesBaseConfig: JSON.parse(JSON.stringify(STAGES_BASE_CONFIG)),
    modulesCatalog: JSON.parse(JSON.stringify(MODULES_CATALOG)),
    discountsCatalog: JSON.parse(JSON.stringify(DISCOUNTS_CATALOG)),
    stageNames: { ...STAGE_NAMES },
    stageDescriptions: { ...STAGE_DESCRIPTIONS },
    meetingsChecklist: JSON.parse(JSON.stringify(MEETINGS_CHECKLIST)),
    criticalFindingsChecklist: JSON.parse(JSON.stringify(CRITICAL_FINDINGS_CHECKLIST)),
    exitCriteriaChecklist: JSON.parse(JSON.stringify(EXIT_CRITERIA_CHECKLIST)),
    projectTypeInfo: JSON.parse(JSON.stringify(PROJECT_TYPE_INFO)),
    riskThresholds: {
      baixoMax: 5,
      medioMax: 12,
      altoMax: 20
    },
    riskCriteriaWeights: {
      personalData: 5,
      confidentialData: 5,
      erpSenior: 5,
      manySheetsOrDb: 3,
      externalUsers: 4,
      noBackup: 4,
      criticalProcess: 5,
      thirdPartyDev: 3
    },
    auxiliaryLists: {
      departments: [
        'Logística / Adm Comercial',
        'Comercial / CRM',
        'Financeiro & Controladoria',
        'Recursos Humanos',
        'Produção & UBS',
        'Qualidade & Rastreabilidade',
        'Pesquisa & Melhoramento',
        'T.I & Governança'
      ],
      statuses: ['Uso', 'Homologação', 'Em Adequação', 'Descontinuado'],
      priorities: ['P0 - Urgente', 'P1 - Alta', 'P2 - Média', 'P3 - Baixa', 'Backlog'],
      generationTools: ['Codex', 'Claude Code', 'Gemini (copia-e-cola)', 'ChatGPT', 'Manual', 'Outro'],
      artifactCategories: [
        'Pauta / Ata de Reunião',
        'Especificação Funcional',
        'Arquitetura & Segurança',
        'Homologação & Evidências',
        'Apresentação & Relatório',
        'Código & Repositório',
        'Outro'
      ],
      meetingEntryTypes: [
        'Reunião de Alinhamento',
        'Pauta Executiva',
        'Homologação com Usuário',
        'Ponto de Controle T.I',
        'Incidente / Mudança',
        'Decisão de Arquitetura'
      ]
    },
    featureFlags: {
      detailedEvolution: false,
      myWeekEnabled: false
    }
  };
}

export type GovernanceConfig = GovernanceSettings;

export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = getDefaultGovernanceSettings();

export function saveGovernanceConfig(config: GovernanceConfig): void {
  setGlobalActiveSettings(config);
}

export function resetGovernanceConfig(): GovernanceConfig {
  const def = getDefaultGovernanceSettings();
  setGlobalActiveSettings(def);
  return def;
}

// Armazenamento em memória da configuração ativa atual
let currentActiveSettings: GovernanceSettings = getDefaultGovernanceSettings();

export function setGlobalActiveSettings(settings: GovernanceSettings): void {
  currentActiveSettings = settings;
}

export function getActiveConfig(overrideSettings?: GovernanceSettings): GovernanceSettings {
  if (overrideSettings) {
    return overrideSettings;
  }
  return currentActiveSettings;
}

