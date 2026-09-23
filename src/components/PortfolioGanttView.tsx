import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, RotateCcw, Star } from 'lucide-react';
import { EstimationInputs, GovStage, SolutionProject, UserRole } from '../types';
import {
  computeEstimation,
  diffDays,
  formatPtBrDate,
  getDefaultEstimationInputs,
  parseFlexibleDate,
  replanFromStage,
  setStageDate
} from '../utils/estimation';
import { STAGE_NAMES } from '../data/estimationCatalog';
import { getActiveConfig } from '../config/governanceConfig';
import { can } from '../utils/permissions';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface PortfolioGanttViewProps {
  projects: SolutionProject[];
  userRole: UserRole;
  onUpdateProject: (updated: SolutionProject) => void;
  onSelectProjectAndNavigate: (
    project: SolutionProject,
    targetTab: 'glpi' | 'diagnostic' | 'action_plan' | 'evolution' | 'estimation'
  ) => void;
}

const DATE_INPUT_CLASS =
  'px-1.5 py-0.5 rounded border border-grey-200 bg-white text-[11px] font-mono text-grey-800 disabled:bg-grey-50';

const GOV_STAGE_ORDER: GovStage[] = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const END_PADDING_DAYS = 20;

type StatusKey = 'nao_iniciado' | 'em_desenvolvimento' | 'homologacao' | 'concluido' | 'atrasado';

const STATUS_STYLES: Record<StatusKey, { dot: string; bar: string; barTrack: string; label: string }> = {
  nao_iniciado: { dot: 'bg-grey-300', bar: 'bg-grey-400', barTrack: 'bg-grey-100', label: 'Não iniciado' },
  em_desenvolvimento: { dot: 'bg-info-500', bar: 'bg-info-500', barTrack: 'bg-info-50', label: 'Em desenvolvimento' },
  homologacao: { dot: 'bg-purple-500', bar: 'bg-purple-500', barTrack: 'bg-purple-50', label: 'Homologação' },
  concluido: { dot: 'bg-success-500', bar: 'bg-success-500', barTrack: 'bg-success-50', label: 'Concluído' },
  atrasado: { dot: 'bg-danger-500', bar: 'bg-danger-500', barTrack: 'bg-danger-50', label: 'Atrasado' }
};

