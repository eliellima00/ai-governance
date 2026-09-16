import React from 'react';
import { ArrowLeft, FileText, ShieldAlert, CheckCircle2, Layers, Clock } from 'lucide-react';
import { GovernanceConfig, ProjectTab, SolutionProject } from '../types';
import { getRiskColorClass, calculateRiskLevel } from '../utils/riskCalculations';
import { Badge } from './ui/Badge';
import { Tabs, TabItem } from './ui/Tabs';

export interface ProjectWorkspaceHeaderProps {
  project: SolutionProject;
  activeTab: ProjectTab;
  onSelectTab: (tab: ProjectTab) => void;
  onNavigateToPortfolio: () => void;
  residualScore: number;
  completedActions: number;
  totalActions: number;
  config: GovernanceConfig;
}

/**
 * Cabeçalho único da solução: identidade + nomenclatura completa (Tipo/Esteira) + navegação
 * entre as 5 abas de trabalho. É a única forma de trocar de aba dentro de uma solução —
 * o Sidebar não lista mais abas nem outras soluções.
 */
export const ProjectWorkspaceHeader: React.FC<ProjectWorkspaceHeaderProps> = ({
  project,
  activeTab,
  onSelectTab,
  onNavigateToPortfolio,
  residualScore,
  completedActions,
  totalActions,
  config
}) => {
  const riskLevel = calculateRiskLevel(residualScore);
  const riskColor = getRiskColorClass(riskLevel);

  const typeKey = project.projectType || 'A';
  const stageKey = project.govStage || 'E0';
  const typeLabel = config.projectTypeInfo[typeKey]?.label || `Tipo ${typeKey}`;
  const stageName = config.stageNames[stageKey] || stageKey;

  const tabs: TabItem<ProjectTab>[] = [
    {
      id: 'glpi',
      label: 'Ficha do Ativo & Doc Viva',
      badge: <FileText className="w-3.5 h-3.5" />
    },
    {
      id: 'diagnostic',
      label: 'Diagnóstico de Risco',
      badge: (
        <span className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          {project.initialScore} pts
        </span>
      )
    },
    {
      id: 'action_plan',
      label: 'Plano de Ação',
      badge: (
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {completedActions}/{totalActions}
        </span>
      )
    },
    {
      id: 'evolution',
      label: 'Evolução da Criticidade',
      badge: (
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          {residualScore} pts
        </span>
      )
    },
    {
      id: 'estimation',
      label: 'Estimativa & Cronograma',
      badge: (
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Tipo {typeKey}
        </span>
      )
    }
  ];

  return (
    <div className="bg-white border-b border-grey-200">
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={onNavigateToPortfolio}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-main hover:text-brand-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Portfólio</span>
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-grey-900 truncate">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge className="bg-info-50 text-info-700 border-info-200 font-mono">
                {project.assetId}
              </Badge>
              <Badge className="bg-purple-50 text-purple-800 border-purple-200">{typeLabel}</Badge>
              <Badge className="bg-grey-100 text-grey-700 border-grey-300">
                {stageKey} — {stageName}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-grey-50 px-3 py-1.5 rounded-full border border-grey-200 shrink-0">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-grey-500 font-bold block leading-tight">
                Risco Residual
              </span>
              <span className="text-xs font-black text-grey-900 font-mono">{residualScore} pts</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskColor.badge}`}>
              {riskLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-3 overflow-x-auto">
        <Tabs items={tabs} value={activeTab} onChange={onSelectTab} />
      </div>
    </div>
  );
};
