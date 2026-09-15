import React, { useState, useMemo } from 'react';
import {
  Table,
  Columns,
  Calendar,
  AlertTriangle,
  Star,
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Bell,
  CheckCircle2,
  Clock,
  ChevronDown,
  Building2,
  FileText,
  User,
  ShieldCheck,
  Flame,
  ArrowRight,
  Info,
  Layers,
  Server,
  Workflow,
  Sparkles
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
  formatPtBrDate,
  getDefaultEstimationInputs
} from '../utils/estimation';
import {
  GOV_STAGES_CATALOG,
  PROJECT_TYPE_INFO,
  STAGE_NAMES
} from '../data/estimationCatalog';
import { can } from '../utils/permissions';

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

export const ProjectPortfolioDashboard: React.FC<ProjectPortfolioDashboardProps> = ({
  projects,
  userRole = 'admin',
  onUpdateProject,
  onSelectProjectAndNavigate,
  onOpenNewProjectModal
}) => {
  const [viewMode, setViewMode] = useState<'spreadsheet' | 'executive_summary' | 'kanban'>('spreadsheet');
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
    onUpdateProject({
      ...project,
      stage: newStage,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    });
  };

  const handleGovStageChange = (project: SolutionProject, newGovStage: GovStage) => {
    onUpdateProject({
      ...project,
      govStage: newGovStage,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    });
  };

  const handlePriorityChange = (project: SolutionProject, newPriority: ExecutivePriority) => {
    onUpdateProject({
      ...project,
      executivePriority: newPriority
    });
  };

  const handleTogglePrioritizeForManagement = (project: SolutionProject) => {
    onUpdateProject({
      ...project,
      isPriorityForManagement: !project.isPriorityForManagement
    });
  };

  const handleNotificationChange = (project: SolutionProject, text: string) => {
    onUpdateProject({
      ...project,
      notificationStatus: text
    });
  };

  const handleSaveNotes = (project: SolutionProject, notes: string) => {
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
      text += `   • Eixo 2 (Técnico): Tipo ${p.projectType || 'A'} (${p.generationTool || 'Vibe Coding'})\n`;
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
      {/* Top Banner with Consultative Info */}
      <div className="bg-white border border-grey-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-brand-lighter text-brand-dark text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Portfólio Corporativo ATTO
              </span>
              <span className="text-xs text-grey-500 font-medium">
                Governança de Soluções Departamentais & Vibe Coding
              </span>
            </div>
            <h1 className="text-xl font-black text-grey-900 tracking-tight">
              Gestão de Demandas Departamentais
            </h1>
            <p className="text-xs text-grey-600 max-w-3xl leading-relaxed">
              Monitore todas as soluções em desenvolvimento e sustentação. Edite diretamente a etapa de cada projeto via select, anote notificações e status, marque as prioridades da gestão e acompanhe impedimentos e agendamentos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyManagementPauta}
              className="px-3.5 py-2 rounded-full text-xs font-bold text-grey-800 bg-warning-50 hover:bg-warning-50 border border-warning-200 transition-colors shadow-2xs flex items-center gap-2"
              title="Copiar pauta estruturada para alinhamento executivo no WhatsApp / Teams"
            >
              {copiedPauta ? (
                <>
                  <Check className="w-4 h-4 text-brand-main" />
                  <span className="text-brand-dark">Pauta Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-warning-600" />
                  <span>Copiar Pauta de Gestão</span>
                </>
              )}
            </button>

            {can(userRole, 'create_solution') && (
              <button
                onClick={onOpenNewProjectModal}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-brand-dark hover:bg-brand-dark transition-colors shadow-2xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Solução</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Projects */}
        <div className="bg-white border border-grey-200 rounded-lg p-3.5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-grey-500">Total Projetos</span>
            <div className="p-1.5 rounded-lg bg-grey-100 text-grey-700">
              <Table className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-grey-900">{stats.total}</span>
            <span className="text-[11px] text-grey-500 font-medium">soluções</span>
          </div>
          <p className="text-[11px] text-grey-400 mt-1 truncate">
            {stats.inProduction} em produção estável
          </p>
        </div>

        {/* Management Priority */}
        <div
          onClick={() => setFilterManagementOnly(!filterManagementOnly)}
          className={`cursor-pointer transition-all border rounded-lg p-3.5 shadow-2xs min-w-0 ${
            filterManagementOnly
              ? 'bg-warning-50 border-warning-500 ring-2 ring-warning-200'
              : 'bg-white border-grey-200 hover:border-warning-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-warning-600">Pauta de Gestão</span>
            <div className="p-1.5 rounded-lg bg-warning-50 text-warning-600">
              <Star className="w-4 h-4 fill-warning-500 text-warning-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-warning-600">{stats.prioritizedForManagement}</span>
            <span className="text-[11px] text-warning-600 font-bold">priorizadas</span>
          </div>
          <p className="text-[11px] text-warning-600/80 mt-1 truncate">
            {filterManagementOnly ? '✓ Filtro ativo (clique para limpar)' : 'Clique para filtrar pauta'}
          </p>
        </div>

        {/* Impediments */}
        <div
          onClick={() => setFilterImpedimentOnly(!filterImpedimentOnly)}
          className={`cursor-pointer transition-all border rounded-lg p-3.5 shadow-2xs min-w-0 ${
            filterImpedimentOnly
              ? 'bg-danger-50 border-danger-400 ring-2 ring-danger-300'
              : 'bg-white border-grey-200 hover:border-danger-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-danger-800">Com Impedimento</span>
            <div className="p-1.5 rounded-lg bg-danger-50 text-danger-800">
              <AlertTriangle className="w-4 h-4 text-danger-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-danger-800">{stats.withImpediment}</span>
            <span className="text-[11px] text-danger-800 font-bold">bloqueios</span>
          </div>
          <p className="text-[11px] text-danger-800/80 mt-1 truncate">
            {filterImpedimentOnly ? '✓ Filtro ativo' : 'Ações necessárias da gestão'}
          </p>
        </div>

        {/* Scheduled Meetings / Delivery */}
        <div className="bg-white border border-grey-200 rounded-lg p-3.5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-info-700">Agendamentos</span>
            <div className="p-1.5 rounded-lg bg-info-50 text-info-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-info-700">{stats.withScheduledDate}</span>
            <span className="text-[11px] text-info-700 font-medium">datas marcadas</span>
          </div>
          <p className="text-[11px] text-info-600 mt-1 truncate">
            Alinhamentos e homologações
          </p>
        </div>

        {/* Compliance / Governance */}
        <div className="bg-white border border-grey-200 rounded-lg p-3.5 shadow-2xs col-span-2 sm:col-span-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-dark">Governança T.I</span>
            <div className="p-1.5 rounded-lg bg-brand-lighter text-brand-dark">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-dark">100%</span>
            <span className="text-[11px] text-brand-dark font-semibold">GLPI + Esteira</span>
          </div>
          <p className="text-[11px] text-brand-main mt-1 truncate">
            Rastreabilidade completa
          </p>
        </div>
      </div>

      {/* View Mode Switcher and Controls */}
      <div className="bg-white border border-grey-200 rounded-lg p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center p-1 bg-grey-100 rounded-lg border border-grey-200/80 max-w-full overflow-x-auto">
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                viewMode === 'spreadsheet'
                  ? 'bg-white text-brand-dark shadow-2xs border border-grey-200'
                  : 'text-grey-600 hover:text-grey-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 shrink-0" />
              <span>Planilha Executiva</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-grey-100 text-grey-700 font-mono">
                {filteredProjects.length}
              </span>
            </button>

            <button
              onClick={() => setViewMode('executive_summary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                viewMode === 'executive_summary'
                  ? 'bg-white text-warning-600 shadow-2xs border border-grey-200'
                  : 'text-grey-600 hover:text-grey-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 shrink-0 fill-warning-500 text-warning-500" />
              <span className="hidden lg:inline">Demandas Departamentais & Alinhamento (1:1)</span>
              <span className="lg:hidden">Alinhamento (1:1)</span>
              {stats.prioritizedForManagement > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-warning-50 text-warning-600 font-bold">
                  {stats.prioritizedForManagement}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-900 shadow-2xs border border-grey-200'
                  : 'text-grey-600 hover:text-grey-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Funil de Etapas (Kanban)</span>
              <span className="sm:hidden">Kanban</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-grey-100">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-grey-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, ativo GLPI, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-grey-300 rounded-lg text-xs bg-grey-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-main"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-grey-300 rounded-lg text-xs font-medium bg-grey-50 text-grey-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-main"
            >
              <option value="all">Todas as Áreas</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-grey-300 rounded-lg text-xs font-medium bg-grey-50 text-grey-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-main"
            >
              <option value="all">Todas as Etapas</option>
              {ALL_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-grey-300 rounded-lg text-xs font-medium bg-grey-50 text-grey-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-main"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="P0 - Urgente">P0 - Urgente</option>
              <option value="P1 - Alta">P1 - Alta</option>
              <option value="P2 - Média">P2 - Média</option>
              <option value="P3 - Baixa">P3 - Baixa</option>
            </select>
          </div>

          {/* Quick Toggle Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterManagementOnly(!filterManagementOnly)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                filterManagementOnly
                  ? 'bg-warning-50 text-warning-600 border-warning-200'
                  : 'bg-grey-50 text-grey-600 border-grey-300 hover:bg-grey-100'
              }`}
              title="Filtrar demandas marcadas para a pauta da gestão"
            >
              <Star className={`w-3.5 h-3.5 ${filterManagementOnly ? 'fill-warning-500 text-warning-500' : 'text-grey-400'}`} />
              <span className="truncate">⭐ Gestão</span>
            </button>

            <button
              onClick={() => setFilterImpedimentOnly(!filterImpedimentOnly)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                filterImpedimentOnly
                  ? 'bg-danger-50 text-danger-800 border-danger-300'
                  : 'bg-grey-50 text-grey-600 border-grey-300 hover:bg-grey-100'
              }`}
              title="Filtrar demandas com impedimento ou bloqueio ativo"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${filterImpedimentOnly ? 'text-danger-500' : 'text-grey-400'}`} />
              <span className="truncate">🚨 Bloqueio</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: SPREADSHEET TABLE (EXECUTIVE GRID) */}
      {viewMode === 'spreadsheet' && (
        <div className="bg-white border border-grey-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-grey-200 bg-grey-100 text-grey-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-12" title="Marcar para pauta de gestão">
                    ⭐ Gestão
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">Solução & Ativo GLPI</th>
                  <th className="py-3 px-3 min-w-[130px]">Área & Dono</th>
                  <th className="py-3 px-3 min-w-[130px]">Tipo Técnico & Esteira</th>
                  <th className="py-3 px-3 min-w-[160px]">Etapa do Ciclo</th>
                  <th className="py-3 px-3 min-w-[120px]">Prioridade</th>
                  <th className="py-3 px-3 min-w-[140px]">Impedimento / Bloqueio</th>
                  <th className="py-3 px-3 min-w-[130px]">Data Marcada</th>
                  <th className="py-3 px-3 text-right min-w-[130px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-200">
                {filteredProjects.map((proj) => {
                  const stageStyle = STAGE_CONFIG[proj.stage || 'Levantamento & Ficha'];
                  const priorityStyle = PRIORITY_CONFIG[proj.executivePriority || 'P2 - Média'];

                  return (
                    <tr
                      key={proj.id}
                      className={`hover:bg-grey-50/90 transition-colors ${
                        proj.isPriorityForManagement ? 'bg-warning-50/30' : ''
                      }`}
                    >
                      {/* 1. Prioritized for Management Star */}
                      <td className="py-3 px-3 text-center">
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
                      </td>

                      {/* 2. Solution Name & Identifiers */}
                      <td className="py-3 px-4">
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
                          <span className="font-mono font-bold text-brand-dark bg-brand-lighter px-1 rounded border border-brand-light">
                            {proj.assetId}
                          </span>
                          <span>•</span>
                          <span className="font-mono">GLPI: #{proj.glpiTicketId}</span>
                        </div>
                      </td>

                      {/* 3. Department & Owner */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-grey-800">{proj.department}</div>
                        <div className="text-[11px] text-grey-500 truncate" title={`Dono: ${proj.businessResponsible}`}>
                          {proj.businessResponsible}
                        </div>
                      </td>

                      {/* 4. Technical Type & GovStage */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-0.5">
                            <Workflow className="w-2.5 h-2.5" />
                            Tipo {proj.projectType || 'A'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-grey-100 text-grey-700 border border-grey-200">
                            {proj.govStage || 'E1'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Stage Select (Interactive) */}
                      <td className="py-3 px-3">
                        <select
                          value={proj.stage || 'Levantamento & Ficha'}
                          onChange={(e) => handleStageChange(proj, e.target.value as ProjectStage)}
                          className={`text-xs font-bold rounded-lg px-2 py-1 border transition-colors cursor-pointer w-full ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} focus:outline-hidden focus:ring-1 focus:ring-brand-main`}
                        >
                          {ALL_STAGES.map((stg) => (
                            <option key={stg} value={stg} className="bg-white text-grey-900">
                              {stg}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 6. Priority Select */}
                      <td className="py-3 px-3">
                        <select
                          value={proj.executivePriority || 'P2 - Média'}
                          onChange={(e) => handlePriorityChange(proj, e.target.value as ExecutivePriority)}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer w-full ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border} focus:outline-hidden focus:ring-1 focus:ring-brand-main`}
                        >
                          <option value="P0 - Urgente">P0 - Urgente</option>
                          <option value="P1 - Alta">P1 - Alta</option>
                          <option value="P2 - Média">P2 - Média</option>
                          <option value="P3 - Baixa">P3 - Baixa</option>
                        </select>
                      </td>

                      {/* 7. Impediment Button & Status */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setActiveImpedimentModalProject(proj)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 w-full justify-center ${
                            proj.hasImpediment
                              ? 'bg-danger-50 text-danger-800 border-danger-300 hover:bg-danger-300'
                              : 'bg-grey-50 text-grey-500 border-grey-200 hover:bg-grey-100'
                          }`}
                          title="Clique para editar detalhes do impedimento e ação necessária da gestão"
                        >
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${proj.hasImpediment ? 'text-danger-500' : 'text-grey-400'}`} />
                          <span className="truncate">
                            {proj.hasImpediment ? '🚨 Bloqueado' : 'Sem bloqueio'}
                          </span>
                        </button>
                      </td>

                      {/* 8. Scheduled Date */}
                      <td className="py-3 px-3">
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
                      </td>

                      {/* 9. Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveNotesModalProject(proj)}
                            className="p-1.5 rounded hover:bg-grey-100 text-grey-600 hover:text-grey-900 transition-colors"
                            title="Anotações & Observações"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onSelectProjectAndNavigate(proj, 'glpi')}
                            className="px-2.5 py-1 bg-brand-lighter hover:bg-brand-lighter text-brand-dark font-bold rounded border border-brand-light text-xs transition-colors flex items-center gap-1"
                            title="Abrir detalhes da solução"
                          >
                            <span>Abrir</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: ALINHAMENTO DE DEMANDAS DEPARTAMENTAIS (1:1) */}
      {viewMode === 'executive_summary' && (
        <div className="space-y-6">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-warning-600">
            <div>
              <span className="font-black text-sm block mb-0.5">Gestão de Demandas Departamentais - Alinhamento (1:1 com a Gestão)</span>
              Visão consolidada para sua reunião de reporte: demandas priorizadas com destaque, bloqueios/impedimentos onde a ação da gestão é necessária, e cronograma de datas já marcadas.
            </div>

            <button
              onClick={handleCopyManagementPauta}
              className="px-3.5 py-2 bg-warning-600 hover:bg-warning-600 text-white font-bold rounded-full shadow-2xs shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar Pauta Formatada</span>
            </button>
          </div>

          {/* Block 1: Prioritized Demands */}
          <div className="bg-white border border-grey-200 rounded-lg p-5 shadow-2xs space-y-4">
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
                                <span className="font-mono text-xs font-bold text-brand-dark bg-white px-1.5 py-0.5 rounded border border-brand-light">
                                  {proj.assetId}
                                </span>
                                <span className="text-xs font-bold text-grey-900">{proj.name}</span>
                              </div>
                              <p className="text-xs text-grey-500 mt-1 line-clamp-2">{proj.objective}</p>
                            </div>

                            <button
                              onClick={() => handleTogglePrioritizeForManagement(proj)}
                              className="p-1 text-warning-600 hover:text-warning-600"
                              title="Remover da pauta de gestão"
                            >
                              <Star className="w-4 h-4 fill-warning-500 text-warning-500" />
                            </button>
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
                          <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Tipo {proj.projectType || 'A'} • Esteira {proj.govStage || 'E1'}
                          </span>
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
          </div>

          {/* Block 2: Active Impediments */}
          <div className="bg-white border border-grey-200 rounded-lg p-5 shadow-2xs space-y-4">
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
                          <span className="font-mono text-xs font-bold text-danger-800 bg-white px-1.5 py-0.5 rounded border border-danger-300">
                            {proj.assetId}
                          </span>
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

                      <button
                        onClick={() => setActiveImpedimentModalProject(proj)}
                        className="px-3 py-1.5 bg-danger-800 hover:bg-danger-800 text-white font-bold rounded-full text-xs shrink-0 transition-colors"
                      >
                        Atualizar Bloqueio
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALL_STAGES.slice(0, 4).map((stg) => {
            const list = filteredProjects.filter((p) => (p.stage || 'Levantamento & Ficha') === stg);
            return (
              <div key={stg} className="bg-grey-50 border border-grey-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-grey-800">{stg}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-grey-600 border border-grey-200">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {list.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onSelectProjectAndNavigate(proj, 'glpi')}
                      className="p-3 bg-white rounded-lg border border-grey-200 hover:border-brand-main shadow-2xs cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-grey-500">
                        <span>{proj.assetId}</span>
                        <span className="font-bold text-purple-800">Tipo {proj.projectType || 'A'}</span>
                      </div>
                      <div className="text-xs font-bold text-grey-900 line-clamp-1">{proj.name}</div>
                      <div className="text-[11px] text-grey-500 truncate">{proj.businessResponsible}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: EDITAR ANOTAÇÕES */}
      {activeNotesModalProject && (
        <div className="fixed inset-0 bg-grey-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 border border-grey-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-grey-900">
              Anotações da Solução: {activeNotesModalProject.name}
            </h3>
            <textarea
              rows={5}
              defaultValue={activeNotesModalProject.notes || ''}
              id="modal-notes-textarea"
              placeholder="Digite anotações ou observações internas sobre o andamento desta demanda..."
              className="w-full p-3 border border-grey-300 rounded-lg text-xs bg-grey-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-main"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveNotesModalProject(null)}
                className="px-4 py-2 text-xs font-bold text-grey-600 hover:text-grey-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('modal-notes-textarea') as HTMLTextAreaElement)?.value || '';
                  handleSaveNotes(activeNotesModalProject, val);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-dark hover:bg-brand-dark rounded-full shadow-2xs transition-colors"
              >
                Salvar Anotações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR IMPEDIMENTO & AÇÃO DA GESTÃO */}
      {activeImpedimentModalProject && (
        <div className="fixed inset-0 bg-grey-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 border border-grey-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-grey-900">
              Registro de Bloqueio: {activeImpedimentModalProject.name}
            </h3>
            <p className="text-xs text-grey-500">
              Informe o bloqueio e qual ação é requerida da gestão para destravar.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-grey-800">
                <input
                  type="checkbox"
                  id="modal-has-impediment"
                  defaultChecked={activeImpedimentModalProject.hasImpediment}
                  className="w-4 h-4 rounded text-danger-500 focus:ring-danger-500 border-grey-300"
                />
                <span>Projeto atualmente com impedimento / bloqueio</span>
              </label>

              <div>
                <label className="text-xs font-bold text-grey-700 block mb-1">
                  Detalhes do Bloqueio:
                </label>
                <textarea
                  rows={3}
                  id="modal-impediment-details"
                  defaultValue={activeImpedimentModalProject.impedimentDetails || ''}
                  placeholder="Ex: Aguardando liberação de porta de banco no firewall ou aprovação da área jurídica..."
                  className="w-full p-2.5 border border-grey-300 rounded-lg text-xs bg-grey-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-grey-700 block mb-1">
                  Ação Requerida da Gestão para Destravar:
                </label>
                <textarea
                  rows={2}
                  id="modal-action-management"
                  defaultValue={activeImpedimentModalProject.actionRequiredFromManagement || ''}
                  placeholder="Ex: Cobrar área de Infraestrutura para priorizar ticket de rede..."
                  className="w-full p-2.5 border border-grey-300 rounded-lg text-xs bg-grey-50 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveImpedimentModalProject(null)}
                className="px-4 py-2 text-xs font-bold text-grey-600 hover:text-grey-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const has = (document.getElementById('modal-has-impediment') as HTMLInputElement)?.checked || false;
                  const det = (document.getElementById('modal-impediment-details') as HTMLTextAreaElement)?.value || '';
                  const act = (document.getElementById('modal-action-management') as HTMLTextAreaElement)?.value || '';
                  handleSaveImpediment(activeImpedimentModalProject, has, det, act);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-danger-800 hover:bg-danger-800 rounded-full shadow-2xs transition-colors"
              >
                Salvar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AGENDAR DATA / REUNIÃO */}
      {activeScheduleModalProject && (
        <div className="fixed inset-0 bg-grey-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border border-grey-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-grey-900">
              Agendar Reunião ou Entrega: {activeScheduleModalProject.name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-grey-700 block mb-1">Data:</label>
                <input
                  type="date"
                  id="modal-schedule-date"
                  defaultValue={activeScheduleModalProject.scheduledDate || ''}
                  className="w-full p-2 border border-grey-300 rounded-lg text-xs font-mono font-bold bg-grey-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-grey-700 block mb-1">Pauta / Assunto:</label>
                <input
                  type="text"
                  id="modal-schedule-subject"
                  defaultValue={activeScheduleModalProject.scheduledSubject || ''}
                  placeholder="Ex: Reunião de Entendimento (E1) ou Homologação T.I"
                  className="w-full p-2 border border-grey-300 rounded-lg text-xs bg-grey-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveScheduleModalProject(null)}
                className="px-4 py-2 text-xs font-bold text-grey-600 hover:text-grey-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const date = (document.getElementById('modal-schedule-date') as HTMLInputElement)?.value || '';
                  const sub = (document.getElementById('modal-schedule-subject') as HTMLInputElement)?.value || '';
                  handleSaveSchedule(activeScheduleModalProject, date, sub);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-dark hover:bg-brand-dark rounded-full shadow-2xs transition-colors"
              >
                Salvar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
