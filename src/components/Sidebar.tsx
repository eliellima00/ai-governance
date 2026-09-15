import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  Layers,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Sliders,
  PlusCircle,
  Search,
  Star,
  FolderKanban,
  SlidersHorizontal
} from 'lucide-react';
import { ProjectTab, SolutionProject, Route, UserRole } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import { can } from '../utils/permissions';
import { AttoLogo } from './AttoLogo';

export interface SidebarProps {
  route: Route;
  projects: SolutionProject[];
  currentProject?: SolutionProject;
  activeTab?: ProjectTab;
  onSelectTab: (tab: ProjectTab) => void;
  onNavigateToPortfolio: () => void;
  onNavigateToSettings: () => void;
  onNavigateToProject: (projectId: string, tab?: ProjectTab) => void;
  onOpenNewProject: () => void;
  residualScore?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  route,
  projects,
  currentProject,
  activeTab = 'glpi',
  onSelectTab,
  onNavigateToPortfolio,
  onNavigateToSettings,
  onNavigateToProject,
  onOpenNewProject,
  residualScore = 0,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  userRole
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const isInProject = route.name === 'project' && !!currentProject;
  const canCreate = can('create_project', userRole);

  const currentRiskColor = getRiskColorClass(
    residualScore <= 5 ? 'BAIXO' : residualScore <= 12 ? 'MEDIO' : residualScore <= 20 ? 'ALTO' : 'CRITICO'
  );

  const completedActions = currentProject
    ? currentProject.actionPlan.filter((a) => a.status === 'Concluído').length
    : 0;
  const totalActions = currentProject ? currentProject.actionPlan.length : 0;

