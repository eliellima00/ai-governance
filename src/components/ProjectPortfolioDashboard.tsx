import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Calendar,
  AlertTriangle,
  Star,
  Plus,
  Copy,
  Check,
  Building2,
  FileText,
  ArrowRight,
  Workflow,
  Inbox,
  Clock
} from 'lucide-react';
import {
  SolutionProject,
  ProjectStage,
  ExecutivePriority,
  ProjectType,
  GovStage,
  UserRole
} from '../types';
import {
  computeEstimation,
  daysSince,
  formatPtBrDate,
  getDefaultEstimationInputs
} from '../utils/estimation';
import {
  GOV_STAGES_CATALOG,
  PROJECT_TYPE_INFO,
  STAGE_NAMES
} from '../data/estimationCatalog';
import { can } from '../utils/permissions';
import { getActiveConfig } from '../config/governanceConfig';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Field, Input, Select, Textarea } from './ui/FormField';
import { PageHeader } from './ui/PageHeader';
import { Tabs } from './ui/Tabs';
import { Modal, ModalFooter } from './ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from './ui/Table';
import { StatTile } from './ui/StatTile';
import { SearchInput } from './ui/SearchInput';
import { PortfolioGanttView } from './PortfolioGanttView';

interface ProjectPortfolioDashboardProps {
  projects: SolutionProject[];
  userRole?: UserRole;
  onUpdateProject: (updatedProject: SolutionProject) => void;
  onSelectProjectAndNavigate: (
    project: SolutionProject,
    targetTab: 'glpi' | 'diagnostic' | 'action_plan' | 'evolution' | 'estimation'
  ) => void;
  onOpenNewProjectModal: () => void;
}

const ALL_STAGES: ProjectStage[] = [
  'Levantamento & Ficha',
  'Diagnóstico de Risco',
  'Plano de Ação / Adequação',
  'Homologação TI',
  'Em Produção / Operação',
  'Sustentação',
  'Bloqueado / Aguardando'
];

const STAGE_CONFIG: Record<
  ProjectStage,
  { bg: string; text: string; border: string; label: string }
> = {
  'Levantamento & Ficha': {
    bg: 'bg-grey-100',
    text: 'text-grey-700',
    border: 'border-grey-300',
    label: 'Levantamento & Ficha'
  },
  'Diagnóstico de Risco': {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    border: 'border-warning-200',
    label: 'Diagnóstico de Risco'
  },
  'Plano de Ação / Adequação': {
    bg: 'bg-info-50',
    text: 'text-info-700',
    border: 'border-info-200',
    label: 'Plano de Ação'
  },
  'Homologação TI': {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-300',
    label: 'Homologação T.I'
  },
  'Em Produção / Operação': {
    bg: 'bg-brand-lighter',
    text: 'text-brand-dark',
    border: 'border-brand-light',
    label: 'Em Produção'
  },
  Sustentação: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
    label: 'Sustentação'
  },
  'Bloqueado / Aguardando': {
    bg: 'bg-danger-50',
    text: 'text-danger-800',
    border: 'border-danger-300',
    label: 'Bloqueado'
  }
};

const PRIORITY_CONFIG: Record<
  ExecutivePriority,
  { bg: string; text: string; border: string; label: string }
> = {
  'P0 - Urgente': {
    bg: 'bg-danger-50',
    text: 'text-danger-800',
    border: 'border-danger-300',
    label: 'P0 - Urgente'
  },
  'P1 - Alta': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    label: 'P1 - Alta'
  },
  'P1 - Alta Prioridade': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    label: 'P1 - Alta'
  },
  'P2 - Média': {
    bg: 'bg-info-50',
    text: 'text-info-700',
    border: 'border-info-200',
    label: 'P2 - Média'
  },
  'P3 - Baixa': {
    bg: 'bg-grey-100',
    text: 'text-grey-700',
    border: 'border-grey-300',
    label: 'P3 - Baixa'
  },
  Backlog: {
    bg: 'bg-grey-100',
    text: 'text-grey-600',
    border: 'border-grey-200',
    label: 'Backlog'
  }
};

const DEFAULT_STAGE_STYLE = {
  bg: 'bg-grey-100',
  text: 'text-grey-700',
  border: 'border-grey-300',
  label: 'Levantamento & Ficha'
};

export function getStageStyle(stage?: string | null) {
  if (!stage) return DEFAULT_STAGE_STYLE;
  if (STAGE_CONFIG[stage as ProjectStage]) {
    return STAGE_CONFIG[stage as ProjectStage];
  }
  const normalized = stage.toLowerCase();
  if (normalized.includes('diagnóstico') || normalized.includes('diagnostico')) {
    return STAGE_CONFIG['Diagnóstico de Risco'];
  }
  if (normalized.includes('plano') || normalized.includes('adequação') || normalized.includes('adequacao')) {
    return STAGE_CONFIG['Plano de Ação / Adequação'];
  }
  if (normalized.includes('homologação') || normalized.includes('homologacao')) {
    return STAGE_CONFIG['Homologação TI'];
  }
  if (
    normalized.includes('produção') ||
    normalized.includes('producao') ||
    normalized.includes('operação') ||
    normalized.includes('operacao')
  ) {
    return STAGE_CONFIG['Em Produção / Operação'];
  }
  if (normalized.includes('sustentação') || normalized.includes('sustentacao')) {
    return STAGE_CONFIG['Sustentação'];
  }
  if (normalized.includes('bloqueado') || normalized.includes('aguardando')) {
    return STAGE_CONFIG['Bloqueado / Aguardando'];
  }
  return DEFAULT_STAGE_STYLE;
}

