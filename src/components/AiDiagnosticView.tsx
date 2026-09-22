import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Database,
  Users,
  Server,
  FileCheck,
  HelpCircle,
  Sparkles,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { SolutionProject, RiskCriterion } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import {
  Button,
  Badge,
  Card,
  Label,
  Textarea,
  PageHeader,
  Tabs,
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
  onNavigateHome?: () => void;
  onNavigateToActionPlan: () => void;
}

export const AiDiagnosticView: React.FC<AiDiagnosticViewProps> = ({
  project,
  onNavigateHome,
  onNavigateToActionPlan
}) => {
  const [activeTab, setActiveTab] = useState<'official' | 'simulator'>('official');

  // Deterministic Rules Simulator (Without LLM)
  const [simText, setSimText] = useState(
    `Nome: Portal Logística\nObjetivo: Cotação de fretes com transportadores externos, integrado ao ERP Senior Sapiens.\nDados: Planilhas Google Sheets com 31 abas, PDFs de CNH e placas (LGPD), dados confidenciais de fretes.`
  );
  const [simResult, setSimResult] = useState<any>(null);

  const runDeterministicTriage = () => {
    const text = simText.toLowerCase();
    let score = 0;
    let seguranca = 0;
    let lgpd = 0;
    let operacional = 0;
    const detectedRules: string[] = [];

    if (text.includes('lgpd') || text.includes('cpf') || text.includes('dados pessoais') || text.includes('cnh') || text.includes('motorista')) {
      score += 5;
      lgpd += 5;
      detectedRules.push('Tratamento de dados pessoais ou documentos sensíveis (LGPD: +5 pts)');
    }
    if (text.includes('confidencial') || text.includes('frete') || text.includes('fatura') || text.includes('banco') || text.includes('financeiro')) {
      score += 5;
      seguranca += 5;
      detectedRules.push('Tratamento de dados de negócio confidenciais / financeiros (+5 pts)');
    }
    if (text.includes('senior') || text.includes('erp') || text.includes('sapiens') || text.includes('api externa')) {
      score += 5;
      seguranca += 5;
      detectedRules.push('Integração com ERP corporativo Senior Sapiens (+5 pts)');
    }
    if (text.includes('sheets') || text.includes('planilha') || text.includes('drive') || text.includes('excel')) {
      score += 4;
      operacional += 4;
      detectedRules.push('Uso de planilhas como banco de dados ou backend operacional (+4 pts)');
    }
    if (text.includes('externo') || text.includes('terceiro') || text.includes('transportador') || text.includes('cliente')) {
      score += 4;
      operacional += 4;
      detectedRules.push('Acesso simultâneo por usuários ou terceiros externos (+4 pts)');
    }
    if (text.includes('crítico') || text.includes('embarque') || text.includes('faturamento') || text.includes('parada')) {
      score += 5;
      operacional += 5;
      detectedRules.push('Impacto severo na operação em caso de indisponibilidade (+5 pts)');
    }

    const level = score <= 5 ? 'BAIXO' : score <= 12 ? 'MEDIO' : score <= 20 ? 'ALTO' : 'CRITICO';

    setSimResult({
      score,
      level,
      dimensions: { seguranca, lgpd, operacional },
      rules: detectedRules
    });
  };

  const riskColor = getRiskColorClass(project.initialRisk);

  return (
    <div className="space-y-6">
      {/* Sub-Header & Switcher */}
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

        <Tabs<'official' | 'simulator'>
          items={[
            { id: 'official', label: 'Parecer Oficial do Chamado' },
            { id: 'simulator', label: 'Simulador de Regras', badge: <Sliders className="w-3.5 h-3.5" /> }
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'official' ? (
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
              value="Solução Corporativa"
              subtext="Mais de 20 usuários, acesso por terceiros e impacto na operação de embarque."
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
                  <ChecklistItem checked>
                    Credenciais de bancos de dados gravadas em scripts abertos.
                  </ChecklistItem>
                  <ChecklistItem checked>
                    Tokens de API de ERP sem expiração nem segregação de perfil.
                  </ChecklistItem>
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
                  <ChecklistItem checked>
                    Dados de motoristas (CPF, CNH, telefone) compartilhados via Google Sheets.
                  </ChecklistItem>
                  <ChecklistItem checked>
                    Ausência de política de expiração automática de documentos.
                  </ChecklistItem>
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
                  <ChecklistItem checked>
                    Dependência de pessoa única para suporte e manutenção da planilha.
                  </ChecklistItem>
                  <ChecklistItem checked>
                    Risco de bloqueio operacional em época de safra de sementes.
                  </ChecklistItem>
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
      ) : (
        /* Deterministic Rules Simulator View */
        <Card className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-grey-900">
              Simulador de Regras de Triagem (Determinístico)
            </h3>
            <p className="text-xs text-grey-500 mt-1">
              Avalie previamente uma descrição de chamado para simular o score de risco e as regras disparadas.
            </p>
          </div>

          <div>
            <Label>Texto de Descrição do Chamado / Solução:</Label>
            <Textarea
              rows={5}
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              className="font-mono"
            />
          </div>

          <Button size="sm" onClick={runDeterministicTriage} leftIcon={<Sliders className="w-4 h-4" />}>
            Avaliar por Regras
          </Button>

          {simResult && (
            <div className="p-4 rounded-lg border border-grey-200 bg-grey-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-grey-900">Resultado da Simulação:</span>
                <span className="text-sm font-black text-grey-900 font-mono">
                  {simResult.score} pontos ({simResult.level})
                </span>
              </div>
              <div className="text-xs text-grey-700">
                <div className="font-semibold mb-1">Regras Acionadas ({simResult.rules.length}):</div>
                <div className="space-y-1.5">
                  {simResult.rules.map((r: string, idx: number) => (
                    <ChecklistItem key={idx} checked>
                      {r}
                    </ChecklistItem>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
