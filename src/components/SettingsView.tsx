import React, { useState } from 'react';
import {
  RotateCcw,
  Save,
  Check,
  AlertCircle,
  Download,
  Upload,
  ArrowLeft,
  Info,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { GovernanceConfig, GovStage, ProjectType, UserRole } from '../types';
import { can } from '../utils/permissions';
import {
  saveGovernanceConfig,
  resetGovernanceConfig
} from '../config/governanceConfig';
import { GOV_STAGES_CATALOG } from '../data/estimationCatalog';
import {
  exportStateAsJson,
  importStateFromJson,
  resetToDefaultState
} from '../utils/storage';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Input, Textarea } from './ui/FormField';
import { PageHeader } from './ui/PageHeader';
import { Tabs, TabItem } from './ui/Tabs';
import { Table, Thead, Tbody, Tr, Th, Td } from './ui/Table';

const EDITABLE_STAGES = GOV_STAGES_CATALOG.filter((s) => s !== 'Concluído');

interface SettingsViewProps {
  userRole: UserRole;
  config: GovernanceConfig;
  onUpdateConfig: (newConfig: GovernanceConfig) => void;
  onNavigateToPortfolio: () => void;
  onReloadAllState: () => void;
}

type SubTab = 'estimation' | 'risk' | 'checklists' | 'backup';

