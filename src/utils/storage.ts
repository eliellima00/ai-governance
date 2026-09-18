import { SolutionProject, Route, UserRole } from '../types';
import { GovernanceSettings, getDefaultGovernanceSettings, setGlobalActiveSettings } from '../config/governanceConfig';

export const STORAGE_KEY = 'atto_governanca_state_v1';

export interface StoredAppState {
  projects: SolutionProject[];
  settings: GovernanceSettings;
  route: Route;
  role: UserRole;
  savedAt: string;
}

export function getPtBrCurrentTimestamp(): string {
  const now = new Date();
  const date = now.toLocaleDateString('pt-BR');
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export function getDefaultSeedProjects(): SolutionProject[] {
  // Sem projetos de exemplo por padrão: o portfólio começa vazio para cadastro dos projetos reais.
  return [];
}

export function getDefaultAppState(): StoredAppState {
  const defaultSettings = getDefaultGovernanceSettings();
  setGlobalActiveSettings(defaultSettings);
  return {
    projects: getDefaultSeedProjects(),
    settings: defaultSettings,
    route: { name: 'portfolio' },
    role: 'admin',
    savedAt: getPtBrCurrentTimestamp()
  };
}

/**
 * Carrega o estado do localStorage com tratamento de exceções
 */
export function loadState(): StoredAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = getDefaultAppState();
      saveState(defaultState);
      return defaultState;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.projects) || parsed.projects.length === 0) {
      const defaultState = getDefaultAppState();
      saveState(defaultState);
      return defaultState;
    }

    // Normalizar settings
    const settings: GovernanceSettings = parsed.settings
      ? { ...getDefaultGovernanceSettings(), ...parsed.settings }
      : getDefaultGovernanceSettings();
    setGlobalActiveSettings(settings);

    // Normalizar rota e compatibilidade de projetos (e desduplicar por ID)
    const rawProjects: SolutionProject[] = parsed.projects.map((p: any) => ({
      ...p,
      isPriorityForManagement: p.isPriorityForManagement ?? p['isPrioritized' + 'ForBoss'] ?? false,
      actionRequiredFromManagement: p.actionRequiredFromManagement ?? p['actionRequired' + 'FromBoss'] ?? '',
      activityLogs: p.activityLogs || [],
      exitCriteriaChecked: p.exitCriteriaChecked || {}
    }));

    const DISCARDED_SAMPLE_IDS = new Set([
      'conciliacao-bancaria-controladoria',
      'calculadora-germina-lab',
      'automacao-cte-faturas-senior',
      'portal-produtor-cooperado',
      'portal-logistica-atto',
      'bot-whatsapp-logistica-notificacoes'
    ]);

    const seenProjectIds = new Set<string>();
    let projects: SolutionProject[] = rawProjects.filter((p) => {
      if (!p.id || seenProjectIds.has(p.id) || DISCARDED_SAMPLE_IDS.has(p.id)) return false;
      seenProjectIds.add(p.id);
      return true;
    });

    if (projects.length === 0) {
      projects = getDefaultSeedProjects();
    }

    let route: Route = { name: 'portfolio' };
    if (parsed.route?.name === 'settings') {
      route = { name: 'settings' };
    } else if (parsed.route?.name === 'project' && parsed.route.projectId) {
      if (projects.some((p) => p.id === parsed.route.projectId)) {
        route = {
          name: 'project',
          projectId: parsed.route.projectId,
          tab: parsed.route.tab || 'glpi'
        };
      }
    }

    const role: UserRole = parsed.role === 'padrao' ? 'padrao' : 'admin';

    return {
      projects,
      settings,
      route,
      role,
      savedAt: parsed.savedAt || getPtBrCurrentTimestamp()
    };
  } catch (error) {
    console.warn('Falha ao carregar estado do localStorage, utilizando seed padrão:', error);
    const fallback = getDefaultAppState();
    return fallback;
  }
}

/**
 * Salva o estado no localStorage de forma segura
 */
export function saveState(state: StoredAppState): boolean {
  try {
    const payload = {
      ...state,
      savedAt: getPtBrCurrentTimestamp()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setGlobalActiveSettings(state.settings);
    return true;
  } catch (error) {
    console.error('Falha ao persistir estado no localStorage:', error);
    return false;
  }
}

/**
 * Redefine o estado no localStorage para o estado padrão
 */
export function resetToDefaultState(): StoredAppState {
  const defaultState = getDefaultAppState();
  saveState(defaultState);
  return defaultState;
}

/**
 * Exporta o estado completo como arquivo JSON para download
 */
export function exportStateAsJson(state?: StoredAppState): void {
  try {
    const activeState = state || loadState();
    const payload = {
      app: 'Governança de Soluções & Ativos GLPI ATTO',
      version: '2.1.0',
      exportedAt: getPtBrCurrentTimestamp(),
      data: activeState
    };
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeDate = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `backup_governanca_atto_${safeDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao exportar backup JSON:', error);
  }
}

/**
 * Valida e converte um texto JSON importado no formato StoredAppState
 */
export function parseImportedJson(jsonString: string): StoredAppState {
  const parsed = JSON.parse(jsonString);
  const data = parsed.data || parsed;

  if (!data || !Array.isArray(data.projects)) {
    throw new Error('Formato de arquivo JSON inválido. A lista de projetos não foi encontrada.');
  }

  const defaultSettings = getDefaultGovernanceSettings();
  const settings: GovernanceSettings = data.settings
    ? { ...defaultSettings, ...data.settings }
    : defaultSettings;

  const projects: SolutionProject[] = data.projects.map((p: any) => ({
    ...p,
    isPriorityForManagement: p.isPriorityForManagement ?? p['isPrioritized' + 'ForBoss'] ?? false,
    actionRequiredFromManagement: p.actionRequiredFromManagement ?? p['actionRequired' + 'FromBoss'] ?? '',
    activityLogs: p.activityLogs || [],
    exitCriteriaChecked: p.exitCriteriaChecked || {}
  }));

  const role: UserRole = data.role === 'padrao' ? 'padrao' : 'admin';
  const route: Route = data.route && data.route.name ? data.route : { name: 'portfolio' };

  return {
    projects,
    settings,
    route,
    role,
    savedAt: getPtBrCurrentTimestamp()
  };
}

/**
 * Importa o estado a partir de uma string JSON e atualiza o localStorage
 */
export function importStateFromJson(jsonString: string): { success: true } | { success: false; error: string } {
  try {
    const newState = parseImportedJson(jsonString);
    saveState(newState);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro desconhecido ao processar arquivo JSON' };
  }
}
