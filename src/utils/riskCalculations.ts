import { ActionItem, RiskCriterion, RiskLevel, SolutionProject } from '../types';
import { getActiveConfig } from '../config/governanceConfig';

export function calculateRiskLevel(score: number): RiskLevel {
  const config = getActiveConfig();
  const { baixoMax, medioMax, altoMax } = config.riskThresholds;
  if (score <= baixoMax) return 'BAIXO';
  if (score <= medioMax) return 'MEDIO';
  if (score <= altoMax) return 'ALTO';
  return 'CRITICO';
}

/**
 * Deriva pontuação, risco e distribuição por dimensão a partir da lista de critérios —
 * garante que `initialScore`/`initialRisk`/`dimensionsInitial` nunca fiquem fora de sincronia
 * com a tabela de critérios depois de uma edição manual (adicionar/editar/excluir).
 */
export function recomputeInitialFromCriteria(criteria: RiskCriterion[]): {
  initialScore: number;
  initialRisk: RiskLevel;
  dimensionsInitial: { lgpd: number; seguranca: number; operacional: number };
} {
  const dimensionsInitial = { lgpd: 0, seguranca: 0, operacional: 0 };
  criteria.forEach((c) => {
    if (c.dimension === 'LGPD') dimensionsInitial.lgpd += c.points;
    else if (c.dimension === 'Segurança') dimensionsInitial.seguranca += c.points;
    else if (c.dimension === 'Operacional') dimensionsInitial.operacional += c.points;
  });
  const initialScore = dimensionsInitial.lgpd + dimensionsInitial.seguranca + dimensionsInitial.operacional;
  return {
    initialScore,
    initialRisk: calculateRiskLevel(initialScore),
    dimensionsInitial
  };
}

export function getRiskColorClass(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
  barColor: string;
} {
  switch (level) {
    case 'BAIXO':
      return {
        bg: 'bg-emerald-50 text-emerald-800',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        barColor: '#10b981'
      };
    case 'MEDIO':
      return {
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
        barColor: '#f59e0b'
      };
    case 'ALTO':
      return {
        bg: 'bg-rose-50 text-rose-800',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        dot: 'bg-rose-500',
        barColor: '#f43f5e'
      };
    case 'CRITICO':
    default:
      return {
        bg: 'bg-zinc-900 text-zinc-100',
        text: 'text-zinc-900',
        border: 'border-zinc-800',
        badge: 'bg-zinc-900 text-white border-zinc-700',
        dot: 'bg-zinc-950 ring-2 ring-red-500',
        barColor: '#18181b'
      };
  }
}

export function computeResidualScore(
  initialScore: number,
  actionPlan: ActionItem[],
  customCompletedIds?: number[]
): {
  initialScore: number;
  completedPoints: number;
  inProgressPoints: number;
  remainingPoints: number;
  currentResidualScore: number;
  projectedResidualScore: number;
  currentRiskLevel: RiskLevel;
  projectedRiskLevel: RiskLevel;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
} {
  let completedPoints = 0;
  let inProgressPoints = 0;
  let completedCount = 0;

  actionPlan.forEach((item) => {
    const isCompleted = customCompletedIds
      ? customCompletedIds.includes(item.id)
      : item.status === 'Concluído';

    const isInProgress = item.status === 'Em andamento';

    if (isCompleted) {
      completedPoints += item.riskPointsImpact;
      completedCount++;
    } else if (isInProgress) {
      inProgressPoints += item.riskPointsImpact;
    }
  });

  const currentResidualScore = Math.max(0, initialScore - completedPoints);
  const projectedResidualScore = Math.max(
    0,
    initialScore - completedPoints - inProgressPoints
  );

  return {
    initialScore,
    completedPoints,
    inProgressPoints,
    remainingPoints: currentResidualScore,
    currentResidualScore,
    projectedResidualScore,
    currentRiskLevel: calculateRiskLevel(currentResidualScore),
    projectedRiskLevel: calculateRiskLevel(projectedResidualScore),
    completedCount,
    totalCount: actionPlan.length,
    progressPercent: actionPlan.length
      ? Math.round((completedCount / actionPlan.length) * 100)
      : 0
  };
}

export function computeDimensionEvolution(project: SolutionProject, actions: ActionItem[]) {
  // Compute initial dimension scores
  const segurancaInit = project.dimensionsInitial.seguranca;
  const lgpdInit = project.dimensionsInitial.lgpd;
  const operacionalInit = project.dimensionsInitial.operacional;

  let segurancaMitigated = 0;
  let lgpdMitigated = 0;
  let operacionalMitigated = 0;

  actions.forEach((act) => {
    if (act.status === 'Concluído') {
      if (act.dimension === 'Segurança') segurancaMitigated += act.riskPointsImpact;
      else if (act.dimension === 'LGPD') lgpdMitigated += act.riskPointsImpact;
      else if (act.dimension === 'Operacional') operacionalMitigated += act.riskPointsImpact;
      else if (act.dimension === 'Governança') {
        // Distribute governance points across operational & security
        operacionalMitigated += act.riskPointsImpact * 0.5;
        segurancaMitigated += act.riskPointsImpact * 0.5;
      }
    }
  });

  return [
    {
      dimension: 'Segurança da Informação',
      initial: segurancaInit,
      current: Math.max(0, segurancaInit - segurancaMitigated),
      target: 2
    },
    {
      dimension: 'LGPD & Privacidade',
      initial: lgpdInit,
      current: Math.max(0, lgpdInit - lgpdMitigated),
      target: 1
    },
    {
      dimension: 'Operacional & Continuidade',
      initial: operacionalInit,
      current: Math.max(0, operacionalInit - operacionalMitigated),
      target: 1
    }
  ];
}
