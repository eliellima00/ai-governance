import React, { useState } from 'react';
import {
  TrendingDown,
  ShieldCheck,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  BarChart2,
  Calendar,
  Zap,
  Lock,
  Users,
  Server,
  FileCheck,
  Home,
  ArrowLeft
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
import { ActionItem, SolutionProject } from '../types';
import { calculateRiskLevel, getRiskColorClass } from '../utils/riskCalculations';

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

  // Timeline data for the Burn-down chart
  const timelineData = [
    {
      date: '23/06/2026',
      label: 'Intake Inicial GLPI',
      score: 34,
      target: 4,
      status: 'Crítico ⚫',
      color: '#18181b',
      event: 'Triagem inicial com IA apontando criticidade 34'
    },
    {
      date: '10/07/2026',
      label: 'Reunião de Alinhamento TI',
      score: 28,
      target: 4,
      status: 'Crítico ⚫',
      color: '#18181b',
      event: 'Restore validado, RACI sustentação e fluxo homologação'
    },
    {
      date: '13/07/2026',
      label: 'Backup Automático',
      score: 26,
      target: 4,
      status: 'Crítico ⚫',
      color: '#18181b',
      event: 'Rotina de snapshots diários em Drive corporativo'
    },
    {
      date: '29/07/2026',
      label: 'Acesso ti.dev & Script',
      score: 24,
      target: 4,
      status: 'Crítico ⚫',
      color: '#18181b',
      event: 'Auditoria de código e migração para conta corporativa'
    },
    {
      date: 'Hoje (Atual)',
      label: 'Cenário Atual (Mitigado)',
      score: residualScore,
      target: 4,
      status: residualScore <= 12 ? 'Médio 🟡' : residualScore <= 20 ? 'Alto 🔴' : 'Crítico ⚫',
      color: residualScore <= 12 ? '#f59e0b' : residualScore <= 20 ? '#f43f5e' : '#18181b',
      event: `${completedActions.length} ações concluídas com sucesso`
    },
    {
      date: 'Próxima Onda',
      label: 'Token ERP + Acessos + CI/CD',
      score: Math.min(residualScore, 11),
      target: 4,
      status: 'Médio 🟡',
      color: '#f59e0b',
      event: 'Remoção de token hardcoded + controle de login'
    },
    {
      date: 'Meta Final',
      label: 'Governança Plena',
      score: 3,
      target: 4,
      status: 'Baixo 🟢',
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
      {/* Top Breadcrumb & Return to Home Bar */}
      {onNavigateHome && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-grey-200 px-4 py-2.5 rounded-lg shadow-2xs text-xs">
          <div className="flex items-center gap-2 text-grey-500 font-medium">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-brand-dark hover:text-brand-dark font-bold hover:underline"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Início (Dados do Ativo)</span>
            </button>
            <span>›</span>
            <span className="text-grey-800 font-semibold">Evolução da Criticidade</span>
          </div>

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1 bg-grey-100 hover:bg-grey-200 text-grey-700 font-semibold rounded-full border border-grey-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar p/ Ficha do Ativo</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-grey-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              Métricas de Desescalada de Criticidade
            </span>
            <span className="text-xs text-grey-500">Monitoramento Contínuo de Risco Residual</span>
          </div>
          <h2 className="text-xl font-bold text-grey-900 mt-1">
            Curva de Redução de Risco & Impacto das Tratativas
          </h2>
        </div>

        <div className="flex items-center gap-4 bg-grey-50 border border-grey-200 p-3 rounded-lg">
          <div className="text-center px-2">
            <span className="text-[10px] text-grey-500 font-semibold uppercase block">Score Inicial</span>
            <span className="text-xl font-extrabold text-grey-900">{project.initialScore} pts</span>
            <span className="text-[10px] text-red-600 font-bold block">Crítico ⚫</span>
          </div>

          <div className="text-grey-300 font-light text-2xl">→</div>

          <div className="text-center px-2">
            <span className="text-[10px] text-grey-500 font-semibold uppercase block">Score Residual Atual</span>
            <span className="text-xl font-extrabold text-indigo-700">{residualScore} pts</span>
            <span className="text-[10px] font-bold block text-grey-700">
              {residualScore <= 12 ? 'Médio 🟡' : residualScore <= 20 ? 'Alto 🔴' : 'Crítico ⚫'}
            </span>
          </div>

          <div className="text-center px-2 bg-brand-lighter rounded-lg py-1 border border-brand-light">
            <span className="text-[10px] text-brand-dark font-bold uppercase block">Queda de Risco</span>
            <span className="text-lg font-black text-brand-dark">-{percentReduction}%</span>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white border border-grey-200 rounded-lg p-6 shadow-xs space-y-4">
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
                    return (
                      <div className="bg-grey-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-grey-800">
                        <div className="font-bold text-grey-200">{data.label} ({data.date})</div>
                        <div className="text-indigo-300 font-extrabold text-sm">
                          Score: {data.score} pontos ({data.status})
                        </div>
                        <div className="text-grey-400 text-[11px] max-w-xs">{data.event}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={20} label="Limite Crítico (>20)" stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={12} label="Limite Alto (13-20)" stroke="#f59e0b" strokeDasharray="3 3" />
              <ReferenceLine y={5} label="Zona Baixo Risco (≤5)" stroke="#10b981" strokeDasharray="3 3" />
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

        {/* Milestone Cards underneath chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-grey-50 border border-grey-200 rounded-lg text-xs">
            <span className="text-[11px] font-bold text-grey-500 uppercase block">1. Fase de Contenção (Concluída)</span>
            <div className="font-bold text-grey-900 mt-0.5">Backup + Homologação + Sustentação</div>
            <p className="text-grey-600 mt-1 text-[11px]">
              Garantia de recuperação em desastres e eliminação de alterações direto em produção.
            </p>
          </div>

          <div className="p-3 bg-info-50 border border-info-200 rounded-lg text-xs">
            <span className="text-[11px] font-bold text-info-700 uppercase block">2. Fase Atual (Em Andamento)</span>
            <div className="font-bold text-info-700 mt-0.5">Segurança & Controle de Acessos</div>
            <p className="text-info-700 mt-1 text-[11px]">
              Migração do token ERP para Script Properties e bloqueio da planilha base aberta.
            </p>
          </div>

          <div className="p-3 bg-brand-lighter border border-brand-light rounded-lg text-xs">
            <span className="text-[11px] font-bold text-brand-dark uppercase block">3. Fase de Homologação Final</span>
            <div className="font-bold text-brand-dark mt-0.5">CI/CD GitHub & Conformidade LGPD</div>
            <p className="text-brand-dark mt-1 text-[11px]">
              Deploy automatizado, expurgo periódico de dados e redução para zona verde (&lt; 5 pts).
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column: Dimensions Reduction & "What-If" Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dimensions Bar Chart Comparison */}
        <div className="lg:col-span-6 bg-white border border-grey-200 rounded-lg p-5 shadow-xs space-y-3">
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
                <Bar dataKey="Inicial" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Atual" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Meta" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* "What-If" Interactive Simulator for Coordinator */}
        <div className="lg:col-span-6 bg-white border border-grey-200 rounded-lg p-5 shadow-xs space-y-4">
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
                className="text-[11px] text-grey-500 hover:text-grey-800 underline"
              >
                Limpar Simulação
              </button>
            )}
          </div>

          {/* Simulation Gauge */}
          <div className="p-3 bg-grey-50 rounded-lg border border-grey-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-grey-500 uppercase block">Score Simulado</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-grey-900">{effectiveSimScore} pts</span>
                {extraSimPoints > 0 && (
                  <span className="text-xs font-bold text-brand-dark bg-brand-lighter px-2 py-0.5 rounded">
                    -{extraSimPoints} pts extras
                  </span>
                )}
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${riskColor.badge}`}>
              Classificação: {effectiveRiskLevel}
            </div>
          </div>

          {/* Pending Action Checkboxes */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {pendingActions.map((action) => {
              const isSimulated = simulatedCompletedIds.includes(action.id);
              return (
                <label
                  key={action.id}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isSimulated
                      ? 'bg-brand-lighter border-brand-light text-brand-dark font-medium'
                      : 'bg-grey-50 border-grey-200 text-grey-700 hover:bg-grey-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSimulated}
                    onChange={() => toggleSimulated(action.id)}
                    className="mt-0.5 text-brand-main rounded focus:ring-brand-main"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        #{action.id} {action.title}
                      </span>
                      <span className="font-bold text-indigo-700 shrink-0 ml-2">
                        -{action.riskPointsImpact} pts
                      </span>
                    </div>
                    <span className="text-[11px] text-grey-500">
                      Resp: {action.responsible} | Prioridade: {action.priority}
                    </span>
                  </div>
                </label>
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
        </div>
      </div>
    </div>
  );
};
