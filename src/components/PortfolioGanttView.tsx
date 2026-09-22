import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GovStage, SolutionProject } from '../types';
import {
  computeEstimation,
  diffDays,
  formatPtBrDate,
  getDefaultEstimationInputs
} from '../utils/estimation';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface PortfolioGanttViewProps {
  projects: SolutionProject[];
  onSelectProjectAndNavigate: (
    project: SolutionProject,
    targetTab: 'glpi' | 'diagnostic' | 'action_plan' | 'evolution' | 'estimation'
  ) => void;
}

const GOV_STAGE_ORDER: GovStage[] = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const PortfolioGanttView: React.FC<PortfolioGanttViewProps> = ({
  projects,
  onSelectProjectAndNavigate
}) => {
  const rows = useMemo(
    () =>
      projects.map((project) => {
        const inputs = project.estimation || getDefaultEstimationInputs(project.projectType || 'A');
        return { project, est: computeEstimation(inputs) };
      }),
    [projects]
  );

  const todayIso = new Date().toISOString().split('T')[0];

  const { rangeStart, rangeEnd, totalSpanDays } = useMemo(() => {
    let minDate = todayIso;
    let maxDate = todayIso;
    rows.forEach(({ est }) => {
      const firstStart = est.stages[0]?.startDate;
      const lastEnd = est.realistic.deliveryDate;
      if (firstStart && diffDays(minDate, firstStart) < 0) minDate = firstStart;
      if (lastEnd && diffDays(maxDate, lastEnd) > 0) maxDate = lastEnd;
    });
    const span = Math.max(diffDays(minDate, maxDate), 1);
    return { rangeStart: minDate, rangeEnd: maxDate, totalSpanDays: span };
  }, [rows, todayIso]);

  const pct = (dateStr: string) => {
    const offset = diffDays(rangeStart, dateStr);
    return Math.min(100, Math.max(0, (offset / totalSpanDays) * 100));
  };

  const monthMarkers = useMemo(() => {
    const markers: { label: string; left: number }[] = [];
    const start = new Date(rangeStart);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endBoundary = new Date(rangeEnd);
    while (cursor <= endBoundary) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      markers.push({
        label: `${MONTH_LABELS[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(2)}`,
        left: pct(iso)
      });
      cursor.setMonth(cursor.getMonth() + 1);
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
      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-grey-600 pb-3 border-b border-grey-100">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-success-500 shrink-0" /> Etapa concluída
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-brand-main shrink-0" /> Etapa em andamento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-grey-200 shrink-0" /> Etapa planejada
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-danger-800">
          <AlertTriangle className="w-3.5 h-3.5 text-danger-500" /> Bloqueada / aguardando terceiros
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-grey-400">
          <span className="w-px h-3 bg-brand-dark" /> Hoje ({formatPtBrDate(todayIso)})
        </span>
      </div>

      {/* Eixo de meses */}
      <div className="flex text-xs">
        <div className="w-56 shrink-0" />
        <div className="relative flex-1 h-5 border-b border-grey-200">
          {monthMarkers.map((m) => (
            <span
              key={m.label + m.left}
              className="absolute text-[10px] font-semibold text-grey-500 -translate-x-1/2"
              style={{ left: `${m.left}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Linhas por projeto */}
      <div className="space-y-2 max-h-150 overflow-y-auto pr-1">
        {rows.map(({ project, est }) => {
          const currentIndex =
            project.govStage === 'Concluído'
              ? GOV_STAGE_ORDER.length
              : GOV_STAGE_ORDER.indexOf(project.govStage || 'E0');

          return (
            <div key={project.id} className="flex items-center gap-3 group">
              <button
                onClick={() => onSelectProjectAndNavigate(project, 'estimation')}
                className="w-56 shrink-0 text-left"
                title={`Abrir cronograma de ${project.name}`}
              >
                <div className="text-xs font-bold text-grey-900 truncate group-hover:text-brand-dark group-hover:underline">
                  {project.name}
                </div>
                <div className="text-[10px] text-grey-500 font-mono truncate">{project.assetId}</div>
              </button>

              <div className="relative flex-1 h-7 bg-grey-50 rounded">
                {/* Marcador de hoje */}
                {todayLeft >= 0 && todayLeft <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-brand-dark/50 z-10"
                    style={{ left: `${todayLeft}%` }}
                  />
                )}

                {est.stages.map((stage, idx) => {
                  const left = pct(stage.startDate);
                  const width = Math.max(pct(stage.endDate) - left, 1.2);
                  const isDone = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  const isBlocked = isCurrent && project.hasImpediment;

                  const colorClass = isBlocked
                    ? 'bg-danger-500'
                    : isCurrent
                    ? 'bg-brand-main'
                    : isDone
                    ? 'bg-success-500'
                    : 'bg-grey-200';

                  return (
                    <div
                      key={stage.stageId}
                      className={`absolute top-0.5 bottom-0.5 rounded-sm ${colorClass}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundImage: isBlocked
                          ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 4px, transparent 4px, transparent 8px)'
                          : undefined
                      }}
                      title={`${stage.stageId} - ${stage.stageName}\n${formatPtBrDate(stage.startDate)} → ${formatPtBrDate(stage.endDate)} (${stage.totalHours.toFixed(1)}h)${isBlocked ? '\n⚠ Aguardando terceiros: ' + (project.impedimentDetails || 'impedimento sinalizado') : ''}`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-4 left-0 text-[9px] font-bold text-grey-600 whitespace-nowrap flex items-center gap-0.5">
                          {isBlocked && <AlertTriangle className="w-2.5 h-2.5 text-danger-500" />}
                          {stage.stageId}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <Badge className="w-24 shrink-0 justify-center text-[10px] px-1.5 py-0.5 bg-grey-100 text-grey-700 border-grey-200">
                {formatPtBrDate(est.realistic.deliveryDate)}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
