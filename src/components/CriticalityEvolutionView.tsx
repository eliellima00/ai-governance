import React, { useMemo } from 'react';
import {
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  BarChart2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';
import { ActionItem, RiskLevel, SolutionProject } from '../types';
import { calculateRiskLevel, getRiskColorClass } from '../utils/riskCalculations';
import { getActiveConfig } from '../config/governanceConfig';
import { Card, Badge, StatTile, PageHeader } from './ui';

const RISK_LABELS: Record<RiskLevel, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  CRITICO: 'Crítico'
};

/**
 * Datas no app são texto livre em pt-BR (`toLocaleDateString('pt-BR')`, ex.: "16/09/2026"), com
 * alguns registros legados em ISO. Tenta as duas formas; retorna null se não for possível
 * interpretar, para que o burn-down ignore com segurança pontos sem data confiável.
 */
function parseAppDate(value?: string): Date | null {
  if (!value) return null;
  const brMatch = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(date.getTime()) ? null : date;
  }
  const iso = new Date(value);
  return isNaN(iso.getTime()) ? null : iso;
}

interface CriticalityEvolutionViewProps {
  project: SolutionProject;
  actionList: ActionItem[];
  residualScore: number;
}

export const CriticalityEvolutionView: React.FC<CriticalityEvolutionViewProps> = ({
  project,
  actionList,
  residualScore
}) => {
  const detailedEvolution = !!getActiveConfig().featureFlags?.detailedEvolution;

  const completedActions = actionList.filter((a) => a.status === 'Concluído');

  // Score/risco inicial real do projeto (não mais fixo em "Crítico").
  const initialRiskColor = getRiskColorClass(project.initialRisk);

  const residualLevel: RiskLevel = calculateRiskLevel(residualScore);
  const residualLabel = RISK_LABELS[residualLevel];
  const residualColor = getRiskColorClass(residualLevel);

  // Timeline do burn-down: calculada a partir do Plano de Ação real do projeto, não mais
  // fabricada com datas/eventos fixos do caso Portal Logística.
  const timelineData = useMemo(() => {
    type TimelinePoint = {
      date: string;
      label: string;
      score: number;
      status: string;
      level: RiskLevel;
      event: string;
    };

    const startDate =
      parseAppDate(project.createdAt) ||
      (project.meetingLogs || [])
        .map((m) => parseAppDate(m.date))
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime())[0] ||
      null;

    const startPoint: TimelinePoint = {
      date: startDate ? startDate.toLocaleDateString('pt-BR') : 'Início',
      label: 'Situação Inicial',
      score: project.initialScore,
      status: RISK_LABELS[project.initialRisk],
      level: project.initialRisk,
      event: 'Diagnóstico inicial de criticidade'
    };

    const datedCompleted = completedActions
      .map((a) => ({ action: a, date: parseAppDate(a.completionDate) }))
      .filter((a): a is { action: ActionItem; date: Date } => !!a.date)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const midPoints: TimelinePoint[] = [];
    let runningScore = project.initialScore;
    datedCompleted.forEach(({ action, date }) => {
      runningScore = Math.max(0, runningScore - action.riskPointsImpact);
      const level = calculateRiskLevel(runningScore);
      midPoints.push({
        date: date.toLocaleDateString('pt-BR'),
        label: action.title,
        score: runningScore,
        status: RISK_LABELS[level],
        level,
        event: `Ação concluída: ${action.title}`
      });
    });

    const currentPoint: TimelinePoint = {
      date: 'Atual',
      label: 'Cenário Atual',
      score: residualScore,
      status: residualLabel,
      level: residualLevel,
      event: `${completedActions.length} ${completedActions.length === 1 ? 'ação concluída' : 'ações concluídas'} até o momento`
    };

    return [startPoint, ...midPoints, currentPoint];
  }, [project, completedActions, residualScore, residualLevel, residualLabel]);

  // Dimensions comparison data
  const dimensionsComparison = [
    {
      name: 'Segurança da Informação',
      Inicial: project.dimensionsInitial.seguranca,
      Atual: Math.max(
        2,
        project.dimensionsInitial.seguranca -
          completedActions
            .filter((a) => a.dimension === 'Segurança' || a.dimension === 'Governança')
            .reduce((s, a) => s + a.riskPointsImpact, 0)
      ),
      Meta: 2
    },
    {
      name: 'Operacional & Continuidade',
      Inicial: project.dimensionsInitial.operacional,
      Atual: Math.max(
        1,
        project.dimensionsInitial.operacional -
          completedActions
            .filter((a) => a.dimension === 'Operacional')
            .reduce((s, a) => s + a.riskPointsImpact, 0)
      ),
      Meta: 1
    },
    {
      name: 'LGPD & Privacidade',
      Inicial: project.dimensionsInitial.lgpd,
      Atual: Math.max(
        1,
        project.dimensionsInitial.lgpd -
          completedActions
            .filter((a) => a.dimension === 'LGPD')
            .reduce((s, a) => s + a.riskPointsImpact, 0)
      ),
      Meta: 1
    }
  ];

  const percentReduction = Math.round(
    ((project.initialScore - residualScore) / project.initialScore) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
            Métricas de Desescalada de Criticidade
          </Badge>
          <span className="text-xs text-grey-500">Monitoramento Contínuo de Risco Residual</span>
        </div>

        <PageHeader
          title="Curva de Redução de Risco & Impacto das Tratativas"
          actions={
            <div className="flex items-center gap-3">
              <StatTile
                label="Score Inicial"
                value={`${project.initialScore} pts`}
                subtext={<Badge className={initialRiskColor.badge}>{RISK_LABELS[project.initialRisk]}</Badge>}
                icon={<AlertTriangle className="w-4 h-4" />}
                iconClassName="bg-grey-100 text-grey-600"
                className="w-36"
              />

              <ArrowRight className="text-grey-300 w-5 h-5 shrink-0 hidden sm:block" />

              <StatTile
                label="Score Residual Atual"
                value={`${residualScore} pts`}
                subtext={<Badge className={residualColor.badge}>{residualLabel}</Badge>}
                icon={<ShieldCheck className="w-4 h-4" />}
                iconClassName="bg-indigo-100 text-indigo-700"
                className="w-36"
              />

              <StatTile
                label="Queda de Risco"
                value={`-${percentReduction}%`}
                icon={<TrendingDown className="w-4 h-4" />}
                iconClassName="bg-brand-main/10 text-brand-dark"
                active
                className="w-36 bg-brand-lighter"
              />
            </div>
          }
        />
      </Card>

      {/* Main Chart Card — versão detalhada, atrás da feature flag (Configurações > Funcionalidades) */}
      {detailedEvolution && (
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-grey-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-grey-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              <span>Gráfico de Desescalada de Criticidade (Burn-Down de Risco)</span>
            </h3>
            <p className="text-xs text-grey-500 mt-0.5">
              Acompanhamento cronológico da pontuação de risco conforme as {actionList.length} ações do plano são implantadas.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              <span className="text-grey-700 font-medium">Pontuação de Risco</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-main inline-block"></span>
              <span className="text-grey-700 font-medium">Meta de Governança (≤ 5 pts)</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                domain={[0, 40]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                label={{ value: 'Pontos de Criticidade', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const dataColor = getRiskColorClass(data.level as RiskLevel);
                    return (
                      <div className="bg-grey-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1.5 border border-grey-800">
                        <div className="font-bold text-grey-200">{data.label} ({data.date})</div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-300 font-extrabold text-sm">Score: {data.score} pontos</span>
                          <Badge className={dataColor.badge}>{data.status}</Badge>
                        </div>
                        <div className="text-grey-400 text-[11px] max-w-xs">{data.event}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={20} label="Limite Crítico (>20)" stroke={getRiskColorClass('ALTO').barColor} strokeDasharray="3 3" />
              <ReferenceLine y={12} label="Limite Alto (13-20)" stroke={getRiskColorClass('MEDIO').barColor} strokeDasharray="3 3" />
              <ReferenceLine y={5} label="Zona Baixo Risco (≤5)" stroke={getRiskColorClass('BAIXO').barColor} strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreGradient)"
                dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      )}

      {/* Dimensões (sempre visível) */}
      <Card className="space-y-3">
        <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-grey-600" />
          <span>Evolução por Dimensão de Risco (Antes x Agora x Meta)</span>
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dimensionsComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Inicial" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Atual" fill="#5C8834" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Meta" fill="#15803D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