const DEFAULT_PRIORITY_STYLE = {
  bg: 'bg-grey-100',
  text: 'text-grey-700',
  border: 'border-grey-300',
  label: 'P2 - Média'
};

export function getPriorityStyle(priority?: string | null) {
  if (!priority) return DEFAULT_PRIORITY_STYLE;
  if (PRIORITY_CONFIG[priority as ExecutivePriority]) {
    return PRIORITY_CONFIG[priority as ExecutivePriority];
  }
  const lower = priority.toLowerCase();
  if (lower.includes('p0') || lower.includes('urgente') || lower.includes('crítica') || lower.includes('critica')) {
    return PRIORITY_CONFIG['P0 - Urgente'];
  }
  if (lower.includes('p1') || lower.includes('alta')) {
    return PRIORITY_CONFIG['P1 - Alta'];
  }
  if (lower.includes('p2') || lower.includes('média') || lower.includes('media')) {
    return PRIORITY_CONFIG['P2 - Média'];
  }
  if (lower.includes('p3') || lower.includes('baixa')) {
    return PRIORITY_CONFIG['P3 - Baixa'];
  }
  if (lower.includes('backlog')) {
    return PRIORITY_CONFIG['Backlog'];
  }
  return DEFAULT_PRIORITY_STYLE;
}

/** Exibição estática de um campo, usada no lugar do input/textarea/checkbox quando o perfil não pode editar. */
const ReadOnlyField: React.FC<{ value: string; multiline?: boolean; className?: string }> = ({
  value,
  multiline,
  className = ''
}) => (
  <div
    className={`w-full px-3 py-2 border border-grey-200 rounded-md text-sm bg-grey-50 text-grey-700 ${
      multiline ? 'whitespace-pre-line leading-relaxed' : 'truncate'
    } ${className}`}
  >
    {value || '—'}
  </div>
);

