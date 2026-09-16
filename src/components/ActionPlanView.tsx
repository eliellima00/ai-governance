import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Check,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionItem, ActionPriority, ActionStatus, SolutionProject } from '../types';
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  ModalFooter,
  PageHeader,
  SearchInput,
  Select,
  StatTile,
  Table,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr
} from './ui';

interface ActionPlanViewProps {
  project: SolutionProject;
  actionList: ActionItem[];
  onNavigateHome?: () => void;
  onToggleActionStatus: (id: number, newStatus: ActionStatus) => void;
  onAddActionItem: (item: Omit<ActionItem, 'id'>) => void;
  onEditActionItem: (item: ActionItem) => void;
  onDeleteActionItem: (id: number) => void;
  onNavigateToEvolution: () => void;
}

const PRIORITY_BADGE_CLASSES: Record<ActionPriority, string> = {
  Crítica: 'bg-danger-50 text-danger-800 border-danger-300',
  Alta: 'bg-warning-50 text-warning-600 border-warning-200',
  Média: 'bg-info-50 text-info-700 border-info-200',
  Baixa: 'bg-grey-100 text-grey-700 border-grey-200'
};

const STATUS_BUTTON_CLASSES: Record<ActionStatus, string> = {
  Concluído: 'bg-brand-main text-white hover:bg-brand-dark border-transparent',
  'Em andamento': 'bg-info-600 text-white hover:bg-info-700 border-transparent',
  Aguardando: 'bg-warning-50 text-warning-600 border-warning-200 hover:bg-warning-200',
  Cancelado: 'bg-grey-100 text-grey-600 border-grey-200 hover:bg-grey-200'
};

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  project,
  actionList,
  onNavigateHome,
  onToggleActionStatus,
  onAddActionItem,
  onEditActionItem,
  onDeleteActionItem,
  onNavigateToEvolution
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDimension, setFilterDimension] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [deletingActionId, setDeletingActionId] = useState<number | null>(null);

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPriority, setFormPriority] = useState<ActionPriority>('Alta');
  const [formStatus, setFormStatus] = useState<ActionStatus>('Aguardando');
  const [formRiskPoints, setFormRiskPoints] = useState<number>(3);
  const [formDimension, setFormDimension] = useState<'Segurança' | 'LGPD' | 'Operacional' | 'Governança'>('Segurança');
  const [formNotes, setFormNotes] = useState('');
  const [formEvidence, setFormEvidence] = useState('');

  const completedActions = actionList.filter((a) => a.status === 'Concluído');
  const inProgressActions = actionList.filter((a) => a.status === 'Em andamento');
  const waitingActions = actionList.filter((a) => a.status === 'Aguardando');

  const totalMitigatedPoints = completedActions.reduce((sum, a) => sum + a.riskPointsImpact, 0);

  const handleStatusChange = (id: number, currentStatus: ActionStatus) => {
    let nextStatus: ActionStatus = 'Em andamento';
    if (currentStatus === 'Aguardando') nextStatus = 'Em andamento';
    else if (currentStatus === 'Em andamento') {
      nextStatus = 'Concluído';
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // ignore
      }
    } else if (currentStatus === 'Concluído') nextStatus = 'Aguardando';

    onToggleActionStatus(id, nextStatus);
  };

  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormResponsible(project.technicalResponsible || 'TI Dev');
    setFormDeadline('30 dias');
    setFormPriority('Alta');
    setFormStatus('Aguardando');
    setFormRiskPoints(3);
    setFormDimension('Segurança');
    setFormNotes('');
    setFormEvidence('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: ActionItem) => {
    setEditingAction(item);
    setFormTitle(item.title);
    setFormResponsible(item.responsible);
    setFormDeadline(item.deadline);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormRiskPoints(item.riskPointsImpact);
    setFormDimension(item.dimension);
    setFormNotes(item.notes || '');
    setFormEvidence(item.evidence || '');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newItemData: Omit<ActionItem, 'id'> = {
      title: formTitle,
      responsible: formResponsible || 'TI Responsável',
      deadline: formDeadline || 'A definir',
      priority: formPriority,
      status: formStatus,
      riskPointsImpact: Number(formRiskPoints) || 1,
      dimension: formDimension,
      notes: formNotes,
      evidence: formEvidence
    };
    if (formStatus === 'Concluído') {
      newItemData.completionDate = new Date().toLocaleDateString('pt-BR');
    }

    onAddActionItem(newItemData);

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction || !formTitle.trim()) return;

    const updatedItem: ActionItem = {
      ...editingAction,
      title: formTitle,
      responsible: formResponsible,
      deadline: formDeadline,
      priority: formPriority,
      status: formStatus,
      riskPointsImpact: Number(formRiskPoints) || 1,
      dimension: formDimension,
      notes: formNotes,
      evidence: formEvidence
    };
    if (formStatus === 'Concluído') {
      updatedItem.completionDate = editingAction.completionDate || new Date().toLocaleDateString('pt-BR');
    } else {
      delete updatedItem.completionDate;
    }

    onEditActionItem(updatedItem);

    setEditingAction(null);
  };

  const handleConfirmDelete = () => {
    if (deletingActionId !== null) {
      onDeleteActionItem(deletingActionId);
      setDeletingActionId(null);
    }
  };

  const filteredActions = actionList.filter((action) => {
    if (filterStatus !== 'all' && action.status !== filterStatus) return false;
    if (filterPriority !== 'all' && action.priority !== filterPriority) return false;
    if (filterDimension !== 'all' && action.dimension !== filterDimension) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = action.title.toLowerCase().includes(q);
      const matchResp = action.responsible.toLowerCase().includes(q);
      const matchNotes = (action.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchResp && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="bg-white border border-grey-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Badge className="bg-brand-lighter text-brand-dark border-brand-light rounded">
            Plano de Ação Repriorizado (Reuniões 08 e 10/07/2026)
          </Badge>
          <span className="text-xs text-grey-500">Gestão e Mitigação de Riscos GLPI</span>
        </div>

        <PageHeader
          title="Matriz de Tratativas & Ações de Governança"
          subtitle="Adicione, edite, priorize e alterne o status das ações para acompanhar a desescalada de risco do ativo."
          actions={
            <>
              <div className="bg-brand-lighter border border-brand-light px-3.5 py-2 rounded-lg text-right">
                <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
                  Pontos Já Mitigados
                </span>
                <div className="text-lg font-extrabold text-brand-dark">
                  -{totalMitigatedPoints} pts abatidos
                </div>
              </div>

              <Button color="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAddModal}>
                Nova Ação
              </Button>

              <Button
                color="secondary"
                size="md"
                leftIcon={<Layers className="w-3.5 h-3.5" />}
                onClick={onNavigateToEvolution}
                className="bg-grey-800 text-white border-grey-800 hover:bg-grey-900"
              >
                Ver Gráfico de Queda
              </Button>
            </>
          }
        />
      </div>

      {/* Action Status Summary Cards (clicáveis: filtram a tabela por status) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatTile
          label="Total de Ações"
          value={`${actionList.length} itens`}
          subtext="Cadastrados para este ativo"
          icon={<Layers className="w-4 h-4" />}
          iconClassName="bg-grey-100 text-grey-600"
          active={filterStatus === 'all'}
          onClick={() => setFilterStatus('all')}
        />
        <StatTile
          label="Concluídas"
          value={
            <>
              {completedActions.length}{' '}
              <span className="text-xs font-normal text-grey-500">
                ({actionList.length > 0 ? Math.round((completedActions.length / actionList.length) * 100) : 0}%)
              </span>
            </>
          }
          subtext="Mitigações ativas em produção"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconClassName="bg-brand-lighter text-brand-dark"
          active={filterStatus === 'Concluído'}
          onClick={() => setFilterStatus('Concluído')}
        />
        <StatTile
          label="Em Andamento"
          value={`${inProgressActions.length} itens`}
          subtext="Sendo executados pelo time"
          icon={<Clock className="w-4 h-4" />}
          iconClassName="bg-info-50 text-info-700"
          active={filterStatus === 'Em andamento'}
          onClick={() => setFilterStatus('Em andamento')}
        />
        <StatTile
          label="Aguardando / Backlog"
          value={`${waitingActions.length} itens`}
          subtext="Próximos ciclos de homologação"
          icon={<AlertTriangle className="w-4 h-4" />}
          iconClassName="bg-warning-50 text-warning-600"
          active={filterStatus === 'Aguardando'}
          onClick={() => setFilterStatus('Aguardando')}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-grey-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-56 flex-1 sm:flex-initial">
          <SearchInput
            placeholder="Buscar por ação, responsável ou notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs py-1.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-auto py-1.5 text-xs font-medium"
          >
            <option value="all">Prioridade (Todas)</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </Select>

          <Select
            value={filterDimension}
            onChange={(e) => setFilterDimension(e.target.value)}
            className="w-auto py-1.5 text-xs font-medium"
          >
            <option value="all">Dimensão (Todas)</option>
            <option value="Segurança">Segurança</option>
            <option value="LGPD">LGPD</option>
            <option value="Operacional">Operacional</option>
            <option value="Governança">Governança</option>
          </Select>
        </div>
      </div>

      {/* Action Table */}
      <div className="bg-white border border-grey-200 rounded-lg shadow-xs overflow-hidden">
        <Table>
          <Thead>
            <Tr className="hover:bg-transparent">
              <Th className="text-center w-10">#</Th>
              <Th className="min-w-[220px]">Ação / Tratativa</Th>
              <Th className="min-w-[130px]">Responsável</Th>
              <Th className="min-w-[110px]">Prazo / Entrega</Th>
              <Th className="min-w-[100px]">Prioridade</Th>
              <Th className="text-center min-w-[120px]">Abatimento Risco</Th>
              <Th className="text-center min-w-[160px]">Status (Clique p/ Mudar)</Th>
              <Th sticky="right" className="text-center w-28 bg-grey-50">
                Ações
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredActions.length === 0 ? (
              <Tr className="hover:bg-transparent">
                <Td colSpan={8} className="py-8 text-center text-grey-400">
                  Nenhuma ação encontrada com os filtros selecionados.
                </Td>
              </Tr>
            ) : (
              filteredActions.map((item) => (
                <Tr key={item.id} className={item.status === 'Concluído' ? 'bg-brand-lighter/40' : ''}>
                  <Td className="text-center font-bold text-grey-500">{item.id}</Td>
                  <Td>
                    <div className="font-semibold text-grey-900">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-grey-100 text-grey-600 border-grey-200 font-medium">
                        {item.dimension}
                      </Badge>
                      {item.evidence && (
                        <span className="text-[10px] text-brand-dark font-medium truncate max-w-xs">
                          ✓ {item.evidence}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className="font-medium text-grey-800 whitespace-nowrap">{item.responsible}</Td>
                  <Td className="whitespace-nowrap">
                    <span
                      className={`font-mono text-[11px] ${
                        item.status === 'Concluído' ? 'text-brand-dark font-semibold' : 'text-grey-600'
                      }`}
                    >
                      {item.completionDate ? `Entregue ${item.completionDate}` : item.deadline}
                    </span>
                  </Td>
                  <Td>
                    <Badge className={`text-[10px] uppercase ${PRIORITY_BADGE_CLASSES[item.priority]}`}>
                      {item.priority}
                    </Badge>
                  </Td>
                  <Td className="text-center">
                    <Badge className="font-bold text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200">
                      -{item.riskPointsImpact} pts
                    </Badge>
                  </Td>
                  <Td className="text-center">
                    <button
                      onClick={() => handleStatusChange(item.id, item.status)}
                      title="Clique para alternar: Aguardando -> Em andamento -> Concluído"
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border transition-transform active:scale-95 cursor-pointer shadow-2xs ${STATUS_BUTTON_CLASSES[item.status]}`}
                    >
                      {item.status === 'Concluído' ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Concluído</span>
                        </>
                      ) : item.status === 'Em andamento' ? (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Em andamento</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{item.status}</span>
                        </>
                      )}
                    </button>
                  </Td>
                  <Td
                    sticky="right"
                    className={`text-center ${
                      item.status === 'Concluído' ? 'bg-brand-lighter' : 'bg-white group-hover:bg-grey-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        title="Editar ação"
                        className="p-1 text-grey-500 hover:text-grey-900 hover:bg-grey-100 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingActionId(item.id)}
                        title="Excluir ação"
                        className="p-1 text-danger-500 hover:text-danger-800 hover:bg-danger-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedAction(item)}
                        title="Ver detalhes"
                        className="px-1.5 py-1 text-grey-600 hover:text-grey-900 hover:bg-grey-100 rounded text-[11px] font-medium transition-colors"
                      >
                        Ver
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>

      {/* Modal: Adicionar Nova Ação */}
      {isAddModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsAddModalOpen(false)}
          title="Cadastrar Nova Ação no Plano"
          subtitle="Defina os parâmetros de mitigação e impacto em pontos de risco."
        >
          <form onSubmit={handleSaveAdd} className="space-y-3.5">
            <Field label="Título da Ação / Tratativa:">
              <Input
                type="text"
                required
                placeholder="Ex: Auditoria semestral de permissões de acesso"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Responsável:">
                <Input
                  type="text"
                  required
                  placeholder="Ex: Roger (Dev Logística) / TI Segurança"
                  value={formResponsible}
                  onChange={(e) => setFormResponsible(e.target.value)}
                />
              </Field>

              <Field label="Prazo / Entrega Estimada:">
                <Input
                  type="text"
                  required
                  placeholder="Ex: 15 dias / 30/08/2026"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Prioridade:">
                <Select value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)}>
                  <option value="Crítica">Crítica</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </Select>
              </Field>

              <Field label="Dimensão:">
                <Select value={formDimension} onChange={(e) => setFormDimension(e.target.value as any)}>
                  <option value="Segurança">Segurança</option>
                  <option value="LGPD">LGPD</option>
                  <option value="Operacional">Operacional</option>
                  <option value="Governança">Governança</option>
                </Select>
              </Field>

              <Field label="Abatimento Risco:">
                <Select
                  value={formRiskPoints}
                  onChange={(e) => setFormRiskPoints(Number(e.target.value))}
                  className="font-bold text-indigo-700"
                >
                  <option value={1}>-1 ponto</option>
                  <option value={2}>-2 pontos</option>
                  <option value={3}>-3 pontos</option>
                  <option value={4}>-4 pontos</option>
                  <option value={5}>-5 pontos</option>
                </Select>
              </Field>
            </div>

            <Field label="Status Inicial:">
              <Select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                <option value="Aguardando">Aguardando</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído">Concluído</option>
              </Select>
            </Field>

            <Field label="Notas Técnicas / Procedimento:">
              <Textarea
                rows={2}
                placeholder="Instruções de como executar ou critérios de validação..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </Field>

            <ModalFooter>
              <Button type="button" color="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Cadastrar Ação
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Modal: Editar Ação Existente */}
      {editingAction && (
        <Modal
          isOpen
          onClose={() => setEditingAction(null)}
          title={`Editar Ação #${editingAction.id}`}
          subtitle="Modifique os parâmetros, responsável ou pontos de abatimento."
        >
          <form onSubmit={handleSaveEdit} className="space-y-3.5">
            <Field label="Título da Ação / Tratativa:">
              <Input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Responsável:">
                <Input
                  type="text"
                  required
                  value={formResponsible}
                  onChange={(e) => setFormResponsible(e.target.value)}
                />
              </Field>

              <Field label="Prazo / Entrega:">
                <Input type="text" required value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Prioridade:">
                <Select value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)}>
                  <option value="Crítica">Crítica</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </Select>
              </Field>

              <Field label="Dimensão:">
                <Select value={formDimension} onChange={(e) => setFormDimension(e.target.value as any)}>
                  <option value="Segurança">Segurança</option>
                  <option value="LGPD">LGPD</option>
                  <option value="Operacional">Operacional</option>
                  <option value="Governança">Governança</option>
                </Select>
              </Field>

              <Field label="Abatimento Risco:">
                <Select
                  value={formRiskPoints}
                  onChange={(e) => setFormRiskPoints(Number(e.target.value))}
                  className="font-bold text-indigo-700"
                >
                  <option value={1}>-1 ponto</option>
                  <option value={2}>-2 pontos</option>
                  <option value={3}>-3 pontos</option>
                  <option value={4}>-4 pontos</option>
                  <option value={5}>-5 pontos</option>
                </Select>
              </Field>
            </div>

            <Field label="Status Atual:">
              <Select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                <option value="Aguardando">Aguardando</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído">Concluído</option>
              </Select>
            </Field>

            <Field label="Notas Técnicas:">
              <Textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </Field>

            <Field label="Evidência de Conclusão (Opcional):">
              <Input
                type="text"
                placeholder="Ex: PR homologado no GitHub #14"
                value={formEvidence}
                onChange={(e) => setFormEvidence(e.target.value)}
              />
            </Field>

            <ModalFooter>
              <Button type="button" color="secondary" onClick={() => setEditingAction(null)}>
                Cancelar
              </Button>
              <Button type="submit" color="primary">
                Salvar Alterações
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Modal: Confirmar Exclusão */}
      {deletingActionId !== null && (
        <Modal
          isOpen
          size="sm"
          onClose={() => setDeletingActionId(null)}
          title={`Remover Ação #${deletingActionId}?`}
        >
          <p className="text-xs text-grey-600">
            Tem certeza que deseja excluir esta ação? Os pontos de abatimento serão recalculados automaticamente.
          </p>
          <ModalFooter>
            <Button color="secondary" size="sm" onClick={() => setDeletingActionId(null)}>
              Cancelar
            </Button>
            <Button color="danger" size="sm" onClick={handleConfirmDelete}>
              Sim, Remover
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Action Detail Modal */}
      {selectedAction && (
        <Modal
          isOpen
          onClose={() => setSelectedAction(null)}
          title={selectedAction.title}
          subtitle={`Ação #${selectedAction.id}`}
        >
          <div className="space-y-2 text-xs bg-grey-50 p-3.5 rounded-lg border border-grey-200">
            <div className="flex justify-between">
              <span className="text-grey-500">Responsável:</span>
              <strong className="text-grey-900">{selectedAction.responsible}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-500">Prazo / Entrega:</span>
              <strong className="text-grey-900">{selectedAction.deadline}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-500">Prioridade:</span>
              <strong className="text-grey-900">{selectedAction.priority}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-500">Redução de Risco:</span>
              <strong className="text-brand-dark">-{selectedAction.riskPointsImpact} pontos</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-grey-500">Dimensão:</span>
              <strong className="text-grey-900">{selectedAction.dimension}</strong>
            </div>
          </div>

          {selectedAction.notes && (
            <div>
              <span className="text-xs font-bold text-grey-800 block mb-1">Notas Técnicas:</span>
              <p className="text-xs text-grey-700 bg-grey-100 p-2.5 rounded leading-relaxed">
                {selectedAction.notes}
              </p>
            </div>
          )}

          {selectedAction.evidence && (
            <div className="p-2.5 bg-brand-lighter border border-brand-light rounded text-xs text-brand-dark">
              <strong>Evidência de Conclusão:</strong> {selectedAction.evidence}
            </div>
          )}

          <ModalFooter>
            <Button color="secondary" onClick={() => setSelectedAction(null)}>
              Fechar
            </Button>
            <Button
              color="primary"
              onClick={() => {
                handleStatusChange(selectedAction.id, selectedAction.status);
                setSelectedAction(null);
              }}
            >
              Alternar Status
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
