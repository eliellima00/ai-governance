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
import {
  ensureAllowedProjectsInFirestore,
  subscribeToProjects,
  saveProjectToFirestore,
  saveSettingsToFirestore,
  fetchSettingsFromFirestore,
  testConnection
} from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ProjectWorkspaceHeader } from './components/ProjectWorkspaceHeader';
import { GlpiAssetView } from './components/GlpiAssetView';
import { AiDiagnosticView } from './components/AiDiagnosticView';
import { ActionPlanView } from './components/ActionPlanView';
import { CriticalityEvolutionView } from './components/CriticalityEvolutionView';
import { ProjectPortfolioDashboard } from './components/ProjectPortfolioDashboard';
import { EstimationScheduleView } from './components/EstimationScheduleView';
import { SettingsView } from './components/SettingsView';
import { NewProjectPage } from './components/NewProjectPage';
import { ArtifactsDiaryView } from './components/ArtifactsDiaryView';

// Helper to parse URL hash into Route
function parseHashToRoute(): Route | null {
  const hash = window.location.hash.replace('#', '');
  if (!hash || hash === 'portfolio') {
    return { name: 'portfolio' };
  }
  if (hash === 'settings') {
    return { name: 'settings' };
  }
  if (hash === 'new-project') {
    return { name: 'new-project' };
  }
  const parts = hash.split('/');
  if (parts[0] === 'project' && parts[1]) {
    const validTabs: ProjectTab[] = [
      'glpi',
      'artifacts',
      'diagnostic',
      'action_plan',
      'evolution',
      'estimation'
    ];
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
  } else if (route.name === 'new-project') {
    if (window.location.hash !== '#new-project') {
      window.location.hash = '#new-project';
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

  // Initialize and synchronize with Firebase Firestore
  useEffect(() => {
    let isMounted = true;
    let unsubscribeProjects: (() => void) | null = null;

    async function initFirebase() {
      try {
        setDbStatus('syncing');

        // Test connectivity
        await testConnection();

        // Ensure database contains only the requested projects
        const allowedProjects = await ensureAllowedProjectsInFirestore();
        if (isMounted && allowedProjects && allowedProjects.length > 0) {
          setProjects(allowedProjects);
        }

        // Fetch settings from Firestore
        const remoteSettings = await fetchSettingsFromFirestore();
        if (isMounted && remoteSettings) {
          setGovernanceConfig(remoteSettings);
        }

        // Set up real-time Firestore listener
        unsubscribeProjects = subscribeToProjects(
          (liveProjects) => {
            if (isMounted && liveProjects.length > 0) {
              setProjects(liveProjects);
              setDbStatus('connected');
            }
          },
          (err) => {
            console.error('Erro na escuta de projetos do Firestore:', err);
            if (isMounted) setDbStatus('error');
          }
        );

        if (isMounted) {
          setDbStatus('connected');
        }
      } catch (err) {
        console.error('Falha na inicialização do Firestore, mantendo operação local:', err);
        if (isMounted) setDbStatus('connected');
      }
    }

    initFirebase();

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

  const navigateToNewProject = useCallback(() => {
    setRoute({ name: 'new-project' });
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

  // Project update handlers with Firestore sync
  const handleUpdateProject = (updatedProject: SolutionProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    saveProjectToFirestore(updatedProject).catch((err) =>
      console.error('Erro ao sincronizar projeto no Firestore:', err)
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
        saveProjectToFirestore(updated).catch(console.error);
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
        saveProjectToFirestore(updated).catch(console.error);
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
        saveProjectToFirestore(updated).catch(console.error);
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
        saveProjectToFirestore(updated).catch(console.error);
        return updated;
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
        const updated = {
          ...proj,
          ...updatedFields,
          lastUpdated:
            new Date().toLocaleDateString('pt-BR') +
            ' ' +
            new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        saveProjectToFirestore(updated).catch(console.error);
        return updated;
      })
    );
  };

  const handleAddNewProject = (newProj: SolutionProject) => {
    setProjects([newProj, ...projects]);
    saveProjectToFirestore(newProj).catch(console.error);
    navigateToProject(newProj.id, 'diagnostic');
  };

  const handleUpdateConfig = (newConfig: GovernanceConfig) => {
    setGovernanceConfig(newConfig);
    saveSettingsToFirestore(newConfig).catch(console.error);
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
          onSetUserRole={setUserRole}
          onNavigateToPortfolio={navigateToPortfolio}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {route.name === 'project' && (
          <ProjectWorkspaceHeader
            project={currentProject}
            activeTab={route.tab}
            onSelectTab={selectProjectTab}
            onNavigateToPortfolio={navigateToPortfolio}
            residualScore={residualStats.currentResidualScore}
            completedActions={currentProject.actionPlan.filter((a) => a.status === 'Concluído').length}
            totalActions={currentProject.actionPlan.length}
            config={governanceConfig}
          />
        )}

        {/* Main Content View Switcher */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-full overflow-x-hidden">
          {route.name === 'portfolio' && (
            <ProjectPortfolioDashboard
              projects={projects}
              userRole={userRole}
              onUpdateProject={handleUpdateProject}
              onSelectProjectAndNavigate={(proj, tab) => navigateToProject(proj.id, tab)}
              onOpenNewProjectModal={navigateToNewProject}
            />
          )}

          {route.name === 'settings' && (
            <SettingsView
              userRole={userRole}
              config={governanceConfig}
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

          {route.name === 'project' && route.tab === 'glpi' && (
            <GlpiAssetView
              project={currentProject}
              residualScore={residualStats.currentResidualScore}
              onNavigateTab={selectProjectTab}
              onSave={handleSaveGlpiAsset}
            />
          )}

          {route.name === 'project' && route.tab === 'artifacts' && (
            <ArtifactsDiaryView
              project={currentProject}
              userRole={userRole}
              onUpdateProject={handleUpdateProject}
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
    </div>
  );
}
