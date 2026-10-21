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
  ChevronRight,
  Database,
  Plus,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { GovernanceConfig, GovStage, ProjectType, SettingsSection, UserRole, SolutionProject } from '../types';
import { can } from '../utils/permissions';
import {
  saveGovernanceConfig,
  resetGovernanceConfig
} from '../config/governanceConfig';
import { DiscountDefinition, GOV_STAGES_CATALOG, ModuleDefinition } from '../data/estimationCatalog';
import {
  exportStateAsJson,
  importStateFromJson,
  resetToDefaultState
} from '../utils/storage';
import { isSupabaseConfigured, testSupabaseConnection } from '../services/supabase';
import { migrateProjectsToSupabase } from '../services/dataService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Input, Textarea } from './ui/FormField';
import { PageHeader } from './ui/PageHeader';
import { Table, Thead, Tbody, Tr, Th, Td } from './ui/Table';
import { ListCrudEditor } from './ui/ListCrudEditor';

const EDITABLE_STAGES = GOV_STAGES_CATALOG.filter((s) => s !== 'Concluído');

/** Próximo id livre de um catálogo (ex.: M7, D5), sem reaproveitar ids já usados por projetos. */
function nextCatalogId(prefix: string, existing: string[]): string {
  const max = existing.reduce((acc, id) => {
    const n = Number(id.replace(prefix, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}${max + 1}`;
}

const NumberField: React.FC<{
  label: string;
  value: number;
  disabled?: boolean;
  step?: string;
  onChange: (value: number) => void;
}> = ({ label, value, disabled, step = '1', onChange }) => (
  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-grey-600">
    {label}:
    <Input
      type="number"
      min={0}
      step={step}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className="w-20 px-2 py-1 text-xs font-mono font-bold"
    />
  </label>
);

const StageSelect: React.FC<{
  names: Record<GovStage, string>;
  value: GovStage;
  disabled?: boolean;
  onChange: (stage: GovStage) => void;
}> = ({ names, value, disabled, onChange }) => (
  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-grey-600">
    Etapa:
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value as GovStage)}
      className="px-2 py-1 border border-grey-300 rounded-md text-xs bg-white text-grey-900 disabled:bg-grey-100"
    >
      {EDITABLE_STAGES.map((stage) => (
        <option key={stage} value={stage}>
          {stage} - {names[stage]}
        </option>
      ))}
    </select>
  </label>
);

interface SettingsViewProps {
  /** Seção aberta, escolhida no menu lateral. */
  section: SettingsSection;
  userRole: UserRole;
  config: GovernanceConfig;
  projects?: SolutionProject[];
  onUpdateConfig: (newConfig: GovernanceConfig) => void;
  onNavigateToPortfolio: () => void;
  onReloadAllState: () => void;
}


export const SettingsView: React.FC<SettingsViewProps> = ({
  section: activeSubTab,
  userRole,
  config,
  projects = [],
  onUpdateConfig,
  onNavigateToPortfolio,
  onReloadAllState
}) => {
  const isAdmin = can('edit_settings', userRole);
  // Accordion: apenas um Tipo Técnico (A/B/C) expandido por vez. Começa com o Tipo A aberto.
  const [expandedType, setExpandedType] = useState<ProjectType | null>('A');

  // Form local state
  const [formData, setFormData] = useState<GovernanceConfig>(JSON.parse(JSON.stringify(config)));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supabase migration state
  const isSupaActive = isSupabaseConfigured();
  const [copiedSql, setCopiedSql] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    loading: boolean;
    message: string;
    isError?: boolean;
  } | null>(null);
  const [connTest, setConnTest] = useState<{
    loading: boolean;
    ok?: boolean;
    message?: string;
    details?: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setConnTest({ loading: true });
    const res = await testSupabaseConnection();
    setConnTest({ loading: false, ok: res.ok, message: res.message, details: res.details });
  };

  const handleCopySql = () => {
    const sqlContent = `-- TABELAS RELACIONAIS POSTGRESQL PARA SUPABASE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    glpi_ticket_id VARCHAR(50),
    asset_id VARCHAR(50),
    department VARCHAR(100) NOT NULL,
    business_responsible VARCHAR(150),
    technical_responsible VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Diagnóstico',
    stage VARCHAR(50) DEFAULT 'E0 - Triagem',
    project_type VARCHAR(10) DEFAULT 'A',
    gov_stage VARCHAR(10) DEFAULT 'E0',
    executive_priority VARCHAR(50) DEFAULT 'P2 - Média Prioridade',
    is_priority_for_management BOOLEAN DEFAULT FALSE,
    has_impediment BOOLEAN DEFAULT FALSE,
    scheduled_meetings JSONB DEFAULT '[]',
    registered_by VARCHAR(150),
    group_encargado VARCHAR(150),
    user_group VARCHAR(150),
    notes TEXT,
    objective TEXT,
    initial_doc TEXT,
    notification_status TEXT,
    qr_code_url TEXT,
    initial_score NUMERIC DEFAULT 0,
    initial_risk VARCHAR(50) DEFAULT 'BAIXO',
    dimensions_initial JSONB DEFAULT '{}'::jsonb,
    links JSONB DEFAULT '{}'::jsonb,
    technical_doc JSONB DEFAULT '{}'::jsonb,
    estimation JSONB DEFAULT '{}'::jsonb,
    text_versions JSONB DEFAULT '[]'::jsonb,
    custom_hourly_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS project_criteria (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    criterion TEXT NOT NULL,
    evidence TEXT,
    points NUMERIC NOT NULL DEFAULT 1,
    dimension VARCHAR(50) NOT NULL,
    mitigated_by_action_ids JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS project_actions (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    responsible VARCHAR(150) NOT NULL,
    deadline VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Média',
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    risk_points_impact NUMERIC DEFAULT 1,
    dimension VARCHAR(50) NOT NULL,
    notes TEXT,
    evidence TEXT,
    completion_date VARCHAR(50),
    stage VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS project_artifacts (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    url TEXT,
    file_name VARCHAR(255),
    file_size VARCHAR(50),
    file_data TEXT,
    version VARCHAR(50) DEFAULT 'v1.0',
    author VARCHAR(150) NOT NULL,
    created_at VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS project_meeting_logs (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    entry_type VARCHAR(100) NOT NULL,
    participants TEXT,
    summary TEXT NOT NULL,
    next_steps TEXT,
    registered_by VARCHAR(150) NOT NULL,
    hours_spent NUMERIC DEFAULT 1,
    linked_artifact_id VARCHAR(100),
    linked_artifact_title VARCHAR(255),
    stage VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_settings (
    id VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_meeting_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total projetos" ON projects FOR ALL USING (true);
CREATE POLICY "Acesso total criterios" ON project_criteria FOR ALL USING (true);
CREATE POLICY "Acesso total acoes" ON project_actions FOR ALL USING (true);
CREATE POLICY "Acesso total artefatos" ON project_artifacts FOR ALL USING (true);
CREATE POLICY "Acesso total reunioes" ON project_meeting_logs FOR ALL USING (true);
CREATE POLICY "Acesso total settings" ON governance_settings FOR ALL USING (true);`;

    navigator.clipboard.writeText(sqlContent).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    });
  };

  const handleMigrate = async () => {
    if (!isAdmin) return;
    setMigrationStatus({ loading: true, message: 'Migrando dados para o Supabase...' });
    const result = await migrateProjectsToSupabase(projects);
    if (result.error) {
      setMigrationStatus({ loading: false, message: `Erro: ${result.error}`, isError: true });
    } else {
      setMigrationStatus({
        loading: false,
        message: `Sucesso! ${result.count} soluções e suas tabelas filhas foram sincronizadas no Supabase.`,
        isError: false
      });
    }
  };

  // Remover de um catálogo não mexe nos projetos: itens que não existem mais são ignorados no cálculo
  const removeCatalogItem = (
    key: 'modulesCatalog' | 'discountsCatalog' | 'exitCriteriaChecklist',
    idx: number,
    label: string
  ) => {
    if (!window.confirm(`Remover "${label}"? Projetos que usavam este item deixam de considerá-lo.`)) return;
    setFormData((prev) => ({ ...prev, [key]: (prev[key] as unknown[]).filter((_, i) => i !== idx) }));
  };

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
    if (window.confirm('ATENÇÃO: Isso apaga todos os projetos e configurações salvos localmente neste navegador (o portfólio local ficará vazio) e não pode ser desfeito. Os dados no Supabase não são afetados. Deseja continuar?')) {
      resetToDefaultState();
      onReloadAllState();
      setBackupMessage({ type: 'success', text: 'Dados locais apagados. O portfólio local está vazio.' });
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


      {/* Sub-tab 1: Motor de Estimativa */}
      {activeSubTab === 'estimation' && (
        <div className="space-y-6">
          {/* Etapas da esteira: nome e objetivo (os códigos E0–E6 são fixos) */}
          <Card className="space-y-4">
            <div className="border-b border-grey-100 pb-3">
              <h3 className="text-sm font-extrabold text-grey-900">Etapas da Esteira</h3>
              <p className="text-xs text-grey-500">
                Nome e objetivo de cada etapa, exibidos no menu do projeto e em todas as telas. Os códigos E0 a E6
                são fixos.
              </p>
            </div>
            <div className="space-y-2.5">
              {EDITABLE_STAGES.map((stage) => (
                <div key={stage} className="grid grid-cols-1 md:grid-cols-[3rem_1fr_2fr] gap-2 items-center">
                  <Badge className="font-mono bg-grey-100 text-grey-800 border-grey-300 justify-center">{stage}</Badge>
                  <Input
                    disabled={!isAdmin}
                    value={formData.stageNames[stage]}
                    placeholder="Nome da etapa"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, stageNames: { ...prev.stageNames, [stage]: e.target.value } }))
                    }
                    className="px-2.5 py-1 text-xs font-bold text-grey-900"
                  />
                  <Input
                    disabled={!isAdmin}
                    value={formData.stageDescriptions[stage]}
                    placeholder="Objetivo da etapa"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stageDescriptions: { ...prev.stageDescriptions, [stage]: e.target.value }
                      }))
                    }
                    className="px-2.5 py-1 text-xs text-grey-700"
                  />
                </div>
              ))}
            </div>
          </Card>

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
                      <div className="px-4 pb-4 space-y-3">
                        <div className="space-y-1.5">
                          {(
                            [
                              ['label', 'Nome do tipo'],
                              ['shortDesc', 'Descrição'],
                              ['technologyHint', 'Stack sugerida']
                            ] as const
                          ).map(([field, placeholder]) => (
                            <Input
                              key={field}
                              disabled={!isAdmin}
                              value={info[field]}
                              placeholder={placeholder}
                              title={placeholder}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  projectTypeInfo: {
                                    ...prev.projectTypeInfo,
                                    [typeKey]: { ...prev.projectTypeInfo[typeKey], [field]: e.target.value }
                                  }
                                }))
                              }
                              className={`px-2 py-1 text-[11px] ${field === 'label' ? 'font-bold' : ''}`}
                            />
                          ))}
                        </div>
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
                                  className="py-1.5 pr-2 px-0 font-medium text-grey-800"
                                  title={formData.stageDescriptions[stage]}
                                >
                                  <span className="block font-semibold text-[11px] text-grey-900 leading-tight">
                                    {formData.stageNames[stage]}
                                  </span>
                                </Td>
                                <Td className="py-1 px-1">
                                  <Input
                                    type="number"
                                    step="0.5"
                                    disabled={!isAdmin}
                                    value={stagesForType[stage].hours}
                                    onChange={(e) => updateStageField(stage, 'hours', e.target.value)}
                                    className="w-16 px-1.5 py-1 text-right text-[11px] font-mono font-bold text-grey-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </Td>
                                <Td className="py-1 px-1">
                                  <Input
                                    type="number"
                                    disabled={!isAdmin}
                                    value={stagesForType[stage].meetings}
                                    onChange={(e) => updateStageField(stage, 'meetings', e.target.value)}
                                    className="w-12 px-1.5 py-1 text-right text-[11px] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </Td>
                                <Td className="py-1 pl-1 px-0">
                                  <Input
                                    type="number"
                                    disabled={!isAdmin}
                                    value={stagesForType[stage].externalDeps}
                                    onChange={(e) => updateStageField(stage, 'externalDeps', e.target.value)}
                                    className="w-12 px-1.5 py-1 text-right text-[11px] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              {formData.modulesCatalog.map((mod, idx) => {
                const update = (patch: Partial<ModuleDefinition>) =>
                  setFormData((prev) => ({
                    ...prev,
                    modulesCatalog: prev.modulesCatalog.map((m, i) => (i === idx ? { ...m, ...patch } : m))
                  }));
                return (
                  <div key={mod.id} className="p-3.5 rounded-lg border border-grey-200 bg-grey-50/50 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono bg-info-50 text-info-700 border-info-200 shrink-0">{mod.id}</Badge>
                      <Input
                        disabled={!isAdmin}
                        value={mod.label}
                        placeholder="Nome do módulo"
                        onChange={(e) => update({ label: e.target.value })}
                        className="flex-1 px-2.5 py-1 text-xs font-bold text-grey-900"
                      />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => removeCatalogItem('modulesCatalog', idx, mod.label)}
                          className="p-1.5 text-grey-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                          title="Remover módulo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      disabled={!isAdmin}
                      value={mod.description || ''}
                      placeholder="Descrição (quando aplicar este módulo)"
                      onChange={(e) => update({ description: e.target.value })}
                      className="px-2.5 py-1 text-xs text-grey-700"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <StageSelect names={formData.stageNames} value={mod.stageId} disabled={!isAdmin} onChange={(stageId) => update({ stageId })} />
                      <NumberField label="Horas" step="0.25" value={mod.hours} disabled={!isAdmin} onChange={(hours) => update({ hours })} />
                      <NumberField label="Reuniões" value={mod.meetings} disabled={!isAdmin} onChange={(meetings) => update({ meetings: Math.round(meetings) })} />
                      <NumberField
                        label="Dependências externas"
                        value={mod.externalDeps}
                        disabled={!isAdmin}
                        onChange={(externalDeps) => update({ externalDeps: Math.round(externalDeps) })}
                      />
                    </div>
                  </div>
                );
              })}
              {isAdmin && (
                <Button
                  color="secondary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      modulesCatalog: [
                        ...prev.modulesCatalog,
                        {
                          id: nextCatalogId('M', prev.modulesCatalog.map((m) => m.id)),
                          label: 'Novo módulo',
                          description: '',
                          hours: 1,
                          stageId: 'E3',
                          meetings: 0,
                          externalDeps: 0
                        }
                      ]
                    }))
                  }
                >
                  Adicionar módulo
                </Button>
              )}
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
              {formData.discountsCatalog.map((disc, idx) => {
                const update = (patch: Partial<DiscountDefinition>) =>
                  setFormData((prev) => ({
                    ...prev,
                    discountsCatalog: prev.discountsCatalog.map((d, i) => (i === idx ? { ...d, ...patch } : d))
                  }));
                return (
                  <div key={disc.id} className="p-3.5 rounded-lg border border-grey-200 bg-grey-50/50 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono bg-brand-lighter text-brand-dark border-brand-light shrink-0">{disc.id}</Badge>
                      <Input
                        disabled={!isAdmin}
                        value={disc.label}
                        placeholder="Nome do item já atendido"
                        onChange={(e) => update({ label: e.target.value })}
                        className="flex-1 px-2.5 py-1 text-xs font-bold text-grey-900"
                      />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => removeCatalogItem('discountsCatalog', idx, disc.label)}
                          className="p-1.5 text-grey-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      disabled={!isAdmin}
                      value={disc.description || ''}
                      placeholder="Descrição (o que a T.I precisa confirmar)"
                      onChange={(e) => update({ description: e.target.value })}
                      className="px-2.5 py-1 text-xs text-grey-700"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <StageSelect names={formData.stageNames} value={disc.stageId} disabled={!isAdmin} onChange={(stageId) => update({ stageId })} />
                      <NumberField label="Desconto de horas" step="0.25" value={disc.hours} disabled={!isAdmin} onChange={(hours) => update({ hours })} />
                    </div>
                  </div>
                );
              })}
              {isAdmin && (
                <Button
                  color="secondary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      discountsCatalog: [
                        ...prev.discountsCatalog,
                        {
                          id: nextCatalogId('D', prev.discountsCatalog.map((d) => d.id)),
                          label: 'Novo item já atendido',
                          description: '',
                          hours: 1,
                          stageId: 'E3'
                        }
                      ]
                    }))
                  }
                >
                  Adicionar item
                </Button>
              )}
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
              Critérios de Saída da Governança (Gate para Conclusão da Esteira)
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
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => removeCatalogItem('exitCriteriaChecklist', idx, crit.title)}
                      className="p-1.5 text-grey-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                      title="Remover critério"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
            {isAdmin && (
              <Button
                color="secondary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    exitCriteriaChecklist: [
                      ...prev.exitCriteriaChecklist,
                      { id: `crit-${Date.now()}`, title: 'Novo critério', description: '' }
                    ]
                  }))
                }
              >
                Adicionar critério
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Sub-tab: Listas & Categorias (auxiliaryLists parametrizáveis) */}
      {activeSubTab === 'lists' && (
        <div className="space-y-6">
          <Card>
            <div className="border-b border-grey-100 pb-3 mb-1">
              <h3 className="text-sm font-extrabold text-grey-900">Listas & Categorias</h3>
              <p className="text-xs text-grey-500">
                Valores que aparecem nos selects do app (Novo Projeto, Ficha, filtros do Portfólio,
                Documentos e Reuniões). Adicione, renomeie, reordene ou remova sem alterar código —
                remover um item daqui não apaga nada de projetos que já usam aquele valor.
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <ListCrudEditor
                label="Área / Departamento"
                description="Usado em Novo Projeto e no filtro de Área do Portfólio."
                items={formData.auxiliaryLists.departments}
                disabled={!isAdmin}
                onChange={(items) =>
                  setFormData((prev) => ({
                    ...prev,
                    auxiliaryLists: { ...prev.auxiliaryLists, departments: items }
                  }))
                }
              />
            </Card>

            <Card>
              <ListCrudEditor
                label="Status do Projeto"
                description="Usado na Ficha GLPI (campo Status)."
                items={formData.auxiliaryLists.statuses}
                disabled={!isAdmin}
                onChange={(items) =>
                  setFormData((prev) => ({
                    ...prev,
                    auxiliaryLists: { ...prev.auxiliaryLists, statuses: items }
                  }))
                }
              />
            </Card>

            <Card>
              <ListCrudEditor
                label="Prioridade Executiva"
                description="Usado no Portfólio (filtro e prioridade por card)."
                items={formData.auxiliaryLists.priorities}
                disabled={!isAdmin}
                onChange={(items) =>
                  setFormData((prev) => ({
                    ...prev,
                    auxiliaryLists: { ...prev.auxiliaryLists, priorities: items }
                  }))
                }
              />
            </Card>

            <Card>
              <ListCrudEditor
                label="Ferramenta de Geração / IA"
                description="Usado em Novo Projeto e na aba Estimativa."
                items={formData.auxiliaryLists.generationTools}
                disabled={!isAdmin}
                onChange={(items) =>
                  setFormData((prev) => ({
                    ...prev,
                    auxiliaryLists: { ...prev.auxiliaryLists, generationTools: items }
                  }))
                }
              />
            </Card>

            <Card>
              <ListCrudEditor
                label="Categoria de Documento"
                description="Usado na lista de Documentos & links da aba Ficha & Documentos."
                items={formData.auxiliaryLists.artifactCategories}
                disabled={!isAdmin}
                onChange={(items) =>
                  setFormData((prev) => ({
                    ...prev,
                    auxiliaryLists: { ...prev.auxiliaryLists, artifactCategories: items }
                  }))
                }
              />
            </Card>

            <Card>
              <ListCrudEditor
                label="Tipo de Reunião"
                description="Usado no registro de reuniões & atas de cada etapa."
                items={formData.auxiliaryLists.meetingEntryTypes}
                disabled={!isAdmin}
                onChange={(items) =>
                  setFormData((prev) => ({
                    ...prev,
                    auxiliaryLists: { ...prev.auxiliaryLists, meetingEntryTypes: items }
                  }))
                }
              />
            </Card>
          </div>
        </div>
      )}

      {/* Sub-tab: Feature Flags */}
      {activeSubTab === 'flags' && (
        <Card className="space-y-4">
          <div className="border-b border-grey-100 pb-3">
            <h3 className="text-sm font-extrabold text-grey-900">Funcionalidades (Beta)</h3>
            <p className="text-xs text-grey-500">
              Telas avançadas desligadas por padrão para manter o acompanhamento dos projetos
              sucinto. O código continua no projeto — reative aqui
              quando quiser voltar a usá-las, sem precisar de deploy.
            </p>
          </div>

          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 p-3.5 rounded-lg border border-grey-200 bg-grey-50/50 ${
                isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
              }`}
            >
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={!!formData.featureFlags.detailedEvolution}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    featureFlags: { ...prev.featureFlags, detailedEvolution: e.target.checked }
                  }))
                }
                className="mt-0.5 rounded text-brand-main"
              />
              <span>
                <span className="text-xs font-bold text-grey-900 block">
                  Evolução detalhada (gráfico de burn-down)
                </span>
                <span className="text-[11px] text-grey-500">
                  Mostra, na etapa E6 - Encerramento, o gráfico cronológico de queda de risco. Por padrão
                  aparece só o resumo (risco inicial, atual e evolução por dimensão).
                </span>
              </span>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-lg border border-grey-200 bg-grey-50/50 ${
                isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
              }`}
            >
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={!!formData.featureFlags.myWeekEnabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    featureFlags: { ...prev.featureFlags, myWeekEnabled: e.target.checked }
                  }))
                }
                className="mt-0.5 rounded text-brand-main"
              />
              <span>
                <span className="text-xs font-bold text-grey-900 block">
                  Minha Semana (planner semanal)
                </span>
                <span className="text-[11px] text-grey-500">
                  Ainda em beta. Ativa o item "Minha Semana" no menu lateral — um board semanal com
                  arrastar-e-soltar reunindo reuniões agendadas e ações pendentes de todos os projetos.
                </span>
              </span>
            </label>
          </div>
        </Card>
      )}

      {/* Sub-tab: Banco de Dados Relacional (Supabase / PostgreSQL) */}
      {activeSubTab === 'database' && (
        <Card className="space-y-6">
          <div className="border-b border-grey-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-grey-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-dark" />
                <span>Integração com Banco Relacional PostgreSQL (Supabase)</span>
              </h3>
              <p className="text-xs text-grey-500 mt-0.5">
                Conecte esta esteira de governança diretamente ao seu banco relacional na nuvem com chaves estrangeiras e integridade referencial.
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isSupaActive
                    ? 'bg-teal-50 border-teal-300 text-teal-850'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSupaActive ? 'bg-teal-500' : 'bg-amber-500'}`} />
                <span>{isSupaActive ? 'Supabase Ativo (PostgreSQL)' : 'Aguardando Credenciais Supabase'}</span>
              </span>
            </div>
          </div>

          {/* Card de Status do Supabase */}
          <div className="p-4 rounded-xl border bg-teal-50/40 border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-grey-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-teal-600" />
                <span>Supabase PostgreSQL (Banco Exclusivo da Aplicação)</span>
              </span>
              <Badge
                className={
                  isSupaActive
                    ? 'bg-teal-50 text-teal-850 border-teal-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }
              >
                {isSupaActive ? 'Conectado' : 'Aguardando Chave Anon'}
              </Badge>
            </div>
            <p className="text-xs text-grey-600 leading-relaxed">
              Tabelas relacionais com chaves estrangeiras e integridade referencial (<code className="bg-white px-1 py-0.5 rounded border text-[11px]">projects</code>, <code className="bg-white px-1 py-0.5 rounded border text-[11px]">project_criteria</code>, <code className="bg-white px-1 py-0.5 rounded border text-[11px]">project_actions</code>, <code className="bg-white px-1 py-0.5 rounded border text-[11px]">project_artifacts</code>, <code className="bg-white px-1 py-0.5 rounded border text-[11px]">project_meeting_logs</code>). Permite consultas SQL diretas, relatórios e integração com ferramentas de BI corporativas.
            </p>
          </div>

          {/* Guia de Configuração Passo a Passo */}
          <div className="bg-grey-50 rounded-xl p-5 border border-grey-200 space-y-4">
            <h4 className="text-xs font-bold text-grey-900 uppercase tracking-wider flex items-center gap-2">
              <span>Como ativar o seu Supabase nesta aplicação:</span>
            </h4>

            <ol className="space-y-3 text-xs text-grey-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-lighter text-brand-dark font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  <strong>Crie ou abra seu projeto no Supabase:</strong> Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-brand-dark font-medium underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> e crie um projeto gratuito ou selecione o da sua organização.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-lighter text-brand-dark font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div className="space-y-1.5 w-full">
                  <div>
                    <strong>Crie as tabelas relacionais no SQL Editor:</strong> Copie o script DDL abaixo e execute-o no <em>SQL Editor</em> do painel do Supabase com 1 clique:
                  </div>
                  <div>
                    <Button
                      color="secondary"
                      size="sm"
                      onClick={handleCopySql}
                      leftIcon={copiedSql ? <Check className="w-3.5 h-3.5 text-brand-main" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {copiedSql ? 'Script SQL Copiado para a Área de Transferência!' : 'Copiar Script SQL (supabase-schema.sql)'}
                    </Button>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-lighter text-brand-dark font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div className="space-y-2 w-full">
                  <div>
                    <strong>Preencha as variáveis de ambiente:</strong> No menu de configurações da aplicação (arquivo <code className="bg-white px-1.5 py-0.5 rounded border font-mono">.env</code>), defina as credenciais fornecidas na aba <em>Project Settings &gt; API</em>:
                    <div className="bg-grey-900 text-grey-100 p-3 rounded-lg font-mono text-[11px] mt-2 space-y-1">
                      <div>VITE_SUPABASE_URL="https://seu-projeto.supabase.co"</div>
                      <div>VITE_SUPABASE_ANON_KEY="sua-anon-key-aqui (chave JWT pública que começa com 'eyJ...')"</div>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <div className="pt-1">
                    <Button
                      color="secondary"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={connTest?.loading}
                      leftIcon={<Database className="w-3.5 h-3.5 text-brand-dark" />}
                    >
                      {connTest?.loading ? 'Testando Conexão...' : 'Testar Conexão com Supabase'}
                    </Button>

                    {connTest && (
                      <div
                        className={`mt-2 p-3 rounded-lg text-xs space-y-1 border ${
                          connTest.ok
                            ? 'bg-teal-50 border-teal-200 text-teal-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {connTest.ok ? (
                            <Check className="w-4 h-4 text-teal-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          )}
                          <span>{connTest.message}</span>
                        </div>
                        {connTest.details && (
                          <div className="text-[11px] text-grey-700 leading-relaxed pl-5">
                            {connTest.details}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-lighter text-brand-dark font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <div className="space-y-2 w-full">
                  <div>
                    <strong>Sincronize e semeie as soluções:</strong> Após inserir as variáveis e rodar o SQL, clique no botão abaixo para semear e salvar todos os projetos e histórico diretamente nas tabelas relacionais do Supabase:
                  </div>
                  <div>
                    <Button
                      color="primary"
                      size="sm"
                      disabled={!isSupaActive || (migrationStatus?.loading)}
                      onClick={handleMigrate}
                      leftIcon={<Database className="w-3.5 h-3.5" />}
                    >
                      {migrationStatus?.loading ? 'Sincronizando com Supabase...' : 'Sincronizar Soluções no Supabase'}
                    </Button>
                    {!isSupaActive && (
                      <span className="text-[11px] text-grey-500 ml-2">
                        (Habilitado assim que o <code className="font-mono">VITE_SUPABASE_URL</code> for detectado)
                      </span>
                    )}
                  </div>
                  {migrationStatus && (
                    <div
                      className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                        migrationStatus.isError
                          ? 'bg-danger-50 text-danger-800 border border-danger-200'
                          : 'bg-teal-50 text-teal-850 border border-teal-200'
                      }`}
                    >
                      {migrationStatus.isError ? <AlertCircle className="w-4 h-4 text-danger-600 shrink-0" /> : <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      <span>{migrationStatus.message}</span>
                    </div>
                  )}
                </div>
              </li>
            </ol>
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
                  <span>Limpar Dados Locais</span>
                </span>
                <p className="text-[11px] text-grey-500 mt-1">
                  Apaga o localStorage deste navegador (portfólio e configurações ficam vazios). Os dados no Supabase não são afetados.
                </p>
              </div>

              <Button
                color="danger"
                onClick={handleResetAllData}
                disabled={!isAdmin}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="w-full bg-danger-50 text-danger-800 border border-danger-300 hover:bg-danger-50"
              >
                Limpar Dados Locais
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
