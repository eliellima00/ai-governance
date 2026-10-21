import React from 'react';
import { CheckCircle2, Clock, FolderOpen, LayoutDashboard } from 'lucide-react';
import { GovernanceConfig, ProjectTab, SolutionProject } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import { getProjectStatusSummary, getStageState, RISK_LABELS, STAGE_TABS } from '../utils/projectStatus';
import { Badge } from './ui/Badge';

export interface ProjectWorkspaceHeaderProps {
  project: SolutionProject;
  activeTab: ProjectTab;
  onSelectTab: (tab: ProjectTab) => void;
  config: GovernanceConfig;
}

const SECONDARY_TABS: { id: ProjectTab; label: string; icon: React.ReactNode }[] = [
  { id: 'ficha', label: 'Ficha & Documentos', icon: <FolderOpen className="w-3.5 h-3.5" /> },
  { id: 'estimation', label: 'Estimativa', icon: <Clock className="w-3.5 h-3.5" /> }
];

/**
 * Cabeçalho único da solução: identidade, resumo de "em que pé está" e navegação.
 * A navegação principal são as etapas da esteira (E0–E6); Visão Geral, Ficha e Estimativa ficam ao lado.
 */
export const ProjectWorkspaceHeader: React.FC<ProjectWorkspaceHeaderProps> = ({
  project,
  activeTab,
  onSelectTab,
  config
}) => {
  const summary = getProjectStatusSummary(project);
  const riskColor = getRiskColorClass(summary.risk.currentLevel);

  const typeKey = project.projectType || 'A';
  const typeLabel = config.projectTypeInfo[typeKey]?.label || typeKey;

  const tabButtonClass = (isActive: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
      isActive ? 'bg-white text-grey-900 shadow-2xs' : 'text-grey-500 hover:text-grey-800'
    }`;

  return (
    <div className="bg-white border-b border-grey-200">
      <div className="px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-grey-900 truncate">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {project.assetId && (
                <Badge className="bg-info-50 text-info-700 border-info-200 font-mono">{project.assetId}</Badge>
              )}
              <Badge className="bg-purple-50 text-purple-800 border-purple-200">{typeLabel}</Badge>
              {summary.blocked && <Badge className="bg-danger-50 text-danger-800 border-danger-300">Bloqueado</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-grey-50 px-3 py-1.5 rounded-full border border-grey-200 shrink-0">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-grey-500 font-bold block leading-tight">
                Risco atual
              </span>
              <span className="text-xs font-black text-grey-900 font-mono">{summary.risk.currentScore} pts</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskColor.badge}`}>
              {RISK_LABELS[summary.risk.currentLevel]}
            </span>
          </div>
        </div>

        {/* Na Visão Geral o resumo já aparece em destaque no corpo da página */}
        {activeTab !== 'overview' && (
          <p className="text-sm text-grey-700 pb-3 leading-snug">
            <span className="font-semibold text-grey-900">Em que pé está:</span> {summary.sentence}
          </p>
        )}
      </div>

      <nav className="px-4 sm:px-6 lg:px-8 pb-3 overflow-x-auto" aria-label="Navegação do projeto">
        <div className="inline-flex items-stretch gap-1 p-1 bg-grey-100 rounded-lg">
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className={tabButtonClass(activeTab === 'overview')}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Visão Geral
          </button>

          <span className="w-px bg-grey-300 my-1.5 mx-1" aria-hidden />

          {STAGE_TABS.map((stage) => {
            const state = getStageState(project, stage);
            const isActive = activeTab === stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => onSelectTab(stage)}
                title={config.stageDescriptions[stage]}
                className={`flex flex-col items-start px-3 py-1.5 rounded-md text-left whitespace-nowrap transition-colors ${
                  isActive ? 'bg-white shadow-2xs' : 'hover:bg-grey-50/60'
                }`}
              >
                <span
                  className={`flex items-center gap-1 text-[11px] font-black ${
                    state === 'current' ? 'text-brand-main' : state === 'done' ? 'text-brand-dark' : 'text-grey-400'
                  }`}
                >
                  {state === 'done' && <CheckCircle2 className="w-3 h-3" />}
                  {state === 'current' && <span className="w-2 h-2 rounded-full bg-brand-main" />}
                  {stage}
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    isActive ? 'text-grey-900' : state === 'future' ? 'text-grey-400' : 'text-grey-600'
                  }`}
                >
                  {config.stageNames[stage]}
                </span>
              </button>
            );
          })}

          <span className="w-px bg-grey-300 my-1.5 mx-1" aria-hidden />

          {SECONDARY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={tabButtonClass(activeTab === tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
