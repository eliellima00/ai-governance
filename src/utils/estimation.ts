import {
  EstimationInputs,
  EstimationResult,
  GovStage,
  ProjectType,
  StageSchedule
} from '../types';
import { getActiveConfig } from '../config/governanceConfig';

/**
 * Faz o parse de uma data em YYYY-MM-DD ou DD/MM/YYYY (com ou sem horário anexado)
 * para um objeto Date local.
 */
export function parseFlexibleDate(dateStr: string): Date {
  const datePart = (dateStr || new Date().toISOString().split('T')[0]).split(' ')[0];
  if (datePart.includes('/')) {
    const [day, month, year] = datePart.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  const parts = datePart.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Diferença em dias corridos entre duas datas (YYYY-MM-DD ou DD/MM/YYYY).
 */
export function diffDays(fromDateStr: string, toDateStr: string): number {
  const from = parseFlexibleDate(fromDateStr);
  const to = parseFlexibleDate(toDateStr);
  return Math.round((to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0)) / 86400000);
}

/**
 * Quantidade de dias corridos entre uma data (YYYY-MM-DD ou DD/MM/YYYY) e hoje.
 */
export function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const todayIso = new Date().toISOString().split('T')[0];
  return Math.max(0, diffDays(dateStr, todayIso));
}

/**
 * Pula fins de semana (sábado e domingo).
 * Se o start cair em fim de semana, avança para a próxima segunda-feira.
 */
