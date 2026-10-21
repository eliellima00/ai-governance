import React, { useState } from 'react';
import { AlertOctagon, ArrowRight, Calendar, CheckCircle2, History, ShieldCheck } from 'lucide-react';
import {
  ActionItem,
  ActionStatus,
  GovStage,
  ProjectActivityLog,
  RiskCriterion,
  SolutionProject,
  StageTab,
  UserRole
} from '../types';
import { getActiveConfig } from '../config/governanceConfig';
import { can } from '../utils/permissions';
import { formatPtBrDate, diffDays } from '../utils/estimation';
import {
  getCurrentStage,
  getProjectEstimation,
  getStageActions,
  getStageSchedule,
  getStageState,
  stageIndex,
  stageLabel,
  STAGE_TABS
} from '../utils/projectStatus';
import { Badge, Button, Card, ChecklistItem, Field, Modal, ModalFooter, Textarea } from './ui';
import { StageTaskList } from './StageTaskList';
import { MeetingLogPanel } from './MeetingLogPanel';
import { AiDiagnosticView } from './AiDiagnosticView';
import { CriticalityEvolutionView } from './CriticalityEvolutionView';

interface StageViewProps {
  project: SolutionProject;
  stage: StageTab;
  userRole: UserRole;
  residualScore: number;
  onUpdateProject: (updated: SolutionProject) => void;
  onToggleActionStatus: (id: number, newStatus: ActionStatus) => void;
  onAddActionItem: (item: Omit<ActionItem, 'id'>) => void;
  onEditActionItem: (item: ActionItem) => void;
  onDeleteActionItem: (id: number) => void;
  onAddCriterion: (item: Omit<RiskCriterion, 'id'>) => void;
  onEditCriterion: (item: RiskCriterion) => void;
  onDeleteCriterion: (id: string) => void;
}

const STATE_BADGES = {
  done: { label: 'Etapa concluída', className: 'bg-brand-lighter text-brand-dark border-brand-light' },
  current: { label: 'Etapa atual', className: 'bg-brand-main text-white border-brand-main' },
  future: { label: 'Próxima', className: 'bg-grey-100 text-grey-600 border-grey-200' }
};

function nextStageOf(stage: GovStage): GovStage {
  const idx = stageIndex(stage);
  return idx + 1 >= STAGE_TABS.length ? 'Concluído' : STAGE_TABS[idx + 1];
}

