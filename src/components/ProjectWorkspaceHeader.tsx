import React from 'react';
import { FileText, ShieldAlert, CheckCircle2, Layers, Clock, FolderArchive } from 'lucide-react';
import { GovernanceConfig, ProjectTab, SolutionProject } from '../types';
import { getRiskColorClass, calculateRiskLevel } from '../utils/riskCalculations';
import { Badge } from './ui/Badge';
import { Tabs, TabItem } from './ui/Tabs';

export interface ProjectWorkspaceHeaderProps {
  project: SolutionProject;
  activeTab: ProjectTab;
  onSelectTab: (tab: ProjectTab) => void;
  residualScore: number;
  completedActions: number;
  totalActions: number;
  config: GovernanceConfig;
}

/**
 * Cabeçalho único da solução: identidade + nomenclatura completa (Arquitetura/Esteira) + navegação
 * entre as abas de trabalho da solução.
 */
export const ProjectWorkspaceHeader: React.FC<ProjectWorkspaceHeaderProps> = ({
  project,
  activeTab,
  onSelectTab,
  residualScore,
  completedActions,
  totalActions,
  config
}) => {
  const riskLevel = calculateRiskLevel(residualScore);
  const riskColor = getRiskColorClass(riskLevel);

  const typeKey = project.projectType || 'A';
  const stageKey = project.govStage || 'E0';
  const typeLabel =
    config.projectTypeInfo[typeKey]?.label ||
    (typeKey === 'A'
      ? 'Google Workspace / Apps Script'
      : typeKey === 'B'
      ? 'Container / VPS / Backend'
      : 'No-Code / Externo');
  const stageName = config.stageNames[stageKey] || stageKey;

  const totalArtifactsAndMeetings =
    (project.artifacts?.length || 0) + (project.meetingLogs?.length || 0);

  const tabs: TabItem<ProjectTab>[] = [
    {
      id: 'glpi',
      label: 'Ficha do Ativo & Doc Viva',
      badge: <FileText className="w-3.5 h-3.5" />
    },
    {
      id: 'artifacts',
      label: 'Artefatos & Acompanhamento',
      badge: (
        <span className="flex items-center gap-1">
          <FolderArchive className="w-3.5 h-3.5" />
          {totalArtifactsAndMeetings}
        </span>
      )
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
          {typeKey === 'A' ? 'Workspace' : typeKey === 'B' ? 'Container/VPS' : 'No-Code'}
        </span>
      )
    }
  ];

  return (
    <div className="bg-white border-b border-grey-200">
      <div className="px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-grey-900 truncate">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge className="bg-info-50 text-info-700 border-info-200 font-mono">
                {project.assetId}
              </Badge>
              <Badge className="bg-purple-50 text-purple-800 border-purple-200">{typeLabel}</Badge>
              <Badge className="bg-grey-100 text-grey-800 border-grey-300 font-medium">
                {stageName}
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
