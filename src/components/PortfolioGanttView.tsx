import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GovStage, SolutionProject } from '../types';
import {
  computeEstimation,
  diffDays,
  formatPtBrDate,
  getDefaultEstimationInputs,
  parseFlexibleDate
} from '../utils/estimation';
import { STAGE_NAMES } from '../data/estimationCatalog';
import { Card } from './ui/Card';

interface PortfolioGanttViewProps {
  projects: SolutionProject[];
  onSelectProjectAndNavigate: (
    project: SolutionProject,
    targetTab: 'glpi' | 'diagnostic' | 'action_plan' | 'evolution' | 'estimation'
  ) => void;
}

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
  onSelectProjectAndNavigate
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const rows = useMemo(
    () =>
      projects.map((project) => {
        const inputs = project.estimation || getDefaultEstimationInputs(project.projectType || 'A');
        return { project, est: computeEstimation(inputs) };
      }),
    [projects]
  );

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
      <div>
        <h3 className="text-sm font-bold text-grey-900">Planejamento visual</h3>
        <p className="text-[11px] text-grey-500">
          Período efetivo: {formatPtBrDate(rangeStart)} a {formatPtBrDate(rangeEnd)} · final automático: maior prazo
          visível + {END_PADDING_DAYS} dias.
        </p>
      </div>

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
        {rows.map(({ project, est }) => {
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

          const tooltip = `${project.name}\n${style.label}${
            project.hasImpediment ? ' (impedimento sinalizado)' : ''
          }\n${formatPtBrDate(barStart)} → ${formatPtBrDate(barEnd)}\n${progressPct}% concluído · ${doneActions}/${totalActions} ações do plano`;

          return (
            <div key={project.id} className="flex items-center gap-3 group pt-4 first:pt-0">
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
          );
        })}
      </div>
    </Card>
  );
};
