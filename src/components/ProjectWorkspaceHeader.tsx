import React from 'react';
import { GovernanceConfig, ProjectTab, SolutionProject } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import { getProjectStatusSummary, RISK_LABELS } from '../utils/projectStatus';
import { Badge } from './ui/Badge';

export interface ProjectWorkspaceHeaderProps {
  project: SolutionProject;
  activeTab: ProjectTab;
  config: GovernanceConfig;
}

/**
 * Cabeçalho único da solução: identidade e resumo de "em que pé está".
 * A navegação do projeto (Visão Geral, etapas E0–E6, Ficha, Estimativa) fica no menu lateral.
 */
export const ProjectWorkspaceHeader: React.FC<ProjectWorkspaceHeaderProps> = ({
  project,
  activeTab,
  config
}) => {
  const summary = getProjectStatusSummary(project);
  const riskColor = getRiskColorClass(summary.risk.currentLevel);

  const typeKey = project.projectType || 'A';
  const typeLabel = config.projectTypeInfo[typeKey]?.label || typeKey;

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
          <p className="text-sm text-grey-700 pb-4 leading-snug">
            <span className="font-semibold text-grey-900">Etapa atual:</span> {summary.sentence}
          </p>
        )}
      </div>

    </div>
  );
};
