import React, { useState } from 'react';
import { Check, CheckCircle2, Clock, Edit2, ExternalLink, ListChecks, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionItem, ActionPriority, ActionStatus, SolutionProject, StageTab, UserRole } from '../types';
import { can } from '../utils/permissions';
import { countProgress, getStageActions, isStageTab, isUrl, stageLabel, STAGE_TABS } from '../utils/projectStatus';
import { Badge, Button, Card, Field, Input, Modal, ModalFooter, ProgressBar, Select, Table, Tbody, Td, Textarea, Th, Thead, Tr } from './ui';

interface StageTaskListProps {
  project: SolutionProject;
  stage: StageTab;
  userRole: UserRole;
  onToggleActionStatus: (id: number, newStatus: ActionStatus) => void;
  onAddActionItem: (item: Omit<ActionItem, 'id'>) => void;
  onEditActionItem: (item: ActionItem) => void;
  onDeleteActionItem: (id: number) => void;
}

type Dimension = ActionItem['dimension'];

const PRIORITY_BADGE_CLASSES: Record<ActionPriority, string> = {
  Crítica: 'bg-danger-50 text-danger-800 border-danger-300',
  Alta: 'bg-warning-50 text-warning-600 border-warning-200',
  Média: 'bg-info-50 text-info-700 border-info-200',
  Baixa: 'bg-grey-100 text-grey-700 border-grey-200'
};

const STATUS_PILL_CLASSES: Record<ActionStatus, string> = {
  Concluído: 'bg-brand-main text-white border-transparent',
  'Em andamento': 'bg-info-600 text-white border-transparent',
  Aguardando: 'bg-warning-50 text-warning-600 border-warning-200',
  Cancelado: 'bg-grey-100 text-grey-600 border-grey-200'
};

const NEXT_STATUS: Record<ActionStatus, ActionStatus> = {
  Aguardando: 'Em andamento',
  'Em andamento': 'Concluído',
  Concluído: 'Aguardando',
  Cancelado: 'Aguardando'
};

interface TaskForm {
  title: string;
  responsible: string;
  deadline: string;
  priority: ActionPriority;
  status: ActionStatus;
  riskPointsImpact: number;
  dimension: Dimension;
  notes: string;
  evidence: string;
  stage: StageTab;
}