function addCalendarDays(iso: string, days: number): string {
  const date = parseFlexibleDate(iso);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function shortDate(iso: string): string {
  return formatPtBrDate(iso).slice(0, 5);
}

export const PortfolioGanttView: React.FC<PortfolioGanttViewProps> = ({
  projects,
  userRole,
  onUpdateProject,
  onSelectProjectAndNavigate
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const { priorities: priorityOptions } = getActiveConfig().auxiliaryLists;
  const canEditDates = can(userRole, 'edit_estimation');
  const canTogglePriority = can(userRole, 'toggle_priority');
  const [planningMode, setPlanningMode] = useState(false);

  // Ordem de prioridade: pauta da gestão primeiro, depois a ordem da lista de prioridades
  // (Configurações), depois a entrega planejada mais próxima.
  const rows = useMemo(() => {
    const priorityRank = (p: SolutionProject) => {
      const idx = priorityOptions.indexOf(p.executivePriority || '');
      return idx < 0 ? priorityOptions.length : idx;
    };
    return projects
      .map((project) => {
        const inputs: EstimationInputs =
          project.estimation || getDefaultEstimationInputs(project.projectType || 'A');
        return { project, inputs, est: computeEstimation(inputs) };
      })
      .sort(
        (a, b) =>
          Number(!!b.project.isPriorityForManagement) - Number(!!a.project.isPriorityForManagement) ||
          priorityRank(a.project) - priorityRank(b.project) ||
          diffDays(b.est.realistic.deliveryDate, a.est.realistic.deliveryDate)
      );
  }, [projects, priorityOptions]);

  const updateInputs = (project: SolutionProject, inputs: EstimationInputs) => {
    if (!canEditDates) return;
    onUpdateProject({ ...project, estimation: inputs, lastUpdated: new Date().toLocaleDateString('pt-BR') });
  };

  const { rangeStart, rangeEnd, totalSpanDays } = useMemo(() => {
    let minDate = todayIso;
    let maxDate = todayIso;
    rows.forEach(({ est }) => {
      const firstStart = est.stages[0]?.startDate;
      const lastEnd = est.realistic.deliveryDate;
      if (firstStart && diffDays(minDate, firstStart) < 0) minDate = firstStart;
      if (lastEnd && diffDays(maxDate, lastEnd) > 0) maxDate = lastEnd;
    });
    const paddedEnd = addCalendarDays(maxDate, END_PADDING_DAYS);
    const span = Math.max(diffDays(minDate, paddedEnd), 1);
    return { rangeStart: minDate, rangeEnd: paddedEnd, totalSpanDays: span };
  }, [rows, todayIso]);

  const pct = (dateStr: string) => {
    const offset = diffDays(rangeStart, dateStr);
    return Math.min(100, Math.max(0, (offset / totalSpanDays) * 100));
  };

  const weekMarkers = useMemo(() => {
    const markers: { label: string; left: number }[] = [];
    let cursor = rangeStart;
    let guard = 0;
    while (diffDays(cursor, rangeEnd) >= 0 && guard < 60) {
      markers.push({ label: shortDate(cursor), left: pct(cursor) });
      cursor = addCalendarDays(cursor, 7);
      guard += 1;
    }
    return markers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, totalSpanDays]);

  const todayLeft = pct(todayIso);

  if (rows.length === 0) {
    return (
      <Card className="p-12 text-center text-xs text-grey-400 italic">
        Nenhuma solução para exibir no cronograma com os filtros atuais.
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-grey-900">Planejamento visual</h3>
          <p className="text-[11px] text-grey-500">
            Período efetivo: {formatPtBrDate(rangeStart)} a {formatPtBrDate(rangeEnd)} · final automático: maior prazo
            visível + {END_PADDING_DAYS} dias · ordenado por prioridade.
          </p>
        </div>
        {(canEditDates || canTogglePriority) && (
          <Button
            size="sm"
            color={planningMode ? 'primary' : 'secondary'}
            leftIcon={<CalendarClock className="w-3.5 h-3.5" />}
            onClick={() => setPlanningMode((v) => !v)}
          >
            {planningMode ? 'Concluir planejamento' : 'Modo planejamento'}
          </Button>
        )}
      </div>
      {planningMode && (
        <p className="text-[11px] text-info-700 bg-info-50 border border-info-200 rounded px-3 py-2">
          Altere a prioridade e as datas direto nas linhas. <strong>Retomar em</strong> replaneja a partir da etapa
          atual (as seguintes se reencadeiam pelas durações sugeridas); <strong>Entrega</strong> fixa o fim da última
          etapa. Para ajustar etapa por etapa, abra a aba Estimativa do projeto.
        </p>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-grey-600 pb-3 border-b border-grey-100">
        {(Object.keys(STATUS_STYLES) as StatusKey[]).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full shrink-0 ${STATUS_STYLES[key].dot}`} /> {STATUS_STYLES[key].label}
          </span>
        ))}
      </div>

      {/* Eixo de datas (semanal) */}
      <div className="flex text-xs">
        <div className="w-64 shrink-0" />
        <div className="relative flex-1 h-6 border-b border-grey-200">
          {weekMarkers.map((m) => (
            <span
              key={m.label + m.left}
              className="absolute text-[10px] text-grey-500 -translate-x-1/2"
              style={{ left: `${m.left}%` }}
            >
              {m.label}
            </span>
          ))}
          {todayLeft >= 0 && todayLeft <= 100 && (
            <span
              className="absolute -top-4 text-[10px] font-bold text-danger-700 bg-danger-50 border border-danger-300 rounded px-1 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${todayLeft}%` }}
            >
              Hoje {shortDate(todayIso)}
            </span>
          )}
        </div>
      </div>

      {/* Linhas por projeto */}
      <div className="space-y-2 max-h-150 overflow-y-auto pr-1">
        {rows.map(({ project, inputs, est }) => {
          const currentIndex =
            project.govStage === 'Concluído'
              ? GOV_STAGE_ORDER.length
              : Math.max(GOV_STAGE_ORDER.indexOf(project.govStage || 'E0'), 0);
          const totalStages = GOV_STAGE_ORDER.length;

          const barStart = est.stages[0]?.startDate || todayIso;
          const barEnd = est.realistic.deliveryDate || todayIso;

          let progressPct: number;
          if (project.govStage === 'Concluído') {
            progressPct = 100;
          } else {
            const currentStage = est.stages[currentIndex];
            let fraction = 0;
            if (currentStage) {
              const span = Math.max(diffDays(currentStage.startDate, currentStage.endDate), 1);
              const elapsed = diffDays(currentStage.startDate, todayIso);
              fraction = Math.min(1, Math.max(0, elapsed / span));
            }
            progressPct = Math.min(99, Math.round(((currentIndex + fraction) / totalStages) * 100));
          }

          const isOverdue = project.govStage !== 'Concluído' && diffDays(todayIso, barEnd) < 0;

          let statusKey: StatusKey;
          if (project.govStage === 'Concluído') {
            statusKey = 'concluido';
          } else if (isOverdue || project.hasImpediment) {
            statusKey = 'atrasado';
          } else if (project.stage === 'Homologação TI') {
            statusKey = 'homologacao';
          } else if (currentIndex <= 0) {
            statusKey = 'nao_iniciado';
          } else {
            statusKey = 'em_desenvolvimento';
          }
          const style = STATUS_STYLES[statusKey];

          const left = pct(barStart);
          const width = Math.max(pct(barEnd) - left, 1.5);

          const totalActions = project.actionPlan?.length || 0;
          const doneActions = project.actionPlan?.filter((a) => a.status === 'Concluído').length || 0;

          const barLabel = `${progressPct}% · prazo final ${formatPtBrDate(barEnd)}`;
          const showFullLabel = width >= 16;
          const showShortLabel = !showFullLabel && width >= 6;

          const suggestedEnd = est.suggestedDeliveryDate;
          const showSuggestedMarker = est.hasManualDates && suggestedEnd !== barEnd;

          const tooltip = `${project.name}\n${style.label}${
            project.hasImpediment ? ' (impedimento sinalizado)' : ''
          }\n${formatPtBrDate(barStart)} → ${formatPtBrDate(barEnd)}${
            showSuggestedMarker ? ` (sugerido pelo motor: ${formatPtBrDate(suggestedEnd)})` : ''
          }\n${progressPct}% concluído · ${doneActions}/${totalActions} ações do plano`;

          const isCompleted = project.govStage === 'Concluído';
          const currentGovStage: GovStage = isCompleted ? 'E6' : project.govStage || 'E0';
          const currentStagePlan = est.stages[currentIndex];
          const lastStage = est.stages[est.stages.length - 1];

          return (
            <div key={project.id} className="pt-4 first:pt-0">
            <div className="flex items-center gap-3 group">
              <button
                onClick={() => onSelectProjectAndNavigate(project, 'estimation')}
                className="w-64 shrink-0 text-left"
                title={`Abrir cronograma de ${project.name}`}
              >
                <div className="text-xs font-bold text-grey-900 truncate group-hover:text-brand-dark group-hover:underline">
                  {project.name}
                </div>
                <div className="text-[10px] text-grey-500 truncate flex items-center gap-1">
                  <span>{STAGE_NAMES[project.govStage || 'E0']}</span>
                  <span>·</span>
                  <span>
                    {doneActions}/{totalActions} ações do plano
                  </span>
                  {project.hasImpediment && (
                    <AlertTriangle className="w-3 h-3 text-danger-500 shrink-0" aria-label="Impedimento sinalizado" />
                  )}
                </div>
              </button>

              <div className="relative flex-1 h-7">
                {/* Grade semanal */}
                {weekMarkers.map((m) => (
                  <div
                    key={m.label + m.left}
                    className="absolute top-0 bottom-0 w-px bg-grey-100"
                    style={{ left: `${m.left}%` }}
                  />
                ))}

                {/* Marcador de hoje */}
                {todayLeft >= 0 && todayLeft <= 100 && (
                  <div
                    className="absolute -top-2 bottom-0 w-px bg-danger-400 z-10"
                    style={{ left: `${todayLeft}%` }}
                  />
                )}

                {/* Entrega que o motor sugeriria sem ajustes manuais */}
                {showSuggestedMarker && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-grey-400 z-10"
                    style={{ left: `${pct(suggestedEnd)}%` }}
                    title={`Entrega sugerida pelo motor: ${formatPtBrDate(suggestedEnd)}`}
                  />
                )}

                {/* Badge de previsão, acima do fim da barra */}
                <span
                  className="absolute -top-4 text-[9px] font-semibold text-grey-600 bg-white border border-grey-200 rounded px-1 -translate-x-1/2 whitespace-nowrap z-10"
                  style={{ left: `${left + width}%` }}
                >
                  Prev. {shortDate(barEnd)}
                </span>

                {/* Barra do projeto */}
                <div
                  className={`absolute top-1 bottom-1 rounded-full flex items-center px-2 overflow-hidden ${style.bar}`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundImage:
                      statusKey === 'atrasado' && !isOverdue
                        ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 4px, transparent 4px, transparent 8px)'
                        : undefined
                  }}
                  title={tooltip}
                >
                  {showFullLabel && (
                    <span className="text-[10px] font-semibold text-white truncate">{barLabel}</span>
                  )}
                  {showShortLabel && (
                    <span className="text-[10px] font-semibold text-white truncate">{progressPct}%</span>
                  )}
                </div>
              </div>
            </div>

            {planningMode && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 ml-1 pl-3 border-l-2 border-grey-200 text-[11px] text-grey-600">
                <label className="flex items-center gap-1.5">
                  <span>Prioridade</span>
                  <select
                    value={project.executivePriority || ''}
                    disabled={!canTogglePriority}
                    onChange={(e) => onUpdateProject({ ...project, executivePriority: e.target.value })}
                    className={DATE_INPUT_CLASS}
                  >
                    {!priorityOptions.includes(project.executivePriority || '') && (
                      <option value={project.executivePriority || ''}>{project.executivePriority || '—'}</option>
                    )}
                    {priorityOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={!canTogglePriority}
                  onClick={() =>
                    onUpdateProject({ ...project, isPriorityForManagement: !project.isPriorityForManagement })
                  }
                  className={`flex items-center gap-1 disabled:cursor-not-allowed ${
                    project.isPriorityForManagement ? 'text-warning-600 font-semibold' : 'text-grey-500'
                  }`}
                  title="Marcar/desmarcar como prioridade para a gestão"
                >
                  <Star className={`w-3.5 h-3.5 ${project.isPriorityForManagement ? 'fill-current' : ''}`} />
                  Pauta da gestão
                </button>

                {!isCompleted && currentStagePlan && (
                  <label className="flex items-center gap-1.5">
                    <span>
                      Retomar {currentGovStage} - {STAGE_NAMES[currentGovStage]} em
                    </span>
                    <input
                      type="date"
                      value={currentStagePlan.startDate}
                      disabled={!canEditDates}
                      onChange={(e) =>
                        e.target.value && updateInputs(project, replanFromStage(inputs, currentGovStage, e.target.value))
                      }
                      className={DATE_INPUT_CLASS}
                    />
                  </label>
                )}

                {!isCompleted && lastStage && (
                  <label className="flex items-center gap-1.5">
                    <span>Entrega</span>
                    <input
                      type="date"
                      value={lastStage.endDate}
                      min={lastStage.startDate}
                      disabled={!canEditDates}
                      onChange={(e) =>
                        e.target.value && updateInputs(project, setStageDate(inputs, 'E6', 'endDate', e.target.value))
                      }
                      className={`${DATE_INPUT_CLASS} ${lastStage.isEndManual ? 'border-warning-400! bg-warning-50!' : ''}`}
                      title={`Mínimo: início planejado da última etapa (${formatPtBrDate(
                        lastStage.startDate
                      )}). Para antecipar mais, ajuste as etapas na aba Estimativa.`}
                    />
                  </label>
                )}

                {est.hasManualDates && canEditDates && (
                  <button
                    type="button"
                    onClick={() => updateInputs(project, { ...inputs, stageDateOverrides: {} })}
                    className="flex items-center gap-1 text-grey-500 hover:text-brand-dark"
                    title={`Remove os ajustes manuais e volta à entrega sugerida (${formatPtBrDate(suggestedEnd)})`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar sugestão ({formatPtBrDate(suggestedEnd)})
                  </button>
                )}
              </div>
            )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
