import React from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Database,
  Users,
  FileCheck
} from 'lucide-react';
import { SolutionProject } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import {
  Badge,
  Card,
  PageHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  ProgressBar,
  ChecklistItem,
  StatTile
} from './ui';

interface AiDiagnosticViewProps {
  project: SolutionProject;
  onNavigateToActionPlan: () => void;
}

export const AiDiagnosticView: React.FC<AiDiagnosticViewProps> = ({
  project,
  onNavigateToActionPlan
}) => {
  const riskColor = getRiskColorClass(project.initialRisk);

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="bg-white border border-grey-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-lighter text-brand-dark rounded-lg border border-brand-light shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-brand-lighter text-brand-dark border-transparent">
                Diagnóstico de Risco por Regras
              </Badge>
              <span className="text-xs text-grey-500 font-mono">Motor Determinístico T.I</span>
            </div>
            <PageHeader
              title="Parecer Técnico de Criticidade & Avaliação Inicial"
              subtitle="Classificação por regras a partir do cadastro — declaração a confirmar na Reunião de Entendimento (E1)."
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score — custom block: StatTile has no decorative-icon slot */}
            <div className="relative overflow-hidden text-left rounded-lg border border-grey-800 bg-grey-900 text-white p-3.5 min-w-0">
              <div className="relative">
                <span className="text-xs font-semibold text-grey-300">Pontuação Total por Regras</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black">{project.initialScore}</span>
                  <span className="text-[11px] text-red-400 font-semibold uppercase">pontos</span>
                </div>
                <div className="mt-2">
                  <Badge className={`${riskColor.badge} border-transparent`}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>Risco Inicial: {project.initialRisk}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Category Card */}
            <StatTile
              label="Categoria da Solução"
              value={project.technicalDoc?.classification || 'Classificação a definir'}
              subtext={`Área responsável: ${project.department}`}
            />

            {/* TI Mandate */}
            <StatTile
              label="Aprovação da T.I"
              icon={<AlertOctagon className="w-5 h-5" />}
              iconClassName="bg-warning-50 text-warning-600"
              value={<span className="text-warning-600">Obrigatória</span>}
              subtext="Exige esteira com Reunião de Entendimento (E1) e homologação."
            />

            {/* Security Audit */}
            <StatTile
              label="Revisão de Segurança"
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconClassName="bg-brand-lighter text-brand-dark"
              value={<span className="text-brand-dark">Necessária</span>}
              subtext="Controle de acessos, segregação de credenciais e proteção LGPD."
            />
          </div>

          {/* Detailed Dimensions Breakdown */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-grey-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-dark" />
              <span>Detalhamento por Dimensão de Risco (Matriz Shadow IT)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Segurança */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-grey-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-grey-500" />
                    <span>Segurança da Informação</span>
                  </span>
                  <Badge className="bg-grey-100 text-grey-900 border-transparent font-mono">
                    {project.dimensionsInitial.seguranca} pts
                  </Badge>
                </div>
                <ProgressBar
                  value={Math.min(100, (project.dimensionsInitial.seguranca / 15) * 100)}
                  colorClassName="bg-red-500"
                />
                <div className="space-y-1.5 mt-2">
                  {project.criteria.filter((c) => c.dimension === 'Segurança').length > 0 ? (
                    project.criteria
                      .filter((c) => c.dimension === 'Segurança')
                      .map((c) => (
                        <ChecklistItem key={c.id} checked>
                          {c.criterion}
                        </ChecklistItem>
                      ))
                  ) : (
                    <span className="text-xs text-grey-400">Nenhum critério de Segurança registrado.</span>
                  )}
                </div>
              </div>

              {/* LGPD */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-grey-700 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-grey-500" />
                    <span>Privacidade & LGPD</span>
                  </span>
                  <Badge className="bg-grey-100 text-grey-900 border-transparent font-mono">
                    {project.dimensionsInitial.lgpd} pts
                  </Badge>
                </div>
                <ProgressBar
                  value={Math.min(100, (project.dimensionsInitial.lgpd / 10) * 100)}
                  colorClassName="bg-warning-500"
                />
                <div className="space-y-1.5 mt-2">
                  {project.criteria.filter((c) => c.dimension === 'LGPD').length > 0 ? (
                    project.criteria
                      .filter((c) => c.dimension === 'LGPD')
                      .map((c) => (
                        <ChecklistItem key={c.id} checked>
                          {c.criterion}
                        </ChecklistItem>
                      ))
                  ) : (
                    <span className="text-xs text-grey-400">Nenhum critério de LGPD registrado.</span>
                  )}
                </div>
              </div>

              {/* Operacional */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-grey-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-grey-500" />
                    <span>Continuidade & Operação</span>
                  </span>
                  <Badge className="bg-grey-100 text-grey-900 border-transparent font-mono">
                    {project.dimensionsInitial.operacional} pts
                  </Badge>
                </div>
                <ProgressBar
                  value={Math.min(100, (project.dimensionsInitial.operacional / 10) * 100)}
                  colorClassName="bg-info-500"
                />
                <div className="space-y-1.5 mt-2">
                  {project.criteria.filter((c) => c.dimension === 'Operacional').length > 0 ? (
                    project.criteria
                      .filter((c) => c.dimension === 'Operacional')
                      .map((c) => (
                        <ChecklistItem key={c.id} checked>
                          {c.criterion}
                        </ChecklistItem>
                      ))
                  ) : (
                    <span className="text-xs text-grey-400">Nenhum critério Operacional registrado.</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Criteria Evaluation Table */}
          <div className="bg-white border border-grey-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-grey-200 bg-grey-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-grey-700">
                Critérios Determinísticos Pontuados ({project.criteria.length} regras)
              </h3>
              <button
                onClick={onNavigateToActionPlan}
                className="text-xs text-brand-dark font-bold hover:underline"
              >
                Ver Plano de Ação & Mitigações →
              </button>
            </div>
            <Table>
              <Thead>
                <Tr>
                  <Th className="min-w-45">Critério Avaliado</Th>
                  <Th className="min-w-27.5">Dimensão</Th>
                  <Th className="min-w-55">Evidência / Justificativa</Th>
                  <Th className="text-right min-w-22.5">Pontos</Th>
                </Tr>
              </Thead>
              <Tbody>
                {project.criteria.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-semibold text-grey-800">{c.criterion}</Td>
                    <Td>
                      <Badge
                        className={`border-transparent text-[11px] ${
                          c.dimension === 'Segurança'
                            ? 'bg-red-50 text-red-700'
                            : c.dimension === 'LGPD'
                            ? 'bg-warning-50 text-warning-600'
                            : 'bg-info-50 text-info-700'
                        }`}
                      >
                        {c.dimension}
                      </Badge>
                    </Td>
                    <Td>{c.evidence}</Td>
                    <Td className="text-right font-mono font-bold text-grey-900">+{c.points}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>
      </div>
  );
};

