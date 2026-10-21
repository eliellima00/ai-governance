import React, { useState, useEffect, useCallback } from 'react';
import {
  ActionItem,
  ActionStatus,
  GovernanceConfig,
  PortfolioView,
  ProjectTab,
  RiskCriterion,
  Route,
  SettingsSection,
  SolutionProject,
  UserRole
} from './types';
import { computeResidualScore, recomputeInitialFromCriteria } from './utils/riskCalculations';
import { isStageTab } from './utils/projectStatus';
import { can } from './utils/permissions';
import { loadState, saveState, resetToDefaultState } from './utils/storage';
import { getActiveConfig } from './config/governanceConfig';
import {
  persistProject,
  persistSettings,
  loadInitialProjects,
  loadInitialSettings,
  subscribeToProjects,
  getActiveDbProvider
} from './services/dataService';
import { testSupabaseConnection } from './services/supabase';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ProjectWorkspaceHeader } from './components/ProjectWorkspaceHeader';
import { ProjectOverviewView } from './components/ProjectOverviewView';
import { ProjectFichaView } from './components/ProjectFichaView';
import { StageView } from './components/StageView';
import { ProjectPortfolioDashboard } from './components/ProjectPortfolioDashboard';
import { EstimationScheduleView } from './components/EstimationScheduleView';
import { SettingsView } from './components/SettingsView';
import { NewProjectPage } from './components/NewProjectPage';
import { MyWeekView } from './components/MyWeekView';
import { AppTour } from './components/tour/AppTour';

// Abas antigas (antes da navegação por etapas) continuam abrindo o lugar equivalente
const LEGACY_TAB_MAP: Record<string, ProjectTab> = {
  glpi: 'ficha',
  artifacts: 'ficha',
  diagnostic: 'E1',
  action_plan: 'overview',
  evolution: 'E6'
};

function normalizeProjectTab(raw?: string): ProjectTab {
  if (!raw) return 'overview';
  if (raw === 'overview' || raw === 'ficha' || raw === 'estimation' || isStageTab(raw)) return raw;
  return LEGACY_TAB_MAP[raw] || 'overview';
}

const PORTFOLIO_VIEWS: PortfolioView[] = ['spreadsheet', 'kanban', 'gantt'];
const SETTINGS_SECTIONS: SettingsSection[] = ['estimation', 'risk', 'checklists', 'lists', 'flags', 'database', 'backup'];

// Helper to parse URL hash into Route
function parseHashToRoute(): Route | null {
  const hash = window.location.hash.replace('#', '');
  if (!hash) {
    return { name: 'portfolio' };
  }
  const [base, sub] = hash.split('/');
  if (base === 'portfolio') {
    return PORTFOLIO_VIEWS.includes(sub as PortfolioView)
      ? { name: 'portfolio', view: sub as PortfolioView }
      : { name: 'portfolio' };
  }
  if (base === 'settings') {
    return SETTINGS_SECTIONS.includes(sub as SettingsSection)
      ? { name: 'settings', section: sub as SettingsSection }
      : { name: 'settings' };
  }
  if (hash === 'new-project') {
    return { name: 'new-project' };
  }
  if (hash === 'my-week') {
    return { name: 'my-week' };
  }
  const parts = hash.split('/');
  if (parts[0] === 'project' && parts[1]) {
    return {
      name: 'project',
      projectId: parts[1],
      tab: normalizeProjectTab(parts[2])
    };
  }
  return null;
}

