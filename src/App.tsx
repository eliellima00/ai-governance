import React, { useState, useEffect, useCallback } from 'react';
import {
  ActionItem,
  ActionStatus,
  GovernanceConfig,
  ProjectTab,
  Route,
  SolutionProject,
  UserRole
} from './types';
import { PORTAL_LOGISTICA_PROJECT } from './data/portalLogisticaData';
import { computeResidualScore } from './utils/riskCalculations';
import { loadState, saveState, resetToDefaultState } from './utils/storage';
import { getActiveConfig } from './config/governanceConfig';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GlpiAssetView } from './components/GlpiAssetView';
import { AiDiagnosticView } from './components/AiDiagnosticView';
import { ActionPlanView } from './components/ActionPlanView';
import { CriticalityEvolutionView } from './components/CriticalityEvolutionView';
import { ProjectPortfolioDashboard } from './components/ProjectPortfolioDashboard';
import { EstimationScheduleView } from './components/EstimationScheduleView';
import { SettingsView } from './components/SettingsView';
import { NewProjectModal } from './components/NewProjectModal';

// Helper to parse URL hash into Route
function parseHashToRoute(): Route | null {
  const hash = window.location.hash.replace('#', '');
  if (!hash || hash === 'portfolio') {
    return { name: 'portfolio' };
  }
  if (hash === 'settings') {
    return { name: 'settings' };
  }
  const parts = hash.split('/');
  if (parts[0] === 'project' && parts[1]) {
    const validTabs: ProjectTab[] = ['glpi', 'diagnostic', 'action_plan', 'evolution', 'estimation'];
    const tab = validTabs.includes(parts[2] as ProjectTab) ? (parts[2] as ProjectTab) : 'glpi';
    return {
      name: 'project',
      projectId: parts[1],
      tab
    };
  }
  return null;
}

