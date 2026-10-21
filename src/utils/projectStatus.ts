import {
  ActionItem,
  EstimationInputs,
  EstimationResult,
  GovStage,
  MeetingDiaryEntry,
  RiskLevel,
  SolutionProject,
  StageSchedule,
  StageTab
} from '../types';
import { getActiveConfig } from '../config/governanceConfig';
import { computeResidualScore } from './riskCalculations';
import { computeEstimation, diffDays, formatPtBrDate, getDefaultEstimationInputs } from './estimation';

export const STAGE_TABS: StageTab[] = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

export const RISK_LABELS: Record<RiskLevel, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  CRITICO: 'Crítico'
};

export function isStageTab(value: string): value is StageTab {
  return (STAGE_TABS as string[]).includes(value);
}

/** Nome da etapa sempre com o código e a descrição ("E2 - Documentação mínima e acessos"). */
export function stageLabel(stage: GovStage): string {
  const name = getActiveConfig().stageNames[stage] || stage;
  return stage === 'Concluído' ? name : `${stage} - ${name}`;
}

export function getCurrentStage(project: SolutionProject): GovStage {
  return project.govStage || 'E0';
}

/** Posição da etapa na esteira; "Concluído" fica depois da E6. */
export function stageIndex(stage: GovStage): number {
  return stage === 'Concluído' ? STAGE_TABS.length : STAGE_TABS.indexOf(stage);
}

export type StageState = 'done' | 'current' | 'future';

export function getStageState(project: SolutionProject, stage: StageTab): StageState {
  const current = stageIndex(getCurrentStage(project));
  const idx = stageIndex(stage);
  if (idx < current) return 'done';
  if (idx === current) return 'current';
  return 'future';
}

/**
 * Tarefas antigas não têm etapa gravada. Sugere uma pelo título, caindo na E3 (correção dos
 * itens críticos), onde está a maior parte das tratativas de um plano de ação. Fica visível
 * e editável em cada tarefa; ao salvar a tarefa a etapa passa a ser gravada.
 */
export function inferActionStage(action: Pick<ActionItem, 'title' | 'notes'>): StageTab {
  const text = `${action.title} ${action.notes || ''}`.toLowerCase();
  if (/backup|restore|restaura|recupera/.test(text)) return 'E4';
  if (/repasse|treinamento|treinar|secund[aá]rio|ponto focal|ti\.dev|handover/.test(text)) return 'E5';
  if (/documenta|ficha|invent[aá]rio|\bpop\b|manual|readme/.test(text)) return 'E2';
  if (/diagn[oó]stico|roteiro|entendimento|levantamento/.test(text)) return 'E1';
  if (/encerramento|homologa[cç][aã]o final/.test(text)) return 'E6';
  return 'E3';
}

export function getActionStage(action: ActionItem): StageTab {
  return action.stage || inferActionStage(action);
}

export function getStageActions(project: SolutionProject, stage: StageTab): ActionItem[] {
  return project.actionPlan.filter((a) => getActionStage(a) === stage);
}

/**
 * Reuniões antigas não têm etapa gravada: sugere a etapa cujo período planejado contém a data
 * da reunião (antes do cronograma → E1, depois → E6; data ilegível → E1).
 */
export function getMeetingStage(meeting: MeetingDiaryEntry, estimation: EstimationResult): StageTab {
  if (meeting.stage) return meeting.stage;
  const stages = estimation.stages.filter((s): s is StageSchedule & { stageId: StageTab } => isStageTab(s.stageId));
  const match = stages.find(
    (s) => diffDays(s.startDate, meeting.date) >= 0 && diffDays(meeting.date, s.endDate) >= 0
  );
  if (match) return match.stageId;
  const last = stages[stages.length - 1];
  return last && diffDays(last.endDate, meeting.date) > 0 ? 'E6' : 'E1';
}

