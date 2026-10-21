import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Calendar, Check, CheckCircle2, Circle, Copy, ListChecks, ShieldCheck } from 'lucide-react';
import { ProjectTab, SolutionProject } from '../types';
import { formatPtBrDate } from '../utils/estimation';
import { getRiskColorClass } from '../utils/riskCalculations';
import {
  buildGlpiStatusNote,
  countProgress,
  getProjectEstimation,
  getProjectStatusSummary,
  getStageActions,
  getStageSchedule,
  getStageState,
  RISK_LABELS,
  stageLabel,
  STAGE_TABS
} from '../utils/projectStatus';
import { Badge, Button, Card, ProgressBar } from './ui';

interface ProjectOverviewViewProps {
  project: SolutionProject;
  onNavigateTab: (tab: ProjectTab) => void;
}

/** Tela inicial do projeto: em que pé está, o que vem a seguir e o andamento por etapa. */
export const ProjectOverviewView: React.FC<ProjectOverviewViewProps> = ({ project, onNavigateTab }) => {
  const summary = getProjectStatusSummary(project);
  const estimation = getProjectEstimation(project);
  const [copied, setCopied] = useState(false);

  const currentStageTab = summary.stage === 'Concluído' ? 'E6' : summary.stage;
  const pendingTasks =
    summary.stage === 'Concluído'
      ? []
      : getStageActions(project, summary.stage).filter(
          (a) => a.status === 'Aguardando' || a.status === 'Em andamento'
        );
  const lastMeeting = (project.meetingLogs || [])[0];
  const initialColor = getRiskColorClass(summary.risk.initialLevel);
  const currentColor = getRiskColorClass(summary.risk.currentLevel);

  const handleCopyNote = () => {
    navigator.clipboard.writeText(buildGlpiStatusNote(project));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Etapa atual */}
      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-grey-500">Etapa atual</span>
            <p className="text-base sm:text-lg font-bold text-grey-900 mt-1 leading-snug">{summary.sentence}</p>
          </div>
          <Button
            color="secondary"
            size="sm"
            leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyNote}
            title="Copia um resumo do andamento para colar no chamado GLPI, e-mail ou Teams"
          >
            {copied ? 'Copiado!' : 'Copiar apontamento GLPI'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-lg border border-grey-200 p-3.5">
            <span className="text-xs font-semibold text-grey-500">Etapa</span>
            <div className="text-sm font-bold text-grey-900 mt-1">{summary.stageLabel}</div>
            <div className="text-[11px] text-grey-500 mt-1">
              {summary.stage === 'Concluído'
                ? 'Todas as etapas concluídas'
                : `Etapa ${summary.stageNumber} de ${summary.totalStages}`}
            </div>
          </div>

          <div className="rounded-lg border border-grey-200 p-3.5">
            <span className="text-xs font-semibold text-grey-500">Tarefas da etapa</span>
            <div className="text-sm font-bold text-grey-900 mt-1">
              {summary.stageProgress.total === 0
                ? 'Nenhuma cadastrada'
                : `${summary.stageProgress.done} de ${summary.stageProgress.total} concluídas`}
            </div>
            {summary.stageProgress.total > 0 && (
              <ProgressBar
                className="mt-2"
                value={(summary.stageProgress.done / summary.stageProgress.total) * 100}
              />
            )}
            <div className="text-[11px] text-grey-500 mt-1.5">
              No projeto: {summary.overallProgress.done} de {summary.overallProgress.total}
            </div>
          </div>

          <div
            className={`rounded-lg border p-3.5 ${
              summary.schedule.status === 'late' ? 'border-danger-300 bg-danger-50' : 'border-grey-200'
            }`}
          >
            <span className="text-xs font-semibold text-grey-500">Prazo</span>
            <div
              className={`text-sm font-bold mt-1 ${
                summary.schedule.status === 'late' ? 'text-danger-800' : 'text-grey-900'
              }`}
            >
              {summary.schedule.status === 'done'
                ? 'Esteira concluída'
                : summary.schedule.status === 'late'
                ? `${summary.schedule.daysLate} ${summary.schedule.daysLate === 1 ? 'dia' : 'dias'} de atraso`
                : 'No prazo'}
            </div>
            <div className="text-[11px] text-grey-500 mt-1">
              {summary.schedule.stageEndDate && <>Etapa até {formatPtBrDate(summary.schedule.stageEndDate)} · </>}
              Entrega prevista {formatPtBrDate(summary.schedule.deliveryDate)}
            </div>
            {!summary.schedule.hasEstimation && (
              <button
                type="button"
                onClick={() => onNavigateTab('estimation')}
                className="text-[11px] text-warning-600 font-semibold hover:underline mt-1"
              >
                Cronograma padrão — revise a estimativa
              </button>
            )}
          </div>

          <div className="rounded-lg border border-grey-200 p-3.5">
            <span className="text-xs font-semibold text-grey-500">Risco</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={initialColor.badge}>{RISK_LABELS[summary.risk.initialLevel]}</Badge>
              <ArrowRight className="w-3.5 h-3.5 text-grey-400" />
              <Badge className={currentColor.badge}>{RISK_LABELS[summary.risk.currentLevel]}</Badge>
            </div>
            <div className="text-[11px] text-grey-500 mt-1.5 font-mono">
              {summary.risk.initialScore} → {summary.risk.currentScore} pts
            </div>
          </div>
        </div>
      </Card>

      {/* Impedimento */}
      {summary.blocked && (
        <div className="rounded-lg border border-danger-300 bg-danger-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
          <div className="text-xs text-danger-800">
            <div className="font-bold text-sm">Projeto bloqueado</div>
            <p className="mt-0.5">{summary.blockReason}</p>
            {project.actionRequiredFromManagement && (
              <p className="mt-1">
                <strong>Ação requerida da gestão:</strong> {project.actionRequiredFromManagement}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas tarefas */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-brand-dark" />
              Próximas tarefas
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab(currentStageTab)}
              className="text-xs text-brand-dark font-semibold hover:underline flex items-center gap-1"
            >
              Abrir {currentStageTab} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-xs text-grey-500">
              {summary.stage === 'Concluído'
                ? 'Nenhuma pendência: a esteira foi concluída.'
                : 'Nenhuma tarefa pendente na etapa atual.'}
            </p>
          ) : (
            <ul className="divide-y divide-grey-100">
              {pendingTasks.slice(0, 5).map((task) => (
                <li key={task.id} className="py-2 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-grey-900">{task.title}</div>
                    <div className="text-[11px] text-grey-500 mt-0.5">
                      {task.responsible} · prazo {task.deadline}
                    </div>
                  </div>
                  <Badge
                    className={
                      task.status === 'Em andamento'
                        ? 'bg-info-50 text-info-700 border-info-200 shrink-0'
                        : 'bg-warning-50 text-warning-600 border-warning-200 shrink-0'
                    }
                  >
                    {task.status}
                  </Badge>
                </li>
              ))}
              {pendingTasks.length > 5 && (
                <li className="pt-2 text-[11px] text-grey-500">+ {pendingTasks.length - 5} tarefas pendentes</li>
              )}
            </ul>
          )}

          {lastMeeting && (
            <div className="pt-3 border-t border-grey-100 text-xs">
              <div className="flex items-center gap-1.5 text-grey-500 font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                Última reunião · {lastMeeting.date}
              </div>
              <div className="font-semibold text-grey-900 mt-1">{lastMeeting.subject}</div>
              {lastMeeting.nextSteps && (
                <p className="text-[11px] text-grey-600 mt-0.5 whitespace-pre-line line-clamp-3">
                  Próximos passos: {lastMeeting.nextSteps}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Andamento por etapa */}
        <Card className="space-y-3">
          <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-dark" />
            Andamento por etapa
          </h3>
          <ul className="space-y-1">
            {STAGE_TABS.map((stage) => {
              const state = getStageState(project, stage);
              const { done, total } = countProgress(getStageActions(project, stage));
              const schedule = getStageSchedule(estimation, stage);
              return (
                <li key={stage}>
                  <button
                    type="button"
                    onClick={() => onNavigateTab(stage)}
                    className={`w-full text-left flex items-center gap-3 px-2.5 py-2 rounded-md text-xs hover:bg-grey-50 ${
                      state === 'current' ? 'bg-brand-lighter/60' : ''
                    }`}
                  >
                    {state === 'done' ? (
                      <CheckCircle2 className="w-4 h-4 text-brand-main shrink-0" />
                    ) : state === 'current' ? (
                      <span className="w-4 h-4 rounded-full border-4 border-brand-main shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-grey-300 shrink-0" />
                    )}
                    <span
                      className={`flex-1 min-w-0 truncate ${
                        state === 'future' ? 'text-grey-500' : 'text-grey-900 font-semibold'
                      }`}
                    >
                      {stageLabel(stage)}
                    </span>
                    <span className="text-[11px] text-grey-500 font-mono shrink-0">
                      {total === 0 ? '—' : `${done}/${total}`}
                    </span>
                    {schedule && (
                      <span className="hidden sm:flex items-center gap-1 text-[11px] text-grey-400 font-mono shrink-0 w-24 justify-end">
                        <Calendar className="w-3 h-3" />
                        {formatPtBrDate(schedule.endDate).slice(0, 5)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
};
