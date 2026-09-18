import { SolutionProject } from '../types';
import { GovernanceSettings } from '../config/governanceConfig';
import { PORTAL_LOGISTICA_PROJECT, BOT_WHATSAPP_PROJECT } from '../data/portalLogisticaData';
import {
  isSupabaseConfigured,
  fetchProjectsFromSupabase,
  saveProjectToSupabase,
  deleteProjectFromSupabase,
  fetchSettingsFromSupabase,
  saveSettingsToSupabase,
  subscribeToSupabaseProjects,
  testSupabaseConnection
} from './supabase';

export const INITIAL_PROJECTS: SolutionProject[] = [
  PORTAL_LOGISTICA_PROJECT,
  BOT_WHATSAPP_PROJECT
];

export type DbProvider = 'supabase';

export function getActiveDbProvider(): DbProvider {
  return 'supabase';
}

const LOCAL_STORAGE_PROJECTS_KEY = 'atto_gov_projects_local';
const LOCAL_STORAGE_SETTINGS_KEY = 'atto_gov_settings_local';

/**
 * Salva ou atualiza um projeto no Supabase (com cache local de segurança)
 */
export async function persistProject(project: SolutionProject): Promise<void> {
  // Salva no cache local
  try {
    const cached = getLocalCachedProjects();
    const idx = cached.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      cached[idx] = project;
    } else {
      cached.push(project);
    }
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(cached));
  } catch (err) {
    console.warn('Erro ao salvar no cache local:', err);
  }

  // Persiste no Supabase PostgreSQL
  if (isSupabaseConfigured()) {
    try {
      await saveProjectToSupabase(project);
    } catch (err) {
      console.warn('Persistência em nuvem adiada. Dados preservados com segurança no cache local:', err);
    }
  }
}

/**
 * Deleta um projeto no Supabase
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const cached = getLocalCachedProjects().filter((p) => p.id !== projectId);
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(cached));
  } catch (err) {
    console.warn('Erro ao atualizar cache local:', err);
  }

  if (isSupabaseConfigured()) {
    try {
      await deleteProjectFromSupabase(projectId);
    } catch (err) {
      console.warn('Aviso ao deletar projeto no Supabase:', err);
    }
  }
}

/**
 * Salva as configurações de governança no Supabase
 */
export async function persistSettings(settings: GovernanceSettings): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Erro ao salvar configurações locais:', err);
  }

  if (isSupabaseConfigured()) {
    try {
      await saveSettingsToSupabase(settings);
    } catch (err) {
      console.warn('Aviso ao salvar configurações no Supabase:', err);
    }
  }
}

/**
 * Carrega a lista de projetos do Supabase. Se o banco estiver vazio, semeia os projetos padrão da ATTO.
 */
export async function loadInitialProjects(): Promise<SolutionProject[]> {
  if (isSupabaseConfigured()) {
    try {
      const supaProjects = await fetchProjectsFromSupabase();
      if (supaProjects !== null) {
        if (supaProjects.length > 0) {
          // Atualiza cache local
          try {
            localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(supaProjects));
          } catch (_) {}
          return supaProjects;
        }

        // Se o banco existe e está pronto, mas sem registros, semeia automaticamente
        console.log('Supabase configurado e conectado. Semeando projetos iniciais...');
        for (const p of INITIAL_PROJECTS) {
          await saveProjectToSupabase(p).catch((err) =>
            console.warn(`Não foi possível semear projeto ${p.id}:`, err)
          );
        }
        return INITIAL_PROJECTS;
      }
    } catch (err) {
      console.warn('Erro ao ler projetos do Supabase, operando localmente:', err);
    }
  }

  // Fallback: cache local ou projetos iniciais
  const localProjects = getLocalCachedProjects();
  if (localProjects.length > 0) {
    return localProjects;
  }
  return INITIAL_PROJECTS;
}

/**
 * Carrega as configurações de governança do Supabase
 */
export async function loadInitialSettings(): Promise<GovernanceSettings | null> {
  if (isSupabaseConfigured()) {
    try {
      const supaSettings = await fetchSettingsFromSupabase();
      if (supaSettings) {
        try {
          localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(supaSettings));
        } catch (_) {}
        return supaSettings;
      }
    } catch (err) {
      console.error('Erro ao ler configurações do Supabase:', err);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}

  return null;
}

/**
 * Inscreve-se nas alterações em tempo real do Supabase
 */
export function subscribeToProjects(
  onProjectsUpdate: (projects: SolutionProject[]) => void
): () => void {
  if (isSupabaseConfigured()) {
    return subscribeToSupabaseProjects(onProjectsUpdate);
  }
  return () => {};
}

/**
 * Semeia/migra os projetos fornecidos para o Supabase
 */
export async function seedProjectsToSupabase(
  projects: SolutionProject[]
): Promise<{ count: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      count: 0,
      error: 'Credenciais do Supabase não configuradas no ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).'
    };
  }

  try {
    let count = 0;
    for (const project of projects) {
      await saveProjectToSupabase(project);
      count++;
    }
    return { count };
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Erro desconhecido durante sincronização.' };
  }
}

// Alias de retrocompatibilidade
export const migrateProjectsToSupabase = seedProjectsToSupabase;

function getLocalCachedProjects(): SolutionProject[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return [];
}