export function getStageMeetings(project: SolutionProject, stage: StageTab): MeetingDiaryEntry[] {
  const meetings = project.meetingLogs || [];
  if (meetings.every((m) => m.stage)) return meetings.filter((m) => m.stage === stage);
  const estimation = getProjectEstimation(project);
  return meetings.filter((m) => getMeetingStage(m, estimation) === stage);
}

/** Tarefas que contam para o andamento (canceladas ficam de fora). */
export function countProgress(actions: ActionItem[]): { done: number; total: number } {
  const active = actions.filter((a) => a.status !== 'Cancelado');
  return { done: active.filter((a) => a.status === 'Concluído').length, total: active.length };
}

export function isUrl(value?: string): boolean {
  return !!value && /^https?:\/\//i.test(value.trim());
}

export function getEstimationInputs(project: SolutionProject): EstimationInputs {
  return (
    project.estimation ||
    getDefaultEstimationInputs(
      project.projectType || 'A',
      project.createdAt ? project.createdAt.split(/[ T]/)[0] : undefined
    )
  );
}

export function getProjectEstimation(project: SolutionProject): EstimationResult {
  return computeEstimation(getEstimationInputs(project));
}

export type ScheduleStatus = 'on_track' | 'late' | 'done';

export interface ProjectStatusSummary {
  stage: GovStage;
  stageLabel: string;
  stageNumber: number; // 1..7 (8 = concluída)
  totalStages: number;
  stageProgress: { done: number; total: number };
  overallProgress: { done: number; total: number };
  nextTask?: ActionItem;
  schedule: {
    status: ScheduleStatus;
    daysLate: number;
    stageEndDate?: string; // YYYY-MM-DD
    deliveryDate: string; // YYYY-MM-DD
    hasEstimation: boolean;
  };
  risk: {
    initialScore: number;
    initialLevel: RiskLevel;
    currentScore: number;
    currentLevel: RiskLevel;
  };
  blocked: boolean;
  blockReason?: string;
  sentence: string;
}

const PRIORITY_ORDER: Record<string, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };

