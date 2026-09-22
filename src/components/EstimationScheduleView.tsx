import React, { useMemo, useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Users,
  Info,
  Layers,
  ShieldCheck,
  Workflow,
  Copy,
  Check,
  FileText,
  History,
  AlertOctagon
} from 'lucide-react';
import {
  DiscountToggle,
  GovStage,
  ModuleToggle,
  ProjectType,
  GenerationTool,
  SolutionProject,
  ProjectActivityLog,
  UserRole
} from '../types';
import { can } from '../utils/permissions';
import {
  CRITICAL_FINDINGS_CHECKLIST,
  DISCOUNTS_CATALOG,
  EXIT_CRITERIA_CHECKLIST,
  GOV_STAGES_CATALOG,
  MEETINGS_CHECKLIST,
  MODULES_CATALOG,
  PROJECT_TYPE_INFO,
  STAGE_DESCRIPTIONS,
  STAGE_NAMES
} from '../data/estimationCatalog';
import {
  computeEstimation,
  formatPtBrDate,
  getDefaultEstimationInputs
} from '../utils/estimation';
import { getActiveConfig } from '../config/governanceConfig';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Field, Input, Select, Textarea } from './ui/FormField';
import { PageHeader } from './ui/PageHeader';
import { Modal, ModalFooter } from './ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from './ui/Table';
import { StatTile } from './ui/StatTile';
import { ChecklistItem } from './ui/ChecklistItem';
import { SelectableCard } from './ui/SelectableCard';

interface EstimationScheduleViewProps {
  project: SolutionProject;
  userRole: UserRole;
  onUpdateProject: (updated: SolutionProject) => void;
  onNavigateToGlpi?: () => void;
}