// Helper to sync Route to URL hash
function syncRouteToHash(route: Route) {
  if (route.name === 'portfolio') {
    const targetHash = route.view ? `#portfolio/${route.view}` : '#portfolio';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  } else if (route.name === 'settings') {
    const targetHash = route.section ? `#settings/${route.section}` : '#settings';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  } else if (route.name === 'new-project') {
    if (window.location.hash !== '#new-project') {
      window.location.hash = '#new-project';
    }
  } else if (route.name === 'my-week') {
    if (window.location.hash !== '#my-week') {
      window.location.hash = '#my-week';
    }
  } else if (route.name === 'project') {
    const targetHash = `#project/${route.projectId}/${route.tab}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }
}

export default function App() {
  // Initialize state from localStorage (fast instant load)
  const [initialLoaded] = useState(() => loadState());

  const [projects, setProjects] = useState<SolutionProject[]>(initialLoaded.projects);
  const [userRole, setUserRole] = useState<UserRole>(initialLoaded.role || 'admin');
  const [governanceConfig, setGovernanceConfig] = useState<GovernanceConfig>(
    initialLoaded.settings || getActiveConfig()
  );
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('syncing');

  // Route state initialized from URL hash or storage
  const [route, setRoute] = useState<Route>(() => {
    const fromHash = parseHashToRoute();
    if (fromHash) return fromHash;
    if (initialLoaded.route) return initialLoaded.route;
    return { name: 'portfolio' };
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Initialize and synchronize with Supabase (PostgreSQL)
  useEffect(() => {
    let isMounted = true;
    let unsubscribeProjects: (() => void) | null = null;

    async function initDatabase() {
      try {
        setDbStatus('syncing');

        // Load initial projects from Supabase or local storage
        const initialList = await loadInitialProjects();
        if (isMounted && initialList && initialList.length > 0) {
          setProjects(initialList);
        }

        // Fetch settings from Supabase
        const remoteSettings = await loadInitialSettings();
        if (isMounted && remoteSettings) {
          setGovernanceConfig(remoteSettings);
        }

        // Set up real-time Supabase listener
        try {
          unsubscribeProjects = subscribeToProjects((liveProjects) => {
            if (isMounted && liveProjects.length > 0) {
              setProjects(liveProjects);
              setDbStatus('connected');
            }
          });
        } catch (_) {}

        if (isMounted) {
          setDbStatus('connected');
        }
      } catch (err) {
        console.info('ℹ️ Operando com dados locais com segurança:', err);
        if (isMounted) setDbStatus('connected');
      }
    }

    initDatabase();

    return () => {
      isMounted = false;
      if (unsubscribeProjects) {
        unsubscribeProjects();
      }
    };
  }, []);

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

  // Bloqueia acesso direto (via hash ou downgrade de perfil) a rotas restritas ao perfil padrão
  useEffect(() => {
    if (route.name === 'settings' && !can(userRole, 'edit_settings')) {
      setRoute({ name: 'portfolio' });
    }
    if (route.name === 'new-project' && !can(userRole, 'create_project')) {
      setRoute({ name: 'portfolio' });
    }
    if (route.name === 'my-week' && !governanceConfig.featureFlags?.myWeekEnabled) {
      setRoute({ name: 'portfolio' });
    }
  }, [route, userRole, governanceConfig]);

  // Determine current project when in 'project' route
  const currentProjectId = route.name === 'project' ? route.projectId : projects[0]?.id;
  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  // Calculate residual score for current project (0 when the portfolio is empty)
  const residualStats = currentProject
    ? computeResidualScore(currentProject.initialScore, currentProject.actionPlan)
    : computeResidualScore(0, []);

  // Navigation handlers
  const navigateToPortfolio = useCallback(() => {
    setRoute({ name: 'portfolio' });
  }, []);

  const navigateToSettings = useCallback(() => {
    setRoute({ name: 'settings' });
  }, []);

  const navigateToPortfolioView = useCallback((view: PortfolioView) => {
    setRoute({ name: 'portfolio', view });
  }, []);

  const navigateToSettingsSection = useCallback((section: SettingsSection) => {
    setRoute({ name: 'settings', section });
  }, []);

  const navigateToNewProject = useCallback(() => {
    setRoute({ name: 'new-project' });
  }, []);

  const navigateToMyWeek = useCallback(() => {
    setRoute({ name: 'my-week' });
  }, []);

  const navigateToProject = useCallback(
    (projectId: string, tab: ProjectTab = 'overview') => {
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

  // Project update handlers with Supabase / Firestore sync
  const handleUpdateProject = (updatedProject: SolutionProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    persistProject(updatedProject).catch((err) =>
      console.error('Erro ao sincronizar projeto:', err)
    );
  };

  const handleToggleActionStatus = (id: number, newStatus: ActionStatus) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updatedPlan = proj.actionPlan.map((act) => {
          if (act.id === id) {
            const updatedItem = {
              ...act,
              status: newStatus
            };
            if (newStatus === 'Concluído') {
              updatedItem.completionDate = act.completionDate || new Date().toLocaleDateString('pt-BR');
            } else {
              delete updatedItem.completionDate;
            }
            return updatedItem;
          }
          return act;
        });
        const updated = { ...proj, actionPlan: updatedPlan };
        persistProject(updated).catch(console.error);
        return updated;
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
        const updated = {
          ...proj,
          actionPlan: [...proj.actionPlan, newItem]
        };
        persistProject(updated).catch(console.error);
        return updated;
      })
    );
  };

  const handleEditActionItem = (updatedItem: ActionItem) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updatedPlan = proj.actionPlan.map((a) => (a.id === updatedItem.id ? updatedItem : a));
        const updated = {
          ...proj,
          actionPlan: updatedPlan
        };
        persistProject(updated).catch(console.error);
        return updated;
      })
    );
  };

  const handleDeleteActionItem = (id: number) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const updated = {
          ...proj,
          actionPlan: proj.actionPlan.filter((a) => a.id !== id)
        };
        persistProject(updated).catch(console.error);
        return updated;
      })
    );
  };

  // Critérios de risco: toda mutação recalcula initialScore/initialRisk/dimensionsInitial
  // a partir da soma dos critérios, pra nunca ficarem fora de sincronia com a tabela.
  const applyCriteriaChange = (newCriteria: RiskCriterion[]) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id !== currentProject.id) return proj;
        const recomputed = recomputeInitialFromCriteria(newCriteria);
        const updated: SolutionProject = {
          ...proj,
          criteria: newCriteria,
          ...recomputed
        };
        persistProject(updated).catch(console.error);
        return updated;
      })
    );
  };

  const handleAddCriterion = (newItemData: Omit<RiskCriterion, 'id'>) => {
    const newItem: RiskCriterion = {
      ...newItemData,
      id: `${currentProject.id}-c-${Date.now()}`
    };
    applyCriteriaChange([...currentProject.criteria, newItem]);
  };

  const handleEditCriterion = (updatedItem: RiskCriterion) => {
    applyCriteriaChange(
      currentProject.criteria.map((c) => (c.id === updatedItem.id ? updatedItem : c))
    );
  };

  const handleDeleteCriterion = (id: string) => {
    applyCriteriaChange(currentProject.criteria.filter((c) => c.id !== id));
  };

  const handleAddNewProject = (newProj: SolutionProject) => {
    setProjects([newProj, ...projects]);
    persistProject(newProj).catch(console.error);
    navigateToProject(newProj.id, 'E1');
  };

  const handleUpdateConfig = (newConfig: GovernanceConfig) => {
    setGovernanceConfig(newConfig);
    persistSettings(newConfig).catch(console.error);
  };

  const handleReloadAllState = () => {
    const reloaded = loadState();
    setProjects(reloaded.projects);
    setUserRole(reloaded.role || 'admin');
    setGovernanceConfig(reloaded.settings || getActiveConfig());
    if (reloaded.route) setRoute(reloaded.route);
  };

  return (
    <div className="min-h-screen bg-grey-100 text-grey-900 flex font-sans antialiased selection:bg-brand-light">
      {/* Permanent Unified Sidebar — pure top-level menu, no per-solution content */}
      <Sidebar
        route={route}
        onNavigateToPortfolio={navigateToPortfolio}
        onNavigateToSettings={navigateToSettings}
        onOpenNewProject={navigateToNewProject}
        onNavigateToMyWeek={navigateToMyWeek}
        onNavigateToPortfolioView={navigateToPortfolioView}
        onNavigateToSettingsSection={navigateToSettingsSection}
        onSelectProjectTab={selectProjectTab}
        currentProject={route.name === 'project' ? currentProject : undefined}
        config={governanceConfig}
        myWeekEnabled={!!governanceConfig.featureFlags?.myWeekEnabled}
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
          totalProjects={projects.length}
          userRole={userRole}
          dbStatus={dbStatus}
          dbProvider={getActiveDbProvider()}
          onSetUserRole={setUserRole}
          onNavigateToPortfolio={navigateToPortfolio}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onStartTour={() => setIsTourOpen(true)}
        />

        {route.name === 'project' && currentProject && (
          <ProjectWorkspaceHeader
            project={currentProject}
            activeTab={route.tab}
            config={governanceConfig}
          />
        )}

        {/* Main Content View Switcher */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-full overflow-x-hidden">
          {route.name === 'portfolio' && (
            <ProjectPortfolioDashboard
              viewMode={route.view || 'spreadsheet'}
              projects={projects}
              userRole={userRole}
              onUpdateProject={handleUpdateProject}
              onSelectProjectAndNavigate={(proj, tab) => navigateToProject(proj.id, tab)}
              onOpenNewProjectModal={navigateToNewProject}
            />
          )}

          {route.name === 'settings' && (
            <SettingsView
              section={route.section || 'estimation'}
              userRole={userRole}
              config={governanceConfig}
              projects={projects}
              onUpdateConfig={handleUpdateConfig}
              onNavigateToPortfolio={navigateToPortfolio}
              onReloadAllState={handleReloadAllState}
            />
          )}

          {route.name === 'new-project' && (
            <NewProjectPage
              userRole={userRole}
              onAddProject={handleAddNewProject}
              onNavigateToPortfolio={navigateToPortfolio}
            />
          )}

          {route.name === 'my-week' && (
            <MyWeekView
              projects={projects}
              onUpdateProject={handleUpdateProject}
              onNavigateToProject={navigateToProject}
            />
          )}

          {route.name === 'project' && route.tab === 'overview' && currentProject && (
            <ProjectOverviewView project={currentProject} onNavigateTab={selectProjectTab} />
          )}

          {route.name === 'project' && route.tab === 'ficha' && currentProject && (
            <ProjectFichaView
              key={currentProject.id}
              project={currentProject}
              userRole={userRole}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {route.name === 'project' && isStageTab(route.tab) && currentProject && (
            <StageView
              project={currentProject}
              stage={route.tab}
              userRole={userRole}
              residualScore={residualStats.currentResidualScore}
              onUpdateProject={handleUpdateProject}
              onToggleActionStatus={handleToggleActionStatus}
              onAddActionItem={handleAddActionItem}
              onEditActionItem={handleEditActionItem}
              onDeleteActionItem={handleDeleteActionItem}
              onAddCriterion={handleAddCriterion}
              onEditCriterion={handleEditCriterion}
              onDeleteCriterion={handleDeleteCriterion}
            />
          )}

          {route.name === 'project' && route.tab === 'estimation' && currentProject && (
            <EstimationScheduleView
              project={currentProject}
              userRole={userRole}
              onUpdateProject={handleUpdateProject}
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

      <AppTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateToPortfolio={navigateToPortfolio}
      />
    </div>
  );
}