// Helper to sync Route to URL hash
function syncRouteToHash(route: Route) {
  if (route.name === 'portfolio') {
    if (window.location.hash !== '#portfolio') {
      window.location.hash = '#portfolio';
    }
  } else if (route.name === 'settings') {
    if (window.location.hash !== '#settings') {
      window.location.hash = '#settings';
    }
  } else if (route.name === 'project') {
    const targetHash = `#project/${route.projectId}/${route.tab}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }
}

export default function App() {
  // Initialize state from localStorage
  const [initialLoaded] = useState(() => loadState());

  const [projects, setProjects] = useState<SolutionProject[]>(initialLoaded.projects);
  const [userRole, setUserRole] = useState<UserRole>(initialLoaded.role || 'admin');
  const [governanceConfig, setGovernanceConfig] = useState<GovernanceConfig>(
    initialLoaded.settings || getActiveConfig()
  );

  // Route state initialized from URL hash or storage
  const [route, setRoute] = useState<Route>(() => {
    const fromHash = parseHashToRoute();
    if (fromHash) return fromHash;
    if (initialLoaded.route) return initialLoaded.route;
    return { name: 'portfolio' };
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Sync state to localStorage whenever changed
  useEffect(() => {
    saveState({
      role: userRole,
      route,
      projects,
      settings: governanceConfig,
      savedAt: ''
    });
    syncRouteToHash(route);
  }, [projects, userRole, route, governanceConfig]);

  // Listen to browser hash changes (Back / Forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHashToRoute();
      if (parsed) {
        setRoute(parsed);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Determine current project when in 'project' route
  const currentProjectId = route.name === 'project' ? route.projectId : projects[0]?.id;
  const currentProject =
    projects.find((p) => p.id === currentProjectId) || projects[0] || PORTAL_LOGISTICA_PROJECT;

  // Calculate residual score for current project
  const residualStats = computeResidualScore(
    currentProject.initialScore,
    currentProject.actionPlan
  );

  // Navigation handlers
  const navigateToPortfolio = useCallback(() => {
    setRoute({ name: 'portfolio' });
  }, []);

  const navigateToSettings = useCallback(() => {
    setRoute({ name: 'settings' });
  }, []);

  const navigateToProject = useCallback(
    (projectId: string, tab: ProjectTab = 'glpi') => {
      setRoute({
        name: 'project',
        projectId,
        tab
      });
    },
    []
  );

  const selectProjectTab = useCallback(
    (tab: ProjectTab) => {
      if (route.name === 'project') {
        setRoute({
          name: 'project',
          projectId: route.projectId,
          tab
        });
      }
    },
    [route]
  );

  // Project update handlers
  const handleUpdateProject = (updatedProject: SolutionProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleToggleActionStatus = (id: number, newStatus: ActionStatus) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updatedPlan = proj.actionPlan.map((act) => {
          if (act.id === id) {
            return {
              ...act,
              status: newStatus,
              completionDate:
                newStatus === 'Concluído'
                  ? act.completionDate || new Date().toLocaleDateString('pt-BR')
                  : undefined
            };
          }
          return act;
        });
        return { ...proj, actionPlan: updatedPlan };
      })
    );
  };

  const handleAddActionItem = (newItemData: Omit<ActionItem, 'id'>) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const nextId =
          proj.actionPlan.length > 0 ? Math.max(...proj.actionPlan.map((a) => a.id)) + 1 : 1;
        const newItem: ActionItem = {
          ...newItemData,
          id: nextId
        };
        return {
          ...proj,
          actionPlan: [...proj.actionPlan, newItem]
        };
      })
    );
  };

  const handleEditActionItem = (updatedItem: ActionItem) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updatedPlan = proj.actionPlan.map((a) => (a.id === updatedItem.id ? updatedItem : a));
        return {
          ...proj,
          actionPlan: updatedPlan
        };
      })
    );
  };

  const handleDeleteActionItem = (id: number) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        return {
          ...proj,
          actionPlan: proj.actionPlan.filter((a) => a.id !== id)
        };
      })
    );
  };

  const handleSaveGlpiAsset = (updatedFields: {
    name: string;
    status: any;
    technicalResponsible: string;
    groupEncargado: string;
    businessResponsible: string;
    objective: string;
    initialDoc: string;
  }) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        return {
          ...proj,
          ...updatedFields,
          lastUpdated:
            new Date().toLocaleDateString('pt-BR') +
            ' ' +
            new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
      })
    );
  };

  const handleAddNewProject = (newProj: SolutionProject) => {
    setProjects([newProj, ...projects]);
    navigateToProject(newProj.id, 'diagnostic');
  };

  const handleReloadAllState = () => {
    const reloaded = loadState();
    setProjects(reloaded.projects);
    setUserRole(reloaded.role || 'admin');
    setGovernanceConfig(reloaded.settings || getActiveConfig());
    if (reloaded.route) setRoute(reloaded.route);
  };

  const isInProject = route.name === 'project';

  return (
    <div className="min-h-screen bg-grey-100 text-grey-900 flex font-sans antialiased selection:bg-brand-light">
      {/* Permanent Unified Sidebar (Root portfolio/settings & Solution workspace) */}
      <Sidebar
        route={route}
        projects={projects}
        currentProject={isInProject ? currentProject : undefined}
        activeTab={isInProject ? route.tab : undefined}
        onSelectTab={selectProjectTab}
        onNavigateToPortfolio={navigateToPortfolio}
        onNavigateToSettings={navigateToSettings}
        onNavigateToProject={navigateToProject}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        residualScore={residualStats.currentResidualScore}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        userRole={userRole}
      />

      {/* Main Content Layout with Consistent Left Padding */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <Navbar
          route={route}
          currentProject={isInProject ? currentProject : undefined}
          totalProjects={projects.length}
          residualScore={residualStats.currentResidualScore}
          userRole={userRole}
          onSetUserRole={setUserRole}
          onNavigateToPortfolio={navigateToPortfolio}
          onNavigateToSettings={navigateToSettings}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Informative Sub-header Bar */}
        {route.name === 'portfolio' ? (
          <div className="bg-grey-900 text-white border-b border-grey-800 py-2 px-4 sm:px-8 text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-brand-main text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded shrink-0">
                  Visão Geral
                </span>
                <span className="text-grey-300 truncate">
                  Gestão Centralizada: <strong>Planilha de Demandas</strong> • <strong>Pauta de Gestão</strong> • <strong>Pipeline Kanban</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-grey-400">Total Soluções:</span>
                <span className="bg-grey-800 text-brand-light border border-grey-700 px-2 py-0.5 rounded font-mono font-bold">
                  {projects.length} ativas
                </span>
                <span className="text-warning-200 text-[11px] font-semibold bg-warning-600/60 px-2 py-0.5 rounded border border-warning-600/80 flex items-center gap-1">
                  ★ {projects.filter((p) => p.isPriorityForManagement).length} priorizadas da gestão
                </span>
              </div>
            </div>
          </div>
        ) : route.name === 'settings' ? (
          <div className="bg-grey-900 text-white border-b border-grey-800 py-2 px-4 sm:px-8 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-grey-300">
                Painel de Parametrização: Ajuste horas base, réguas de risco e critérios de saída sem alterar código.
              </span>
              <span className="text-brand-light font-mono text-[11px] font-bold">
                Perfil Atual: {userRole.toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-grey-900 text-white border-b border-grey-800 py-2 px-4 sm:px-8 text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-brand-main text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded shrink-0">
                  Padrão ATTO
                </span>
                <span className="text-grey-300 truncate">
                  Fluxo de Governança: <strong>Ficha do Ativo & Doc Viva</strong> → <strong>Diagnóstico de Risco</strong> →{' '}
                  <strong>Mitigações</strong> → <strong>Estimativa & Cronograma</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-grey-400">Score Residual:</span>
                <span className="bg-grey-800 text-brand-light border border-grey-700 px-2 py-0.5 rounded font-mono font-bold">
                  {residualStats.currentResidualScore} pts ({residualStats.currentRiskLevel})
                </span>
                <span className="text-grey-400 text-[11px] hidden sm:inline">
                  ({residualStats.completedCount}/{residualStats.totalCount} concluídas)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content View Switcher */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-full overflow-x-hidden">
          {route.name === 'portfolio' && (
            <ProjectPortfolioDashboard
              projects={projects}
              userRole={userRole}
              onUpdateProject={handleUpdateProject}
              onSelectProjectAndNavigate={(proj, tab) => navigateToProject(proj.id, tab)}
              onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            />
          )}

          {route.name === 'settings' && (
            <SettingsView
              userRole={userRole}
              config={governanceConfig}
              onUpdateConfig={setGovernanceConfig}
              onNavigateToPortfolio={navigateToPortfolio}
              onReloadAllState={handleReloadAllState}
            />
          )}

          {route.name === 'project' && route.tab === 'glpi' && (
            <GlpiAssetView
              project={currentProject}
              residualScore={residualStats.currentResidualScore}
              onNavigateTab={selectProjectTab}
              onSave={handleSaveGlpiAsset}
            />
          )}

          {route.name === 'project' && route.tab === 'diagnostic' && (
            <AiDiagnosticView
              project={currentProject}
              onNavigateHome={() => selectProjectTab('glpi')}
              onNavigateToActionPlan={() => selectProjectTab('action_plan')}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {route.name === 'project' && route.tab === 'action_plan' && (
            <ActionPlanView
              project={currentProject}
              actionList={currentProject.actionPlan}
              onNavigateHome={() => selectProjectTab('glpi')}
              onToggleActionStatus={handleToggleActionStatus}
              onAddActionItem={handleAddActionItem}
              onEditActionItem={handleEditActionItem}
              onDeleteActionItem={handleDeleteActionItem}
              onNavigateToEvolution={() => selectProjectTab('evolution')}
            />
          )}

          {route.name === 'project' && route.tab === 'evolution' && (
            <CriticalityEvolutionView
              project={currentProject}
              actionList={currentProject.actionPlan}
              residualScore={residualStats.currentResidualScore}
              onNavigateHome={() => selectProjectTab('glpi')}
              onToggleAction={handleToggleActionStatus}
              onNavigateToActionPlan={() => selectProjectTab('action_plan')}
            />
          )}

          {route.name === 'project' && route.tab === 'estimation' && (
            <EstimationScheduleView
              project={currentProject}
              onUpdateProject={handleUpdateProject}
              onNavigateToGlpi={() => selectProjectTab('glpi')}
            />
          )}
        </main>

        {/* Application Footer */}
        <footer className="bg-white border-t border-grey-200 py-4 px-6 text-center text-xs text-grey-500 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <strong>ATTO Sementes</strong> — Gestão de Ativos & Governança de Soluções de T.I (GLPI 10.x)
            </div>
            <div className="flex items-center gap-3">
              <span>Esteira Oficial: <code className="font-mono text-grey-700">grupoatto/governanca-solucoes</code></span>
              <span>•</span>
              <span>Versão da Metodologia: <strong>v2.1-governance</strong></span>
            </div>
          </div>
        </footer>
      </div>

      {/* New Project Intake Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onAddProject={handleAddNewProject}
      />
    </div>
  );
}