  // Filtered projects for the sidebar quick-list
  const filteredProjects = projects.filter((p) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.assetId.toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term)
    );
  });

  const projectMenuItems = [
    {
      id: 'glpi' as const,
      label: 'Ficha do Ativo & Doc Viva',
      shortLabel: 'Ficha do Ativo',
      icon: FileText,
      badge: currentProject?.assetId || 'GLPI',
      badgeColor: 'bg-grey-700 text-grey-200',
      description: 'Formulário GLPI e Doc Técnica'
    },
    {
      id: 'diagnostic' as const,
      label: 'Diagnóstico de Risco (regras)',
      shortLabel: 'Diagnóstico',
      icon: ShieldAlert,
      badge: `${currentProject?.initialScore ?? 0} pts`,
      badgeColor: 'bg-danger-800/60 text-danger-300 border border-danger-800/80 font-bold',
      description: 'Score inicial e critérios determinísticos'
    },
    {
      id: 'action_plan' as const,
      label: 'Plano de Ação & Mitigações',
      shortLabel: 'Plano de Ação',
      icon: CheckCircle2,
      badge: `${completedActions}/${totalActions}`,
      badgeColor:
        completedActions === totalActions && totalActions > 0
          ? 'bg-brand-dark text-brand-lighter border border-brand-main font-bold'
          : 'bg-warning-600/60 text-warning-200 border border-warning-600 font-semibold',
      description: 'Mitigações, prazos e donos'
    },
    {
      id: 'evolution' as const,
      label: 'Evolução da Criticidade',
      shortLabel: 'Evolução Risco',
      icon: Layers,
      badge: `${residualScore} pts`,
      badgeColor: 'bg-info-700/60 text-info-200 border border-info-700 font-extrabold',
      description: 'Curva histórica do score residual'
    },
    {
      id: 'estimation' as const,
      label: 'Estimativa & Cronograma',
      shortLabel: 'Estimativa',
      icon: Clock,
      badge: `Tipo ${currentProject?.projectType || 'A'}`,
      badgeColor: 'bg-purple-900/60 text-purple-200 border border-purple-800 font-bold',
      description: 'Esforço, janela, reuniões & esteira'
    }
  ];

  const handleSelectTab = (tab: ProjectTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleNavigateProject = (id: string) => {
    onNavigateToProject(id, 'glpi');
    onCloseMobile();
  };

  const handleGoPortfolio = () => {
    onNavigateToPortfolio();
    onCloseMobile();
  };

  const handleGoSettings = () => {
    onNavigateToSettings();
    onCloseMobile();
  };

  const handleCreateNew = () => {
    onOpenNewProject();
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container (Industriatto Base Dark #1E1F20) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-base-back text-white flex flex-col transition-all duration-300 ease-in-out border-r border-[#2E3032] ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header with Industriatto Logo and Colors */}
        <div className="p-3 border-b border-[#2E3032] bg-[#171819] flex items-center justify-between">
          <div
            onClick={handleGoPortfolio}
            className="cursor-pointer select-none group min-w-0"
            title="Ir para a Gestão de Demandas (Industriatto ATTO Sementes)"
          >
            <AttoLogo variant="dark" isCollapsed={isCollapsed} subtitle="Governança T.I" />
          </div>

          {!isCollapsed && (
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                userRole === 'admin'
                  ? 'bg-brand-dark text-brand-lighter border border-brand-main'
                  : 'bg-grey-800 text-grey-300'
              }`}
            >
              {userRole}
            </span>
          )}
        </div>

        {/* Primary Menu Navigation: Gestão de Demandas, Nova Solução, Parametrização */}
        <div className="p-2 border-b border-[#2E3032] space-y-1.5 bg-[#171819]/60">
          {!isCollapsed && (
            <div className="px-2 pt-1 pb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
              Menu Principal
            </div>
          )}

          {/* 1. Gestão de Demandas */}
          <button
            onClick={handleGoPortfolio}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all ${
              route.name === 'portfolio'
                ? 'bg-brand-main text-white shadow-xs font-bold'
                : 'text-grey-300 hover:bg-[#2E3032] hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Gestão de Demandas Departamentais (Portfólio Geral)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderKanban className={`w-4 h-4 shrink-0 ${route.name === 'portfolio' ? 'text-white' : 'text-brand-light'}`} />
              {!isCollapsed && <span className="truncate">Gestão de Demandas</span>}
            </div>
            {!isCollapsed && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/40 text-brand-lighter border border-brand-main/40 font-bold">
                {projects.length}
              </span>
            )}
          </button>

          {/* 2. Formulário de Nova Solução (Pill Button Industriatto) */}
          <button
            onClick={handleCreateNew}
            disabled={!canCreate}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-bold transition-all ${
              canCreate
                ? 'bg-brand-main hover:bg-brand-dark text-white shadow-xs border border-[#75AD40]/30'
                : 'bg-grey-800/40 text-grey-500 cursor-not-allowed border border-transparent'
            } ${isCollapsed ? 'justify-center px-0 rounded-full' : ''}`}
            title={canCreate ? 'Cadastrar Nova Solução / Demanda' : 'Cadastro restrito ao perfil Admin'}
          >
            <div className="flex items-center gap-2 min-w-0">
              <PlusCircle className={`w-4 h-4 shrink-0 ${canCreate ? 'text-[#FFED00]' : 'text-grey-600'}`} />
              {!isCollapsed && <span className="truncate">Nova Solução</span>}
            </div>
            {!isCollapsed && canCreate && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-dark text-brand-lighter">
                + Novo
              </span>
            )}
          </button>

          {/* 3. Tela de Parametrização */}
          <button
            onClick={handleGoSettings}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-semibold transition-all ${
              route.name === 'settings'
                ? 'bg-brand-main text-white shadow-xs font-bold'
                : 'text-grey-300 hover:bg-[#2E3032] hover:text-white'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Parametrização & Regras de Governança T.I"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <SlidersHorizontal className={`w-4 h-4 shrink-0 ${route.name === 'settings' ? 'text-white' : 'text-grey-400'}`} />
              {!isCollapsed && <span className="truncate">Parametrização</span>}
            </div>
            {!isCollapsed && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono text-grey-400 bg-black/40">
                Regras T.I
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Center Section: Asset Workspace OR Root Solutions List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
          {isInProject && currentProject ? (
            /* ========================================================================= */
            /* MODE A: INSIDE A SOLUTION WORKSPACE (PROJECT CONTEXT)                    */
            /* ========================================================================= */
            <div className="space-y-3">
              {/* Back to Demands quick action (Pill Button) */}
              <button
                onClick={handleGoPortfolio}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-brand-lighter hover:text-white bg-brand-dark/80 hover:bg-brand-dark border border-brand-main transition-all ${
                  isCollapsed ? 'justify-center rounded-full' : ''
                }`}
                title="Voltar para a Gestão de Demandas"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0 text-[#FFED00]" />
                {!isCollapsed && <span className="truncate">← Voltar às Demandas</span>}
              </button>

              {/* Active Asset Card */}
              {!isCollapsed ? (
                <div className="p-3 rounded-lg border border-[#2E3032] bg-[#141516] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-brand-light font-bold tracking-tight">
                      {currentProject.assetId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-grey-800 text-grey-300 text-[10px]">
                      {currentProject.department}
                    </span>
                  </div>
                  <h2 className="text-xs font-black text-white line-clamp-2 leading-snug">
                    {currentProject.name}
                  </h2>
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#2E3032] text-[10px]">
                    <span className="inline-flex items-center gap-1 font-bold text-purple-300">
                      <Workflow className="w-3 h-3" />
                      Tipo {currentProject.projectType || 'A'}
                    </span>
                    <span className="text-grey-500">•</span>
                    <span className="text-grey-300 font-medium">Esteira {currentProject.govStage || 'E0'}</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center border-b border-[#2E3032] text-[10px] font-mono text-brand-light font-bold">
                  {currentProject.assetId}
                </div>
              )}

              {/* Asset Workspace 5 Tabs */}
              <div>
                {!isCollapsed && (
                  <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                    Abas da Solução
                  </div>
                )}

                <div className="space-y-1">
                  {projectMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-full text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-brand-main text-white shadow-xs font-bold'
                            : 'text-grey-300 hover:bg-[#2E3032] hover:text-white'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-white' : 'text-grey-400'
                            }`}
                          />
                          {!isCollapsed && (
                            <div className="text-left truncate">
                              <div className="truncate text-xs font-bold">{item.shortLabel}</div>
                              <div
                                className={`text-[10px] truncate ${
                                  isActive ? 'text-brand-lighter' : 'text-grey-400'
                                }`}
                              >
                                {item.description}
                              </div>
                            </div>
                          )}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Switcher to another Solution */}
              {!isCollapsed && projects.length > 1 && (
                <div className="pt-2 border-t border-[#2E3032]">
                  <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                    Outras Soluções
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin">
                    {projects
                      .filter((p) => p.id !== currentProject.id)
                      .slice(0, 5)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleNavigateProject(p.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-full text-[11px] text-grey-300 hover:bg-[#2E3032] hover:text-white transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate pr-1 group-hover:text-brand-light">
                            {p.name}
                          </span>
                          <span className="font-mono text-[9px] text-grey-400 shrink-0">
                            {p.assetId}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* MODE B: ROOT LEVEL (PORTFOLIO & SETTINGS)                                 */
            /* ========================================================================= */
            <div className="space-y-3">
              {/* Section Header */}
              {!isCollapsed ? (
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                    Soluções Departamentais
                  </span>
                  <span className="text-[10px] font-mono font-bold text-brand-light">
                    {filteredProjects.length}/{projects.length}
                  </span>
                </div>
              ) : (
                <div className="text-center text-[9px] text-grey-400 font-bold uppercase">
                  Ativos
                </div>
              )}

              {/* Quick Search inside Sidebar */}
              {!isCollapsed && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-grey-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por nome ou ID..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-[#141516] border border-[#2E3032] rounded-lg text-xs text-white placeholder-grey-500 focus:outline-none focus:border-brand-main"
                  />
                </div>
              )}

              {/* List of Solutions / Ativos */}
              <div className="space-y-1">
                {filteredProjects.map((project) => {
                  const isCurrent = currentProject?.id === project.id && isInProject;
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleNavigateProject(project.id)}
                      className={`w-full text-left p-2 rounded-full transition-all group ${
                        isCurrent
                          ? 'bg-brand-dark border border-brand-main text-white'
                          : 'text-grey-300 hover:bg-[#2E3032] hover:text-white border border-transparent'
                      } ${isCollapsed ? 'text-center py-2 px-1' : ''}`}
                      title={`${project.assetId} - ${project.name}`}
                    >
                      {isCollapsed ? (
                        <div className="font-mono text-[10px] font-bold text-brand-light truncate">
                          {project.assetId.replace('SOL-', '')}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold text-brand-light flex items-center gap-1">
                              {project.isPriorityForManagement && (
                                <Star className="w-3 h-3 fill-[#EAB818] text-[#EAB818] shrink-0" />
                              )}
                              <span>{project.assetId}</span>
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-grey-800 text-grey-300 text-[9px] font-semibold">
                              {project.govStage || 'E0'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-grey-200 group-hover:text-white truncate leading-tight">
                            {project.name}
                          </div>
                          <div className="text-[10px] text-grey-400 truncate flex items-center justify-between">
                            <span>{project.department}</span>
                            <span className="text-grey-500 font-mono text-[9px]">
                              Tipo {project.projectType || 'A'}
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}

                {filteredProjects.length === 0 && !isCollapsed && (
                  <div className="p-4 text-center text-xs text-grey-500 italic">
                    Nenhuma demanda encontrada
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Metrics / Risk Widget */}
        {!isCollapsed && (
          <div className="p-3 mx-2.5 mb-2 rounded-lg bg-[#141516] border border-[#2E3032] text-xs space-y-1">
            {isInProject && currentProject ? (
              <>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-grey-400 font-medium">Criticidade Residual:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentRiskColor.badge}`}>
                    {residualScore <= 5 ? 'Baixo' : residualScore <= 12 ? 'Médio' : residualScore <= 20 ? 'Alto' : 'Crítico'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black font-mono text-white">{residualScore} pts</span>
                  <span className="text-[10px] text-grey-400">
                    de {currentProject.initialScore} pts iniciais
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-[10px] text-grey-400">
                  <span>Demandas Ativas:</span>
                  <strong className="text-brand-light font-mono">{projects.length}</strong>
                </div>
                <div className="flex items-center justify-between text-[10px] text-grey-400">
                  <span>Priorizadas Gestão:</span>
                  <strong className="text-[#FFED00] font-mono">
                    {projects.filter((p) => p.isPriorityForManagement).length}
                  </strong>
                </div>
              </>
            )}
          </div>
        )}

        {/* Collapse Sidebar Toggle (Desktop only) */}
        <div className="p-2.5 border-t border-[#2E3032] hidden lg:block bg-[#171819]">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-full text-grey-400 hover:text-white hover:bg-[#2E3032] transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
