import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Database,
  Users,
  FileCheck,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { RiskCriterion, SolutionProject, UserRole } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import { can } from '../utils/permissions';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  ModalFooter,
  PageHeader,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Textarea,
  ProgressBar,
  ChecklistItem,
  StatTile
} from './ui';

interface AiDiagnosticViewProps {
  project: SolutionProject;
  userRole: UserRole;
  onNavigateToActionPlan: () => void;
  onAddCriterion: (item: Omit<RiskCriterion, 'id'>) => void;
  onEditCriterion: (item: RiskCriterion) => void;
  onDeleteCriterion: (id: string) => void;
}

type CriterionDimension = 'Segurança' | 'LGPD' | 'Operacional';

export const AiDiagnosticView: React.FC<AiDiagnosticViewProps> = ({
  project,
  userRole,
  onNavigateToActionPlan,
  onAddCriterion,
  onEditCriterion,
  onDeleteCriterion
}) => {
  const riskColor = getRiskColorClass(project.initialRisk);
  const canEditCriteria = can(userRole, 'edit_criteria');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<RiskCriterion | null>(null);
  const [deletingCriterionId, setDeletingCriterionId] = useState<string | null>(null);

  const [formCriterion, setFormCriterion] = useState('');
  const [formEvidence, setFormEvidence] = useState('');
  const [formDimension, setFormDimension] = useState<CriterionDimension>('Segurança');
  const [formPoints, setFormPoints] = useState<number>(3);

  const handleOpenAddModal = () => {
    setFormCriterion('');
    setFormEvidence('');
    setFormDimension('Segurança');
    setFormPoints(3);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: RiskCriterion) => {
    setEditingCriterion(item);
    setFormCriterion(item.criterion);
    setFormEvidence(item.evidence);
    setFormDimension(item.dimension);
    setFormPoints(item.points);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCriterion.trim()) return;
    onAddCriterion({
      criterion: formCriterion,
      evidence: formEvidence,
      dimension: formDimension,
      points: Number(formPoints) || 0
    });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCriterion || !formCriterion.trim()) return;
    onEditCriterion({
      ...editingCriterion,
      criterion: formCriterion,
      evidence: formEvidence,
      dimension: formDimension,
      points: Number(formPoints) || 0
    });
    setEditingCriterion(null);
  };

  const handleConfirmDelete = () => {
    if (deletingCriterionId !== null) {
      onDeleteCriterion(deletingCriterionId);
      setDeletingCriterionId(null);
    }
  };

  const renderDimensionColumn = (dimension: CriterionDimension) => {
    const items = project.criteria.filter((c) => c.dimension === dimension);
    if (items.length === 0) {
      return <span className="text-xs text-grey-400">Nenhum critério de {dimension} registrado.</span>;
    }
    return items.map((c) => (
      <ChecklistItem key={c.id} checked>
        {c.criterion}
      </ChecklistItem>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="bg-white border border-grey-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-lighter text-brand-dark rounded-lg border border-brand-light shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-brand-lighter text-brand-dark border-transparent">
                Diagnóstico de Risco por Regras
              </Badge>
              <span className="text-xs text-grey-500 font-mono">Motor Determinístico T.I</span>
            </div>
            <PageHeader
              title="Parecer Técnico de Criticidade & Avaliação Inicial"
              subtitle="Classificação por regras a partir do cadastro — declaração a confirmar na Reunião de Entendimento (E1)."
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score — custom block: StatTile has no decorative-icon slot */}
            <div className="relative overflow-hidden text-left rounded-lg border border-grey-800 bg-grey-900 text-white p-3.5 min-w-0">
              <div className="relative">
                <span className="text-xs font-semibold text-grey-300">Pontuação Total por Regras</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black">{project.initialScore}</span>
                  <span className="text-[11px] text-red-400 font-semibold uppercase">pontos</span>
                </div>
                <div className="mt-2">
                  <Badge className={`${riskColor.badge} border-transparent`}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>Risco Inicial: {project.initialRisk}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Category Card */}
            <StatTile
              label="Categoria da Solução"
              value={project.technicalDoc?.classification || 'Classificação a definir'}
              subtext={`Área responsável: ${project.department}`}
            />

            {/* TI Mandate */}
            <StatTile
              label="Aprovação da T.I"
              icon={<AlertOctagon className="w-5 h-5" />}
              iconClassName="bg-warning-50 text-warning-600"
              value={<span className="text-warning-600">Obrigatória</span>}
              subtext="Exige esteira com Reunião de Entendimento (E1) e homologação."
            />

            {/* Security Audit */}
            <StatTile
              label="Revisão de Segurança"
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconClassName="bg-brand-lighter text-brand-dark"
              value={<span className="text-brand-dark">Necessária</span>}
              subtext="Controle de acessos, segregação de credenciais e proteção LGPD."
            />
          </div>

          {/* Detailed Dimensions Breakdown */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-grey-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-dark" />
              <span>Detalhamento por Dimensão de Risco (Matriz Shadow IT)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Segurança */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-grey-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-grey-500" />
                    <span>Segurança da Informação</span>
                  </span>
                  <Badge className="bg-grey-100 text-grey-900 border-transparent font-mono">
                    {project.dimensionsInitial.seguranca} pts
                  </Badge>
                </div>
                <ProgressBar
                  value={Math.min(100, (project.dimensionsInitial.seguranca / 15) * 100)}
                  colorClassName="bg-red-500"
                />
                <div className="space-y-1.5 mt-2">{renderDimensionColumn('Segurança')}</div>
              </div>

              {/* LGPD */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-grey-700 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-grey-500" />
                    <span>Privacidade & LGPD</span>
                  </span>
                  <Badge className="bg-grey-100 text-grey-900 border-transparent font-mono">
                    {project.dimensionsInitial.lgpd} pts
                  </Badge>
                </div>
                <ProgressBar
                  value={Math.min(100, (project.dimensionsInitial.lgpd / 10) * 100)}
                  colorClassName="bg-warning-500"
                />
                <div className="space-y-1.5 mt-2">{renderDimensionColumn('LGPD')}</div>
              </div>

              {/* Operacional */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-grey-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-grey-500" />
                    <span>Continuidade & Operação</span>
                  </span>
                  <Badge className="bg-grey-100 text-grey-900 border-transparent font-mono">
                    {project.dimensionsInitial.operacional} pts
                  </Badge>
                </div>
                <ProgressBar
                  value={Math.min(100, (project.dimensionsInitial.operacional / 10) * 100)}
                  colorClassName="bg-info-500"
                />
                <div className="space-y-1.5 mt-2">{renderDimensionColumn('Operacional')}</div>
              </div>
            </div>
          </Card>

          {/* Criteria Evaluation Table */}
          <div className="bg-white border border-grey-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-grey-200 bg-grey-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-grey-700">
                  Critérios Determinísticos Pontuados ({project.criteria.length} regras)
                </h3>
                {canEditCriteria && (
                  <p className="text-[11px] text-grey-500 mt-0.5">
                    Adicionar, editar ou excluir um critério recalcula automaticamente a pontuação e o risco inicial do projeto.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {canEditCriteria && (
                  <Button size="sm" color="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleOpenAddModal}>
                    Adicionar Critério
                  </Button>
                )}
                <button
                  onClick={onNavigateToActionPlan}
                  className="text-xs text-brand-dark font-bold hover:underline whitespace-nowrap"
                >
                  Ver Plano de Ação & Mitigações →
                </button>
              </div>
            </div>
            <Table>
              <Thead>
                <Tr>
                  <Th className="min-w-45">Critério Avaliado</Th>
                  <Th className="min-w-27.5">Dimensão</Th>
                  <Th className="min-w-55">Evidência / Justificativa</Th>
                  <Th className="text-right min-w-22.5">Pontos</Th>
                  {canEditCriteria && <Th className="text-right min-w-20">Ações</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {project.criteria.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-semibold text-grey-800">{c.criterion}</Td>
                    <Td>
                      <Badge
                        className={`border-transparent text-[11px] ${
                          c.dimension === 'Segurança'
                            ? 'bg-red-50 text-red-700'
                            : c.dimension === 'LGPD'
                            ? 'bg-warning-50 text-warning-600'
                            : 'bg-info-50 text-info-700'
                        }`}
                      >
                        {c.dimension}
                      </Badge>
                    </Td>
                    <Td>{c.evidence}</Td>
                    <Td className="text-right font-mono font-bold text-grey-900">+{c.points}</Td>
                    {canEditCriteria && (
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="text-grey-400 hover:text-brand-dark"
                            title="Editar critério"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCriterionId(c.id)}
                            className="text-grey-400 hover:text-danger-800"
                            title="Excluir critério"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>

      {/* Modal: Adicionar Critério */}
      {isAddModalOpen && (
        <Modal
          isOpen
          onClose={() => setIsAddModalOpen(false)}
          title="Adicionar Critério de Risco"
          subtitle="A pontuação e o risco inicial do projeto são recalculados automaticamente."
        >
          <form onSubmit={handleSaveAdd} className="space-y-3.5">
            <Field label="Critério Avaliado:">
              <Input
                type="text"
                required
                placeholder="Ex: Utiliza dados pessoais (LGPD)"
                value={formCriterion}
                onChange={(e) => setFormCriterion(e.target.value)}
              />
            </Field>

            <Field label="Evidência / Justificativa:">
              <Textarea
                rows={2}
                placeholder="Ex: Confirmado em reunião de entendimento..."
                value={formEvidence}
                onChange={(e) => setFormEvidence(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Dimensão:">
                <Select value={formDimension} onChange={(e) => setFormDimension(e.target.value as CriterionDimension)}>
                  <option value="Segurança">Segurança</option>
                  <option value="LGPD">LGPD</option>
                  <option value="Operacional">Operacional</option>
                </Select>
              </Field>

              <Field label="Pontos:">
                <Input
                  type="number"
                  min={0}
                  value={formPoints}
                  onChange={(e) => setFormPoints(Number(e.target.value))}
                  className="font-mono font-bold"
                />
              </Field>
            </div>

            <ModalFooter>
              <Button type="button" color="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Adicionar Critério
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Modal: Editar Critério */}
      {editingCriterion && (
        <Modal
          isOpen
          onClose={() => setEditingCriterion(null)}
          title="Editar Critério de Risco"
          subtitle="A pontuação e o risco inicial do projeto são recalculados automaticamente."
        >
          <form onSubmit={handleSaveEdit} className="space-y-3.5">
            <Field label="Critério Avaliado:">
              <Input type="text" required value={formCriterion} onChange={(e) => setFormCriterion(e.target.value)} />
            </Field>

            <Field label="Evidência / Justificativa:">
              <Textarea rows={2} value={formEvidence} onChange={(e) => setFormEvidence(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Dimensão:">
                <Select value={formDimension} onChange={(e) => setFormDimension(e.target.value as CriterionDimension)}>
                  <option value="Segurança">Segurança</option>
                  <option value="LGPD">LGPD</option>
                  <option value="Operacional">Operacional</option>
                </Select>
              </Field>

              <Field label="Pontos:">
                <Input
                  type="number"
                  min={0}
                  value={formPoints}
                  onChange={(e) => setFormPoints(Number(e.target.value))}
                  className="font-mono font-bold"
                />
              </Field>
            </div>

            <ModalFooter>
              <Button type="button" color="secondary" onClick={() => setEditingCriterion(null)}>
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
      {deletingCriterionId !== null && (
        <Modal
          isOpen
          size="sm"
          onClose={() => setDeletingCriterionId(null)}
          title="Excluir Critério?"
        >
          <p className="text-xs text-grey-600">
            Tem certeza que deseja excluir este critério? A pontuação e o risco inicial do projeto serão
            recalculados automaticamente.
          </p>
          <ModalFooter>
            <Button color="secondary" size="sm" onClick={() => setDeletingCriterionId(null)}>
              Cancelar
            </Button>
            <Button color="danger" size="sm" onClick={handleConfirmDelete}>
              Sim, Excluir
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
