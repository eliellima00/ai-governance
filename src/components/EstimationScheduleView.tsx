import React, { useMemo, useState } from 'react';
import { CalendarClock, ChevronDown, Info, RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  DiscountToggle,
  EstimationInputs,
  GenerationTool,
  GovStage,
  ModuleToggle,
  ProjectType,
  SolutionProject,
  UserRole
} from '../types';
import { can } from '../utils/permissions';
import { computeEstimation, diffDays, formatPtBrDate, replanFromStage, setStageDate } from '../utils/estimation';
import { getCurrentStage, getEstimationInputs, getStageState, isStageTab, stageLabel } from '../utils/projectStatus';
import { getActiveConfig } from '../config/governanceConfig';
import { Badge, Button, Card, ChecklistItem, Field, Input, Select, Table, Tbody, Td, Th, Thead, Tr } from './ui';

interface EstimationScheduleViewProps {
  project: SolutionProject;
  userRole: UserRole;
  onUpdateProject: (updated: SolutionProject) => void;
}

/** Célula de data de uma etapa: input editável (admin) com destaque quando a data foi ajustada manualmente. */
const StageDateCell: React.FC<{
  value: string;
  suggested: string;
  isManual: boolean;
  editable: boolean;
  min?: string;
  onChange: (date: string) => void;
  onReset?: () => void;
}> = ({ value, suggested, isManual, editable, min, onChange, onReset }) => {
  if (!editable) {
    return (
      <span className="font-mono">
        {formatPtBrDate(value)}
        {isManual && <span className="ml-1 text-[9px] font-semibold text-warning-600 uppercase">manual</span>}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className={`px-1.5 py-0.5 rounded border text-xs font-mono ${
          isManual ? 'border-warning-400 bg-warning-50 text-warning-800' : 'border-grey-200 bg-white'
        }`}
        title={isManual ? `Data ajustada manualmente · sugerida: ${formatPtBrDate(suggested)}` : 'Data sugerida — altere se quiser'}
      />
      {isManual && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-grey-400 hover:text-brand-dark"
          title={`Voltar à data sugerida (${formatPtBrDate(suggested)})`}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const fmtHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')}h`;

export const EstimationScheduleView: React.FC<EstimationScheduleViewProps> = ({
  project,
  userRole,
  onUpdateProject
}) => {
  const config = getActiveConfig();
  const canEdit = can(userRole, 'edit_estimation');
  const currentStage: GovStage = getCurrentStage(project);

  const inputs = useMemo(() => getEstimationInputs(project), [project]);
  const result = useMemo(() => computeEstimation(inputs), [inputs]);
  const projectType: ProjectType = inputs.projectType || project.projectType || 'A';
  const generationTool: GenerationTool = inputs.generationTool || project.generationTool || 'Claude Code';
  const typeInfo = config.projectTypeInfo[projectType];
  const hoursPerDay = config.estimationConfig.horasPorManha * config.estimationConfig.fatorRealista;

  const [showAdjustments, setShowAdjustments] = useState(false);
  const [replanDate, setReplanDate] = useState(() => new Date().toISOString().split('T')[0]);
  const todayIso = new Date().toISOString().split('T')[0];

  const updateInputs = (next: EstimationInputs) => {
    if (!canEdit) return;
    onUpdateProject({ ...project, projectType: next.projectType, generationTool: next.generationTool, estimation: next });
  };

  const toggleModule = (moduleId: string) => {
    const known = inputs.modules.some((m) => m.id === moduleId);
    const modules: ModuleToggle[] = known
      ? inputs.modules.map((m) => (m.id === moduleId ? { ...m, applied: !m.applied } : m))
      : [
          ...inputs.modules,
          { id: moduleId, label: config.modulesCatalog.find((m) => m.id === moduleId)?.label || moduleId, applied: true }
        ];
    updateInputs({ ...inputs, modules });
  };

  const toggleDiscount = (discountId: string, field: 'declared' | 'confirmed') => {
    const existing: DiscountToggle = inputs.discounts.find((d) => d.id === discountId) || {
      id: discountId,
      label: config.discountsCatalog.find((d) => d.id === discountId)?.label || discountId,
      declared: false,
      confirmed: false
    };
    const nextVal = !existing[field];
    const updated: DiscountToggle = {
      ...existing,
      [field]: nextVal,
      // Desmarcar "declarado" desmarca "confirmado"
      ...(field === 'declared' && !nextVal ? { confirmed: false } : {})
    };
    const discounts = inputs.discounts.some((d) => d.id === discountId)
      ? inputs.discounts.map((d) => (d.id === discountId ? updated : d))
      : [...inputs.discounts, updated];
    updateInputs({ ...inputs, discounts });
  };

  const appliedModules = config.modulesCatalog.filter((m) => inputs.modules.some((t) => t.id === m.id && t.applied));
  const confirmedDiscounts = config.discountsCatalog.filter((d) =>
    inputs.discounts.some((t) => t.id === d.id && t.confirmed)
  );
  const pendingDeclaredDiscounts = config.discountsCatalog.filter((d) =>
    inputs.discounts.some((t) => t.id === d.id && t.declared && !t.confirmed)
  );

  return (
    <div className="space-y-6">
      {/* Os três números */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <span className="text-xs font-semibold text-grey-500">Esforço total da T.I</span>
          <div className="text-3xl font-black text-grey-900 mt-1 font-mono">{fmtHours(result.effortTotalHours)}</div>
          <p className="text-[11px] text-grey-500 mt-1">Horas de trabalho somadas em todas as etapas</p>
        </Card>
        <Card>
          <span className="text-xs font-semibold text-grey-500">Duração prevista</span>
          <div className="text-3xl font-black text-grey-900 mt-1 font-mono">{result.realistic.totalDays} dias úteis</div>
          <p className="text-[11px] text-grey-500 mt-1">
            {result.realistic.activeDays} de trabalho + {result.realistic.agendaDays} de espera (agenda e terceiros)
          </p>
        </Card>
        <Card className="bg-brand-dark border-brand-dark text-white">
          <span className="text-xs font-semibold text-brand-light">Entrega prevista</span>
          <div className="text-3xl font-black mt-1 font-mono">{formatPtBrDate(result.realistic.deliveryDate)}</div>
          <p className="text-[11px] text-brand-light mt-1">
            Início em {formatPtBrDate(inputs.startDate)}
            {!result.hasManualDates && <> · no melhor cenário, {formatPtBrDate(result.optimistic.deliveryDate)}</>}
          </p>
        </Card>
      </div>

      {/* Como a conta é feita */}
      <Card className="space-y-3">
        <h3 className="text-sm font-bold text-grey-900">Como a conta é feita</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-grey-100 border border-grey-200">
            Base do tipo {projectType} ({typeInfo?.label}): <strong className="font-mono">{fmtHours(result.effortBaseHours)}</strong>
          </span>
          <span className="text-grey-400 font-bold">+</span>
          <span className="px-3 py-1.5 rounded-lg bg-info-50 border border-info-200 text-info-700">
            Módulos extras ({appliedModules.length}): <strong className="font-mono">{fmtHours(result.effortModulesHours)}</strong>
          </span>
          <span className="text-grey-400 font-bold">−</span>
          <span className="px-3 py-1.5 rounded-lg bg-brand-lighter border border-brand-light text-brand-dark">
            Itens já atendidos ({confirmedDiscounts.length}): <strong className="font-mono">{fmtHours(result.effortDiscountHours)}</strong>
          </span>
          <span className="text-grey-400 font-bold">=</span>
          <span className="px-3 py-1.5 rounded-lg bg-grey-900 text-white">
            <strong className="font-mono">{fmtHours(result.effortTotalHours)}</strong>
          </span>
        </div>
        <ul className="text-xs text-grey-600 space-y-1 list-disc list-inside">
          <li>
            Prazo: cada dia rende cerca de {hoursPerDay.toString().replace('.', ',')}h de trabalho, e cada reunião ou
            dependência de outro time acrescenta dias de espera ({result.meetingsCount} reuniões e{' '}
            {result.externalDepsCount} dependências previstas).
          </li>
          <li>Um item "já atendido" só desconta horas depois de confirmado pela T.I na reunião de diagnóstico.</li>
          {pendingDeclaredDiscounts.length > 0 && (
            <li className="text-warning-600">
              {pendingDeclaredDiscounts.length}{' '}
              {pendingDeclaredDiscounts.length === 1 ? 'item declarado aguarda' : 'itens declarados aguardam'} confirmação
              (até −{fmtHours(pendingDeclaredDiscounts.reduce((s, d) => s + d.hours, 0))}).
            </li>
          )}
        </ul>
      </Card>

      {/* Cronograma por etapa */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-grey-900">Cronograma por etapa</h3>
            {canEdit && (
              <p className="text-xs text-grey-500 mt-0.5">
                As datas são sugeridas, mas podem ser alteradas; as etapas seguintes se reencadeiam.
              </p>
            )}
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {isStageTab(currentStage) && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={replanDate}
                    onChange={(e) => setReplanDate(e.target.value)}
                    className="text-xs font-mono w-36 py-1"
                    aria-label="Nova data de início da etapa atual"
                  />
                  <Button
                    size="sm"
                    color="secondary"
                    leftIcon={<CalendarClock className="w-3.5 h-3.5" />}
                    onClick={() => replanDate && updateInputs(replanFromStage(inputs, currentStage, replanDate))}
                    disabled={!replanDate}
                    title="A etapa atual passa a começar na data escolhida e as seguintes voltam às durações sugeridas. Etapas anteriores não mudam."
                  >
                    Replanejar a partir de {stageLabel(currentStage)}
                  </Button>
                </div>
              )}
              {result.hasManualDates && (
                <Button
                  size="sm"
                  color="secondary"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => updateInputs({ ...inputs, stageDateOverrides: {} })}
                >
                  Restaurar datas sugeridas
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="border border-grey-200 rounded-lg overflow-hidden">
          <Table>
            <Thead>
              <Tr className="hover:bg-transparent">
                <Th className="min-w-[220px]">Etapa</Th>
                <Th className="text-right">Horas</Th>
                <Th className="text-center">Dias úteis</Th>
                <Th>Início</Th>
                <Th>Fim</Th>
                <Th>Situação</Th>
              </Tr>
            </Thead>
            <Tbody>
              {result.stages.map((stg) => {
                const state = isStageTab(stg.stageId) ? getStageState(project, stg.stageId) : 'future';
                const isLate = state === 'current' && diffDays(stg.endDate, todayIso) > 0;
                return (
                  <Tr key={stg.stageId} className={state === 'current' ? 'bg-brand-lighter/50' : ''}>
                    <Td className="font-semibold text-grey-900 whitespace-nowrap">{stageLabel(stg.stageId)}</Td>
                    <Td className="text-right font-mono" title={`Base ${stg.baseHours}h · módulos +${stg.modulesHours}h · descontos −${stg.discountHours}h`}>
                      {fmtHours(stg.totalHours)}
                    </Td>
                    <Td className="text-center font-mono text-grey-700" title={`${stg.workDays} de trabalho + ${stg.waitDays} de espera`}>
                      {stg.workDays + stg.waitDays}
                    </Td>
                    <Td>
                      <StageDateCell
                        value={stg.startDate}
                        suggested={stg.suggestedStartDate}
                        isManual={stg.isStartManual}
                        editable={canEdit}
                        onChange={(date) => updateInputs(setStageDate(inputs, stg.stageId, 'startDate', date))}
                        // O início da E0 é a própria data de início — não há sugestão a restaurar
                        onReset={
                          stg.stageId === 'E0'
                            ? undefined
                            : () => updateInputs(setStageDate(inputs, stg.stageId, 'startDate', undefined))
                        }
                      />
                    </Td>
                    <Td>
                      <StageDateCell
                        value={stg.endDate}
                        suggested={stg.suggestedEndDate}
                        isManual={stg.isEndManual}
                        editable={canEdit}
                        min={stg.startDate}
                        onChange={(date) => updateInputs(setStageDate(inputs, stg.stageId, 'endDate', date))}
                        onReset={() => updateInputs(setStageDate(inputs, stg.stageId, 'endDate', undefined))}
                      />
                    </Td>
                    <Td>
                      {state === 'done' ? (
                        <Badge className="bg-brand-lighter text-brand-dark border-brand-light">Concluída</Badge>
                      ) : isLate ? (
                        <Badge className="bg-danger-50 text-danger-800 border-danger-300">Atrasada</Badge>
                      ) : state === 'current' ? (
                        <Badge className="bg-brand-main text-white border-brand-main">Em andamento</Badge>
                      ) : (
                        <span className="text-[11px] text-grey-400">Prevista</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
            <tfoot>
              <tr className="bg-grey-50 border-t-2 border-grey-200 font-bold text-grey-900 text-xs">
                <td className="px-3 py-2.5">Total</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtHours(result.effortTotalHours)}</td>
                <td className="px-3 py-2.5 text-center font-mono">{result.realistic.totalDays}</td>
                <td className="px-3 py-2.5 font-mono">{formatPtBrDate(inputs.startDate)}</td>
                <td className="px-3 py-2.5 font-mono">{formatPtBrDate(result.realistic.deliveryDate)}</td>
                <td />
              </tr>
            </tfoot>
          </Table>
        </div>
      </Card>

      {/* Ajustes da estimativa (recolhido) */}
      <Card className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdjustments((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left"
          aria-expanded={showAdjustments}
        >
          <span className="text-sm font-bold text-grey-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-dark" />
            {canEdit ? 'Ajustar estimativa' : 'Parâmetros da estimativa'}
          </span>
          <span className="flex items-center gap-2 text-xs text-grey-500">
            Tipo {projectType} · {appliedModules.length} módulos · {confirmedDiscounts.length} itens atendidos
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdjustments ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {showAdjustments && (
          <div className="space-y-5 pt-1 border-t border-grey-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <Field label="Tipo técnico" hint={typeInfo?.shortDesc}>
                <Select
                  value={projectType}
                  disabled={!canEdit}
                  onChange={(e) => updateInputs({ ...inputs, projectType: e.target.value as ProjectType })}
                >
                  {(['A', 'B', 'C'] as ProjectType[]).map((t) => (
                    <option key={t} value={t}>
                      Tipo {t} — {config.projectTypeInfo[t]?.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Data de início">
                <Input
                  type="date"
                  value={inputs.startDate}
                  disabled={!canEdit}
                  onChange={(e) => e.target.value && updateInputs({ ...inputs, startDate: e.target.value })}
                  className="font-mono"
                />
              </Field>
              <Field label="Ferramenta de geração">
                <Select
                  value={generationTool}
                  disabled={!canEdit}
                  onChange={(e) => updateInputs({ ...inputs, generationTool: e.target.value })}
                >
                  {config.auxiliaryLists.generationTools.map((tool) => (
                    <option key={tool} value={tool}>
                      {tool}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-grey-600">Módulos extras (somam horas)</h4>
                {config.modulesCatalog.map((mod) => {
                  const applied = inputs.modules.some((m) => m.id === mod.id && m.applied);
                  return (
                    <div
                      key={mod.id}
                      className={`p-2.5 rounded-lg border ${applied ? 'border-info-500 bg-info-50/60' : 'border-grey-200'}`}
                    >
                      <ChecklistItem
                        checked={applied}
                        onToggle={() => toggleModule(mod.id)}
                        disabled={!canEdit}
                        trailing={<span className="text-xs font-mono font-bold text-info-700 shrink-0">+{fmtHours(mod.hours)}</span>}
                      >
                        <span className="text-xs font-semibold text-grey-900">{mod.label}</span>
                        <p className="text-[11px] text-grey-500 mt-0.5">Entra em {stageLabel(mod.stageId)}</p>
                      </ChecklistItem>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-grey-600">
                  Itens já atendidos (descontam horas)
                </h4>
                {currentStage === 'E0' && (
                  <p className="text-[11px] text-warning-600 flex items-center gap-1">
                    <Info className="w-3 h-3" /> A confirmação fica liberada a partir de {stageLabel('E1')}.
                  </p>
                )}
                {config.discountsCatalog.map((disc) => {
                  const item = inputs.discounts.find((d) => d.id === disc.id);
                  const declared = !!item?.declared;
                  const confirmed = !!item?.confirmed;
                  const canConfirm = declared && currentStage !== 'E0';
                  return (
                    <div
                      key={disc.id}
                      className={`p-2.5 rounded-lg border ${
                        confirmed ? 'border-brand-main bg-brand-lighter/50' : declared ? 'border-warning-200 bg-warning-50/40' : 'border-grey-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-grey-900">{disc.label}</span>
                        <span className="text-xs font-mono font-bold text-brand-dark shrink-0">−{fmtHours(disc.hours)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <ChecklistItem checked={declared} onToggle={() => toggleDiscount(disc.id, 'declared')} disabled={!canEdit}>
                          <span className="text-xs text-grey-700">Declarado no cadastro</span>
                        </ChecklistItem>
                        <ChecklistItem
                          checked={confirmed}
                          onToggle={() => toggleDiscount(disc.id, 'confirmed')}
                          disabled={!canEdit || !canConfirm}
                        >
                          <span className={`text-xs font-semibold ${canConfirm ? 'text-brand-dark' : 'text-grey-400'}`}>
                            Confirmado pela T.I
                          </span>
                        </ChecklistItem>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
