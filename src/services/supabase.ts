import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SolutionProject, ProjectArtifact, MeetingDiaryEntry, ActionItem, RiskCriterion } from '../types';
import { GovernanceSettings } from '../config/governanceConfig';

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '') ||
  '';
const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '') ||
  '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Verifica de forma segura se as tabelas relacionais do Supabase já foram criadas
 */
export async function checkSupabaseTablesExist(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('projects').select('id').limit(1);
    if (error) {
      if (
        error.code === 'PGRST205' ||
        (error as any).code === '42P01' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('relation "projects" does not exist')
      ) {
        return false;
      }
    }
    return !error;
  } catch (_) {
    return false;
  }
}

/**
 * Testa a conexão com o Supabase e identifica causas comuns de erro (chave inválida vs tabelas não criadas)
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; details?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: 'URL ou chave anon não configuradas no ambiente.' };
  }
  try {
    const { data, error } = await client.from('projects').select('id').limit(1);
    if (error) {
      if (error.message?.includes('Invalid API key') || (error as any).code === 'PGRST301') {
        return {
          ok: false,
          message: 'Chave de API inválida (401)',
          details:
            'A chave configurada parece ser a senha do banco de dados (16 caracteres) em vez da chave da API REST. Copie a chave "anon" "public" (o token JWT longo que começa com "eyJ..." ou "sb_publishable_...") no painel do Supabase em Project Settings > API.'
        };
      }
      if (
        error.message?.includes('relation "projects" does not exist') ||
        error.message?.includes('schema cache') ||
        (error as any).code === '42P01' ||
        (error as any).code === 'PGRST205'
      ) {
        return {
          ok: true,
          message: 'Autenticado com sucesso no Supabase! (Tabelas pendentes de criação)',
          details:
            'A autenticação com a sua nova chave funcionou perfeitamente! As tabelas ainda não foram criadas no PostgreSQL do Supabase.'
        };
      }
      return {
        ok: false,
        message: `Resposta do Supabase: ${error.message}`,
        details: (error as any).details || (error as any).hint
      };
    }
    return {
      ok: true,
      message: 'Conexão ativa e tabelas prontas no Supabase (PostgreSQL)!'
    };
  } catch (err: any) {
    return {
      ok: false,
      message: 'Erro ao conectar ao Supabase',
      details: err?.message
    };
  }
}

/**
 * Carrega todos os projetos e suas relações filhas do Supabase.
 * Retorna null se as tabelas ainda não existirem ou se ocorrer falha na conexão.
 */