/** Tarefas (ações do plano) de uma etapa da esteira. */
export const StageTaskList: React.FC<StageTaskListProps> = ({
  project,
  stage,
  userRole,
  onToggleActionStatus,
  onAddActionItem,
  onEditActionItem,
  onDeleteActionItem
}) => {
  const canEdit = can(userRole, 'toggle_action_item');
  const tasks = getStageActions(project, stage);
  const { done, total } = countProgress(tasks);

  const [modalMode, setModalMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [editingTask, setEditingTask] = useState<ActionItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>({
    title: '',
    responsible: '',
    deadline: '',
    priority: 'Alta',
    status: 'Aguardando',
    riskPointsImpact: 0,
    dimension: 'Governança',
    notes: '',
    evidence: '',
    stage
  });

  const openAdd = () => {
    setEditingTask(null);
    setForm({
      title: '',
      responsible: project.technicalResponsible || 'TI Dev',
      deadline: '',
      priority: 'Alta',
      status: 'Aguardando',
      riskPointsImpact: 0,
      dimension: 'Governança',
      notes: '',
      evidence: '',
      stage
    });
    setModalMode('add');
  };

  const openEdit = (task: ActionItem) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      responsible: task.responsible,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      riskPointsImpact: task.riskPointsImpact,
      dimension: task.dimension,
      notes: task.notes || '',
      evidence: task.evidence || '',
      // Gravar a etapa ao salvar confirma a sugestão feita para registros antigos
      stage
    });
    setModalMode('edit');
  };

  const handleCycleStatus = (task: ActionItem) => {
    const next = NEXT_STATUS[task.status];
    if (next === 'Concluído') {
      try {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
      } catch (_) {
        // ignore
      }
    }
    onToggleActionStatus(task.id, next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const data: Omit<ActionItem, 'id'> = {
      title: form.title.trim(),
      responsible: form.responsible.trim() || 'TI Responsável',
      deadline: form.deadline.trim() || 'A definir',
      priority: form.priority,
      status: form.status,
      riskPointsImpact: Number(form.riskPointsImpact) || 0,
      dimension: form.dimension,
      notes: form.notes,
      evidence: form.evidence.trim(),
      stage: form.stage
    };
    if (form.status === 'Concluído') {
      data.completionDate = editingTask?.completionDate || new Date().toLocaleDateString('pt-BR');
    }
    if (modalMode === 'edit' && editingTask) {
      onEditActionItem({ ...data, id: editingTask.id });
    } else {
      onAddActionItem(data);
    }
    setModalMode('closed');
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-brand-dark" />
            <span>Tarefas da etapa</span>
            <span className="text-xs font-normal text-grey-500">
              {total === 0 ? '(nenhuma)' : `${done} de ${total} concluídas`}
            </span>
          </h3>
          {total > 0 && (
            <div className="w-48 mt-2">
              <ProgressBar value={(done / total) * 100} />
            </div>
          )}
        </div>
        {canEdit && (
          <Button color="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAdd}>
            Nova tarefa
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-grey-500">Nenhuma tarefa cadastrada para esta etapa.</p>
      ) : (
        <div className="border border-grey-200 rounded-lg overflow-hidden">
          <Table>
            <Thead>
              <Tr className="hover:bg-transparent">
                <Th className="w-36">Status</Th>
                <Th className="min-w-[240px]">Tarefa</Th>
                <Th className="min-w-[120px]">Responsável</Th>
                <Th className="min-w-[100px]">Prazo</Th>
                <Th>Prioridade</Th>
                <Th className="text-center">Risco</Th>
                {canEdit && <Th className="w-20" />}
              </Tr>
            </Thead>
            <Tbody>
              {tasks.map((task) => {
                const pill = (
                  <>
                    {task.status === 'Concluído' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{task.status}</span>
                  </>
                );
                const pillClass = `px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border whitespace-nowrap ${STATUS_PILL_CLASSES[task.status]}`;
                return (
                  <Tr key={task.id} className={task.status === 'Concluído' ? 'bg-brand-lighter/40' : ''}>
                    <Td>
                      {canEdit ? (
                        <button
                          onClick={() => handleCycleStatus(task)}
                          title="Clique para alternar: Aguardando → Em andamento → Concluído"
                          className={`${pillClass} cursor-pointer active:scale-95 transition-transform`}
                        >
                          {pill}
                        </button>
                      ) : (
                        <span className={pillClass}>{pill}</span>
                      )}
                    </Td>
                    <Td>
                      <div className={`font-semibold ${task.status === 'Cancelado' ? 'line-through text-grey-400' : 'text-grey-900'}`}>
                        {task.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className="text-[10px] px-1.5 py-0.5 bg-grey-100 text-grey-600 border-grey-200 font-medium">
                          {task.dimension}
                        </Badge>
                        {!task.stage && (
                          <span
                            className="text-[10px] text-warning-600 font-medium"
                            title="Tarefa antiga sem etapa gravada: a etapa foi sugerida pelo título. Edite e salve para confirmar."
                          >
                            etapa sugerida
                          </span>
                        )}
                        {task.evidence &&
                          (isUrl(task.evidence) ? (
                            <a
                              href={task.evidence}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-brand-dark font-semibold inline-flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> Evidência
                            </a>
                          ) : (
                            <span className="text-[11px] text-brand-dark truncate max-w-xs">✓ {task.evidence}</span>
                          ))}
                      </div>
                      {task.notes && <p className="text-[11px] text-grey-500 mt-1 line-clamp-2">{task.notes}</p>}
                    </Td>
                    <Td className="text-grey-800 whitespace-nowrap">{task.responsible}</Td>
                    <Td className="whitespace-nowrap font-mono text-[11px] text-grey-600">
                      {task.completionDate ? (
                        <span className="text-brand-dark font-semibold">Entregue {task.completionDate}</span>
                      ) : (
                        task.deadline
                      )}
                    </Td>
                    <Td>
                      <Badge className={`text-[10px] uppercase ${PRIORITY_BADGE_CLASSES[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </Td>
                    <Td className="text-center font-mono text-[11px] text-indigo-700 font-bold">
                      {task.riskPointsImpact > 0 ? `-${task.riskPointsImpact} pts` : '—'}
                    </Td>
                    {canEdit && (
                      <Td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(task)}
                            title="Editar tarefa"
                            className="p-1 text-grey-500 hover:text-grey-900 hover:bg-grey-100 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(task.id)}
                            title="Excluir tarefa"
                            className="p-1 text-danger-500 hover:text-danger-800 hover:bg-danger-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
      )}

      {modalMode !== 'closed' && (
        <Modal
          isOpen
          onClose={() => setModalMode('closed')}
          title={modalMode === 'edit' ? 'Editar tarefa' : 'Nova tarefa'}
          subtitle={stageLabel(form.stage)}
        >
          <form onSubmit={handleSave} className="space-y-3.5">
            <Field label="Tarefa" required>
              <Input
                required
                placeholder="Ex.: Migrar planilha para conta corporativa"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Responsável">
                <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
              </Field>
              <Field label="Prazo">
                <Input
                  placeholder="Ex.: 30/11/2026"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Etapa">
                <Select
                  value={form.stage}
                  onChange={(e) => isStageTab(e.target.value) && setForm({ ...form, stage: e.target.value })}
                >
                  {STAGE_TABS.map((s) => (
                    <option key={s} value={s}>
                      {stageLabel(s)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ActionStatus })}
                >
                  <option value="Aguardando">Aguardando</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Prioridade">
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as ActionPriority })}
                >
                  <option value="Crítica">Crítica</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </Select>
              </Field>
              <Field label="Dimensão">
                <Select
                  value={form.dimension}
                  onChange={(e) => setForm({ ...form, dimension: e.target.value as Dimension })}
                >
                  <option value="Segurança">Segurança</option>
                  <option value="LGPD">LGPD</option>
                  <option value="Operacional">Operacional</option>
                  <option value="Governança">Governança</option>
                </Select>
              </Field>
              <Field label="Reduz o risco em">
                <Select
                  value={form.riskPointsImpact}
                  onChange={(e) => setForm({ ...form, riskPointsImpact: Number(e.target.value) })}
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Não reduz' : `${n} ${n === 1 ? 'ponto' : 'pontos'}`}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Observações">
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>

            <Field label="Evidência de conclusão" hint="Texto ou link (ex.: documento no Drive, PR no GitHub).">
              <Input
                placeholder="https://..."
                value={form.evidence}
                onChange={(e) => setForm({ ...form, evidence: e.target.value })}
              />
            </Field>

            <ModalFooter>
              <Button type="button" color="secondary" onClick={() => setModalMode('closed')}>
                Cancelar
              </Button>
              <Button type="submit" color="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Salvar
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {deletingId !== null && (
        <Modal isOpen size="sm" onClose={() => setDeletingId(null)} title="Excluir tarefa?">
          <p className="text-xs text-grey-600">
            A tarefa será removida e o risco residual recalculado automaticamente.
          </p>
          <ModalFooter>
            <Button color="secondary" size="sm" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button
              color="danger"
              size="sm"
              onClick={() => {
                onDeleteActionItem(deletingId);
                setDeletingId(null);
              }}
            >
              Excluir
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Card>
  );
};
