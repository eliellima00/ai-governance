import React from 'react';
import {
  FolderKanban,
  PlusCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutDashboard,
  FolderOpen,
  Clock,
  CheckCircle2,
  Table2,
  Columns3,
  GanttChart,
  Calculator,
  Gauge,
  ListChecks,
  List,
  FlaskConical,
  Database,
  HardDriveDownload
} from 'lucide-react';
import {
  GovernanceConfig,
  PortfolioView,
  ProjectTab,
  Route,
  SettingsSection,
  SolutionProject,
  UserRole
} from '../types';
import { can } from '../utils/permissions';
import { getStageState, STAGE_TABS } from '../utils/projectStatus';
import { AttoLogo } from './AttoLogo';

export interface SidebarProps {
  route: Route;
  onNavigateToPortfolio: () => void;
  onNavigateToSettings: () => void;
  onOpenNewProject: () => void;
  onNavigateToMyWeek: () => void;
  onNavigateToPortfolioView: (view: PortfolioView) => void;
  onNavigateToSettingsSection: (section: SettingsSection) => void;
  onSelectProjectTab: (tab: ProjectTab) => void;
  /** Projeto aberto (só na rota de projeto): o menu mostra a navegação dele. */
  currentProject?: SolutionProject;
  config: GovernanceConfig;
  myWeekEnabled: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userRole: UserRole;
}

const PORTFOLIO_VIEW_ITEMS: { id: PortfolioView; label: string; icon: React.ElementType }[] = [
  { id: 'spreadsheet', label: 'Planilha Executiva', icon: Table2 },
  { id: 'kanban', label: 'Funil de Etapas (Kanban)', icon: Columns3 },
  { id: 'gantt', label: 'Cronograma (Gantt)', icon: GanttChart }
];

const SETTINGS_SECTION_ITEMS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'estimation', label: 'Motor de Estimativa', icon: Calculator },
  { id: 'risk', label: 'Réguas de Risco', icon: Gauge },
  { id: 'checklists', label: 'Critérios de Saída', icon: ListChecks },
  { id: 'lists', label: 'Listas & Categorias', icon: List },
  { id: 'flags', label: 'Funcionalidades (Beta)', icon: FlaskConical },
  { id: 'database', label: 'Banco de Dados', icon: Database },
  { id: 'backup', label: 'Backup (JSON)', icon: HardDriveDownload }
];

