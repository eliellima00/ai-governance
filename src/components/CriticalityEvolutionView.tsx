import React, { useState } from 'react';
import {
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  BarChart2,
  Zap
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
import { Card, Badge, StatTile, ChecklistItem, PageHeader } from './ui';

interface CriticalityEvolutionViewProps {
  project: SolutionProject;
  actionList: ActionItem[];
  residualScore: number;
  onNavigateHome?: () => void;
  onToggleAction: (id: number, status: any) => void;
  onNavigateToActionPlan: () => void;
}

export const CriticalityEvolutionView: React.FC<CriticalityEvolutionViewProps> = ({
  project,
  actionList,
  residualScore,
  onNavigateHome,
  onToggleAction,
  onNavigateToActionPlan
}) => {
  // What-if simulation overrides
  const [simulatedCompletedIds, setSimulatedCompletedIds] = useState<number[]>([]);

  const completedActions = actionList.filter((a) => a.status === 'Concluído');
  const pendingActions = actionList.filter((a) => a.status !== 'Concluído');

  // Calculate points with simulation
  const extraSimPoints = simulatedCompletedIds.reduce((sum, id) => {
    const act = actionList.find((a) => a.id === id);
    return sum + (act ? act.riskPointsImpact : 0);
  }, 0);

  const effectiveSimScore = Math.max(0, residualScore - extraSimPoints);
  const effectiveRiskLevel = calculateRiskLevel(effectiveSimScore);
  const riskColor = getRiskColorClass(effectiveRiskLevel);

  // Display-only helpers: initial score status is always presented as "Crítico".
  const initialRiskColor = getRiskColorClass('CRITICO');

  // Display-only helper mirroring the residual score status bands used below
  // (kept identical to the original inline conclusions, just split into a
  // plain label + a RiskLevel used purely for badge coloring).
  const residualLevel: RiskLevel = residualScore <= 12 ? 'MEDIO' : residualScore <= 20 ? 'ALTO' : 'CRITICO';
  const residualLabel = residualScore <= 12 ? 'Médio' : residualScore <= 20 ? 'Alto' : 'Crítico';
  const residualColor = getRiskColorClass(residualLevel);

  // Timeline data for the Burn-down chart
  // `level` is a display-only addition (not used in any calculation) so the
  // chart tooltip can render a proper Badge instead of baked-in emoji.
  const timelineData: {
    date: string;
    label: string;
    score: number;
    target: number;
    status: string;
    level: RiskLevel;
    color: string;
    event: string;
  }[] = [
    {
      date: '23/06/2026',
      label: 'Intake Inicial GLPI',
      score: 34,
      target: 4,
      status: 'Crítico',
      level: 'CRITICO',
      color: '#18181b',
      event: 'Triagem inicial com IA apontando criticidade 34'
    },
    {
      date: '10/07/2026',
      label: 'Reunião de Alinhamento TI',
      score: 28,
      target: 4,
      status: 'Crítico',
      level: 'CRITICO',
      color: '#18181b',
      event: 'Restore validado, RACI sustentação e fluxo homologação'
    },
    {
      date: '13/07/2026',
      label: 'Backup Automático',
      score: 26,
      target: 4,
      status: 'Crítico',
      level: 'CRITICO',
      color: '#18181b',
      event: 'Rotina de snapshots diários em Drive corporativo'
    },
    {
      date: '29/07/2026',
      label: 'Acesso ti.dev & Script',
      score: 24,
      target: 4,
      status: 'Crítico',
      level: 'CRITICO',
      color: '#18181b',
      event: 'Auditoria de código e migração para conta corporativa'
    },
    {
      date: 'Hoje (Atual)',
      label: 'Cenário Atual (Mitigado)',
      score: residualScore,
      target: 4,
      status: residualLabel,
      level: residualLevel,
      color: residualScore <= 12 ? '#f59e0b' : residualScore <= 20 ? '#f43f5e' : '#18181b',
      event: `${completedActions.length} ações concluídas com sucesso`
    },
    {
      date: 'Próxima Onda',
      label: 'Token ERP + Acessos + CI/CD',
      score: Math.min(residualScore, 11),
      target: 4,
      status: 'Médio',
      level: 'MEDIO',
      color: '#f59e0b',
      event: 'Remoção de token hardcoded + controle de login'
    },
    {
      date: 'Meta Final',
      label: 'Governança Plena',
      score: 3,
      target: 4,
      status: 'Baixo',
      level: 'BAIXO',
      color: '#10b981',
      event: 'Conformidade LGPD, descarte automático e domínio'
    }
  ];

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

  const toggleSimulated = (id: number) => {
    if (simulatedCompletedIds.includes(id)) {
      setSimulatedCompletedIds(simulatedCompletedIds.filter((i) => i !== id));
    } else {
      setSimulatedCompletedIds([...simulatedCompletedIds, id]);
    }
  };

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
                subtext={<Badge className={initialRiskColor.badge}>Crítico</Badge>}
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

      {/* Main Chart Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-grey-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-grey-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              <span>Gráfico de Desescalada de Criticidade (Burn-Down de Risco)</span>
            </h3>
            <p className="text-xs text-grey-500 mt-0.5">
              Acompanhamento cronológico da pontuação de risco conforme as 17 ações do plano são implantadas.
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

      {/* Two-Column: Dimensions Reduction & "What-If" Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dimensions Bar Chart Comparison */}
        <Card className="lg:col-span-6 space-y-3">
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

        {/* "What-If" Interactive Simulator for Coordinator */}
        <Card className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-grey-200 pb-2">
            <div>
              <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning-600" />
                <span>Simulador de Impacto para Apresentação ao Coordenador</span>
              </h3>
              <p className="text-xs text-grey-500">
                Selecione ações pendentes para ver a pontuação caindo ao vivo:
              </p>
            </div>
            {simulatedCompletedIds.length > 0 && (
              <button
                onClick={() => setSimulatedCompletedIds([])}
                className="text-[11px] text-grey-500 hover:text-grey-800 underline shrink-0"
              >
                Limpar Simulação
              </button>
            )}
          </div>

          {/* Simulation Gauge */}
          <div className="flex items-center gap-3">
            <StatTile
              label="Score Simulado"
              value={`${effectiveSimScore} pts`}
              subtext={
                extraSimPoints > 0
                  ? `-${extraSimPoints} pts extras simulados`
                  : 'Nenhuma ação extra simulada'
              }
              className="flex-1"
            />
            <Badge className={`${riskColor.badge} shrink-0`}>Classificação: {effectiveRiskLevel}</Badge>
          </div>

          {/* Pending Action Checkboxes */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {pendingActions.map((action) => {
              const isSimulated = simulatedCompletedIds.includes(action.id);
              return (
                <div
                  key={action.id}
                  onClick={() => toggleSimulated(action.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    isSimulated
                      ? 'bg-brand-lighter border-brand-light text-brand-dark font-medium'
                      : 'bg-grey-50 border-grey-200 text-grey-700 hover:bg-grey-100'
                  }`}
                >
                  <ChecklistItem
                    checked={isSimulated}
                    trailing={
                      <span className="font-bold text-indigo-700 text-xs shrink-0">
                        -{action.riskPointsImpact} pts
                      </span>
                    }
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-inherit">
                        #{action.id} {action.title}
                      </span>
                      <span className="text-[11px] text-grey-500">
                        Resp: {action.responsible} | Prioridade: {action.priority}
                      </span>
                    </div>
                  </ChecklistItem>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-grey-200">
            <span className="text-[11px] text-grey-500">
              * Marque as ações para testar cenários de homologação com a coordenação.
            </span>
            <button
              onClick={onNavigateToActionPlan}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
            >
              Ir para Plano Oficial →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