const SUB_TABS: TabItem<SubTab>[] = [
  { id: 'estimation', label: 'Motor de Estimativa & Eixo 2' },
  { id: 'risk', label: 'Réguas de Risco & Corte' },
  { id: 'checklists', label: 'Critérios de Saída (Checklist)' },
  { id: 'backup', label: 'Backup Técnico (JSON)' }
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userRole,
  config,
  onUpdateConfig,
  onNavigateToPortfolio,
  onReloadAllState
}) => {
  const isAdmin = can('edit_settings', userRole);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('estimation');
  // Accordion: apenas um Tipo Técnico (A/B/C) expandido por vez. Começa com o Tipo A aberto.
  const [expandedType, setExpandedType] = useState<ProjectType | null>('A');

  // Form local state
  const [formData, setFormData] = useState<GovernanceConfig>(JSON.parse(JSON.stringify(config)));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = () => {
    if (!isAdmin) return;
    saveGovernanceConfig(formData);
    onUpdateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (!isAdmin) return;
    if (window.confirm('Deseja realmente restaurar todos os parâmetros de governança para os valores padrão de fábrica?')) {
      const def = resetGovernanceConfig();
      setFormData(JSON.parse(JSON.stringify(def)));
      onUpdateConfig(def);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = importStateFromJson(text);
        if (res.success) {
          setBackupMessage({ type: 'success', text: 'Backup importado com sucesso! Estado restaurado.' });
          onReloadAllState();
        } else {
          const errText = (res as { success: false; error: string }).error || 'Arquivo inválido';
          setBackupMessage({ type: 'error', text: `Erro na validação do arquivo: ${errText}` });
        }
      } catch (err: any) {
        setBackupMessage({ type: 'error', text: `Falha ao ler arquivo: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetAllData = () => {
    if (!isAdmin) return;
    if (window.confirm('ATENÇÃO: Deseja redefinir todas as soluções para a base padrão original? Quaisquer alterações locais em projetos serão substituídas pelos 5 projetos de exemplo.')) {
      resetToDefaultState();
      onReloadAllState();
      setBackupMessage({ type: 'success', text: 'Base de dados resetada com sucesso para as soluções de exemplo originais.' });
    }
  };

  return (
    <div id="settings-governance-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Actions */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <PageHeader
            title="Parametrização de Governança & Regras T.I"
            subtitle="Ajuste os parâmetros dos cálculos de esforço, réguas de risco e critérios de saída sem alterar código."
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin ? (
            <>
              <Button
                color="secondary"
                size="sm"
                onClick={handleResetDefaults}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                title="Restaurar parâmetros padrão de fábrica"
              >
                Restaurar Padrões
              </Button>

              <Button
                color="primary"
                size="sm"
                onClick={handleSave}
                leftIcon={saveSuccess ? <Check className="w-4 h-4 text-brand-light" /> : <Save className="w-4 h-4" />}
              >
                {saveSuccess ? 'Parâmetros Salvos!' : 'Salvar Alterações'}
              </Button>
            </>
          ) : (
            <Badge className="bg-warning-50 text-warning-600 border-warning-200">
              <Lock className="w-3.5 h-3.5 text-warning-600" />
              <span>Modo Somente Leitura (Perfil Padrão)</span>
            </Badge>
          )}
        </div>
      </Card>

      {!isAdmin && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 text-xs text-warning-600 flex items-start gap-3">
          <Info className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-0.5">Acesso Restrito a Administradores</span>
            Você está visualizando a parametrização com o perfil <strong>Padrão</strong>. Apenas usuários com perfil <strong>Admin</strong> podem salvar alterações ou restaurar backups. Para testar a edição, altere o seletor de perfil no canto superior direito para "Admin".
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs<SubTab> items={SUB_TABS} value={activeSubTab} onChange={setActiveSubTab} />

      {/* Sub-tab 1: Motor de Estimativa */}
      {activeSubTab === 'estimation' && (
        <div className="space-y-6">
          {/* Tipos Técnicos A, B, C */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-grey-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-grey-900">
                  Esforço Base por Arquitetura & Stack Técnica
                </h3>
                <p className="text-xs text-grey-500">
                  Horas base estimadas de envolvimento da equipe de T.I para cada arquétipo de solução.
                </p>
              </div>
            </div>

            <div className="bg-grey-50 border border-grey-200 rounded-lg p-3">
              <span className="text-[11px] font-bold text-grey-600 uppercase tracking-wide block mb-2">
                O que é cada etapa (E0 a E6)
              </span>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {EDITABLE_STAGES.map((stage) => (
                  <div
                    key={stage}
                    className="flex items-baseline gap-1.5 text-xs"
                    title={formData.stageDescriptions[stage]}
                  >
                    <span className="font-mono font-bold text-brand-dark shrink-0">{stage}</span>
                    <span className="text-grey-600">{formData.stageNames[stage]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {(['A', 'B', 'C'] as ProjectType[]).map((typeKey) => {
                const info = formData.projectTypeInfo[typeKey];
                const stagesForType = formData.stagesBaseConfig[typeKey];

                const updateStageField = (
                  stage: GovStage,
                  field: 'hours' | 'meetings' | 'externalDeps',
                  raw: string
                ) => {
                  const val = Math.max(0, field === 'hours' ? Number(raw) || 0 : Math.round(Number(raw) || 0));
                  setFormData((prev) => ({
                    ...prev,
                    stagesBaseConfig: {
                      ...prev.stagesBaseConfig,
                      [typeKey]: {
                        ...prev.stagesBaseConfig[typeKey],
                        [stage]: { ...prev.stagesBaseConfig[typeKey][stage], [field]: val }
                      }
                    }
                  }));
                };

                const isExpanded = expandedType === typeKey;
                const totalHoursBase = EDITABLE_STAGES.reduce(
                  (sum, stage) => sum + (stagesForType[stage].hours || 0),
                  0
                );

                return (
                  <div
                    key={typeKey}
                    className="rounded-lg border border-grey-200 bg-grey-50/50 min-w-0 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedType(isExpanded ? null : typeKey)}
                      aria-expanded={isExpanded}
                      className="w-full flex items-start justify-between gap-3 p-4 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white border-grey-300 text-grey-800 shrink-0">
                            {typeKey === 'A' ? 'Workspace' : typeKey === 'B' ? 'Container / VPS' : 'No-Code'}
                          </Badge>
                          {info.statusBadge && (
                            <span className="text-[10px] font-bold text-warning-600 bg-warning-50 px-1.5 py-0.2 rounded border border-warning-200 truncate">
                              {info.statusBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-grey-600 font-medium mt-1.5">{info.label}</p>
                        <p className="text-[10px] text-grey-400 mt-0.5">{info.technologyHint}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        {!isExpanded && (
                          <span className="text-[10px] font-mono font-bold text-grey-500 whitespace-nowrap">
                            Total: {totalHoursBase}h base
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-grey-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-grey-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <Table className="text-[10px] border-collapse">
                          <Thead>
                            <Tr className="hover:bg-transparent">
                              <Th className="py-1 pr-1 px-0 normal-case font-semibold text-grey-500">Etapa</Th>
                              <Th className="text-right py-1 px-1 normal-case font-semibold text-grey-500">Horas</Th>
                              <Th className="text-right py-1 px-1 normal-case font-semibold text-grey-500">Reun.</Th>
                              <Th className="text-right py-1 pl-1 px-0 normal-case font-semibold text-grey-500">Deps</Th>
                            </Tr>
                          </Thead>
                          <Tbody className="divide-grey-100">
                            {EDITABLE_STAGES.map((stage) => (
                              <Tr key={stage} className="hover:bg-transparent">
                                <Td
                                  className="py-1 pr-1 px-0 font-mono font-bold text-grey-700 cursor-help"
                                  title={`${formData.stageNames[stage]} — ${formData.stageDescriptions[stage]}`}
                                >
                                  {stage}
                                </Td>
                                <Td className="py-1 px-1">
                                  <Input
                                    type="number"
                                    step="0.5"
                                    disabled={!isAdmin}
                                    value={stagesForType[stage].hours}
                                    onChange={(e) => updateStageField(stage, 'hours', e.target.value)}
                                    className="w-14 px-1.5 py-1 text-right text-[11px] font-mono font-bold text-grey-900"
                                  />
                                </Td>
                                <Td className="py-1 px-1">
                                  <Input
                                    type="number"
                                    disabled={!isAdmin}
                                    value={stagesForType[stage].meetings}
                                    onChange={(e) => updateStageField(stage, 'meetings', e.target.value)}
                                    className="w-10 px-1.5 py-1 text-right text-[11px] font-mono"
                                  />
                                </Td>
                                <Td className="py-1 pl-1 px-0">
                                  <Input
                                    type="number"
                                    disabled={!isAdmin}
                                    value={stagesForType[stage].externalDeps}
                                    onChange={(e) => updateStageField(stage, 'externalDeps', e.target.value)}
                                    className="w-10 px-1.5 py-1 text-right text-[11px] font-mono"
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Módulos Adicionais */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-grey-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-grey-900">
                  Catálogo de Módulos Adicionais de Complexidade
                </h3>
                <p className="text-xs text-grey-500">
                  Horas e reuniões extras adicionadas quando o projeto demanda integrações ou suporte de infraestrutura.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formData.modulesCatalog.map((mod, idx) => (
                <div
                  key={mod.id}
                  className="p-3.5 rounded-lg border border-grey-200 bg-grey-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono bg-info-50 text-info-700 border-info-200">
                        {mod.id}
                      </Badge>
                      <span className="text-xs font-bold text-grey-900 truncate">{mod.label}</span>
                    </div>
                    <p className="text-[11px] text-grey-500 mt-1">{mod.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-semibold text-grey-600">Horas:</label>
                      <Input
                        type="number"
                        disabled={!isAdmin}
                        value={mod.hours}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const updated = [...formData.modulesCatalog];
                          updated[idx] = { ...updated[idx], hours: val };
                          setFormData((prev) => ({ ...prev, modulesCatalog: updated }));
                        }}
                        className="w-16 px-2 py-1 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-semibold text-grey-600">Reuniões:</label>
                      <Input
                        type="number"
                        disabled={!isAdmin}
                        value={mod.meetings}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const updated = [...formData.modulesCatalog];
                          updated[idx] = { ...updated[idx], meetings: val };
                          setFormData((prev) => ({ ...prev, modulesCatalog: updated }));
                        }}
                        className="w-14 px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Descontos de Esforço */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-grey-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-grey-900">
                  Descontos de Esforço (Itens Já Atendidos Confirmados na E1)
                </h3>
                <p className="text-xs text-grey-500">
                  Abatimento de horas computado quando a equipe de T.I valida a existência prévia de documentação ou repositório.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formData.discountsCatalog.map((disc, idx) => (
                <div
                  key={disc.id}
                  className="p-3.5 rounded-lg border border-grey-200 bg-grey-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono bg-brand-lighter text-brand-dark border-brand-light">
                        {disc.id}
                      </Badge>
                      <span className="text-xs font-bold text-grey-900 truncate">{disc.label}</span>
                    </div>
                    <p className="text-[11px] text-grey-500 mt-1">{disc.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] font-semibold text-grey-600">Desconto de Horas:</label>
                    <Input
                      type="number"
                      disabled={!isAdmin}
                      value={disc.hours}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        const updated = [...formData.discountsCatalog];
                        updated[idx] = { ...updated[idx], hours: val };
                        setFormData((prev) => ({ ...prev, discountsCatalog: updated }));
                      }}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold text-brand-dark"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Sub-tab 2: Réguas de Risco */}
      {activeSubTab === 'risk' && (
        <Card className="space-y-5">
          <div className="border-b border-grey-100 pb-3">
            <h3 className="text-sm font-extrabold text-grey-900">
              Faixas de Corte de Risco (Pontuação Residual e Inicial)
            </h3>
            <p className="text-xs text-grey-500">
              Valores limites de pontuação para determinar a classificação em Baixo, Médio, Alto e Crítico.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-brand-light bg-brand-lighter/40">
              <span className="text-xs font-bold text-brand-dark block mb-1">Risco BAIXO</span>
              <p className="text-[11px] text-grey-500 mb-2">Pontuação menor ou igual a:</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.riskThresholds.baixoMax}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      riskThresholds: { ...prev.riskThresholds, baixoMax: val }
                    }));
                  }}
                  className="w-20 border-brand-light text-sm font-mono font-bold text-brand-dark"
                />
                <span className="text-xs text-grey-600 font-semibold">pontos</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-warning-200 bg-warning-50/40">
              <span className="text-xs font-bold text-warning-600 block mb-1">Risco MÉDIO</span>
              <p className="text-[11px] text-grey-500 mb-2">Pontuação menor ou igual a:</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.riskThresholds.medioMax}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      riskThresholds: { ...prev.riskThresholds, medioMax: val }
                    }));
                  }}
                  className="w-20 border-warning-200 text-sm font-mono font-bold text-warning-600"
                />
                <span className="text-xs text-grey-600 font-semibold">pontos</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-orange-200 bg-orange-50/40">
              <span className="text-xs font-bold text-orange-900 block mb-1">Risco ALTO</span>
              <p className="text-[11px] text-grey-500 mb-2">Pontuação menor ou igual a:</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.riskThresholds.altoMax}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      riskThresholds: { ...prev.riskThresholds, altoMax: val }
                    }));
                  }}
                  className="w-20 border-orange-300 text-sm font-mono font-bold text-orange-900"
                />
                <span className="text-xs text-grey-600 font-semibold">pontos</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-danger-300 bg-danger-50/40">
              <span className="text-xs font-bold text-danger-800 block mb-1">Risco CRÍTICO</span>
              <p className="text-[11px] text-grey-500 mb-2">Pontuação maior que o corte Alto:</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-extrabold text-danger-800 bg-white px-3 py-1 rounded border border-danger-300">
                  &gt; {formData.riskThresholds.altoMax}
                </span>
                <span className="text-xs text-grey-600 font-semibold">pontos</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Sub-tab 3: Critérios de Saída */}
      {activeSubTab === 'checklists' && (
        <Card className="space-y-4">
          <div className="border-b border-grey-100 pb-3">
            <h3 className="text-sm font-extrabold text-grey-900">
              Critérios de Saída da Governança (Gate para Conclusão / E6)
            </h3>
            <p className="text-xs text-grey-500">
              Checklist obrigatório de conformidade que valida a saída da solução da esteira sem risco de dependência de pessoa única.
            </p>
          </div>

          <div className="space-y-3">
            {formData.exitCriteriaChecklist.map((crit, idx) => (
              <div
                key={crit.id}
                className="p-3.5 rounded-lg border border-grey-200 bg-grey-50/50 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge className="font-mono bg-brand-lighter text-brand-dark border-brand-light">
                    {crit.id}
                  </Badge>
                  <Input
                    type="text"
                    disabled={!isAdmin}
                    value={crit.title}
                    onChange={(e) => {
                      const updated = [...formData.exitCriteriaChecklist];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setFormData((prev) => ({ ...prev, exitCriteriaChecklist: updated }));
                    }}
                    className="flex-1 px-2.5 py-1 text-xs font-bold text-grey-900"
                  />
                </div>
                <Textarea
                  rows={2}
                  disabled={!isAdmin}
                  value={crit.description}
                  onChange={(e) => {
                    const updated = [...formData.exitCriteriaChecklist];
                    updated[idx] = { ...updated[idx], description: e.target.value };
                    setFormData((prev) => ({ ...prev, exitCriteriaChecklist: updated }));
                  }}
                  className="px-2.5 py-1.5 text-xs text-grey-700"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sub-tab 4: Backup Técnico JSON */}
      {activeSubTab === 'backup' && (
        <Card className="space-y-5">
          <div className="border-b border-grey-100 pb-3">
            <h3 className="text-sm font-extrabold text-grey-900">
              Backup Técnico em JSON (Persistência sem Banco)
            </h3>
            <p className="text-xs text-grey-500">
              Exporte todos os projetos, parâmetros e histórico em um arquivo JSON íntegro, ou restaure um backup anterior.
            </p>
          </div>

          {backupMessage && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
                backupMessage.type === 'success'
                  ? 'bg-brand-lighter text-brand-dark border-brand-light'
                  : 'bg-danger-50 text-danger-800 border-danger-300'
              }`}
            >
              {backupMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-brand-main shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-danger-500 shrink-0" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Card */}
            <div className="p-4 rounded-lg border border-grey-200 bg-grey-50/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-grey-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-brand-dark" />
                  <span>Exportar Backup Completo</span>
                </span>
                <p className="text-[11px] text-grey-500 mt-1">
                  Gera arquivo JSON estruturado contendo todas as soluções, planos de ação, parâmetros e estimativas.
                </p>
              </div>

              <Button
                color="secondary"
                onClick={() => exportStateAsJson()}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="w-full text-brand-dark bg-brand-lighter hover:bg-brand-lighter border-brand-light"
              >
                Baixar JSON de Backup
              </Button>
            </div>

            {/* Import Card */}
            <div className="p-4 rounded-lg border border-grey-200 bg-grey-50/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-grey-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-info-700" />
                  <span>Restaurar Backup Técnico</span>
                </span>
                <p className="text-[11px] text-grey-500 mt-1">
                  Selecione um arquivo JSON exportado previamente para restaurar o estado integral da aplicação.
                </p>
              </div>

              <label
                className={`w-full px-4 py-2 text-sm rounded-full font-semibold text-center border transition-colors flex items-center justify-center gap-2 ${
                  isAdmin
                    ? 'cursor-pointer text-info-700 bg-info-50 hover:bg-info-50 border-info-200'
                    : 'cursor-not-allowed opacity-60 text-grey-400 bg-grey-100 border-grey-300'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Selecionar Arquivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  disabled={!isAdmin}
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset Defaults Card */}
            <div className="p-4 rounded-lg border border-grey-200 bg-grey-50/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-grey-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-danger-800" />
                  <span>Resetar para Exemplos Originais</span>
                </span>
                <p className="text-[11px] text-grey-500 mt-1">
                  Limpa o localStorage e recarrega os 5 projetos padrão da ATTO (Portal Logística, CTe OCR, etc).
                </p>
              </div>

              <Button
                color="danger"
                onClick={handleResetAllData}
                disabled={!isAdmin}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="w-full bg-danger-50 text-danger-800 border border-danger-300 hover:bg-danger-50"
              >
                Restaurar Base de Exemplo
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