export async function fetchProjectsFromSupabase(): Promise<SolutionProject[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Busca projetos
    const { data: rawProjects, error: projError } = await client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projError || !rawProjects) {
      if (
        projError?.code === 'PGRST205' ||
        (projError as any)?.code === '42P01' ||
        projError?.message?.includes('schema cache') ||
        projError?.message?.includes('relation "projects" does not exist')
      ) {
        console.info(
          'ℹ️ [Supabase] Tabelas relacionais ainda não foram criadas no banco de dados. Operando com dados locais com segurança.'
        );
        return null;
      }
      console.warn('Aviso ao buscar projetos do Supabase:', projError?.message || projError);
      return null;
    }

    // Busca dados relacionais filhos
    const [criteriaRes, actionsRes, artifactsRes, meetingsRes] = await Promise.all([
      client.from('project_criteria').select('*'),
      client.from('project_actions').select('*'),
      client.from('project_artifacts').select('*'),
      client.from('project_meeting_logs').select('*')
    ]);

  const criteriaMap = new Map<string, RiskCriterion[]>();
  (criteriaRes.data || []).forEach((c: any) => {
    const list = criteriaMap.get(c.project_id) || [];
    list.push({
      id: c.id,
      criterion: c.criterion,
      evidence: c.evidence || '',
      points: Number(c.points) || 1,
      dimension: c.dimension,
      mitigatedByActionIds: c.mitigated_by_action_ids || []
    });
    criteriaMap.set(c.project_id, list);
  });

  const actionsMap = new Map<string, ActionItem[]>();
  (actionsRes.data || []).forEach((a: any) => {
    const list = actionsMap.get(a.project_id) || [];
    list.push({
      id: a.id,
      title: a.title,
      responsible: a.responsible,
      deadline: a.deadline,
      priority: a.priority,
      status: a.status,
      riskPointsImpact: Number(a.risk_points_impact) || 1,
      dimension: a.dimension,
      notes: a.notes || undefined,
      evidence: a.evidence || undefined,
      completionDate: a.completion_date || undefined
    });
    actionsMap.set(a.project_id, list);
  });

  const artifactsMap = new Map<string, ProjectArtifact[]>();
  (artifactsRes.data || []).forEach((art: any) => {
    const list = artifactsMap.get(art.project_id) || [];
    list.push({
      id: art.id,
      title: art.title,
      category: art.category,
      fileType: art.file_type,
      url: art.url || undefined,
      fileName: art.file_name || undefined,
      fileSize: art.file_size || undefined,
      fileData: art.file_data || undefined,
      version: art.version || undefined,
      author: art.author,
      createdAt: art.created_at,
      description: art.description || undefined
    });
    artifactsMap.set(art.project_id, list);
  });

  const meetingsMap = new Map<string, MeetingDiaryEntry[]>();
  (meetingsRes.data || []).forEach((m: any) => {
    const list = meetingsMap.get(m.project_id) || [];
    list.push({
      id: m.id,
      date: m.date,
      subject: m.subject,
      entryType: m.entry_type,
      participants: m.participants || '',
      summary: m.summary,
      nextSteps: m.next_steps || undefined,
      registeredBy: m.registered_by,
      hoursSpent: Number(m.hours_spent) || 1,
      linkedArtifactId: m.linked_artifact_id || undefined,
      linkedArtifactTitle: m.linked_artifact_title || undefined,
      createdAt: m.created_at
    });
    meetingsMap.set(m.project_id, list);
  });

  return rawProjects.map((p: any): SolutionProject => ({
    id: p.id,
    name: p.name,
    glpiTicketId: p.glpi_ticket_id || undefined,
    assetId: p.asset_id || undefined,
    department: p.department,
    businessResponsible: p.business_responsible || '',
    technicalResponsible: p.technical_responsible || '',
    status: p.status || 'Em Adequação',
    stage: p.stage || 'Levantamento & Ficha',
    projectType: p.project_type || 'A',
    govStage: p.gov_stage || 'E0',
    executivePriority: p.executive_priority || 'P2 - Média',
    isPriorityForManagement: !!p.is_priority_for_management,
    hasImpediment: p.has_impediment,
    scheduledDate: p.scheduled_date || undefined,
    scheduledSubject: p.scheduled_subject || undefined,
    registeredBy: p.registered_by || undefined,
    groupEncargado: p.group_encargado || undefined,
    userGroup: p.user_group || undefined,
    notes: p.notes || undefined,
    objective: p.objective || '',
    initialDoc: p.initial_doc || '',
    notificationStatus: p.notification_status || undefined,
    qrCodeUrl: p.qr_code_url || undefined,
    initialScore: Number(p.initial_score) || 0,
    initialRisk: p.initial_risk || 'BAIXO',
    dimensionsInitial: p.dimensions_initial || { seguranca: 0, lgpd: 0, operacional: 0 },
    links: p.links || { spreadsheet: '', script: '', internalPanel: '', externalPortal: '' },
    technicalDoc: p.technical_doc,
    estimation: p.estimation && Object.keys(p.estimation).length > 0 ? p.estimation : undefined,
    sheetsCatalog: p.sheets_catalog || [],
    createdAt: p.created_at,
    lastUpdated: p.last_updated || new Date().toLocaleDateString('pt-BR'),
    criteria: criteriaMap.get(p.id) || [],
    actionPlan: actionsMap.get(p.id) || [],
    artifacts: artifactsMap.get(p.id) || [],
    meetingLogs: meetingsMap.get(p.id) || []
  }));
  } catch (err: any) {
    console.warn('Aviso ao consultar Supabase:', err?.message || err);
    return null;
  }
}

/**
 * Salva um projeto e atualiza suas tabelas relacionais filhas no Supabase
 */