export function addWorkingDays(startDateStr: string, daysToAdd: number): string {
  const date = parseFlexibleDate(startDateStr);

  // If initial date falls on Saturday (6) or Sunday (0), move to Monday
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  let added = 0;
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formata data ISO (YYYY-MM-DD) para padrão brasileiro DD/MM/YYYY
 */
export function formatPtBrDate(isoOrFormattedDate: string): string {
  if (!isoOrFormattedDate) return '-';
  if (isoOrFormattedDate.includes('/')) return isoOrFormattedDate;
  const parts = isoOrFormattedDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoOrFormattedDate;
}

/**
 * Cria os valores padrão de EstimationInputs para um projeto
 */
export function getDefaultEstimationInputs(
  projectType: ProjectType = 'A',
  startDate?: string
): EstimationInputs {
  const config = getActiveConfig();
  const initialDate = startDate || new Date().toISOString().split('T')[0];

  return {
    projectType,
    generationTool: 'Claude Code',
    startDate: initialDate,
    modules: config.modulesCatalog.map((m) => ({
      id: m.id,
      label: m.label,
      applied: false
    })),
    discounts: config.discountsCatalog.map((d) => ({
      id: d.id,
      label: d.label,
      declared: false,
      confirmed: false
    }))
  };
}

/**
 * Motor de cálculo de estimativa de esforço, reuniões, dependências e cronograma
 */
export function computeEstimation(inputs: EstimationInputs): EstimationResult {
  const config = getActiveConfig();
  const { projectType = 'A', startDate, modules = [], discounts = [] } = inputs;

  const validStartDate = startDate || new Date().toISOString().split('T')[0];

  const capOtimista = config.estimationConfig.horasPorManha * config.estimationConfig.fatorOtimista; // 3.2 h/dia
  const capRealista = config.estimationConfig.horasPorManha * config.estimationConfig.fatorRealista; // 2.4 h/dia

  const stagesToCompute: GovStage[] = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

  let effortBaseHours = 0;
  let effortModulesHours = 0;
  let effortDiscountHours = 0;
  let totalDeclaredDiscountsHours = 0;

  // Mapa de módulos aplicados
  const appliedModulesMap = new Map<string, boolean>();
  modules.forEach((m) => {
    if (m.applied) appliedModulesMap.set(m.id, true);
  });

  // Mapa de descontos declarados e confirmados
  const confirmedDiscountsMap = new Map<string, boolean>();
  const declaredDiscountsMap = new Map<string, boolean>();
  discounts.forEach((d) => {
    if (d.confirmed) confirmedDiscountsMap.set(d.id, true);
    if (d.declared) declaredDiscountsMap.set(d.id, true);
  });

  // Calcular horas de descontos declarados (para o esforço potencial)
  config.discountsCatalog.forEach((d) => {
    if (declaredDiscountsMap.get(d.id)) {
      totalDeclaredDiscountsHours += d.hours;
    }
  });

  const stages: StageSchedule[] = [];
  let currentStageStartDate = addWorkingDays(validStartDate, 0);

  for (const stageId of stagesToCompute) {
    const baseConfig = config.stagesBaseConfig[projectType]?.[stageId] || {
      hours: 0,
      meetings: 0,
      externalDeps: 0
    };

    const baseHours = baseConfig.hours;
    effortBaseHours += baseHours;

    // Somar módulos que incidem nesta etapa
    const stageModules = config.modulesCatalog.filter(
      (m) => m.stageId === stageId && appliedModulesMap.get(m.id)
    );
    const stageModulesHours = stageModules.reduce((acc, m) => acc + m.hours, 0);
    const stageModulesMeetings = stageModules.reduce((acc, m) => acc + m.meetings, 0);
    const stageModulesDeps = stageModules.reduce((acc, m) => acc + m.externalDeps, 0);
    effortModulesHours += stageModulesHours;

    // Descontos confirmados que incidem nesta etapa
    const stageDiscounts = config.discountsCatalog.filter(
      (d) => d.stageId === stageId && confirmedDiscountsMap.get(d.id)
    );
    const stageDiscountHours = stageDiscounts.reduce((acc, d) => acc + d.hours, 0);
    effortDiscountHours += stageDiscountHours;

    // Horas totais da etapa (nunca negativas)
    const totalHours = Math.max(0, baseHours + stageModulesHours - stageDiscountHours);

    const meetingsCount = baseConfig.meetings + stageModulesMeetings;
    const externalDepsCount = baseConfig.externalDeps + stageModulesDeps;

    // Dias de trabalho ativo (realista)
    const workDays = Math.ceil(totalHours / capRealista);

    // Dias de overhead de agenda/espera (realista)
    const waitDays =
      meetingsCount * config.estimationConfig.leadReuniaoRealista +
      externalDepsCount * config.estimationConfig.bufferDepRealista;

    const totalDaysSpan = workDays + waitDays;
    const stageEndDate = addWorkingDays(
      currentStageStartDate,
      Math.max(totalDaysSpan - 1, 0)
    );

    stages.push({
      stageId,
      stageName: config.stageNames[stageId] || stageId,
      baseHours,
      modulesHours: stageModulesHours,
      discountHours: stageDiscountHours,
      totalHours,
      meetingsCount,
      externalDepsCount,
      workDays,
      waitDays,
      startDate: currentStageStartDate,
      endDate: stageEndDate
    });

    // Próxima etapa inicia no próximo dia útil
    currentStageStartDate = addWorkingDays(stageEndDate, 1);
  }

  // Esforço total confirmado
  const effortTotalHours = Math.max(
    0,
    effortBaseHours + effortModulesHours - effortDiscountHours
  );

  // Esforço potencial (se todos os itens declarados forem confirmados na E1)
  const effortPotentialHours = Math.max(
    0,
    effortBaseHours + effortModulesHours - totalDeclaredDiscountsHours
  );

  const totalMeetingsCount = stages.reduce((acc, s) => acc + s.meetingsCount, 0);
  const totalExternalDepsCount = stages.reduce((acc, s) => acc + s.externalDepsCount, 0);

  // Realistic schedule aggregates
  const realisticActiveDays = stages.reduce((acc, s) => acc + s.workDays, 0);
  const realisticAgendaDays = stages.reduce((acc, s) => acc + s.waitDays, 0);
  const realisticTotalDays = realisticActiveDays + realisticAgendaDays;
  const realisticDeliveryDate = stages[stages.length - 1]?.endDate || validStartDate;

  // Optimistic schedule aggregates (conforme especificação da fórmula)
  const optimisticActiveDays = Math.ceil(effortTotalHours / capOtimista);
  const optimisticAgendaDays =
    totalMeetingsCount * config.estimationConfig.leadReuniaoOtimista +
    totalExternalDepsCount * config.estimationConfig.bufferDepOtimista;
  const optimisticTotalDays = optimisticActiveDays + optimisticAgendaDays;
  const optimisticDeliveryDate = addWorkingDays(validStartDate, optimisticTotalDays);

  return {
    effortBaseHours,
    effortModulesHours,
    effortDiscountHours,
    effortTotalHours,
    effortPotentialHours,
    meetingsCount: totalMeetingsCount,
    externalDepsCount: totalExternalDepsCount,
    optimistic: {
      activeDays: optimisticActiveDays,
      agendaDays: optimisticAgendaDays,
      totalDays: optimisticTotalDays,
      deliveryDate: optimisticDeliveryDate
    },
    realistic: {
      activeDays: realisticActiveDays,
      agendaDays: realisticAgendaDays,
      totalDays: realisticTotalDays,
      deliveryDate: realisticDeliveryDate
    },
    stages
  };
}