/**
 * Menu lateral único do app. Além da navegação de topo, mostra as seções da tela aberta
 * (visões do portfólio, navegação do projeto, seções da parametrização) — as telas não têm abas internas.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  route,
  onNavigateToPortfolio,
  onNavigateToSettings,
  onOpenNewProject,
  onNavigateToMyWeek,
  onNavigateToPortfolioView,
  onNavigateToSettingsSection,
  onSelectProjectTab,
  currentProject,
  config,
  myWeekEnabled,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  userRole
}) => {
  const canCreate = can('create_project', userRole);
  const canConfigure = can('edit_settings', userRole);

  // Toda navegação fecha o drawer no mobile
  const go = (fn: () => void) => () => {
    fn();
    onCloseMobile();
  };

  const isPortfolioActive = route.name === 'portfolio' || route.name === 'project';
  const activePortfolioView = route.name === 'portfolio' ? route.view || 'spreadsheet' : null;
  const activeSettingsSection = route.name === 'settings' ? route.section || 'estimation' : null;
  const activeProjectTab = route.name === 'project' ? route.tab : null;

  const topItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-xs font-semibold transition-all ${
      isActive ? 'bg-brand-dark text-white shadow-xs font-bold' : 'text-grey-600 hover:bg-grey-100 hover:text-grey-900'
    } ${isCollapsed ? 'justify-center px-0' : ''}`;

  const subItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-2 rounded-md text-xs transition-colors ${
      isCollapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-1.5'
    } ${isActive ? 'bg-brand-lighter text-brand-dark font-bold' : 'text-grey-600 hover:bg-grey-100 hover:text-grey-900'}`;

  const SubItem: React.FC<{
    isActive: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    hint?: string;
  }> = ({ isActive, onClick, label, icon, hint }) => (
    <button type="button" onClick={go(onClick)} className={subItemClass(isActive)} title={hint || label}>
      <span className="shrink-0 flex items-center justify-center w-4">{icon}</span>
      {!isCollapsed && <span className="truncate text-left">{label}</span>}
    </button>
  );

  const subList = (children: React.ReactNode) => (
    <div className={`space-y-0.5 ${isCollapsed ? '' : 'ml-4 pl-2 border-l border-grey-200'}`}>{children}</div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white text-grey-700 flex flex-col transition-all duration-300 ease-in-out border-r border-grey-200 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-3 border-b border-grey-200 flex items-center justify-between">
          <div
            onClick={go(onNavigateToPortfolio)}
            className="cursor-pointer select-none group min-w-0"
            title="Ir para a Gestão de Demandas (Industriatto ATTO Sementes)"
          >
            <AttoLogo isCollapsed={isCollapsed} subtitle="Governança T.I" />
          </div>

          {!isCollapsed && (
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                userRole === 'admin'
                  ? 'bg-brand-lighter text-brand-dark border border-brand-light'
                  : 'bg-grey-100 text-grey-500 border border-grey-200'
              }`}
            >
              {userRole}
            </span>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1.5" aria-label="Menu principal">
          {!isCollapsed && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-grey-400">
              Menu Principal
            </div>
          )}

          <button
            onClick={go(onNavigateToPortfolio)}
            data-tour="sidebar-portfolio-btn"
            className={topItemClass(isPortfolioActive)}
            title="Gestão de Demandas Departamentais (Portfólio Geral)"
          >
            <FolderKanban className={`w-4 h-4 shrink-0 ${isPortfolioActive ? 'text-white' : 'text-brand-main'}`} />
            {!isCollapsed && <span className="truncate">Gestão de Demandas</span>}
          </button>

          {/* Visões do portfólio */}
          {activePortfolioView && (
            <div data-tour="portfolio-view-switcher">
              {subList(
                PORTFOLIO_VIEW_ITEMS.map((item) => (
                  <SubItem
                    key={item.id}
                    isActive={activePortfolioView === item.id}
                    onClick={() => onNavigateToPortfolioView(item.id)}
                    label={item.label}
                    icon={<item.icon className="w-3.5 h-3.5" />}
                  />
                ))
              )}
            </div>
          )}

          {/* Navegação do projeto aberto */}
          {currentProject && activeProjectTab && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="ml-4 pl-2 pt-1 text-[11px] font-bold text-grey-900 truncate" title={currentProject.name}>
                  {currentProject.name}
                </div>
              )}
              {subList(
                <>
                  <SubItem
                    isActive={activeProjectTab === 'overview'}
                    onClick={() => onSelectProjectTab('overview')}
                    label="Visão Geral"
                    icon={<LayoutDashboard className="w-3.5 h-3.5" />}
                  />

                  {!isCollapsed && (
                    <div className="px-2.5 pt-2 pb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-grey-400">
                      Esteira
                    </div>
                  )}
                  {STAGE_TABS.map((stage) => {
                    const state = getStageState(currentProject, stage);
                    const icon =
                      state === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-main" />
                      ) : state === 'current' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-main ring-2 ring-brand-lighter" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full border border-grey-300" />
                      );
                    const label = `${stage} - ${config.stageNames[stage] || stage}`;
                    return isCollapsed ? (
                      <button
                        key={stage}
                        type="button"
                        onClick={go(() => onSelectProjectTab(stage))}
                        className={`${subItemClass(activeProjectTab === stage)} font-mono font-bold`}
                        title={label}
                      >
                        {stage}
                      </button>
                    ) : (
                      <SubItem
                        key={stage}
                        isActive={activeProjectTab === stage}
                        onClick={() => onSelectProjectTab(stage)}
                        label={label}
                        icon={icon}
                        hint={`${label}${state === 'current' ? ' (etapa atual)' : ''}`}
                      />
                    );
                  })}

                  {!isCollapsed && <div className="pt-1.5" />}
                  <SubItem
                    isActive={activeProjectTab === 'ficha'}
                    onClick={() => onSelectProjectTab('ficha')}
                    label="Ficha & Documentos"
                    icon={<FolderOpen className="w-3.5 h-3.5" />}
                  />
                  <SubItem
                    isActive={activeProjectTab === 'estimation'}
                    onClick={() => onSelectProjectTab('estimation')}
                    label="Estimativa"
                    icon={<Clock className="w-3.5 h-3.5" />}
                  />
                </>
              )}
            </div>
          )}

          {myWeekEnabled && (
            <button
              onClick={go(onNavigateToMyWeek)}
              data-tour="sidebar-my-week-btn"
              className={topItemClass(route.name === 'my-week')}
              title="Minha Semana (planner semanal) — beta"
            >
              <CalendarDays
                className={`w-4 h-4 shrink-0 ${route.name === 'my-week' ? 'text-white' : 'text-brand-main'}`}
              />
              {!isCollapsed && <span className="truncate">Minha Semana</span>}
            </button>
          )}

          {canCreate && (
            <button
              onClick={go(onOpenNewProject)}
              data-tour="sidebar-new-solution-btn"
              className={topItemClass(route.name === 'new-project')}
              title="Cadastrar Nova Solução / Demanda"
            >
              <PlusCircle
                className={`w-4 h-4 shrink-0 ${route.name === 'new-project' ? 'text-white' : 'text-brand-main'}`}
              />
              {!isCollapsed && <span className="truncate">Nova Solução</span>}
            </button>
          )}

          {canConfigure && (
            <button
              onClick={go(onNavigateToSettings)}
              data-tour="sidebar-settings-btn"
              className={topItemClass(route.name === 'settings')}
              title="Parametrização & Regras de Governança T.I"
            >
              <SlidersHorizontal
                className={`w-4 h-4 shrink-0 ${route.name === 'settings' ? 'text-white' : 'text-grey-500'}`}
              />
              {!isCollapsed && <span className="truncate">Parametrização</span>}
            </button>
          )}

          {/* Seções da parametrização */}
          {activeSettingsSection &&
            subList(
              SETTINGS_SECTION_ITEMS.map((item) => (
                <SubItem
                  key={item.id}
                  isActive={activeSettingsSection === item.id}
                  onClick={() => onNavigateToSettingsSection(item.id)}
                  label={item.label}
                  icon={<item.icon className="w-3.5 h-3.5" />}
                />
              ))
            )}
        </nav>

        {/* Collapse Sidebar Toggle (Desktop only) */}
        <div className="p-2.5 border-t border-grey-200 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-full text-grey-400 hover:text-grey-700 hover:bg-grey-100 transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