function todayIso(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function getStageSchedule(estimation: EstimationResult, stage: GovStage): StageSchedule | undefined {
  return estimation.stages.find((s) => s.stageId === stage);
}

/** Resumo de "em que pé está" o projeto, usado no cabeçalho e na Visão Geral. */
export function getProjectStatusSummary(project: SolutionProject): ProjectStatusSummary {
  const stage = getCurrentStage(project);
  const estimation = getProjectEstimation(project);
  const residual = computeResidualScore(project.initialScore, project.actionPlan);
  const isDone = stage === 'Concluído';

  const stageActions = isDone ? [] : getStageActions(project, stage);
  const stageProgress = countProgress(stageActions);
  const overallProgress = countProgress(project.actionPlan);

  const pending = (isDone ? [] : stageActions)
    .filter((a) => a.status === 'Aguardando' || a.status === 'Em andamento')
    .sort((a, b) => {
      // Em andamento primeiro, depois por prioridade
      if (a.status !== b.status) return a.status === 'Em andamento' ? -1 : 1;
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    });

  const stageSchedule = isDone ? undefined : getStageSchedule(estimation, stage);
  const today = todayIso();
  const daysLate = stageSchedule ? Math.max(0, diffDays(stageSchedule.endDate, today)) : 0;
  const scheduleStatus: ScheduleStatus = isDone ? 'done' : daysLate > 0 ? 'late' : 'on_track';

  const blocked = !!project.hasImpediment;
  const label = stageLabel(stage);

  const parts: string[] = [];
  if (isDone) {
    parts.push('Esteira concluída');
  } else {
    parts.push(label);
    parts.push(
      stageProgress.total === 0
        ? 'nenhuma tarefa cadastrada nesta etapa'
        : `${stageProgress.done} de ${stageProgress.total} ${stageProgress.total === 1 ? 'tarefa concluída' : 'tarefas concluídas'}`
    );
    if (scheduleStatus === 'late') {
      parts.push(`${daysLate} ${daysLate === 1 ? 'dia' : 'dias'} de atraso`);
    } else if (stageSchedule) {
      parts.push(`no prazo (etapa até ${formatPtBrDate(stageSchedule.endDate)})`);
    }
  }
  const initialLevel = project.initialRisk;
  const currentLevel = residual.currentRiskLevel;
  parts.push(
    initialLevel === currentLevel
      ? `risco ${RISK_LABELS[currentLevel]}`
      : `risco ${RISK_LABELS[initialLevel]} → ${RISK_LABELS[currentLevel]}`
  );

  return {
    stage,
    stageLabel: label,
    stageNumber: stageIndex(stage) + 1,
    totalStages: STAGE_TABS.length,
    stageProgress,
    overallProgress,
    nextTask: pending[0],
    schedule: {
      status: scheduleStatus,
      daysLate,
      stageEndDate: stageSchedule?.endDate,
      deliveryDate: estimation.realistic.deliveryDate,
      hasEstimation: !!project.estimation
    },
    risk: {
      initialScore: project.initialScore,
      initialLevel,
      currentScore: residual.currentResidualScore,
      currentLevel
    },
    blocked,
    blockReason: blocked ? project.impedimentDetails || 'Impedimento registrado' : undefined,
    sentence: (blocked ? 'Bloqueado · ' : '') + parts.join(' · ')
  };
}

/** Texto do apontamento de andamento para colar no chamado GLPI (ou e-mail/Teams). */
export function buildGlpiStatusNote(project: SolutionProject): string {
  const config = getActiveConfig();
  const summary = getProjectStatusSummary(project);
  const inputs = getEstimationInputs(project);
  const estimation = computeEstimation(inputs);
  const exitChecked = project.exitCriteriaChecked || {};

  let text = `[ATTO T.I - GOVERNANÇA DE SOLUÇÕES]\n`;
  text += `Apontamento de andamento — ${project.name}\n`;
  text += `Ativo: ${project.assetId || '-'} · Chamado GLPI: ${project.glpiTicketId || '-'}\n`;
  text += `Responsável técnico: ${project.technicalResponsible || '-'} · Negócio: ${project.businessResponsible || '-'}\n\n`;

  text += `RESUMO: ${summary.sentence}\n\n`;

  text += `ANDAMENTO POR ETAPA:\n`;
  STAGE_TABS.forEach((stage) => {
    const { done, total } = countProgress(getStageActions(project, stage));
    const state = getStageState(project, stage);
    const mark = state === 'done' ? '[X]' : state === 'current' ? '[>]' : '[ ]';
    text += `${mark} ${stageLabel(stage)} — ${total === 0 ? 'sem tarefas' : `${done}/${total} tarefas`}\n`;
  });

  if (summary.nextTask) {
    text += `\nPRÓXIMA TAREFA: ${summary.nextTask.title} (${summary.nextTask.responsible}, prazo ${summary.nextTask.deadline})\n`;
  }

  text += `\nESTIMATIVA:\n`;
  text += `• Esforço total previsto da T.I: ${estimation.effortTotalHours.toFixed(1).replace('.', ',')} h\n`;
  text += `• Início: ${formatPtBrDate(inputs.startDate)} · Entrega prevista: ${formatPtBrDate(estimation.realistic.deliveryDate)}\n`;

  text += `\nCRITÉRIOS DE SAÍDA:\n`;
  config.exitCriteriaChecklist.forEach((c) => {
    text += `[${exitChecked[c.id] ? 'X' : ' '}] ${c.title}\n`;
  });

  if (project.hasImpediment) {
    text += `\nIMPEDIMENTO: ${project.impedimentDetails || 'Impedimento ativo'}\n`;
    if (project.actionRequiredFromManagement) {
      text += `Ação requerida da gestão: ${project.actionRequiredFromManagement}\n`;
    }
  }

  text += `\nGerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
  return text;
}