/** Aba de uma etapa da esteira: objetivo, datas, tarefas, reuniões e o conteúdo próprio da etapa. */
export const StageView: React.FC<StageViewProps> = ({
  project,
  stage,
  userRole,
  residualScore,
  onUpdateProject,
  onToggleActionStatus,
  onAddActionItem,
  onEditActionItem,
  onDeleteActionItem,
  onAddCriterion,
  onEditCriterion,
  onDeleteCriterion
}) => {
  const config = getActiveConfig();
  const canAdvanceStage = can(userRole, 'advance_stage');
  const currentStage = getCurrentStage(project);
  const state = getStageState(project, stage);
  const stateBadge = STATE_BADGES[state];

  const schedule = getStageSchedule(getProjectEstimation(project), stage);
  const todayIso = new Date().toISOString().split('T')[0];
  const daysLate = state === 'current' && schedule ? Math.max(0, diffDays(schedule.endDate, todayIso)) : 0;

  const exitCriteriaChecked = project.exitCriteriaChecked || {};
  const stageHistory = (project.activityLog || []).filter((log) => log.stage === stage);

  const [pendingTarget, setPendingTarget] = useState<GovStage | null>(null);
  const [justification, setJustification] = useState('');

  const requestStageChange = (target: GovStage) => {
    if (!canAdvanceStage || target === currentStage) return;
    setPendingTarget(target);
    setJustification('');
  };

  // Ao avançar para o encerramento, os critérios de saída precisam estar marcados (ou justificados)
  const missingCriteria =
    pendingTarget === 'E6' || pendingTarget === 'Concluído'
      ? config.exitCriteriaChecklist.filter((c) => !exitCriteriaChecked[c.id]).map((c) => c.title)
      : [];
  const pendingTasksInCurrent =
    currentStage === 'Concluído'
      ? 0
      : getStageActions(project, currentStage).filter(
          (a) => a.status === 'Aguardando' || a.status === 'Em andamento'
        ).length;
  const isBackward = pendingTarget !== null && stageIndex(pendingTarget) < stageIndex(currentStage);

  const applyStageTransition = () => {
    if (!pendingTarget) return;
    const nowStr =
      new Date().toLocaleDateString('pt-BR') +
      ' ' +
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const description = `Mudança de etapa: ${stageLabel(currentStage)} → ${stageLabel(pendingTarget)}`;
    const effectiveJustification =
      missingCriteria.length > 0 ? justification || 'Avanço autorizado com critérios parciais' : justification;
    const logEntry: ProjectActivityLog = {
      id: 'log-' + Date.now(),
      date: nowStr,
      timestamp: nowStr,
      author: project.technicalResponsible || 'T.I Governança',
      registeredBy: project.technicalResponsible || 'T.I Governança',
      action: description,
      description,
      details: effectiveJustification ? `Justificativa: ${effectiveJustification}` : undefined,
      stage: pendingTarget,
      hours: 0.5
    };
    onUpdateProject({
      ...project,
      govStage: pendingTarget,
      stageEnteredAt: todayIso,
      activityLog: [logEntry, ...(project.activityLog || [])]
    });
    setPendingTarget(null);
  };

  const handleToggleExitCriteria = (critId: string) => {
    if (!canAdvanceStage) return;
    onUpdateProject({
      ...project,
      exitCriteriaChecked: { ...exitCriteriaChecked, [critId]: !exitCriteriaChecked[critId] }
    });
  };

  const nextStage = nextStageOf(stage);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da etapa */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-grey-900">{stageLabel(stage)}</h2>
              <Badge className={stateBadge.className}>{stateBadge.label}</Badge>
              {daysLate > 0 && (
                <Badge className="bg-danger-50 text-danger-800 border-danger-300">
                  {daysLate} {daysLate === 1 ? 'dia' : 'dias'} de atraso
                </Badge>
              )}
            </div>
            <p className="text-xs text-grey-600 mt-1 max-w-3xl">{config.stageDescriptions[stage]}</p>
            {schedule && (
              <p className="text-xs text-grey-500 mt-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Planejado: {formatPtBrDate(schedule.startDate)} a {formatPtBrDate(schedule.endDate)} ·{' '}
                {schedule.totalHours}h de esforço
              </p>
            )}
          </div>

          {canAdvanceStage && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {state === 'current' ? (
                <Button
                  color="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => requestStageChange(nextStage)}
                >
                  {nextStage === 'Concluído' ? 'Concluir a esteira' : `Avançar para ${stageLabel(nextStage)}`}
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => requestStageChange(stage)}
                  className="text-xs text-grey-500 hover:text-brand-dark hover:underline"
                >
                  {state === 'done' ? 'Voltar a esteira para esta etapa' : 'Mover a esteira para esta etapa'}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Conteúdo próprio da etapa */}
      {stage === 'E1' && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-grey-900">Diagnóstico de risco</h3>
          <AiDiagnosticView
            project={project}
            userRole={userRole}
            onAddCriterion={onAddCriterion}
            onEditCriterion={onEditCriterion}
            onDeleteCriterion={onDeleteCriterion}
          />
        </section>
      )}

      <StageTaskList
        project={project}
        stage={stage}
        userRole={userRole}
        onToggleActionStatus={onToggleActionStatus}
        onAddActionItem={onAddActionItem}
        onEditActionItem={onEditActionItem}
        onDeleteActionItem={onDeleteActionItem}
      />

      {stage === 'E6' && (
        <>
          <Card className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-dark" />
                <span>Critérios de saída da governança</span>
              </h3>
              <p className="text-xs text-grey-500 mt-0.5">
                O objetivo não é resolver tudo: é resolver o crítico e tirar a solução da mão de uma só pessoa.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {config.exitCriteriaChecklist.map((crit) => {
                const isChecked = !!exitCriteriaChecked[crit.id];
                return (
                  <div
                    key={crit.id}
                    className={`p-3 rounded-lg border ${
                      isChecked ? 'border-brand-main bg-brand-lighter/50' : 'border-grey-200'
                    }`}
                  >
                    <ChecklistItem
                      checked={isChecked}
                      onToggle={() => handleToggleExitCriteria(crit.id)}
                      disabled={!canAdvanceStage}
                    >
                      <div className="text-xs font-bold text-grey-900">{crit.title}</div>
                      <div className="text-[11px] text-grey-500 leading-snug mt-0.5">{crit.description}</div>
                    </ChecklistItem>
                  </div>
                );
              })}
            </div>
          </Card>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-grey-900">Redução do risco (antes × agora)</h3>
            <CriticalityEvolutionView project={project} actionList={project.actionPlan} residualScore={residualScore} />
          </section>
        </>
      )}

      <MeetingLogPanel project={project} userRole={userRole} onUpdateProject={onUpdateProject} stage={stage} />

      {stageHistory.length > 0 && (
        <Card className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-grey-700 flex items-center gap-2">
            <History className="w-4 h-4 text-grey-500" />
            Histórico da etapa
          </h3>
          {stageHistory.map((log) => (
            <div key={log.id} className="flex flex-wrap justify-between gap-2 text-xs border-t border-grey-100 pt-2">
              <div>
                <div className="font-semibold text-grey-800">{log.action || log.description}</div>
                {log.details && <div className="text-[11px] text-grey-500">{log.details}</div>}
              </div>
              <div className="text-[11px] text-grey-400 font-mono text-right">
                <div>{log.timestamp || log.date}</div>
                <div>{log.author || log.registeredBy}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Confirmação de mudança de etapa (toda transição passa por aqui) */}
      {pendingTarget && (
        <Modal
          isOpen
          onClose={() => setPendingTarget(null)}
          title={missingCriteria.length > 0 ? 'Critérios de saída incompletos' : 'Confirmar mudança de etapa'}
        >
          <div className="flex items-center gap-2 text-warning-600 -mt-1">
            <AlertOctagon className="w-5 h-5" />
            <span className="text-xs font-semibold">
              {stageLabel(currentStage)} → {stageLabel(pendingTarget)}
            </span>
          </div>

          {isBackward && (
            <p className="text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded-lg p-2.5 font-medium">
              Isso volta a esteira para uma etapa anterior.
            </p>
          )}

          {!isBackward && pendingTasksInCurrent > 0 && (
            <p className="text-xs text-warning-600 bg-warning-50 border border-warning-200 rounded-lg p-2.5 font-medium">
              A etapa atual ainda tem {pendingTasksInCurrent}{' '}
              {pendingTasksInCurrent === 1 ? 'tarefa pendente' : 'tarefas pendentes'}.
            </p>
          )}

          {missingCriteria.length > 0 && (
            <>
              <p className="text-xs text-grey-600">Estes critérios de saída ainda não foram marcados:</p>
              <ul className="p-3 bg-warning-50 rounded-lg border border-warning-200 space-y-1 text-xs text-warning-600 font-medium list-disc list-inside">
                {missingCriteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}

          <Field label={missingCriteria.length > 0 ? 'Justificativa para avançar mesmo assim' : 'Observação (opcional)'}>
            <Textarea rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} />
          </Field>

          <p className="text-[11px] text-grey-500">A mudança fica registrada no histórico da etapa.</p>

          <ModalFooter>
            <Button color="secondary" onClick={() => setPendingTarget(null)}>
              Cancelar
            </Button>
            <Button
              color={missingCriteria.length > 0 ? 'danger' : 'primary'}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={applyStageTransition}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </Modal>
      )}

    </div>
  );
};
