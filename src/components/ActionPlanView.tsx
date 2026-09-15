import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  TrendingDown,
  Layers,
  GitPullRequest,
  Check,
  Sparkles,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Home,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionItem, ActionPriority, ActionStatus, SolutionProject } from '../types';

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

    onAddActionItem({
      title: formTitle,
      responsible: formResponsible || 'TI Responsável',
      deadline: formDeadline || 'A definir',
      priority: formPriority,
      status: formStatus,
      riskPointsImpact: Number(formRiskPoints) || 1,
      dimension: formDimension,
      notes: formNotes,
      evidence: formEvidence,
      completionDate: formStatus === 'Concluído' ? new Date().toLocaleDateString('pt-BR') : undefined
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction || !formTitle.trim()) return;

    onEditActionItem({
      ...editingAction,
      title: formTitle,
      responsible: formResponsible,
      deadline: formDeadline,
      priority: formPriority,
      status: formStatus,
      riskPointsImpact: Number(formRiskPoints) || 1,
      dimension: formDimension,
      notes: formNotes,
      evidence: formEvidence,
      completionDate: formStatus === 'Concluído' ? (editingAction.completionDate || new Date().toLocaleDateString('pt-BR')) : undefined
    });

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
            <span className="text-grey-800 font-semibold">Plano de Ação & Mitigações</span>
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

      {/* Header & Metrics */}
      <div className="bg-white border border-grey-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-lighter text-brand-dark border border-brand-light">
              Plano de Ação Repriorizado (Reuniões 08 e 10/07/2026)
            </span>
            <span className="text-xs text-grey-500">Gestão e Mitigação de Riscos GLPI</span>
          </div>
          <h2 className="text-xl font-bold text-grey-900 mt-1">
            Matriz de Tratativas & Ações de Governança
          </h2>
          <p className="text-xs text-grey-600 mt-0.5">
            Adicione, edite, priorize e alterne o status das ações para acompanhar a desescalada de risco do ativo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Risk Mitigated Counter */}
          <div className="bg-brand-lighter border border-brand-light px-3.5 py-2 rounded-lg text-right">
            <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wider block">
              Pontos Já Mitigados
            </span>
            <div className="text-lg font-extrabold text-brand-dark">
              -{totalMitigatedPoints} pts abatidos
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-dark hover:bg-brand-dark text-white text-xs font-bold rounded-full shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ação</span>
          </button>

          <button
            onClick={onNavigateToEvolution}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-grey-800 hover:bg-grey-900 text-white text-xs font-bold rounded-full shadow-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ver Gráfico de Queda</span>
          </button>
        </div>
      </div>

      {/* Action Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-grey-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs text-grey-500 font-medium block">Total de Ações</span>
          <div className="text-2xl font-bold text-grey-900 mt-1">{actionList.length} itens</div>
          <span className="text-[11px] text-grey-500">Cadastrados para este ativo</span>
        </div>

        <div className="bg-brand-lighter border border-brand-light rounded-lg p-4 shadow-xs">
          <span className="text-xs text-brand-dark font-medium block">Concluídas</span>
          <div className="text-2xl font-bold text-brand-dark mt-1">
            {completedActions.length}{' '}
            <span className="text-xs font-normal text-brand-dark">
              ({actionList.length > 0 ? Math.round((completedActions.length / actionList.length) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-brand-dark">Mitigações ativas em produção</span>
        </div>

        <div className="bg-info-50 border border-info-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs text-info-700 font-medium block">Em Andamento</span>
          <div className="text-2xl font-bold text-info-700 mt-1">{inProgressActions.length} itens</div>
          <span className="text-[11px] text-info-700">Sendo executados pelo time</span>
        </div>

        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs text-warning-600 font-medium block">Aguardando / Backlog</span>
          <div className="text-2xl font-bold text-warning-600 mt-1">{waitingActions.length} itens</div>
          <span className="text-[11px] text-warning-600">Próximos ciclos de homologação</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-grey-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-56 flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-grey-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por ação, responsável ou notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-grey-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-main focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Buttons */}
          <div className="flex items-center gap-1 bg-grey-100 p-0.5 rounded-lg border border-grey-200">
            {['all', 'Concluído', 'Em andamento', 'Aguardando'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  filterStatus === st
                    ? 'bg-grey-900 text-white shadow-xs'
                    : 'text-grey-600 hover:text-grey-900'
                }`}
              >
                {st === 'all' ? 'Todos' : st}
              </button>
            ))}
          </div>

          {/* Priority Select */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-grey-300 rounded text-grey-700 font-medium text-xs focus:outline-hidden"
          >
            <option value="all">Prioridade (Todas)</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          {/* Dimension Select */}
          <select
            value={filterDimension}
            onChange={(e) => setFilterDimension(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-grey-300 rounded text-grey-700 font-medium text-xs focus:outline-hidden"
          >
            <option value="all">Dimensão (Todas)</option>
            <option value="Segurança">Segurança</option>
            <option value="LGPD">LGPD</option>
            <option value="Operacional">Operacional</option>
            <option value="Governança">Governança</option>
          </select>
        </div>
      </div>

      {/* Action Table */}
      <div className="bg-white border border-grey-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-grey-100 text-grey-700 font-semibold border-b border-grey-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4">Ação / Tratativa</th>
                <th className="py-3 px-3">Responsável</th>
                <th className="py-3 px-3">Prazo / Entrega</th>
                <th className="py-3 px-3">Prioridade</th>
                <th className="py-3 px-3 text-center">Abatimento Risco</th>
                <th className="py-3 px-3 text-center">Status (Clique p/ Mudar)</th>
                <th className="py-3 px-3 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-200 text-grey-700">
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-grey-400">
                    Nenhuma ação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredActions.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-grey-50 transition-colors ${
                      item.status === 'Concluído' ? 'bg-brand-lighter/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold text-grey-500">{item.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-grey-900">{item.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-grey-100 text-grey-600 font-medium border border-grey-200">
                          {item.dimension}
                        </span>
                        {item.evidence && (
                          <span className="text-[10px] text-brand-dark font-medium truncate max-w-xs">
                            ✓ {item.evidence}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-grey-800 whitespace-nowrap">
                      {item.responsible}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`font-mono text-[11px] ${
                          item.status === 'Concluído' ? 'text-brand-dark font-semibold' : 'text-grey-600'
                        }`}
                      >
                        {item.completionDate ? `Entregue ${item.completionDate}` : item.deadline}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.priority === 'Crítica'
                            ? 'bg-danger-50 text-danger-800 border border-danger-300'
                            : item.priority === 'Alta'
                            ? 'bg-warning-50 text-warning-600 border border-warning-200'
                            : item.priority === 'Média'
                            ? 'bg-info-50 text-info-700 border border-info-200'
                            : 'bg-grey-100 text-grey-700 border border-grey-200'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        -{item.riskPointsImpact} pts
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleStatusChange(item.id, item.status)}
                        title="Clique para alternar: Aguardando -> Em andamento -> Concluído"
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-2xs ${
                          item.status === 'Concluído'
                            ? 'bg-brand-main text-white hover:bg-brand-dark'
                            : item.status === 'Em andamento'
                            ? 'bg-info-600 text-white hover:bg-info-700'
                            : 'bg-warning-50 text-warning-600 border border-warning-200 hover:bg-warning-200'
                        }`}
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
                            <Clock className="w-3 h-3 text-warning-600" />
                            <span>Aguardando</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Já Concluído" Highlights Box */}
      <div className="bg-grey-900 text-white rounded-lg p-5 shadow-xs border border-grey-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-light" />
            <h3 className="text-sm font-bold text-white">
              Marcos de Infraestrutura & Governança já Homologados
            </h3>
          </div>
          <span className="text-xs bg-brand-dark text-brand-light border border-brand-dark px-2 py-0.5 rounded font-semibold">
            Base de Sustentação Ativa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-grey-300 pt-1">
          <div className="flex items-center gap-2 bg-grey-800/80 p-2.5 rounded border border-grey-700">
            <CheckCircle2 className="w-4 h-4 text-brand-light shrink-0" />
            <span>Git instalado e configurado no ambiente</span>
          </div>
          <div className="flex items-center gap-2 bg-grey-800/80 p-2.5 rounded border border-grey-700">
            <CheckCircle2 className="w-4 h-4 text-brand-light shrink-0" />
            <span>Conta GitHub criada para o Roger (Dev)</span>
          </div>
          <div className="flex items-center gap-2 bg-grey-800/80 p-2.5 rounded border border-grey-700">
            <CheckCircle2 className="w-4 h-4 text-brand-light shrink-0" />
            <span>Repositório criado: <code className="text-brand-light font-mono">grupoatto/portal-logistica</code></span>
          </div>
          <div className="flex items-center gap-2 bg-grey-800/80 p-2.5 rounded border border-grey-700">
            <CheckCircle2 className="w-4 h-4 text-brand-light shrink-0" />
            <span>Funcionamento do Git no Codex validado</span>
          </div>
          <div className="flex items-center gap-2 bg-grey-800/80 p-2.5 rounded border border-grey-700">
            <CheckCircle2 className="w-4 h-4 text-brand-light shrink-0" />
            <span>Testes de resiliência e restore realizados</span>
          </div>
          <div className="flex items-center gap-2 bg-grey-800/80 p-2.5 rounded border border-grey-700">
            <CheckCircle2 className="w-4 h-4 text-brand-light shrink-0" />
            <span>Conta do GPT corporativa ATTO ativada</span>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Nova Ação */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-grey-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-grey-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-grey-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-grey-900">Cadastrar Nova Ação no Plano</h3>
                <p className="text-xs text-grey-500">Defina os parâmetros de mitigação e impacto em pontos de risco.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-grey-400 hover:text-grey-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-grey-700 block mb-1">Título da Ação / Tratativa:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auditoria semestral de permissões de acesso"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-grey-300 rounded text-xs focus:ring-2 focus:ring-brand-main focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Responsável:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roger (Dev Logística) / TI Segurança"
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value)}
                    className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Prazo / Entrega Estimada:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 15 dias / 30/08/2026"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Prioridade:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs focus:outline-hidden"
                  >
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Dimensão:</label>
                  <select
                    value={formDimension}
                    onChange={(e) => setFormDimension(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs focus:outline-hidden"
                  >
                    <option value="Segurança">Segurança</option>
                    <option value="LGPD">LGPD</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Governança">Governança</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Abatimento Risco:</label>
                  <select
                    value={formRiskPoints}
                    onChange={(e) => setFormRiskPoints(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs font-bold text-indigo-700 focus:outline-hidden"
                  >
                    <option value={1}>-1 ponto</option>
                    <option value={2}>-2 pontos</option>
                    <option value={3}>-3 pontos</option>
                    <option value={4}>-4 pontos</option>
                    <option value={5}>-5 pontos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-grey-700 block mb-1">Status Inicial:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs focus:outline-hidden"
                >
                  <option value="Aguardando">Aguardando</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-grey-700 block mb-1">Notas Técnicas / Procedimento:</label>
                <textarea
                  rows={2}
                  placeholder="Instruções de como executar ou critérios de validação..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 border border-grey-300 rounded text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-grey-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-grey-200 hover:bg-grey-300 text-grey-800 font-semibold rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-dark hover:bg-brand-dark text-white font-semibold rounded-full shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Ação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Ação Existente */}
      {editingAction && (
        <div className="fixed inset-0 z-50 bg-grey-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-grey-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-grey-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-grey-900">Editar Ação #{editingAction.id}</h3>
                <p className="text-xs text-grey-500">Modifique os parâmetros, responsável ou pontos de abatimento.</p>
              </div>
              <button
                onClick={() => setEditingAction(null)}
                className="text-grey-400 hover:text-grey-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-grey-700 block mb-1">Título da Ação / Tratativa:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-grey-300 rounded text-xs focus:ring-2 focus:ring-brand-main focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Responsável:</label>
                  <input
                    type="text"
                    required
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value)}
                    className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Prazo / Entrega:</label>
                  <input
                    type="text"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Prioridade:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs focus:outline-hidden"
                  >
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Dimensão:</label>
                  <select
                    value={formDimension}
                    onChange={(e) => setFormDimension(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs focus:outline-hidden"
                  >
                    <option value="Segurança">Segurança</option>
                    <option value="LGPD">LGPD</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Governança">Governança</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-grey-700 block mb-1">Abatimento Risco:</label>
                  <select
                    value={formRiskPoints}
                    onChange={(e) => setFormRiskPoints(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs font-bold text-indigo-700 focus:outline-hidden"
                  >
                    <option value={1}>-1 ponto</option>
                    <option value={2}>-2 pontos</option>
                    <option value={3}>-3 pontos</option>
                    <option value={4}>-4 pontos</option>
                    <option value={5}>-5 pontos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-grey-700 block mb-1">Status Atual:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-grey-300 rounded text-xs focus:outline-hidden"
                >
                  <option value="Aguardando">Aguardando</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-grey-700 block mb-1">Notas Técnicas:</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 border border-grey-300 rounded text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-grey-700 block mb-1">Evidência de Conclusão (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: PR homologado no GitHub #14"
                  value={formEvidence}
                  onChange={(e) => setFormEvidence(e.target.value)}
                  className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-grey-200">
                <button
                  type="button"
                  onClick={() => setEditingAction(null)}
                  className="px-4 py-2 bg-grey-200 hover:bg-grey-300 text-grey-800 font-semibold rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-dark hover:bg-brand-dark text-white font-semibold rounded-full shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {deletingActionId !== null && (
        <div className="fixed inset-0 z-50 bg-grey-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-xl border border-grey-200 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-grey-900 flex items-center gap-1.5 text-danger-800">
              <Trash2 className="w-4 h-4" />
              <span>Remover Ação #{deletingActionId}?</span>
            </h3>
            <p className="text-xs text-grey-600">
              Tem certeza que deseja excluir esta ação? Os pontos de abatimento serão recalculados automaticamente.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-grey-200">
              <button
                onClick={() => setDeletingActionId(null)}
                className="px-3 py-1.5 bg-grey-200 hover:bg-grey-300 text-grey-800 text-xs font-semibold rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-danger-500 hover:bg-danger-800 text-white text-xs font-semibold rounded"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Detail Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-grey-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-grey-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-grey-500">Ação #{selectedAction.id}</span>
                <h3 className="text-base font-bold text-grey-900 mt-0.5">{selectedAction.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-grey-400 hover:text-grey-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

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

            <div className="flex justify-end gap-2 pt-2 border-t border-grey-200">
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 bg-grey-200 hover:bg-grey-300 text-grey-800 text-xs font-semibold rounded-full"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  handleStatusChange(selectedAction.id, selectedAction.status);
                  setSelectedAction(null);
                }}
                className="px-4 py-2 bg-brand-main hover:bg-brand-dark text-white text-xs font-semibold rounded-full shadow-xs"
              >
                Alternar Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