export const EstimationScheduleView: React.FC<EstimationScheduleViewProps> = ({
  project,
  userRole,
  onUpdateProject,
  onNavigateToGlpi
}) => {
  const { generationTools: generationToolOptions } = getActiveConfig().auxiliaryLists;
  const canEditEstimation = can(userRole, 'edit_estimation');
  const canAdvanceStage = can(userRole, 'advance_stage');

  // Modal states
  const [isGlpiModalOpen, setIsGlpiModalOpen] = useState(false);
  const [copiedGlpiNote, setCopiedGlpiNote] = useState(false);
  const [pendingStageModal, setPendingStageModal] = useState<{
    targetStage: GovStage;
    missingCriteria: string[];
  } | null>(null);
  const [stageJustification, setStageJustification] = useState('');

  // Garantir que o projeto tenha estrutura de estimationInputs e govStage
  const currentInputs = useMemo(() => {
    if (project.estimation) {
      return project.estimation;
    }
    return getDefaultEstimationInputs(
      project.projectType || 'A',
      project.createdAt ? project.createdAt.split(' ')[0] : undefined
    );
  }, [project.estimation, project.projectType, project.createdAt]);

  const currentGovStage: GovStage = project.govStage || 'E1';
  const currentProjectType: ProjectType = currentInputs.projectType || project.projectType || 'A';
  const currentGenerationTool: GenerationTool =
    currentInputs.generationTool || project.generationTool || 'Claude Code';

  // Checklists de saída marcados no projeto
  const exitCriteriaChecked = project.exitCriteriaChecked || {
    C1: false,
    C2: false,
    C3: false,
    C4: false
  };

  // Executar motor de cálculo
  const estimationResult = useMemo(() => {
    return computeEstimation(currentInputs);
  }, [currentInputs]);

  // Atualizador de inputs
  const handleUpdateInputs = (newInputs: typeof currentInputs) => {
    if (!canEditEstimation) return;
    const updatedProject: SolutionProject = {
      ...project,
      projectType: newInputs.projectType,
      generationTool: newInputs.generationTool,
      estimation: newInputs
    };
    onUpdateProject(updatedProject);
  };

  const handleToggleExitCriteria = (critId: string) => {
    if (!canAdvanceStage) return;
    const nextChecked = {
      ...exitCriteriaChecked,
      [critId]: !exitCriteriaChecked[critId]
    };
    const updatedProject: SolutionProject = {
      ...project,
      exitCriteriaChecked: nextChecked
    };
    onUpdateProject(updatedProject);
  };

  const handleRequestStageChange = (newStage: GovStage) => {
    if (!canAdvanceStage || newStage === currentGovStage) return;

    // Se estiver avançando para E6 ou Concluído, validar os 4 critérios de saída
    const isAdvancingToCompletion = newStage === 'E6' || newStage === 'Concluído';
    if (isAdvancingToCompletion) {
      const missing = EXIT_CRITERIA_CHECKLIST.filter((c) => !exitCriteriaChecked[c.id]).map(
        (c) => `${c.id}: ${c.title}`
      );

      if (missing.length > 0) {
        setPendingStageModal({
          targetStage: newStage,
          missingCriteria: missing
        });
        setStageJustification('');
        return;
      }
    }

    applyStageTransition(newStage);
  };

  const applyStageTransition = (newStage: GovStage, justification?: string) => {
    const nowStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const logEntry: ProjectActivityLog = {
      id: 'log-' + Date.now(),
      date: nowStr,
      timestamp: nowStr,
      author: project.technicalResponsible || 'T.I Governança',
      registeredBy: project.technicalResponsible || 'T.I Governança',
      action: `Avanço de etapa da esteira: ${STAGE_NAMES[currentGovStage]} → ${STAGE_NAMES[newStage]}`,
      description: `Avanço de etapa da esteira: ${STAGE_NAMES[currentGovStage]} → ${STAGE_NAMES[newStage]}`,
      details: justification ? `Justificativa informada: ${justification}` : `Transição direta de etapa para ${STAGE_NAMES[newStage]}`,
      stage: newStage,
      hours: 0.5
    };

    const updatedProject: SolutionProject = {
      ...project,
      govStage: newStage,
      activityLog: [logEntry, ...(project.activityLog || [])]
    };

    onUpdateProject(updatedProject);
    setPendingStageModal(null);
  };

  const handleToggleModule = (moduleId: string) => {
    const updatedModules: ModuleToggle[] = currentInputs.modules.map((m) =>
      m.id === moduleId ? { ...m, applied: !m.applied } : m
    );
    handleUpdateInputs({
      ...currentInputs,
      modules: updatedModules
    });
  };

  const handleToggleDiscount = (discountId: string, field: 'declared' | 'confirmed') => {
    const updatedDiscounts: DiscountToggle[] = currentInputs.discounts.map((d) => {
      if (d.id === discountId) {
        const nextVal = !d[field];
        return {
          ...d,
          [field]: nextVal,
          // Se desmarcar declarado, desmarca confirmado automaticamente
          ...(field === 'declared' && !nextVal ? { confirmed: false } : {})
        };
      }
      return d;
    });
    handleUpdateInputs({
      ...currentInputs,
      discounts: updatedDiscounts
    });
  };

  const handleTypeChange = (newType: ProjectType) => {
    handleUpdateInputs({
      ...currentInputs,
      projectType: newType
    });
  };

  const handleToolChange = (newTool: GenerationTool) => {
    handleUpdateInputs({
      ...currentInputs,
      generationTool: newTool
    });
  };

  const handleStartDateChange = (newDate: string) => {
    handleUpdateInputs({
      ...currentInputs,
      startDate: newDate
    });
  };

  // Gerar texto formatado do apontamento da esteira para colar no chamado GLPI
  const generateGlpiNoteText = () => {
    const optDate = formatPtBrDate(estimationResult.optimistic.deliveryDate);
    const realDate = formatPtBrDate(estimationResult.realistic.deliveryDate);
    const stageName = STAGE_NAMES[currentGovStage] || currentGovStage;

    let text = `=======================================================\n`;
    text += `[ATTO T.I - GOVERNANÇA DE SOLUÇÕES & ATIVOS]\n`;
    text += `Apontamento da Esteira de Governança para Chamado GLPI\n`;
    text += `=======================================================\n\n`;
    text += `DADOS DA SOLUÇÃO:\n`;
    text += `• Solução: ${project.name}\n`;
    text += `• Identificador do Ativo: ${project.assetId}\n`;
    text += `• Chamado GLPI de Origem: ${project.glpiTicketId}\n`;
    text += `• Área Responsável: ${project.department}\n`;
    text += `• Dono de Negócio: ${project.businessResponsible}\n`;
    text += `• Responsável Técnico: ${project.technicalResponsible}\n\n`;

    text += `ESTEIRA & TIPO TÉCNICO (EIXO 2):\n`;
    text += `• Tipo Técnico: Tipo ${currentProjectType} (${PROJECT_TYPE_INFO[currentProjectType].label})\n`;
    text += `• Ferramenta / Metodologia: ${currentGenerationTool}\n`;
    text += `• Etapa Atual: ${currentGovStage} - ${stageName}\n`;
    text += `• Status Geral: ${project.status || 'Em Adequação'}\n\n`;

    text += `ESTIMATIVA & JANELA DE HOMOLOGAÇÃO:\n`;
    text += `• Início da Contagem: ${formatPtBrDate(currentInputs.startDate)}\n`;
    text += `• Janela Homologada: [${optDate} → ${realDate}]\n`;
    text += `• Esforço Total Previsto da T.I: ${estimationResult.effortTotalHours.toFixed(1)} horas\n`;
    text += `• Reuniões Previstas: ${estimationResult.meetingsCount} encontros\n`;
    text += `• Dependências Externas: ${estimationResult.externalDepsCount} integrações/deps\n\n`;

    text += `CRITÉRIOS DE SAÍDA (GATE DE GOVERNANÇA):\n`;
    EXIT_CRITERIA_CHECKLIST.forEach((c) => {
      const isChecked = !!exitCriteriaChecked[c.id];
      text += `[${isChecked ? 'X' : ' '}] ${c.id}: ${c.title} (${isChecked ? 'ATENDIDO' : 'PENDENTE'})\n`;
    });

    if (project.scheduledDate) {
      text += `\nPRÓXIMO AGENDAMENTO:\n`;
      text += `• Data: ${project.scheduledDate}\n`;
      text += `• Pauta: ${project.scheduledSubject || 'Alinhamento de esteira'}\n`;
    }

    if (project.hasImpediment) {
      text += `\n🚨 IMPEDIMENTO REGISTRADO:\n`;
      text += `• Detalhe: ${project.impedimentDetails || 'Impedimento ativo'}\n`;
      if (project.actionRequiredFromManagement) {
        text += `• Ação Requerida da Gestão: ${project.actionRequiredFromManagement}\n`;
      }
    }

    text += `\n-------------------------------------------------------\n`;
    text += `Gerado automaticamente via Central de Governança ATTO\n`;
    text += `Data do Apontamento: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;

    return text;
  };

  const handleCopyGlpiNote = () => {
    const text = generateGlpiNoteText();
    navigator.clipboard.writeText(text);
    setCopiedGlpiNote(true);
    setTimeout(() => setCopiedGlpiNote(false), 2500);
  };

  const isEarlyStage = currentGovStage === 'E0' || currentGovStage === 'E1';

  return (
    <div id="estimation-schedule-view" className="space-y-6">
      {/* Header & Subtitle */}
      <Card>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge className="uppercase bg-brand-lighter text-brand-dark border-brand-light">
            Eixo 2 — Tipo Técnico & Cronograma
          </Badge>
          <Badge className="font-mono bg-grey-100 text-grey-700 border-grey-300">
            {project.assetId}
          </Badge>
          <span className="text-xs text-grey-500 font-medium">
            Chamado: <strong>{project.glpiTicketId}</strong>
          </span>
        </div>

        <PageHeader
          title="Estimativa de Esforço, Prazo & Esteira de Governança"
          subtitle="Modelo oficial de esteira da T.I para soluções departamentais e vibe coding. O tempo de entrega é dominado pelo overhead de agenda e dependências externas, e não apenas pelo tempo de código ativo."
          actions={
            <>
              <Button
                color="primary"
                size="sm"
                leftIcon={<FileText className="w-4 h-4" />}
                onClick={() => setIsGlpiModalOpen(true)}
                title="Gerar texto estruturado do apontamento da esteira para colar no chamado GLPI"
              >
                Gerar Apontamento GLPI
              </Button>

              <div className="bg-grey-50 p-2 rounded-lg border border-grey-200 text-right">
                <div className="text-[10px] uppercase font-bold text-grey-500">Etapa Atual da Esteira</div>
                <div className="text-xs font-extrabold text-brand-dark flex items-center justify-end gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-brand-main animate-pulse"></span>
                  <span>{STAGE_NAMES[currentGovStage] || currentGovStage}</span>
                </div>
              </div>
            </>
          }
        />
      </Card>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-warning-50 border border-warning-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-warning-600 shadow-xs">
        <Info className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <span className="font-bold text-warning-600">Princípio de Governança: </span>
          Estimativa a partir do cadastro; confirmar na reunião de diagnóstico e entendimento. O cadastro inicial é uma declaração do usuário mantenedor, não um fato consumado.
          {currentGovStage === 'E0' && (
            <span className="block mt-1 font-semibold text-warning-600 bg-warning-50/80 px-2 py-0.5 rounded border border-warning-200/80 w-fit">
              ⚠️ Projeto em Cadastro Inicial — Caixas de "Confirmado" ficam desabilitadas até a Reunião de Diagnóstico.
            </span>
          )}
        </div>
      </div>

      {/* Main KPI Results Panel (Janela de Entrega em Destaque) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Janela de Entrega */}
        <StatTile
          variant="dark"
          className="md:col-span-2"
          label="Janela de Entrega Homologada"
          icon={<Calendar className="w-4 h-4" />}
          iconClassName="bg-white/10 text-brand-light"
          value={
            <span className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                {formatPtBrDate(estimationResult.optimistic.deliveryDate)}
              </span>
              <span className="text-brand-light font-bold text-sm">à</span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-warning-200 font-mono">
                {formatPtBrDate(estimationResult.realistic.deliveryDate)}
              </span>
            </span>
          }
          subtext={
            <div className="space-y-2">
              <div className="text-[10px] text-grey-400 font-mono">
                Início: {formatPtBrDate(currentInputs.startDate)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-grey-700/80 text-[11px]">
                <div>
                  <span className="text-brand-light font-semibold">Cenário Otimista:</span>{' '}
                  <span className="text-grey-300">
                    {estimationResult.optimistic.totalDays} dias úteis ({estimationResult.optimistic.activeDays}d ativos + {estimationResult.optimistic.agendaDays}d agenda)
                  </span>
                </div>
                <div>
                  <span className="text-warning-200 font-semibold">Cenário Realista:</span>{' '}
                  <span className="text-grey-300">
                    {estimationResult.realistic.totalDays} dias úteis ({estimationResult.realistic.activeDays}d ativos + {estimationResult.realistic.agendaDays}d agenda)
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-grey-500 italic pt-1">
                * Sempre apresentada como janela prospectiva; nunca como data seca.
              </p>
            </div>
          }
        />

        {/* KPI 2: Esforço de T.I */}
        <StatTile
          label="Esforço Total T.I"
          icon={<Clock className="w-4 h-4" />}
          iconClassName="bg-brand-lighter text-brand-main"
          value={
            <span className="flex items-baseline gap-2">
              <span>{estimationResult.effortTotalHours.toFixed(1)}h</span>
              <span className="text-xs text-grey-500 font-medium">confirmadas</span>
            </span>
          }
          subtext={
            <div className="space-y-1 pt-1.5 mt-1 border-t border-grey-100">
              <div className="flex justify-between">
                <span>Base {currentProjectType === 'A' ? 'Workspace' : currentProjectType === 'B' ? 'Container/VPS' : 'No-Code'}:</span>
                <span className="font-mono font-bold">{estimationResult.effortBaseHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-info-700">
                <span>Módulos extras:</span>
                <span className="font-mono font-bold">+{estimationResult.effortModulesHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-brand-dark font-semibold">
                <span>Descontos E1:</span>
                <span className="font-mono font-bold">-{estimationResult.effortDiscountHours.toFixed(1)}h</span>
              </div>
            </div>
          }
        />

        {/* KPI 3: Reuniões & Dependências */}
        <StatTile
          label="Interações & Bloqueios"
          icon={<Users className="w-4 h-4" />}
          iconClassName="bg-info-50 text-info-600"
          value={
            <span className="flex items-baseline gap-2">
              <span>{estimationResult.meetingsCount}</span>
              <span className="text-xs text-grey-500 font-medium">reuniões</span>
            </span>
          }
          subtext={
            <div className="space-y-1 pt-1.5 mt-1 border-t border-grey-100">
              <div className="flex justify-between">
                <span>Dependências Externas:</span>
                <span className="font-mono font-bold text-warning-600 bg-warning-50 px-1.5 rounded">
                  {estimationResult.externalDepsCount} pontos
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overhead de Espera:</span>
                <span className="font-mono font-bold text-grey-800">
                  +{estimationResult.realistic.agendaDays} dias úteis
                </span>
              </div>
            </div>
          }
        />
      </div>

      {/* Seção 1: Configuração do Eixo 2 (Tipo Técnico & Parâmetros) */}
      <Card className="space-y-5">
        <div className="border-b border-grey-100 pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-grey-800 flex items-center gap-2">
            <Workflow className="w-4 h-4 text-brand-dark" />
            <span>Arquitetura da Solução & Stack Técnica</span>
          </h2>
          <p className="text-xs text-grey-500 mt-0.5">
            Selecione a arquitetura técnica da solução. Cada stack possui esforço base, lista de reuniões e critérios de teste específicos.
          </p>
        </div>

        {/* Cards de Seleção de Tipo Técnico (A / B / C) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['A', 'B', 'C'] as ProjectType[]).map((typeKey) => {
            const isSelected = currentProjectType === typeKey;
            const info = PROJECT_TYPE_INFO[typeKey];

            return (
              <SelectableCard
                key={typeKey}
                selected={isSelected}
                onClick={() => handleTypeChange(typeKey)}
                disabled={!canEditEstimation}
                className="flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      className={`uppercase ${
                        isSelected
                          ? 'bg-brand-main text-white border-brand-main'
                          : 'bg-grey-100 text-grey-700 border-grey-200'
                      }`}
                    >
                      {typeKey === 'A' ? 'Workspace' : typeKey === 'B' ? 'Container / VPS' : 'No-Code'}
                    </Badge>
                    {isSelected && (
                      <span className="text-brand-dark flex items-center gap-1 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Selecionado
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-grey-900 leading-tight">
                    {info.label}
                  </h3>
                  <p className="text-[11px] text-grey-500 mt-1 leading-relaxed">
                    {info.shortDesc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-grey-200/80 text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between text-grey-700">
                    <span>Stack Sugerida:</span>
                    <strong className="text-brand-dark text-[10px] truncate max-w-[170px]" title={info.technologyHint}>
                      {info.technologyHint}
                    </strong>
                  </div>
                  {info.statusBadge && (
                    <div className="flex justify-between text-grey-700">
                      <span>Calibração:</span>
                      <strong className="text-warning-600 text-[10px]">{info.statusBadge}</strong>
                    </div>
                  )}
                </div>
              </SelectableCard>
            );
          })}
        </div>

        {/* Inputs de Data de Início e Ferramenta de Geração */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <Field label="Data de Início da Contagem:">
            <Input
              type="date"
              value={currentInputs.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="text-xs font-mono font-bold text-grey-800"
              disabled={!canEditEstimation}
            />
          </Field>

          <Field label="Ferramenta de Vibe Coding / Geração:">
            <Select
              value={currentGenerationTool}
              onChange={(e) => handleToolChange(e.target.value as GenerationTool)}
              className="text-xs font-bold text-grey-800"
              disabled={!canEditEstimation}
            >
              {generationToolOptions.map((tool) => (
                <option key={tool} value={tool}>
                  {tool}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Responsável Técnico da T.I:">
            <Input
              type="text"
              readOnly
              value={project.technicalResponsible}
              className="text-xs text-grey-600 bg-grey-50 font-medium cursor-not-allowed"
            />
          </Field>
        </div>
      </Card>

      {/* Seção 2: Esteira de Governança com Stepper Interativo */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-grey-100 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-grey-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-dark" />
              <span>Esteira Oficial de Governança de Soluções</span>
            </h2>
            <p className="text-xs text-grey-500 mt-0.5">
              Clique na etapa correspondente para avançar o projeto na esteira. Ao avançar para a homologação final, os critérios de saída são validados.
            </p>
          </div>
          <Badge className="bg-brand-lighter text-brand-dark border-brand-light font-semibold self-start sm:self-auto">
            Etapa Atual: {STAGE_NAMES[currentGovStage] || currentGovStage}
          </Badge>
        </div>

        {/* Stepper visual com nomes claros das etapas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 mb-5">
          {GOV_STAGES_CATALOG.map((stageKey, idx) => {
            const isCurrent = currentGovStage === stageKey;
            const currentIndex = GOV_STAGES_CATALOG.indexOf(currentGovStage);
            const isPassed = idx < currentIndex;

            return (
              <button
                key={stageKey}
                type="button"
                onClick={() => handleRequestStageChange(stageKey)}
                disabled={!canAdvanceStage}
                className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between min-h-[72px] ${
                  !canAdvanceStage ? 'cursor-default opacity-90' : ''
                } ${
                  isCurrent
                    ? 'border-brand-main bg-brand-main text-white shadow-md ring-2 ring-brand-main/30'
                    : isPassed
                    ? 'border-brand-light bg-brand-lighter/70 text-brand-dark hover:bg-brand-lighter'
                    : 'border-grey-200 bg-white text-grey-700 hover:bg-grey-50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span className={isCurrent ? 'text-brand-light' : isPassed ? 'text-brand-main' : 'text-grey-400'}>
                    Etapa {idx + 1}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-main shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                  ) : null}
                </div>
                <div className={`text-xs font-bold leading-tight ${isCurrent ? 'text-white' : 'text-grey-900'}`}>
                  {STAGE_NAMES[stageKey]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Informações da Etapa Selecionada */}
        <div className="bg-grey-50 p-3.5 rounded-lg border border-grey-200 text-xs text-grey-700 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-extrabold text-grey-900">Objetivo de {STAGE_NAMES[currentGovStage]}: </span>
            <span>{STAGE_DESCRIPTIONS[currentGovStage] || 'Esteira finalizada e ativo homologado em produção.'}</span>
          </div>
          {currentGovStage === 'E1' && (
            <Badge className="bg-info-50 text-info-700 border-info-200 shrink-0">
              Nesta etapa: validar e marcar "Confirmado" nos itens atendidos
            </Badge>
          )}
        </div>

        {/* Critério de Saída Obrigatório (Checklist de 4 itens Interativo) */}
        <div className="bg-brand-dark text-white rounded-lg p-4 border border-brand-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-light flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-light" />
              <span>Critérios de Saída da Governança (Gate para Conclusão)</span>
            </h3>
            <span className="text-[11px] text-brand-light font-medium hidden sm:inline">
              O objetivo não é resolver tudo: é resolver o crítico e tirar do risco de pessoa única.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {EXIT_CRITERIA_CHECKLIST.map((crit) => {
              const isChecked = !!exitCriteriaChecked[crit.id];

              return (
                <div
                  key={crit.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isChecked
                      ? 'bg-brand-dark/90 border-brand-main shadow-xs'
                      : 'bg-brand-dark/40 border-brand-dark/80'
                  }`}
                >
                  <ChecklistItem
                    checked={isChecked}
                    onToggle={() => handleToggleExitCriteria(crit.id)}
                    disabled={!canAdvanceStage}
                    trailing={
                      isChecked && (
                        <span className="text-[10px] font-mono text-brand-light font-bold shrink-0">✓ Atendido</span>
                      )
                    }
                  >
                    <div className="text-xs font-bold text-white">{crit.title}</div>
                    <div className="text-[11px] text-brand-light leading-snug mt-0.5">
                      {crit.description}
                    </div>
                  </ChecklistItem>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Seções de Módulos Adicionais e Descontos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Módulos Adicionais (Somam horas, reuniões e deps) */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-grey-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-info-700" />
                <span>Módulos Adicionais de Complexidade</span>
              </h2>
              <Badge className="font-mono bg-info-50 text-info-700 border-info-200">
                +{estimationResult.effortModulesHours.toFixed(2)}h
              </Badge>
            </div>
            <p className="text-xs text-grey-500 mb-4">
              Selecione os módulos extras caso a solução necessite de integrações com ERP, infraestrutura específica ou ambientes de dev.
            </p>

            <div className="space-y-2.5">
              {MODULES_CATALOG.map((mod) => {
                const isApplied = currentInputs.modules.some((m) => m.id === mod.id && m.applied);

                return (
                  <div
                    key={mod.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isApplied
                        ? 'border-info-500 bg-info-50/60 shadow-xs'
                        : 'border-grey-200 hover:bg-grey-50/60'
                    }`}
                  >
                    <ChecklistItem
                      checked={isApplied}
                      onToggle={() => handleToggleModule(mod.id)}
                      disabled={!canEditEstimation}
                      trailing={
                        <span className="text-xs font-mono font-bold text-info-700 shrink-0 bg-white px-1.5 py-0.5 rounded border border-info-200">
                          +{mod.hours}h ({STAGE_NAMES[mod.stageId] || mod.stageId})
                        </span>
                      }
                    >
                      <span className="text-xs font-bold text-grey-900">{mod.label}</span>
                      <p className="text-[11px] text-grey-500 mt-0.5">
                        {mod.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-grey-400">
                        {mod.meetings > 0 && <span>+{mod.meetings} reunião</span>}
                        {mod.externalDeps > 0 && <span>+{mod.externalDeps} dependência externa</span>}
                      </div>
                    </ChecklistItem>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Bloco 2: Itens Já Atendidos (Declarado vs Confirmado) */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-grey-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-dark" />
                <span>Itens Já Atendidos (Descontos de Esforço)</span>
              </h2>
              <Badge className="font-mono bg-brand-lighter text-brand-dark border-brand-light">
                -{estimationResult.effortDiscountHours.toFixed(1)}h abatidas
              </Badge>
            </div>
            <p className="text-xs text-grey-500 mb-4">
              <strong>Regra de Ouro:</strong> Declarado no cadastro não reduz esforço. O desconto de horas só é computado quando a T.I <strong>confirmar na E1</strong>.
            </p>

            <div className="space-y-3">
              {DISCOUNTS_CATALOG.map((disc) => {
                const itemState = currentInputs.discounts.find((d) => d.id === disc.id) || {
                  id: disc.id,
                  label: disc.label,
                  declared: false,
                  confirmed: false
                };

                // Regra de bloqueio do interruptor Confirmado: só habilita quando govStage >= E1
                const canConfirm = itemState.declared && currentGovStage !== 'E0';
                const confirmTitle =
                  currentGovStage === 'E0'
                    ? 'Confirmação habilitada a partir da Reunião de Entendimento (E1)'
                    : !itemState.declared
                    ? 'Declare primeiro antes de confirmar'
                    : undefined;

                return (
                  <div
                    key={disc.id}
                    className={`p-3 rounded-lg border transition-all ${
                      itemState.confirmed
                        ? 'border-brand-main bg-brand-lighter/50 shadow-xs'
                        : itemState.declared
                        ? 'border-warning-200 bg-warning-50/40'
                        : 'border-grey-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-grey-900">{disc.label}</div>
                        <p className="text-[11px] text-grey-500 mt-0.5">{disc.description}</p>
                        <span className="text-[10px] text-grey-500 font-medium">
                          Impacto: -{disc.hours}h em {STAGE_NAMES[disc.stageId] || disc.stageId}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-grey-100 flex items-center justify-between gap-4 flex-wrap">
                      {/* Checkbox 1: Declarado */}
                      <ChecklistItem
                        checked={itemState.declared}
                        onToggle={() => handleToggleDiscount(disc.id, 'declared')}
                        disabled={!canEditEstimation}
                      >
                        <span className="text-xs text-grey-700 font-medium">Declarado no Cadastro</span>
                      </ChecklistItem>

                      {/* Checkbox 2: Confirmado na Reunião de Diagnóstico */}
                      <div title={confirmTitle}>
                        <ChecklistItem
                          checked={itemState.confirmed}
                          disabled={!canEditEstimation || !canConfirm}
                          onToggle={() => handleToggleDiscount(disc.id, 'confirmed')}
                        >
                          <span className={`text-xs font-bold ${canConfirm ? 'text-brand-dark' : 'text-grey-400'}`}>
                            Confirmado na Reunião T.I
                          </span>
                        </ChecklistItem>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Seção 3: Cronograma Detalhado & Breakdown de Etapas */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-grey-100 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-grey-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-dark" />
              <span>Cronograma Realista por Etapa da Esteira</span>
            </h2>
            <p className="text-xs text-grey-500 mt-0.5">
              Detalhamento de dias úteis ativos (código e testes) e dias de espera de agenda e terceiros.
            </p>
          </div>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th className="min-w-[220px]">Etapa</Th>
              <Th className="text-right">Horas Base</Th>
              <Th className="text-right">Módulos</Th>
              <Th className="text-right">Descontos</Th>
              <Th className="text-right">Horas Total</Th>
              <Th className="text-center">Interações</Th>
              <Th className="text-center">Dias Ativos</Th>
              <Th className="text-center">Dias Agenda</Th>
              <Th className="text-center">Início Previsto</Th>
              <Th className="text-center">Fim Previsto</Th>
            </Tr>
          </Thead>
          <Tbody>
            {estimationResult.stages.map((stg) => {
              const isCurrentStage = currentGovStage === stg.stageId;

              return (
                <Tr
                  key={stg.stageId}
                  className={isCurrentStage ? 'bg-brand-lighter/50 font-bold' : ''}
                >
                  <Td className="flex items-center gap-2">
                    <span className="font-semibold text-grey-900 whitespace-nowrap">{stg.stageName}</span>
                  </Td>
                  <Td className="text-right font-mono">{stg.baseHours}h</Td>
                  <Td className="text-right font-mono text-info-700">
                    {stg.modulesHours > 0 ? `+${stg.modulesHours}h` : '—'}
                  </Td>
                  <Td className="text-right font-mono text-brand-dark">
                    {stg.discountHours > 0 ? `-${stg.discountHours}h` : '—'}
                  </Td>
                  <Td className="text-right font-mono font-bold text-grey-900">
                    {stg.totalHours}h
                  </Td>
                  <Td className="text-center text-grey-600 font-mono">
                    {stg.meetingsCount} reun / {stg.externalDepsCount} deps
                  </Td>
                  <Td className="text-center font-mono font-bold text-grey-800">
                    {stg.workDays}d
                  </Td>
                  <Td className="text-center font-mono text-warning-600">
                    +{stg.waitDays}d
                  </Td>
                  <Td className="text-center font-mono text-grey-600">
                    {formatPtBrDate(stg.startDate)}
                  </Td>
                  <Td className="text-center font-mono font-bold text-brand-dark">
                    {formatPtBrDate(stg.endDate)}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
          <tfoot>
            <tr className="bg-grey-50 border-t-2 border-grey-200 font-bold text-grey-900">
              <td className="px-3 py-2.5">Totais Consolidados</td>
              <td className="px-3 py-2.5 text-right font-mono">{estimationResult.effortBaseHours.toFixed(1)}h</td>
              <td className="px-3 py-2.5 text-right font-mono text-info-700">+{estimationResult.effortModulesHours.toFixed(1)}h</td>
              <td className="px-3 py-2.5 text-right font-mono text-brand-dark">-{estimationResult.effortDiscountHours.toFixed(1)}h</td>
              <td className="px-3 py-2.5 text-right font-mono text-brand-dark text-sm">
                {estimationResult.effortTotalHours.toFixed(1)}h
              </td>
              <td className="px-3 py-2.5 text-center font-mono">
                {estimationResult.meetingsCount} reun / {estimationResult.externalDepsCount} deps
              </td>
              <td className="px-3 py-2.5 text-center font-mono">{estimationResult.realistic.activeDays}d</td>
              <td className="px-3 py-2.5 text-center font-mono text-warning-600">+{estimationResult.realistic.agendaDays}d</td>
              <td className="px-3 py-2.5 text-center font-mono">{formatPtBrDate(currentInputs.startDate)}</td>
              <td className="px-3 py-2.5 text-center font-mono text-brand-dark text-sm">
                {formatPtBrDate(estimationResult.realistic.deliveryDate)}
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>

      {/* Histórico e Registro de Atividades da Solução */}
      {project.activityLog && project.activityLog.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2 border-b border-grey-100 pb-2">
            <History className="w-4 h-4 text-grey-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-grey-800">
              Histórico & Auditoria da Esteira ({project.activityLog.length} registros)
            </h3>
          </div>
          <div className="space-y-2">
            {project.activityLog.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-grey-100 bg-grey-50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-grey-900">{log.action}</div>
                  {log.details && <div className="text-grey-600 text-[11px] mt-0.5">{log.details}</div>}
                </div>
                <div className="text-right text-[11px] text-grey-400 font-mono shrink-0">
                  <div>{log.timestamp}</div>
                  <div className="text-grey-500 font-semibold">{log.author}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL 1: Apontamento para GLPI */}
      <Modal
        isOpen={isGlpiModalOpen}
        onClose={() => setIsGlpiModalOpen(false)}
        title="Apontamento da Esteira para Chamado GLPI"
        subtitle="Copie o texto estruturado abaixo e cole diretamente no chamado correspondente no GLPI (ou envie por e-mail/Teams) para registrar a evolução da governança e as datas homologadas."
        size="lg"
      >
        <Textarea
          readOnly
          rows={12}
          value={generateGlpiNoteText()}
          className="font-mono bg-grey-50 text-grey-800"
        />

        <ModalFooter>
          <Button color="secondary" onClick={() => setIsGlpiModalOpen(false)}>
            Fechar
          </Button>
          <Button
            color="primary"
            leftIcon={copiedGlpiNote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            onClick={handleCopyGlpiNote}
          >
            {copiedGlpiNote ? 'Copiado com Sucesso!' : 'Copiar para Área de Transferência'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* MODAL 2: Justificativa de Avanço de Etapa com Critérios Faltantes */}
      {pendingStageModal && (
        <Modal
          isOpen
          onClose={() => setPendingStageModal(null)}
          title="Atenção: Critérios de Saída Incompletos"
          size="md"
        >
          <div className="flex items-center gap-2 text-warning-600 -mt-1">
            <AlertOctagon className="w-5 h-5" />
            <span className="text-xs font-semibold">
              Avançando para a etapa {STAGE_NAMES[pendingStageModal.targetStage]}
            </span>
          </div>

          <p className="text-xs text-grey-600">
            Você está avançando para a etapa <strong>{STAGE_NAMES[pendingStageModal.targetStage]}</strong>, mas os seguintes critérios de saída da governança ainda não foram validados:
          </p>

          <div className="p-3 bg-warning-50 rounded-lg border border-warning-200 space-y-1.5 text-xs text-warning-600 font-medium">
            {pendingStageModal.missingCriteria.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-warning-600 font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Field label="Justificativa para avanço extraordinário:">
            <Textarea
              rows={3}
              placeholder="Informe o motivo ou aprovação formal para avançar mesmo com critérios em aberto..."
              value={stageJustification}
              onChange={(e) => setStageJustification(e.target.value)}
              className="bg-grey-50 focus:bg-white"
            />
          </Field>

          <ModalFooter>
            <Button color="secondary" onClick={() => setPendingStageModal(null)}>
              Cancelar
            </Button>
            <Button
              color="danger"
              onClick={() => applyStageTransition(pendingStageModal.targetStage, stageJustification || 'Avanço autorizado com critérios parciais')}
            >
              Confirmar Avanço de Etapa
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