export async function saveProjectToSupabase(project: SolutionProject): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // 1. Upsert tabela principal
    const { error: projError } = await client.from('projects').upsert({
      id: project.id,
      name: project.name,
      glpi_ticket_id: project.glpiTicketId || null,
      asset_id: project.assetId || null,
      department: project.department,
      business_responsible: project.businessResponsible || null,
      technical_responsible: project.technicalResponsible || null,
      status: project.status,
      stage: project.stage,
      project_type: project.projectType || 'A',
      gov_stage: project.govStage || 'E0',
      executive_priority: project.executivePriority || 'P2 - Média Prioridade',
      is_priority_for_management: Boolean(project.isPriorityForManagement),
      has_impediment: Boolean(project.hasImpediment),
      scheduled_date: project.scheduledDate || null,
      scheduled_subject: project.scheduledSubject || null,
      registered_by: project.registeredBy || null,
      group_encargado: project.groupEncargado || null,
      user_group: project.userGroup || null,
      notes: project.notes || null,
      objective: project.objective || '',
      initial_doc: project.initialDoc || '',
      notification_status: project.notificationStatus || null,
      qr_code_url: project.qrCodeUrl || null,
      initial_score: project.initialScore || 0,
      initial_risk: project.initialRisk || 'BAIXO',
      dimensions_initial: project.dimensionsInitial || {},
      links: project.links || {},
      technical_doc: project.technicalDoc || {},
      estimation: project.estimation || {},
      sheets_catalog: project.sheetsCatalog || [],
      last_updated: project.lastUpdated || new Date().toLocaleDateString('pt-BR')
    });

    if (projError) {
      if (
        projError.code === 'PGRST205' ||
        (projError as any).code === '42P01' ||
        projError.message?.includes('schema cache') ||
        projError.message?.includes('relation "projects" does not exist')
      ) {
        console.info(
          `ℹ️ [Supabase] Tabela 'projects' ainda não criada. O projeto '${project.name}' foi salvo no cache local.`
        );
        return;
      }
      console.warn('Aviso ao salvar projeto no Supabase:', projError.message || projError);
      return;
    }

    // 2. Atualizar critérios
    await client.from('project_criteria').delete().eq('project_id', project.id);
    if (project.criteria && project.criteria.length > 0) {
      await client.from('project_criteria').insert(
        project.criteria.map((c) => ({
          id: c.id,
          project_id: project.id,
          criterion: c.criterion,
          evidence: c.evidence || null,
          points: c.points,
          dimension: c.dimension,
          mitigated_by_action_ids: c.mitigatedByActionIds || []
        }))
      );
    }

    // 3. Atualizar ações
    await client.from('project_actions').delete().eq('project_id', project.id);
    if (project.actionPlan && project.actionPlan.length > 0) {
      await client.from('project_actions').insert(
        project.actionPlan.map((a) => ({
          id: a.id,
          project_id: project.id,
          title: a.title,
          responsible: a.responsible,
          deadline: a.deadline,
          priority: a.priority,
          status: a.status,
          risk_points_impact: a.riskPointsImpact,
          dimension: a.dimension,
          notes: a.notes || null,
          evidence: a.evidence || null,
          completion_date: a.completionDate || null
        }))
      );
    }

    // 4. Atualizar artefatos
    await client.from('project_artifacts').delete().eq('project_id', project.id);
    if (project.artifacts && project.artifacts.length > 0) {
      await client.from('project_artifacts').insert(
        project.artifacts.map((art) => ({
          id: art.id,
          project_id: project.id,
          title: art.title,
          category: art.category,
          file_type: art.fileType,
          url: art.url || null,
          file_name: art.fileName || null,
          file_size: art.fileSize || null,
          file_data: art.fileData || null,
          version: art.version || 'v1.0',
          author: art.author,
          created_at: art.createdAt,
          description: art.description || null
        }))
      );
    }

    // 5. Atualizar acompanhamento / atas
    await client.from('project_meeting_logs').delete().eq('project_id', project.id);
    if (project.meetingLogs && project.meetingLogs.length > 0) {
      await client.from('project_meeting_logs').insert(
        project.meetingLogs.map((m) => ({
          id: m.id,
          project_id: project.id,
          date: m.date,
          subject: m.subject,
          entry_type: m.entryType,
          participants: m.participants || null,
          summary: m.summary,
          next_steps: m.nextSteps || null,
          registered_by: m.registeredBy,
          hours_spent: m.hoursSpent || 1,
          linked_artifact_id: m.linkedArtifactId || null,
          linked_artifact_title: m.linkedArtifactTitle || null
        }))
      );
    }
  } catch (err: any) {
    console.info(`ℹ️ [Supabase] Operação de rede em nuvem não concluída (${err?.message || err}). Dados salvos no cache local.`);
  }
}

/**
 * Salva configurações globais no Supabase com tolerância a falhas
 */
export async function saveSettingsToSupabase(settings: GovernanceSettings): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client.from('governance_settings').upsert({
      id: 'governance',
      data: settings,
      updated_at: new Date().toISOString()
    });

    if (error) {
      if (
        error.code === 'PGRST205' ||
        (error as any).code === '42P01' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('relation "governance_settings" does not exist')
      ) {
        return;
      }
      console.warn('Aviso ao salvar configurações no Supabase:', error.message || error);
    }
  } catch (_) {}
}

/**
 * Carrega configurações globais do Supabase com tolerância a falhas
 */
export async function fetchSettingsFromSupabase(): Promise<GovernanceSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('governance_settings')
      .select('data')
      .eq('id', 'governance')
      .single();

    if (error || !data) return null;
    return data.data as GovernanceSettings;
  } catch (_) {
    return null;
  }
}

/**
 * Remove um projeto do Supabase (as tabelas filhas são removidas via CASCADE)
 */
export async function deleteProjectFromSupabase(projectId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client.from('projects').delete().eq('id', projectId);
    if (error) {
      if (
        error.code === 'PGRST205' ||
        (error as any).code === '42P01' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('relation "projects" does not exist')
      ) {
        return;
      }
      console.warn('Aviso ao deletar projeto do Supabase:', error.message || error);
    }
  } catch (_) {}
}

/**
 * Escuta alterações em tempo real na tabela de projetos do Supabase com canal exclusivo
 */
export function subscribeToSupabaseProjects(
  onProjectsUpdate: (projects: SolutionProject[]) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  try {
    const channelName = `projects-realtime-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        async () => {
          try {
            const updatedProjects = await fetchProjectsFromSupabase();
            if (updatedProjects && updatedProjects.length > 0) {
              onProjectsUpdate(updatedProjects);
            }
          } catch (err: any) {
            console.warn('Aviso ao recarregar projetos em tempo real no Supabase:', err?.message || err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.info('ℹ️ [Supabase] Canal em tempo real aguardando inicialização das tabelas no banco de dados.');
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (_) {}
    };
  } catch (err: any) {
    console.warn('Não foi possível registrar o canal em tempo real do Supabase:', err?.message || err);
    return () => {};
  }
}

