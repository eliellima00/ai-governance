import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Clock,
  CheckSquare,
  Database,
  RotateCcw,
  Save,
  Check,
  AlertCircle,
  Download,
  Upload,
  Layers,
  ArrowLeft,
  Info,
  Building2,
  Lock
} from 'lucide-react';
import { GovernanceConfig, UserRole } from '../types';
import { can } from '../utils/permissions';
import {
  DEFAULT_GOVERNANCE_CONFIG,
  saveGovernanceConfig,
  resetGovernanceConfig
} from '../config/governanceConfig';
import {
  exportStateAsJson,
  importStateFromJson,
  resetToDefaultState
} from '../utils/storage';

interface SettingsViewProps {
  userRole: UserRole;
  config: GovernanceConfig;
  onUpdateConfig: (newConfig: GovernanceConfig) => void;
  onNavigateToPortfolio: () => void;
  onReloadAllState: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userRole,
  config,
  onUpdateConfig,
  onNavigateToPortfolio,
  onReloadAllState
}) => {
  const isAdmin = can('edit_settings', userRole);
  const [activeSubTab, setActiveSubTab] = useState<'estimation' | 'risk' | 'checklists' | 'backup'>('estimation');

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
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <button
              onClick={onNavigateToPortfolio}
              className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Portfólio</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Administração</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Parametrização de Governança & Regras T.I
              </h1>
              <p className="text-xs text-slate-500">
                Ajuste os parâmetros dos cálculos de esforço, réguas de risco e critérios de saída sem alterar código.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            <>
              <button
                onClick={handleResetDefaults}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
                title="Restaurar parâmetros padrão de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrões</span>
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors flex items-center gap-2"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Parâmetros Salvos!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Modo Somente Leitura (Perfil Padrão)</span>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-0.5">Acesso Restrito a Administradores</span>
            Você está visualizando a parametrização com o perfil <strong>Padrão</strong>. Apenas usuários com perfil <strong>Admin</strong> podem salvar alterações ou restaurar backups. Para testar a edição, altere o seletor de perfil no canto superior direito para "Admin".
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('estimation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'estimation'
              ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Motor de Estimativa & Eixo 2</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risk')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'risk'
              ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Réguas de Risco & Corte</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checklists')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'checklists'
              ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Critérios de Saída (Checklist)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'backup'
              ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup Técnico (JSON)</span>
        </button>
      </div>

      {/* Sub-tab 1: Motor de Estimativa */}
      {activeSubTab === 'estimation' && (
        <div className="space-y-6">
          {/* Tipos Técnicos A, B, C */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Esforço Base por Tipo Técnico (Eixo 2)
                </h3>
                <p className="text-xs text-slate-500">
                  Horas base estimadas de envolvimento da equipe de T.I para cada arquétipo de solução.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['A', 'B', 'C'] as const).map((typeKey) => {
                const info = formData.projectTypes[typeKey];
                return (
                  <div
                    key={typeKey}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-white border border-slate-300 text-slate-800">
                        Tipo {typeKey}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{info.name}</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Horas Base T.I:
                      </label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={info.baseHours}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 0);
                          setFormData((prev) => ({
                            ...prev,
                            projectTypes: {
                              ...prev.projectTypes,
                              [typeKey]: { ...prev.projectTypes[typeKey], baseHours: val }
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-slate-900 disabled:opacity-60 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Reuniões Base:
                        </label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={info.baseMeetings}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setFormData((prev) => ({
                              ...prev,
                              projectTypes: {
                                ...prev.projectTypes,
                                [typeKey]: { ...prev.projectTypes[typeKey], baseMeetings: val }
                              }
                            }));
                          }}
                          className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs bg-white font-mono disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Deps Externas:
                        </label>
                        <input
                          type="number"
                          disabled={!isAdmin}
                          value={info.baseExternalDeps}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setFormData((prev) => ({
                              ...prev,
                              projectTypes: {
                                ...prev.projectTypes,
                                [typeKey]: { ...prev.projectTypes[typeKey], baseExternalDeps: val }
                              }
                            }));
                          }}
                          className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs bg-white font-mono disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Módulos Adicionais */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Catálogo de Módulos Adicionais de Complexidade
                </h3>
                <p className="text-xs text-slate-500">
                  Horas e reuniões extras adicionadas quando o projeto demanda integrações ou suporte de infraestrutura.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formData.modulesCatalog.map((mod, idx) => (
                <div
                  key={mod.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {mod.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">{mod.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{mod.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-semibold text-slate-600">Horas:</label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={mod.hours}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const updated = [...formData.modulesCatalog];
                          updated[idx] = { ...updated[idx], hours: val };
                          setFormData((prev) => ({ ...prev, modulesCatalog: updated }));
                        }}
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-xs bg-white font-mono font-bold disabled:opacity-60"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-semibold text-slate-600">Reuniões:</label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={mod.meetings}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const updated = [...formData.modulesCatalog];
                          updated[idx] = { ...updated[idx], meetings: val };
                          setFormData((prev) => ({ ...prev, modulesCatalog: updated }));
                        }}
                        className="w-14 px-2 py-1 border border-slate-300 rounded text-xs bg-white font-mono disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Descontos de Esforço */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Descontos de Esforço (Itens Já Atendidos Confirmados na E1)
                </h3>
                <p className="text-xs text-slate-500">
                  Abatimento de horas computado quando a equipe de T.I valida a existência prévia de documentação ou repositório.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formData.discountsCatalog.map((disc, idx) => (
                <div
                  key={disc.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {disc.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">{disc.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{disc.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] font-semibold text-slate-600">Desconto de Horas:</label>
                    <input
                      type="number"
                      disabled={!isAdmin}
                      value={disc.hours}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        const updated = [...formData.discountsCatalog];
                        updated[idx] = { ...updated[idx], hours: val };
                        setFormData((prev) => ({ ...prev, discountsCatalog: updated }));
                      }}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-xs bg-white font-mono font-bold text-emerald-700 disabled:opacity-60"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Réguas de Risco */}
      {activeSubTab === 'risk' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Faixas de Corte de Risco (Pontuação Residual e Inicial)
            </h3>
            <p className="text-xs text-slate-500">
              Valores limites de pontuação para determinar a classificação em Baixo, Médio, Alto e Crítico.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <span className="text-xs font-bold text-emerald-900 block mb-1">Risco BAIXO</span>
              <p className="text-[11px] text-slate-500 mb-2">Pontuação menor ou igual a:</p>
              <div className="flex items-center gap-2">
                <input
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
                  className="w-20 px-2 py-1 border border-emerald-300 rounded text-sm font-mono font-bold bg-white text-emerald-900"
                />
                <span className="text-xs text-slate-600 font-semibold">pontos</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <span className="text-xs font-bold text-amber-900 block mb-1">Risco MÉDIO</span>
              <p className="text-[11px] text-slate-500 mb-2">Pontuação menor ou igual a:</p>
              <div className="flex items-center gap-2">
                <input
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
                  className="w-20 px-2 py-1 border border-amber-300 rounded text-sm font-mono font-bold bg-white text-amber-900"
                />
                <span className="text-xs text-slate-600 font-semibold">pontos</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40">
              <span className="text-xs font-bold text-orange-900 block mb-1">Risco ALTO</span>
              <p className="text-[11px] text-slate-500 mb-2">Pontuação menor ou igual a:</p>
              <div className="flex items-center gap-2">
                <input
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
                  className="w-20 px-2 py-1 border border-orange-300 rounded text-sm font-mono font-bold bg-white text-orange-900"
                />
                <span className="text-xs text-slate-600 font-semibold">pontos</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
              <span className="text-xs font-bold text-rose-900 block mb-1">Risco CRÍTICO</span>
              <p className="text-[11px] text-slate-500 mb-2">Pontuação maior que o corte Alto:</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-extrabold text-rose-700 bg-white px-3 py-1 rounded border border-rose-300">
                  &gt; {formData.riskThresholds.altoMax}
                </span>
                <span className="text-xs text-slate-600 font-semibold">pontos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Critérios de Saída */}
      {activeSubTab === 'checklists' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Critérios de Saída da Governança (Gate para Conclusão / E6)
            </h3>
            <p className="text-xs text-slate-500">
              Checklist obrigatório de conformidade que valida a saída da solução da esteira sem risco de dependência de pessoa única.
            </p>
          </div>

          <div className="space-y-3">
            {formData.exitCriteriaChecklist.map((crit, idx) => (
              <div
                key={crit.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {crit.id}
                  </span>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={crit.title}
                    onChange={(e) => {
                      const updated = [...formData.exitCriteriaChecklist];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      setFormData((prev) => ({ ...prev, exitCriteriaChecklist: updated }));
                    }}
                    className="flex-1 px-2.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-900 bg-white disabled:opacity-60"
                  />
                </div>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  value={crit.description}
                  onChange={(e) => {
                    const updated = [...formData.exitCriteriaChecklist];
                    updated[idx] = { ...updated[idx], description: e.target.value };
                    setFormData((prev) => ({ ...prev, exitCriteriaChecklist: updated }));
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-700 bg-white disabled:opacity-60 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tab 4: Backup Técnico JSON */}
      {activeSubTab === 'backup' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Backup Técnico em JSON (Persistência sem Banco)
            </h3>
            <p className="text-xs text-slate-500">
              Exporte todos os projetos, parâmetros e histórico em um arquivo JSON íntegro, ou restaure um backup anterior.
            </p>
          </div>

          {backupMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                backupMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {backupMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Exportar Backup Completo</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Gera arquivo JSON estruturado contendo todas as soluções, planos de ação, parâmetros e estimativas.
                </p>
              </div>

              <button
                onClick={exportStateAsJson}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar JSON de Backup</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>Restaurar Backup Técnico</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecione um arquivo JSON exportado previamente para restaurar o estado integral da aplicação.
                </p>
              </div>

              <label
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-center border transition-colors flex items-center justify-center gap-1.5 ${
                  isAdmin
                    ? 'cursor-pointer text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-300'
                    : 'cursor-not-allowed opacity-60 text-slate-400 bg-slate-100 border-slate-300'
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
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-700" />
                  <span>Resetar para Exemplos Originais</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Limpa o localStorage e recarrega os 5 projetos padrão da ATTO (Portal Logística, CTe OCR, etc).
                </p>
              </div>

              <button
                onClick={handleResetAllData}
                disabled={!isAdmin}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Base de Exemplo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
