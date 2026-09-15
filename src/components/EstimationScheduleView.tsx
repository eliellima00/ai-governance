import React, { useMemo, useState } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  ShieldCheck,
  Server,
  FileCode,
  Workflow,
  ArrowRight,
  HelpCircle,
  TrendingDown,
  Copy,
  Check,
  FileText,
  X,
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
  ProjectActivityLog
} from '../types';
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

interface EstimationScheduleViewProps {
  project: SolutionProject;
  onUpdateProject: (updated: SolutionProject) => void;
  onNavigateToGlpi?: () => void;
}

export const EstimationScheduleView: React.FC<EstimationScheduleViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToGlpi
}) => {
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
    const updatedProject: SolutionProject = {
      ...project,
      projectType: newInputs.projectType,
      generationTool: newInputs.generationTool,
      estimation: newInputs
    };
    onUpdateProject(updatedProject);
  };

  const handleToggleExitCriteria = (critId: string) => {
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
    if (newStage === currentGovStage) return;

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
      action: `Avanço de etapa da esteira: ${currentGovStage} → ${newStage}`,
      description: `Avanço de etapa da esteira: ${currentGovStage} → ${newStage}`,
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
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                Eixo 2 — Tipo Técnico & Cronograma
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                {project.assetId}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Chamado: <strong>{project.glpiTicketId}</strong>
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Estimativa de Esforço, Prazo & Esteira de Governança</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Modelo oficial de esteira da T.I para soluções departamentais e vibe coding. O tempo de entrega é dominado pelo <strong>overhead de agenda e dependências externas</strong>, e não apenas pelo tempo de código ativo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Botão de Apontamento GLPI */}
            <button
              onClick={() => setIsGlpiModalOpen(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-2xs flex items-center gap-1.5"
              title="Gerar texto estruturado do apontamento da esteira para colar no chamado GLPI"
            >
              <FileText className="w-4 h-4" />
              <span>Gerar Apontamento GLPI</span>
            </button>

            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500">Etapa Atual da Esteira</div>
              <div className="text-xs font-extrabold text-emerald-800 flex items-center justify-end gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{currentGovStage}: {STAGE_NAMES[currentGovStage]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <span className="font-bold text-amber-950">Princípio de Governança: </span>
          Estimativa a partir do cadastro; confirmar na reunião de entendimento (E1). O cadastro inicial é uma declaração do usuário mantenedor, não um fato consumado.
          {currentGovStage === 'E0' && (
            <span className="block mt-1 font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300/80 w-fit">
              ⚠️ Projeto em E0 — Caixas de "Confirmado" ficam desabilitadas até a Reunião de Entendimento (E1).
            </span>
          )}
        </div>
      </div>

      {/* Main KPI Results Panel (Janela de Entrega em Destaque) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Janela de Entrega */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-xl p-4 border border-emerald-700 shadow-sm relative overflow-hidden md:col-span-2">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Calendar className="w-44 h-44" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/80">
              Janela de Entrega Homologada
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Início: {formatPtBrDate(currentInputs.startDate)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                {formatPtBrDate(estimationResult.optimistic.deliveryDate)}
              </span>
              <span className="text-emerald-400 font-bold text-sm">à</span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-amber-300 font-mono">
                {formatPtBrDate(estimationResult.realistic.deliveryDate)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/80 text-[11px]">
            <div>
              <span className="text-emerald-300 font-semibold">Cenário Otimista:</span>{' '}
              <span className="text-slate-200">
                {estimationResult.optimistic.totalDays} dias úteis ({estimationResult.optimistic.activeDays}d ativos + {estimationResult.optimistic.agendaDays}d agenda)
              </span>
            </div>
            <div>
              <span className="text-amber-300 font-semibold">Cenário Realista:</span>{' '}
              <span className="text-slate-200">
                {estimationResult.realistic.totalDays} dias úteis ({estimationResult.realistic.activeDays}d ativos + {estimationResult.realistic.agendaDays}d agenda)
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic">
            * Sempre apresentada como janela prospectiva; nunca como data seca.
          </p>
        </div>

        {/* KPI 2: Esforço de T.I */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Esforço Total T.I</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {estimationResult.effortTotalHours.toFixed(1)}h
              </span>
              <span className="text-xs text-slate-500 font-medium">confirmadas</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Base Tipo {currentProjectType}:</span>
              <span className="font-mono font-bold">{estimationResult.effortBaseHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between text-blue-700">
              <span>Módulos extras:</span>
              <span className="font-mono font-bold">+{estimationResult.effortModulesHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Descontos E1:</span>
              <span className="font-mono font-bold">-{estimationResult.effortDiscountHours.toFixed(1)}h</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Reuniões & Dependências */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Interações & Bloqueios</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {estimationResult.meetingsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">reuniões</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Dependências Externas:</span>
              <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 rounded">
                {estimationResult.externalDepsCount} pontos
              </span>
            </div>
            <div className="flex justify-between">
              <span>Overhead de Espera:</span>
              <span className="font-mono font-bold text-slate-800">
                +{estimationResult.realistic.agendaDays} dias úteis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 1: Configuração do Eixo 2 (Tipo Técnico & Parâmetros) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Workflow className="w-4 h-4 text-emerald-700" />
            <span>Classificação do Eixo 2 — Arquétipo da Solução</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecione o tipo técnico da solução. Cada tipo possui esforço base, lista de reuniões e critérios de teste específicos.
          </p>
        </div>

        {/* Cards de Seleção de Tipo Técnico (A / B / C) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['A', 'B', 'C'] as ProjectType[]).map((typeKey) => {
            const isSelected = currentProjectType === typeKey;
            const info = PROJECT_TYPE_INFO[typeKey];

            return (
              <div
                key={typeKey}
                onClick={() => handleTypeChange(typeKey)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Tipo {typeKey}
                    </span>
                    {isSelected && (
                      <span className="text-emerald-700 flex items-center gap-1 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Selecionado
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {info.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {info.shortDesc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between text-slate-700">
                    <span>Stack Sugerida:</span>
                    <strong className="text-emerald-800 text-[10px] truncate max-w-[170px]" title={info.technologyHint}>
                      {info.technologyHint}
                    </strong>
                  </div>
                  {info.statusBadge && (
                    <div className="flex justify-between text-slate-700">
                      <span>Calibração:</span>
                      <strong className="text-amber-700 text-[10px]">{info.statusBadge}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inputs de Data de Início e Ferramenta de Geração */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Data de Início da Contagem:
            </label>
            <input
              type="date"
              value={currentInputs.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ferramenta de Vibe Coding / Geração:
            </label>
            <select
              value={currentGenerationTool}
              onChange={(e) => handleToolChange(e.target.value as GenerationTool)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Claude Code">Claude Code</option>
              <option value="Codex">Codex</option>
              <option value="ChatGPT">ChatGPT</option>
              <option value="Gemini (copia-e-cola)">Gemini (copia-e-cola)</option>
              <option value="Manual">Manual</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Responsável Técnico da T.I:
            </label>
            <input
              type="text"
              readOnly
              value={project.technicalResponsible}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 bg-slate-50 font-medium cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Seção 2: Esteira de Governança (E0..E6) com Stepper Interativo */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Esteira Oficial de Governança (E0 à E6)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em qualquer etapa para avançar o projeto na esteira. Ao avançar para homologação final ou conclusão, os critérios de saída são validados.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded self-start sm:self-auto">
            Etapa Atual: {currentGovStage}
          </span>
        </div>

        {/* Stepper visual */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
          {GOV_STAGES_CATALOG.map((stageKey, idx) => {
            const isCurrent = currentGovStage === stageKey;
            const currentIndex = GOV_STAGES_CATALOG.indexOf(currentGovStage);
            const isPassed = idx < currentIndex;

            return (
              <button
                key={stageKey}
                type="button"
                onClick={() => handleRequestStageChange(stageKey)}
                className={`text-left p-2.5 rounded-lg border transition-all relative ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : isPassed
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/70'
                    : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                  <span>{stageKey}</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  ) : (
                    <span className="text-[9px] text-slate-400">#{idx}</span>
                  )}
                </div>
                <div className={`text-[11px] font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                  {STAGE_NAMES[stageKey]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Informações da Etapa Selecionada */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-extrabold text-slate-900">Objetivo da Etapa {currentGovStage}: </span>
            <span>{STAGE_DESCRIPTIONS[currentGovStage] || 'Esteira finalizada e ativo homologado em produção.'}</span>
          </div>
          {currentGovStage === 'E1' && (
            <span className="text-[11px] bg-blue-100 text-blue-900 px-2 py-1 rounded font-bold shrink-0 border border-blue-200">
              Nesta etapa: validar e marcar "Confirmado" nos itens atendidos
            </span>
          )}
        </div>

        {/* Critério de Saída Obrigatório (Checklist de 4 itens Interativo) */}
        <div className="bg-emerald-950 text-white rounded-xl p-4 border border-emerald-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Critérios de Saída da Governança (Gate para Conclusão)</span>
            </h3>
            <span className="text-[11px] text-emerald-200 font-medium hidden sm:inline">
              O objetivo não é resolver tudo: é resolver o crítico e tirar do risco de pessoa única.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {EXIT_CRITERIA_CHECKLIST.map((crit) => {
              const isChecked = !!exitCriteriaChecked[crit.id];

              return (
                <label
                  key={crit.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-900/90 border-emerald-500 text-white shadow-xs'
                      : 'bg-emerald-900/40 border-emerald-800/80 text-emerald-100 hover:bg-emerald-900/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleExitCriteria(crit.id)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-600 bg-emerald-950"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{crit.title}</span>
                      {isChecked && (
                        <span className="text-[10px] font-mono text-emerald-300 font-bold">✓ Atendido</span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-200 leading-snug mt-0.5">
                      {crit.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seções de Módulos Adicionais e Descontos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Módulos Adicionais (Somam horas, reuniões e deps) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>Módulos Adicionais de Complexidade</span>
              </h2>
              <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                +{estimationResult.effortModulesHours.toFixed(2)}h
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Selecione os módulos extras caso a solução necessite de integrações com ERP, infraestrutura específica ou ambientes de dev.
            </p>

            <div className="space-y-2.5">
              {MODULES_CATALOG.map((mod) => {
                const isApplied = currentInputs.modules.some((m) => m.id === mod.id && m.applied);

                return (
                  <label
                    key={mod.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isApplied
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isApplied}
                      onChange={() => handleToggleModule(mod.id)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                        <span className="text-xs font-mono font-bold text-blue-700 shrink-0 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                          +{mod.hours}h ({mod.stageId})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {mod.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        {mod.meetings > 0 && <span>+{mod.meetings} reunião</span>}
                        {mod.externalDeps > 0 && <span>+{mod.externalDeps} dependência externa</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bloco 2: Itens Já Atendidos (Declarado vs Confirmado) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Itens Já Atendidos (Descontos de Esforço)</span>
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                -{estimationResult.effortDiscountHours.toFixed(1)}h abatidas
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
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

                return (
                  <div
                    key={disc.id}
                    className={`p-3 rounded-xl border transition-all ${
                      itemState.confirmed
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : itemState.declared
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900">{disc.label}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{disc.description}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Impacto: -{disc.hours}h na etapa {disc.stageId}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
                      {/* Checkbox 1: Declarado */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                        <input
                          type="checkbox"
                          checked={itemState.declared}
                          onChange={() => handleToggleDiscount(disc.id, 'declared')}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                        />
                        <span>Declarado no Cadastro</span>
                      </label>

                      {/* Checkbox 2: Confirmado na E1 */}
                      <label
                        className={`flex items-center gap-2 text-xs font-bold ${
                          canConfirm
                            ? 'cursor-pointer text-emerald-800'
                            : 'cursor-not-allowed text-slate-400 opacity-60'
                        }`}
                        title={
                          currentGovStage === 'E0'
                            ? 'Confirmação habilitada a partir da Reunião de Entendimento (E1)'
                            : !itemState.declared
                            ? 'Declare primeiro antes de confirmar'
                            : undefined
                        }
                      >
                        <input
                          type="checkbox"
                          disabled={!canConfirm}
                          checked={itemState.confirmed}
                          onChange={() => handleToggleDiscount(disc.id, 'confirmed')}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 disabled:cursor-not-allowed"
                        />
                        <span>Confirmado T.I (E1)</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Seção 3: Cronograma Detalhado & Breakdown de Etapas */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Cronograma Realista por Etapa da Esteira</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detalhamento de dias úteis ativos (código e testes) e dias de espera de agenda e terceiros.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-2.5 font-bold">Etapa</th>
                <th className="p-2.5 font-bold text-right">Horas Base</th>
                <th className="p-2.5 font-bold text-right">Módulos</th>
                <th className="p-2.5 font-bold text-right">Descontos</th>
                <th className="p-2.5 font-bold text-right">Horas Total</th>
                <th className="p-2.5 font-bold text-center">Interações</th>
                <th className="p-2.5 font-bold text-center">Dias Ativos</th>
                <th className="p-2.5 font-bold text-center">Dias Agenda</th>
                <th className="p-2.5 font-bold text-center">Início Previsto</th>
                <th className="p-2.5 font-bold text-center">Fim Previsto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estimationResult.stages.map((stg) => {
                const isCurrentStage = currentGovStage === stg.stageId;

                return (
                  <tr
                    key={stg.stageId}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCurrentStage ? 'bg-emerald-50/50 font-bold' : ''
                    }`}
                  >
                    <td className="p-2.5 flex items-center gap-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                        {stg.stageId}
                      </span>
                      <span className="truncate max-w-[180px]">{stg.stageName}</span>
                    </td>
                    <td className="p-2.5 text-right font-mono">{stg.baseHours}h</td>
                    <td className="p-2.5 text-right font-mono text-blue-700">
                      {stg.moduleHours > 0 ? `+${stg.moduleHours}h` : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-700">
                      {stg.discountHours > 0 ? `-${stg.discountHours}h` : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {stg.totalHours}h
                    </td>
                    <td className="p-2.5 text-center text-slate-600 font-mono">
                      {stg.meetings} reun / {stg.externalDeps} deps
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                      {stg.workDays}d
                    </td>
                    <td className="p-2.5 text-center font-mono text-amber-700">
                      +{stg.waitDays}d
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-600">
                      {formatPtBrDate(stg.startDate)}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-900">
                      {formatPtBrDate(stg.endDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                <td className="p-2.5">Totais Consolidados</td>
                <td className="p-2.5 text-right font-mono">{estimationResult.effortBaseHours.toFixed(1)}h</td>
                <td className="p-2.5 text-right font-mono text-blue-700">+{estimationResult.effortModulesHours.toFixed(1)}h</td>
                <td className="p-2.5 text-right font-mono text-emerald-700">-{estimationResult.effortDiscountHours.toFixed(1)}h</td>
                <td className="p-2.5 text-right font-mono text-emerald-900 text-sm">
                  {estimationResult.effortTotalHours.toFixed(1)}h
                </td>
                <td className="p-2.5 text-center font-mono">
                  {estimationResult.meetingsCount} reun / {estimationResult.externalDepsCount} deps
                </td>
                <td className="p-2.5 text-center font-mono">{estimationResult.realistic.activeDays}d</td>
                <td className="p-2.5 text-center font-mono text-amber-700">+{estimationResult.realistic.agendaDays}d</td>
                <td className="p-2.5 text-center font-mono">{formatPtBrDate(currentInputs.startDate)}</td>
                <td className="p-2.5 text-center font-mono text-emerald-900 text-sm">
                  {formatPtBrDate(estimationResult.realistic.deliveryDate)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Histórico e Registro de Atividades da Solução */}
      {project.activityLog && project.activityLog.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Histórico & Auditoria da Esteira ({project.activityLog.length} registros)
            </h3>
          </div>
          <div className="space-y-2">
            {project.activityLog.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-900">{log.action}</div>
                  {log.details && <div className="text-slate-600 text-[11px] mt-0.5">{log.details}</div>}
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                  <div>{log.timestamp}</div>
                  <div className="text-slate-500 font-semibold">{log.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Apontamento para GLPI */}
      {isGlpiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Apontamento da Esteira para Chamado GLPI
                </h3>
              </div>
              <button
                onClick={() => setIsGlpiModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Copie o texto estruturado abaixo e cole diretamente no chamado correspondente no GLPI (ou envie por e-mail/Teams) para registrar a evolução da governança e as datas homologadas:
            </p>

            <textarea
              readOnly
              rows={12}
              value={generateGlpiNoteText()}
              className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50 text-slate-800 focus:outline-hidden"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsGlpiModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Fechar
              </button>
              <button
                onClick={handleCopyGlpiNote}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                {copiedGlpiNote ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar para Área de Transferência</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Justificativa de Avanço de Etapa com Critérios Faltantes */}
      {pendingStageModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-900">
                Atenção: Critérios de Saída Incompletos
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Você está avançando para a etapa <strong>{pendingStageModal.targetStage}</strong>, mas os seguintes critérios de saída da governança ainda não foram validados:
            </p>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1.5 text-xs text-amber-900 font-medium">
              {pendingStageModal.missingCriteria.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Justificativa para avanço extraordinário:
              </label>
              <textarea
                rows={3}
                placeholder="Informe o motivo ou aprovação formal para avançar mesmo com critérios em aberto..."
                value={stageJustification}
                onChange={(e) => setStageJustification(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPendingStageModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => applyStageTransition(pendingStageModal.targetStage, stageJustification || 'Avanço autorizado com critérios parciais')}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-2xs transition-colors"
              >
                Confirmar Avanço de Etapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