export const ProjectPortfolioDashboard: React.FC<ProjectPortfolioDashboardProps> = ({
  projects,
  userRole = 'admin',
  onUpdateProject,
  onSelectProjectAndNavigate,
  onOpenNewProjectModal
}) => {
  const { priorities: priorityOptions } = getActiveConfig().auxiliaryLists;
  const canManageImpediment = can(userRole, 'manage_impediment');
  const canTogglePriority = can(userRole, 'toggle_priority');
  const canAdvanceStage = can(userRole, 'advance_stage');
  const canAnnotate = can(userRole, 'add_notes');

  const [viewMode, setViewMode] = useState<'spreadsheet' | 'executive_summary' | 'kanban' | 'gantt'>('spreadsheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterManagementOnly, setFilterManagementOnly] = useState(false);
  const [filterImpedimentOnly, setFilterImpedimentOnly] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProjectType, setFilterProjectType] = useState('all');

  const [copiedPauta, setCopiedPauta] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Modals
  const [activeNotesModalProject, setActiveNotesModalProject] = useState<SolutionProject | null>(null);
  const [activeImpedimentModalProject, setActiveImpedimentModalProject] = useState<SolutionProject | null>(null);
  const [activeScheduleModalProject, setActiveScheduleModalProject] = useState<SolutionProject | null>(null);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.department));
    return Array.from(set).sort();
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesAsset = p.assetId.toLowerCase().includes(query);
        const matchesGlpi = p.glpiTicketId.toLowerCase().includes(query);
        const matchesResp = p.businessResponsible.toLowerCase().includes(query);
        const matchesTech = p.technicalResponsible.toLowerCase().includes(query);
        if (!matchesName && !matchesAsset && !matchesGlpi && !matchesResp && !matchesTech) {
          return false;
        }
      }

      // Department
      if (filterDepartment !== 'all' && p.department !== filterDepartment) return false;

      // Stage
      if (filterStage !== 'all' && (p.stage || 'Levantamento & Ficha') !== filterStage) return false;

      // Management Only Filter
      if (filterManagementOnly && !p.isPriorityForManagement) return false;

      // Impediment Only
      if (filterImpedimentOnly && !p.hasImpediment) return false;

      // Priority
      if (filterPriority !== 'all' && p.executivePriority !== filterPriority) return false;

      // Project Type (Eixo 2)
      if (filterProjectType !== 'all' && (p.projectType || 'A') !== filterProjectType) return false;

      return true;
    });
  }, [
    projects,
    searchTerm,
    filterDepartment,
    filterStage,
    filterManagementOnly,
    filterImpedimentOnly,
    filterPriority,
    filterProjectType
  ]);

  // Estimativa/cronograma por projeto (reutilizado no Kanban e usado como base para o Gantt)
  const estimationByProjectId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeEstimation>>();
    filteredProjects.forEach((p) => {
      const inputs = p.estimation || getDefaultEstimationInputs(p.projectType || 'A');
      map.set(p.id, computeEstimation(inputs));
    });
    return map;
  }, [filteredProjects]);

  // General KPI Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const prioritizedForManagement = projects.filter((p) => p.isPriorityForManagement).length;
    const withImpediment = projects.filter((p) => p.hasImpediment).length;
    const withScheduledDate = projects.filter((p) => !!p.scheduledDate).length;
    const inProduction = projects.filter((p) => p.stage === 'Em Produção / Operação').length;

    return {
      total,
      prioritizedForManagement,
      withImpediment,
      withScheduledDate,
      inProduction
    };
  }, [projects]);

  // Handlers for Inline Modifications
  const handleStageChange = (project: SolutionProject, newStage: ProjectStage) => {
    if (!canAdvanceStage) return;
    onUpdateProject({
      ...project,
      stage: newStage,
      stageEnteredAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    });
  };

  const handleGovStageChange = (project: SolutionProject, newGovStage: GovStage) => {
    if (!canAdvanceStage) return;
    onUpdateProject({
      ...project,
      govStage: newGovStage,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    });
  };

  const handlePriorityChange = (project: SolutionProject, newPriority: ExecutivePriority) => {
    if (!canTogglePriority) return;
    onUpdateProject({
      ...project,
      executivePriority: newPriority
    });
  };

  const handleTogglePrioritizeForManagement = (project: SolutionProject) => {
    if (!canTogglePriority) return;
    onUpdateProject({
      ...project,
      isPriorityForManagement: !project.isPriorityForManagement
    });
  };

  const handleNotificationChange = (project: SolutionProject, text: string) => {
    if (!canAnnotate) return;
    onUpdateProject({
      ...project,
      notificationStatus: text
    });
  };

  const handleSaveNotes = (project: SolutionProject, notes: string) => {
    if (!canAnnotate) return;
    onUpdateProject({
      ...project,
      notes
    });
    setActiveNotesModalProject(null);
  };

  const handleSaveImpediment = (
    project: SolutionProject,
    hasImpediment: boolean,
    details: string,
    actionFromManagement: string
  ) => {
    if (!canManageImpediment) return;
    onUpdateProject({
      ...project,
      hasImpediment,
      impedimentDetails: details,
      actionRequiredFromManagement: actionFromManagement
    });
    setActiveImpedimentModalProject(null);
  };

  const handleSaveSchedule = (
    project: SolutionProject,
    date: string,
    subject: string
  ) => {
    if (!canAnnotate) return;
    onUpdateProject({
      ...project,
      scheduledDate: date,
      scheduledSubject: subject
    });
    setActiveScheduleModalProject(null);
  };

  // Copy Executive Pauta to clipboard for WhatsApp / Email
  const handleCopyManagementPauta = () => {
    const managementProjects = projects.filter((p) => p.isPriorityForManagement);
    const impedimentProjects = projects.filter((p) => p.hasImpediment);
    const scheduledProjects = projects.filter((p) => p.scheduledDate);

    let text = `📋 *PAUTA EXECUTIVA DE DEMANDAS & PROJETOS - ATTO T.I*\n`;
    text += `_Data: ${new Date().toLocaleDateString('pt-BR')}_\n\n`;

    text += `⭐ *DEMANDAS PRIORITÁRIAS DA GESTÃO (${managementProjects.length}):*\n`;
    managementProjects.forEach((p, idx) => {
      const inputs = p.estimation || getDefaultEstimationInputs(p.projectType || 'A');
      const est = computeEstimation(inputs);
      const stageName = STAGE_NAMES[p.govStage || 'E1'] || p.govStage || 'E1';
      const optDate = formatPtBrDate(est.optimistic.deliveryDate);
      const realDate = formatPtBrDate(est.realistic.deliveryDate);

      text += `${idx + 1}. *${p.name}* [${p.assetId}]\n`;
      text += `   • Arquitetura: ${p.projectType === 'A' ? 'Google Workspace / Apps Script' : p.projectType === 'B' ? 'Container / VPS / Backend' : 'No-Code / Externo'} (${p.generationTool || 'Desenvolvimento'})\n`;
      text += `   • Esteira T.I: ${p.govStage || 'E1'} - ${stageName}\n`;
      text += `   • Janela de Entrega: [${optDate} → ${realDate}] (${est.effortTotalHours.toFixed(1)}h T.I)\n`;
      text += `   • Responsável: ${p.businessResponsible} | Técnico: ${p.technicalResponsible}\n`;
      if (p.notificationStatus) {
        text += `   • Notificação/Canal: ${p.notificationStatus}\n`;
      }
      if (p.notes) {
        text += `   • Anotações: ${p.notes}\n`;
      }
      text += `\n`;
    });

    if (impedimentProjects.length > 0) {
      text += `⚠️ *IMPEDIMENTOS & AÇÕES REQUERIDAS DA GESTÃO (${impedimentProjects.length}):*\n`;
      impedimentProjects.forEach((p, idx) => {
        text += `${idx + 1}. *${p.name}*\n`;
        text += `   • Bloqueio: ${p.impedimentDetails || 'Impedimento sinalizado'}\n`;
        if (p.actionRequiredFromManagement) {
          text += `   • 🚨 *Ação necessária da Gestão:* ${p.actionRequiredFromManagement}\n`;
        }
        text += `\n`;
      });
    }

    if (scheduledProjects.length > 0) {
      text += `📅 *AGENDAMENTOS & PRÓXIMAS REUNIÕES (${scheduledProjects.length}):*\n`;
      scheduledProjects.forEach((p, idx) => {
        text += `${idx + 1}. *${p.scheduledDate}* - ${p.name}\n`;
        text += `   • Pauta: ${p.scheduledSubject || 'Alinhamento geral'}\n`;
      });
      text += `\n`;
    }

    text += `_Gerado via Painel de Governança de Soluções ATTO_\n`;

    navigator.clipboard.writeText(text);
    setCopiedPauta(true);
    setTimeout(() => setCopiedPauta(false), 2500);
  };

  return (
    <div id="project-portfolio-dashboard" className="space-y-6">
      {/* Page Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-grey-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-grey-900 tracking-tight">
              Gestão de Demandas Departamentais
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-lighter text-brand-dark border border-brand-light shrink-0">
              {projects.length} {projects.length === 1 ? 'Solução Ativa' : 'Soluções Ativas'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-grey-600 mt-1 max-w-3xl leading-relaxed">
            Painel executivo de esteira, prioridades da gestão, impedimentos e alinhamentos de soluções setoriais.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            color="secondary"
            size="sm"
            onClick={handleCopyManagementPauta}
            leftIcon={
              copiedPauta ? (
                <Check className="w-4 h-4 text-brand-main" />
              ) : (
                <Copy className="w-4 h-4 text-warning-600" />
              )
            }
            className="bg-warning-50 border-warning-200 hover:bg-warning-100 text-grey-800 font-semibold"
            title="Copiar pauta estruturada para alinhamento executivo no WhatsApp / Teams"
          >
            {copiedPauta ? 'Pauta Copiada!' : 'Copiar Pauta de Gestão'}
          </Button>

          {can(userRole, 'create_solution') && (
            <Button
              color="primary"
              size="sm"
              onClick={onOpenNewProjectModal}
              leftIcon={<Plus className="w-4 h-4" />}
              data-tour="portfolio-new-solution-btn"
            >
              Nova Solução
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" data-tour="portfolio-kpis">
        <StatTile
          label="Total Projetos"
          value={
            <>
              {stats.total} <span className="text-xs font-normal text-grey-400">soluções</span>
            </>
          }
          subtext={`${stats.inProduction} em produção estável`}
          icon={<TableIcon className="w-4 h-4" />}
          iconClassName="bg-grey-100 text-grey-700"
        />

        <StatTile
          label="Pauta de Gestão"
          value={
            <>
              {stats.prioritizedForManagement}{' '}
              <span className="text-xs font-normal text-warning-600">priorizadas</span>
            </>
          }
          subtext={
            filterManagementOnly ? '✓ Filtro ativo (clique para limpar)' : 'Clique para filtrar pauta'
          }
          icon={<Star className="w-4 h-4 fill-warning-500 text-warning-500" />}
          iconClassName="bg-warning-50 text-warning-600"
          active={filterManagementOnly}
          onClick={() => setFilterManagementOnly(!filterManagementOnly)}
        />

        <StatTile
          label="Com Impedimento"
          value={
            <>
              {stats.withImpediment} <span className="text-xs font-normal text-danger-800">bloqueios</span>
            </>
          }
          subtext={filterImpedimentOnly ? '✓ Filtro ativo' : 'Ações necessárias da gestão'}
          icon={<AlertTriangle className="w-4 h-4 text-danger-500" />}
          iconClassName="bg-danger-50 text-danger-800"
          active={filterImpedimentOnly}
          onClick={() => setFilterImpedimentOnly(!filterImpedimentOnly)}
        />

        <StatTile
          label="Agendamentos"
          value={
            <>
              {stats.withScheduledDate}{' '}
              <span className="text-xs font-normal text-info-700">datas marcadas</span>
            </>
          }
          subtext="Alinhamentos e homologações"
          icon={<Calendar className="w-4 h-4" />}
          iconClassName="bg-info-50 text-info-700"
        />
      </div>

      {/* View Mode Switcher and Controls */}
      <Card className="p-4 space-y-3.5" data-tour="portfolio-view-switcher">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Tabs<'spreadsheet' | 'executive_summary' | 'kanban' | 'gantt'>
            items={[
              {
                id: 'spreadsheet' as const,
                label: 'Planilha Executiva',
                badge: (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-grey-100 text-grey-700 font-mono">
                    {filteredProjects.length}
                  </span>
                )
              },
              {
                id: 'executive_summary' as const,
                label: 'Alinhamento (1:1)',
                badge:
                  stats.prioritizedForManagement > 0 ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-warning-50 text-warning-600 font-bold">
                      {stats.prioritizedForManagement}
                    </span>
                  ) : undefined
              },
              {
                id: 'kanban' as const,
                label: 'Funil de Etapas (Kanban)'
              },
              {
                id: 'gantt' as const,
                label: 'Cronograma (Gantt)'
              }
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-grey-100">
          {/* Search */}
          <div className="sm:col-span-2">
            <SearchInput
              placeholder="Buscar por nome, ativo GLPI, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          {/* Department Filter */}
          <Select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="text-xs py-1.5 bg-grey-50"
          >
            <option value="all">Todas as Áreas</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>

          {/* Stage Filter */}
          <Select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="text-xs py-1.5 bg-grey-50"
          >
            <option value="all">Todas as Etapas</option>
            {ALL_STAGES.map((stg) => (
              <option key={stg} value={stg}>
                {stg}
              </option>
            ))}
          </Select>

          {/* Priority Filter */}
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs py-1.5 bg-grey-50"
          >
            <option value="all">Todas as Prioridades</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* EMPTY STATE: NENHUMA SOLUÇÃO CADASTRADA AINDA */}
      {projects.length === 0 && (
        <Card className="p-12 sm:p-16 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-grey-200 bg-grey-50/60 shadow-none">
          <div className="w-16 h-16 rounded-full bg-brand-lighter flex items-center justify-center">
            <Inbox className="w-8 h-8 text-brand-dark" />
          </div>
          <div className="max-w-md">
            <h2 className="text-base sm:text-lg font-black text-grey-900">
              Nenhuma solução cadastrada ainda
            </h2>
            <p className="text-xs sm:text-sm text-grey-500 mt-1.5 leading-relaxed">
              O portfólio está vazio. Cadastre a primeira solução ou ativo de T.I para iniciar o
              diagnóstico de risco, o plano de ação e o acompanhamento na esteira de governança.
            </p>
          </div>
          {can(userRole, 'create_solution') && (
            <Button
              color="primary"
              size="sm"
              onClick={onOpenNewProjectModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Primeira Solução
            </Button>
          )}
        </Card>
      )}

      {/* VIEW 1: SPREADSHEET TABLE (EXECUTIVE GRID) */}
      {projects.length > 0 && viewMode === 'spreadsheet' && (
        <Card className="p-0 overflow-hidden">
          <Table className="text-xs">
            <Thead>
              <Tr className="hover:bg-transparent">
                <Th sticky="left" className="text-center w-12 bg-grey-50" title="Marcar para pauta de gestão">
                  ⭐ Gestão
                </Th>
                <Th className="min-w-[200px]">Solução & Ativo GLPI</Th>
                <Th className="min-w-[130px]">Área & Dono</Th>
                <Th className="min-w-[150px]">Arquitetura & Esteira</Th>
                <Th className="min-w-[230px]">Etapa do Ciclo</Th>
                <Th className="min-w-[150px]">Prioridade</Th>
                <Th className="min-w-[140px]">Impedimento / Bloqueio</Th>
                <Th className="min-w-[130px]">Data Marcada</Th>
                <Th sticky="right" className="text-right min-w-[130px] bg-grey-50">
                  Ações
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProjects.map((proj) => {
                const stageStyle = getStageStyle(proj.stage);
                const priorityStyle = getPriorityStyle(proj.executivePriority);

                return (
                  <Tr key={proj.id} className={proj.isPriorityForManagement ? 'bg-warning-50/30' : ''}>
                    {/* 1. Prioritized for Management Star */}
                    <Td
                      sticky="left"
                      className={`text-center ${
                        proj.isPriorityForManagement ? 'bg-warning-50' : 'bg-white group-hover:bg-grey-50'
                      }`}
                    >
                      {canTogglePriority ? (
                        <button
                          onClick={() => handleTogglePrioritizeForManagement(proj)}
                          className="p-1 rounded-full hover:bg-grey-200/60 transition-transform active:scale-95"
                          title={
                            proj.isPriorityForManagement
                              ? 'Priorizado para apresentar à Gestão (Clique para desmarcar)'
                              : 'Clique para marcar e priorizar na pauta da Gestão'
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${
                              proj.isPriorityForManagement
                                ? 'fill-warning-500 text-warning-500'
                                : 'text-grey-300 hover:text-grey-400'
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="p-1 inline-flex" title={proj.isPriorityForManagement ? 'Priorizado para a Gestão' : undefined}>
                          <Star
                            className={`w-4 h-4 ${
                              proj.isPriorityForManagement ? 'fill-warning-500 text-warning-500' : 'text-grey-300'
                            }`}
                          />
                        </span>
                      )}
                    </Td>

                    {/* 2. Solution Name & Identifiers */}
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectProjectAndNavigate(proj, 'glpi')}
                          className="font-bold text-grey-900 hover:text-brand-dark text-left hover:underline line-clamp-1"
                          title={`Abrir workspace da solução: ${proj.name}`}
                        >
                          {proj.name}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-grey-500">
                        <Badge className="font-mono font-bold text-brand-dark bg-brand-lighter border-brand-light px-1 py-0 rounded">
                          {proj.assetId}
                        </Badge>
                        <span>•</span>
                        <span className="font-mono">GLPI: #{proj.glpiTicketId}</span>
                      </div>
                    </Td>

                    {/* 3. Department & Owner */}
                    <Td>
                      <div className="font-semibold text-grey-800">{proj.department}</div>
                      <div className="text-[11px] text-grey-500 truncate" title={`Dono: ${proj.businessResponsible}`}>
                        {proj.businessResponsible}
                      </div>
                    </Td>

                    {/* 4. Technical Type & GovStage */}
                    <Td>
                      <div className="flex flex-col gap-1">
                        <Badge className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-800 border-purple-200">
                          <Workflow className="w-2.5 h-2.5" />
                          {proj.projectType === 'A'
                            ? 'Workspace'
                            : proj.projectType === 'B'
                            ? 'Container/VPS'
                            : 'No-Code'}
                        </Badge>
                        <Badge className="text-[10px] px-1.5 py-0.5 bg-grey-100 text-grey-700 border-grey-200">
                          {STAGE_NAMES[proj.govStage || 'E1'] || proj.govStage || 'E1'}
                        </Badge>
                      </div>
                    </Td>

                    {/* 5. Stage Select (Interactive) */}
                    <Td>
                      {canAdvanceStage ? (
                        <select
                          value={proj.stage && ALL_STAGES.includes(proj.stage) ? proj.stage : 'Levantamento & Ficha'}
                          onChange={(e) => handleStageChange(proj, e.target.value as ProjectStage)}
                          className={`text-xs font-bold rounded-lg px-2 py-1 border transition-colors w-full cursor-pointer ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} focus:outline-hidden focus:ring-1 focus:ring-brand-main`}
                        >
                          {ALL_STAGES.map((stg) => (
                            <option key={stg} value={stg} className="bg-white text-grey-900">
                              {stg}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`block text-xs font-bold rounded-lg px-2 py-1 border w-full truncate ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}>
                          {proj.stage && ALL_STAGES.includes(proj.stage) ? proj.stage : 'Levantamento & Ficha'}
                        </span>
                      )}
                    </Td>

                    {/* 6. Priority Select */}
                    <Td>
                      {canTogglePriority ? (
                      <select
                        value={
                          proj.executivePriority && PRIORITY_CONFIG[proj.executivePriority]
                            ? proj.executivePriority
                            : 'P2 - Média'
                        }
                        onChange={(e) => handlePriorityChange(proj, e.target.value as ExecutivePriority)}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors w-full cursor-pointer ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border} focus:outline-hidden focus:ring-1 focus:ring-brand-main`}
                      >
                        {priorityOptions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      ) : (
                        <span className={`block text-xs font-semibold rounded-lg px-2 py-1 border w-full truncate ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                          {proj.executivePriority && PRIORITY_CONFIG[proj.executivePriority] ? proj.executivePriority : 'P2 - Média'}
                        </span>
                      )}
                    </Td>

                    {/* 7. Impediment Button & Status */}
                    <Td>
                      <Button
                        type="button"
                        size="sm"
                        color="secondary"
                        onClick={() => setActiveImpedimentModalProject(proj)}
                        leftIcon={
                          <AlertTriangle
                            className={`w-3.5 h-3.5 shrink-0 ${proj.hasImpediment ? 'text-danger-500' : 'text-grey-400'}`}
                          />
                        }
                        className={`w-full justify-center ${
                          proj.hasImpediment
                            ? 'bg-danger-50 text-danger-800 border-danger-300'
                            : 'text-grey-500'
                        }`}
                        title="Clique para editar detalhes do impedimento e ação necessária da gestão"
                      >
                        <span className="truncate">{proj.hasImpediment ? '🚨 Bloqueado' : 'Sem bloqueio'}</span>
                      </Button>
                    </Td>

                    {/* 8. Scheduled Date */}
                    <Td>
                      <button
                        onClick={() => setActiveScheduleModalProject(proj)}
                        className="text-left w-full hover:bg-grey-100 p-1 rounded-full transition-colors"
                        title="Clique para agendar data de reunião ou entrega"
                      >
                        {proj.scheduledDate ? (
                          <div>
                            <div className="font-bold text-grey-800 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-info-600" />
                              <span>{proj.scheduledDate}</span>
                            </div>
                            <div className="text-[10px] text-grey-500 truncate max-w-[120px]">
                              {proj.scheduledSubject || 'Reunião marcada'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-grey-400 italic flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Agendar
                          </span>
                        )}
                      </button>
                    </Td>

                    {/* 9. Action Buttons */}
                    <Td
                      sticky="right"
                      className={`text-right ${
                        proj.isPriorityForManagement ? 'bg-warning-50' : 'bg-white group-hover:bg-grey-50'
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveNotesModalProject(proj)}
                          className="p-1.5 rounded hover:bg-grey-100 text-grey-600 hover:text-grey-900 transition-colors"
                          title="Anotações & Observações"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <Button
                          size="sm"
                          color="secondary"
                          onClick={() => onSelectProjectAndNavigate(proj, 'glpi')}
                          rightIcon={<ArrowRight className="w-3 h-3" />}
                          className="bg-brand-lighter text-brand-dark border-brand-light hover:bg-brand-lighter px-2.5 py-1"
                          title="Abrir detalhes da solução"
                        >
                          Abrir
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* VIEW 2: ALINHAMENTO DE DEMANDAS DEPARTAMENTAIS (1:1) */}
      {projects.length > 0 && viewMode === 'executive_summary' && (
        <div className="space-y-6">
          <Card className="bg-warning-50 border-warning-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-warning-600 p-4">
            <div>
              <span className="font-black text-sm block mb-0.5">Gestão de Demandas Departamentais - Alinhamento (1:1 com a Gestão)</span>
              Visão consolidada para sua reunião de reporte: demandas priorizadas com destaque, bloqueios/impedimentos onde a ação da gestão é necessária, e cronograma de datas já marcadas.
            </div>

            <Button
              color="secondary"
              onClick={handleCopyManagementPauta}
              leftIcon={<Copy className="w-4 h-4" />}
              className="bg-warning-600 hover:bg-warning-600 text-white border-transparent shrink-0"
            >
              Copiar Pauta Formatada
            </Button>
          </Card>

          {/* Block 1: Prioritized Demands */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-grey-100 pb-3">
              <h2 className="text-sm font-black text-grey-900 flex items-center gap-2">
                <Star className="w-4 h-4 fill-warning-500 text-warning-500" />
                <span>Demandas Prioritárias da Gestão ({projects.filter((p) => p.isPriorityForManagement).length})</span>
              </h2>
              <span className="text-xs text-grey-500">
                Itens marcados com estrela para discussão prioritária
              </span>
            </div>

            {projects.filter((p) => p.isPriorityForManagement).length === 0 ? (
              <div className="p-8 text-center text-xs text-grey-400 italic bg-grey-50 rounded-lg border border-dashed border-grey-200">
                Nenhum projeto marcado como prioridade da gestão no momento. Clique na estrela ⭐ ao lado de qualquer projeto na planilha para adicioná-lo aqui.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects
                  .filter((p) => p.isPriorityForManagement)
                  .map((proj) => {
                    const inputs = proj.estimation || getDefaultEstimationInputs(proj.projectType || 'A');
                    const est = computeEstimation(inputs);

                    return (
                      <div
                        key={proj.id}
                        className="p-4 rounded-lg border border-warning-200 bg-warning-50/40 space-y-3 relative flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className="font-mono text-xs font-bold text-brand-dark bg-white border-brand-light px-1.5 py-0.5">
                                  {proj.assetId}
                                </Badge>
                                <span className="text-xs font-bold text-grey-900">{proj.name}</span>
                              </div>
                              <p className="text-xs text-grey-500 mt-1 line-clamp-2">{proj.objective}</p>
                            </div>

                            {canTogglePriority && (
                              <button
                                onClick={() => handleTogglePrioritizeForManagement(proj)}
                                className="p-1 text-warning-600 hover:text-warning-600"
                                title="Remover da pauta de gestão"
                              >
                                <Star className="w-4 h-4 fill-warning-500 text-warning-500" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-warning-200/60 text-xs">
                            <div>
                              <span className="text-grey-500 block text-[10px] uppercase font-bold">Responsável:</span>
                              <span className="font-semibold text-grey-800">{proj.businessResponsible}</span>
                            </div>
                            <div>
                              <span className="text-grey-500 block text-[10px] uppercase font-bold">Janela de Entrega:</span>
                              <span className="font-mono font-bold text-brand-dark">
                                {formatPtBrDate(est.optimistic.deliveryDate)} à {formatPtBrDate(est.realistic.deliveryDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-warning-200/60 flex items-center justify-between">
                          <Badge className="text-[11px] font-bold text-purple-800 bg-purple-50 border-purple-200 px-2 py-0.5">
                            {proj.projectType === 'A' ? 'Google Workspace' : proj.projectType === 'B' ? 'Container / VPS' : 'No-Code'} • {STAGE_NAMES[proj.govStage || 'E1'] || proj.govStage || 'E1'}
                          </Badge>
                          <button
                            onClick={() => onSelectProjectAndNavigate(proj, 'glpi')}
                            className="text-xs font-bold text-brand-dark hover:underline flex items-center gap-1"
                          >
                            <span>Abrir Detalhes</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>

          {/* Block 2: Active Impediments */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-grey-100 pb-3">
              <h2 className="text-sm font-black text-grey-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger-500" />
                <span>Impedimentos Ativos & Ação Requerida da Gestão ({projects.filter((p) => p.hasImpediment).length})</span>
              </h2>
            </div>

            {projects.filter((p) => p.hasImpediment).length === 0 ? (
              <div className="p-6 text-center text-xs text-grey-400 italic bg-grey-50 rounded-lg border border-dashed border-grey-200">
                Nenhum projeto com impedimento ou bloqueio ativo no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {projects
                  .filter((p) => p.hasImpediment)
                  .map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-lg border border-danger-300 bg-danger-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className="font-mono text-xs font-bold text-danger-800 bg-white border-danger-300 px-1.5 py-0.5">
                            {proj.assetId}
                          </Badge>
                          <span className="text-xs font-bold text-grey-900 truncate">{proj.name}</span>
                        </div>
                        <p className="text-xs text-danger-800 font-medium">{proj.impedimentDetails}</p>
                        {proj.actionRequiredFromManagement && (
                          <div className="mt-1 text-xs text-grey-700 bg-white p-2 rounded border border-danger-300">
                            <strong>Ação Requerida da Gestão: </strong>
                            <span>{proj.actionRequiredFromManagement}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        color="danger"
                        onClick={() => setActiveImpedimentModalProject(proj)}
                        className="shrink-0"
                      >
                        Atualizar Bloqueio
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* VIEW 3: KANBAN BOARD */}
      {projects.length > 0 && viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {ALL_STAGES.map((stg) => {
            const list = filteredProjects.filter((p) => (p.stage || 'Levantamento & Ficha') === stg);
            return (
              <Card key={stg} className="bg-grey-50 p-3.5 space-y-3 w-72 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-grey-800">{stg}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-grey-600 border border-grey-200">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {list.map((proj) => {
                    const priorityStyle = getPriorityStyle(proj.executivePriority);
                    const est = estimationByProjectId.get(proj.id);

                    return (
                      <Card
                        key={proj.id}
                        onClick={() => onSelectProjectAndNavigate(proj, 'glpi')}
                        className={`p-3 hover:border-brand-main cursor-pointer transition-all space-y-2 ${
                          proj.hasImpediment ? 'border-danger-300' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-grey-500">
                          <span>{proj.assetId}</span>
                          <span className="font-bold text-purple-800">
                            {proj.projectType === 'A' ? 'Workspace' : proj.projectType === 'B' ? 'Container/VPS' : 'No-Code'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-grey-900 line-clamp-1">{proj.name}</div>
                        <div className="text-[11px] text-grey-500 truncate">{proj.businessResponsible}</div>

                        <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-grey-100">
                          <Badge className="text-[9px] px-1.5 py-0 bg-grey-100 text-grey-700 border-grey-200">
                            {proj.govStage || 'E1'} · {STAGE_NAMES[proj.govStage || 'E1'] || proj.govStage}
                          </Badge>
                          <Badge className={`text-[9px] px-1.5 py-0 ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                            {priorityStyle.label}
                          </Badge>
                          {proj.hasImpediment && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-danger-50 text-danger-800 border-danger-300">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Bloqueado
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-grey-500 pt-1">
                          <span className="flex items-center gap-1" title="Dias nesta etapa do ciclo">
                            <Clock className="w-3 h-3" />
                            {daysSince(proj.stageEnteredAt)}d nesta etapa
                          </span>
                          {est && (
                            <span title="Previsão de entrega (cenário realista)">
                              Prev.: {formatPtBrDate(est.realistic.deliveryDate)}
                            </span>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* VIEW 4: GANTT DE CRONOGRAMA */}
      {projects.length > 0 && viewMode === 'gantt' && (
        <PortfolioGanttView
          projects={filteredProjects}
          onSelectProjectAndNavigate={onSelectProjectAndNavigate}
        />
      )}

      {/* MODAL 1: EDITAR ANOTAÇÕES */}
      {activeNotesModalProject && (
        <Modal
          isOpen
          onClose={() => setActiveNotesModalProject(null)}
          title={`Anotações da Solução: ${activeNotesModalProject.name}`}
        >
          {canAnnotate ? (
            <Textarea
              rows={5}
              defaultValue={activeNotesModalProject.notes || ''}
              id="modal-notes-textarea"
              placeholder="Digite anotações ou observações internas sobre o andamento desta demanda..."
            />
          ) : (
            <ReadOnlyField value={activeNotesModalProject.notes || ''} multiline />
          )}
          <ModalFooter>
            <Button color="secondary" onClick={() => setActiveNotesModalProject(null)}>
              {canAnnotate ? 'Cancelar' : 'Fechar'}
            </Button>
            {canAnnotate && (
              <Button
                color="primary"
                onClick={() => {
                  const val = (document.getElementById('modal-notes-textarea') as HTMLTextAreaElement)?.value || '';
                  handleSaveNotes(activeNotesModalProject, val);
                }}
              >
                Salvar Anotações
              </Button>
            )}
          </ModalFooter>
        </Modal>
      )}

      {/* MODAL 2: EDITAR IMPEDIMENTO & AÇÃO DA GESTÃO */}
      {activeImpedimentModalProject && (
        <Modal
          isOpen
          onClose={() => setActiveImpedimentModalProject(null)}
          title={`Registro de Bloqueio: ${activeImpedimentModalProject.name}`}
          subtitle="Informe o bloqueio e qual ação é requerida da gestão para destravar."
        >
          {canManageImpediment ? (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-grey-800">
              <input
                type="checkbox"
                id="modal-has-impediment"
                defaultChecked={activeImpedimentModalProject.hasImpediment}
                className="w-4 h-4 rounded text-danger-500 focus:ring-danger-500 border-grey-300"
              />
              <span>Projeto atualmente com impedimento / bloqueio</span>
            </label>
          ) : (
            <div className="text-xs font-bold text-grey-800">
              Projeto atualmente com impedimento / bloqueio:{' '}
              <span className={activeImpedimentModalProject.hasImpediment ? 'text-danger-600' : 'text-grey-500'}>
                {activeImpedimentModalProject.hasImpediment ? 'Sim' : 'Não'}
              </span>
            </div>
          )}

          <Field label="Detalhes do Bloqueio:">
            {canManageImpediment ? (
              <Textarea
                rows={3}
                id="modal-impediment-details"
                defaultValue={activeImpedimentModalProject.impedimentDetails || ''}
                placeholder="Ex: Aguardando liberação de porta de banco no firewall ou aprovação da área jurídica..."
              />
            ) : (
              <ReadOnlyField value={activeImpedimentModalProject.impedimentDetails || ''} multiline />
            )}
          </Field>

          <Field label="Ação Requerida da Gestão para Destravar:">
            {canManageImpediment ? (
              <Textarea
                rows={2}
                id="modal-action-management"
                defaultValue={activeImpedimentModalProject.actionRequiredFromManagement || ''}
                placeholder="Ex: Cobrar área de Infraestrutura para priorizar ticket de rede..."
              />
            ) : (
              <ReadOnlyField value={activeImpedimentModalProject.actionRequiredFromManagement || ''} multiline />
            )}
          </Field>

          <ModalFooter>
            <Button color="secondary" onClick={() => setActiveImpedimentModalProject(null)}>
              {canManageImpediment ? 'Cancelar' : 'Fechar'}
            </Button>
            {canManageImpediment && (
              <Button
                color="danger"
                onClick={() => {
                  const has = (document.getElementById('modal-has-impediment') as HTMLInputElement)?.checked || false;
                  const det = (document.getElementById('modal-impediment-details') as HTMLTextAreaElement)?.value || '';
                  const act = (document.getElementById('modal-action-management') as HTMLTextAreaElement)?.value || '';
                  handleSaveImpediment(activeImpedimentModalProject, has, det, act);
                }}
              >
                Salvar Bloqueio
              </Button>
            )}
          </ModalFooter>
        </Modal>
      )}

      {/* MODAL 3: AGENDAR DATA / REUNIÃO */}
      {activeScheduleModalProject && (
        <Modal
          isOpen
          onClose={() => setActiveScheduleModalProject(null)}
          title={`Agendar Reunião ou Entrega: ${activeScheduleModalProject.name}`}
          size="sm"
        >
          <Field label="Data:">
            {canAnnotate ? (
              <Input
                type="date"
                id="modal-schedule-date"
                defaultValue={activeScheduleModalProject.scheduledDate || ''}
                className="font-mono font-bold"
              />
            ) : (
              <ReadOnlyField value={activeScheduleModalProject.scheduledDate || ''} className="font-mono font-bold" />
            )}
          </Field>

          <Field label="Pauta / Assunto:">
            {canAnnotate ? (
              <Input
                type="text"
                id="modal-schedule-subject"
                defaultValue={activeScheduleModalProject.scheduledSubject || ''}
                placeholder="Ex: Reunião de Entendimento (E1) ou Homologação T.I"
              />
            ) : (
              <ReadOnlyField value={activeScheduleModalProject.scheduledSubject || ''} />
            )}
          </Field>

          <ModalFooter>
            <Button color="secondary" onClick={() => setActiveScheduleModalProject(null)}>
              {canAnnotate ? 'Cancelar' : 'Fechar'}
            </Button>
            {canAnnotate && (
              <Button
                color="primary"
                onClick={() => {
                  const date = (document.getElementById('modal-schedule-date') as HTMLInputElement)?.value || '';
                  const sub = (document.getElementById('modal-schedule-subject') as HTMLInputElement)?.value || '';
                  handleSaveSchedule(activeScheduleModalProject, date, sub);
                }}
              >
                Salvar Agendamento
              </Button>
            )}
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
