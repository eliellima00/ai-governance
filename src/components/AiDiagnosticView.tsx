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
  Home,
  ArrowLeft,
  Workflow,
  Check,
  Sparkles,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { SolutionProject, RiskCriterion, ProjectType } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';
import { PROJECT_TYPE_INFO } from '../data/estimationCatalog';

interface AiDiagnosticViewProps {
  project: SolutionProject;
  onNavigateHome?: () => void;
  onNavigateToActionPlan: () => void;
  onUpdateProject?: (updatedProject: SolutionProject) => void;
}

export const AiDiagnosticView: React.FC<AiDiagnosticViewProps> = ({
  project,
  onNavigateHome,
  onNavigateToActionPlan,
  onUpdateProject
}) => {
  const [activeTab, setActiveTab] = useState<'official' | 'simulator'>('official');
  const [appliedTypeSuccess, setAppliedTypeSuccess] = useState(false);

  // Deterministic Keyword-based Project Type Detection (No LLM)
  const typeSuggestion = useMemo(() => {
    const fullText = `${project.name} ${project.objective} ${project.initialDoc} ${
      project.technicalDoc?.backend || ''
    } ${project.technicalDoc?.database || ''} ${project.technicalDoc?.classification || ''} ${
      project.technicalDoc?.frontend || ''
    } ${project.technicalDoc?.integrations || ''}`.toLowerCase();

    const typeBKeywords = [
      'docker',
      'vps',
      'linux',
      'node',
      'fastify',
      'express',
      'python',
      'django',
      'fastapi',
      'postgres',
      'postgresql',
      'sql',
      'supabase',
      'cloud run',
      'api rest'
    ];
    const typeCKeywords = [
      'whatsapp',
      'bot',
      'blip',
      'z-api',
      'meta cloud',
      'webhook',
      'n8n',
      'make',
      'zapier',
      'bubble',
      'power automate',
      'chatbot'
    ];
    const typeAKeywords = [
      'sheets',
      'planilha',
      'apps script',
      'excel',
      'vba',
      'google drive',
      'appsheet',
      'macros'
    ];

    const matchedB = typeBKeywords.filter((k) => fullText.includes(k));
    const matchedC = typeCKeywords.filter((k) => fullText.includes(k));
    const matchedA = typeAKeywords.filter((k) => fullText.includes(k));

    if (matchedC.length > 0 && matchedC.length >= matchedB.length) {
      return {
        suggestedType: 'C' as ProjectType,
        confidence: matchedC.length >= 2 ? 'Alta' : 'Média',
        matchedKeywords: matchedC,
        explanation:
          'Detectados componentes de bots, mensageria (WhatsApp/Meta), webhooks ou ferramentas de integração Low-Code.'
      };
    }

    if (matchedB.length > 0) {
      return {
        suggestedType: 'B' as ProjectType,
        confidence: matchedB.length >= 2 ? 'Alta' : 'Média',
        matchedKeywords: matchedB,
        explanation:
          'Detectada pilha com código customizado (Node/Python/Docker/VPS), banco relacional ou APIs nativas.'
      };
    }

    return {
      suggestedType: 'A' as ProjectType,
      confidence: matchedA.length > 0 ? 'Alta' : 'Média',
      matchedKeywords: matchedA.length > 0 ? matchedA : ['planilhas / scripts de escritório'],
      explanation:
        'Detectada arquitetura leve baseada em Google Sheets, Google Apps Script, macros ou automações departamentais.'
    };
  }, [project]);

  const handleApplySuggestedType = () => {
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        projectType: typeSuggestion.suggestedType
      });
      setAppliedTypeSuccess(true);
      setTimeout(() => setAppliedTypeSuccess(false), 2500);
    }
  };

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
      {/* Top Breadcrumb & Return to Home Bar */}
      {onNavigateHome && (
        <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-2xs text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold hover:underline"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Início (Dados do Ativo)</span>
            </button>
            <span>›</span>
            <span className="text-slate-800 font-semibold">Diagnóstico de Risco (regras)</span>
          </div>

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md border border-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar p/ Ficha do Ativo</span>
          </button>
        </div>
      )}

      {/* Sub-Header & Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Diagnóstico de Risco por Regras
              </span>
              <span className="text-xs text-slate-500 font-mono">Motor Determinístico T.I</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Parecer Técnico de Criticidade & Avaliação Inicial
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Classificação por regras a partir do cadastro — declaração a confirmar na Reunião de Entendimento (E1).
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('official')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'official'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parecer Oficial do Chamado
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-white text-emerald-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulador de Regras</span>
          </button>
        </div>
      </div>

      {activeTab === 'official' ? (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score */}
            <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-xs relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-10">
                <ShieldAlert className="w-24 h-24 text-white" />
              </div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Pontuação Total por Regras
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-white">{project.initialScore}</span>
                <span className="text-xs text-red-400 font-semibold uppercase">pontos</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${riskColor.badge} flex items-center gap-1`}>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  Risco Inicial: {project.initialRisk}
                </span>
              </div>
            </div>

            {/* Category Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                Categoria da Solução
              </span>
              <div className="text-lg font-bold text-slate-900 mt-1">Solução Corporativa</div>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                Mais de 20 usuários, acesso por terceiros e impacto na operação de embarque.
              </p>
            </div>

            {/* TI Mandate */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 shadow-xs">
              <span className="text-xs uppercase tracking-wider text-amber-800 font-semibold block">
                Aprovação da T.I
              </span>
              <div className="text-lg font-bold text-amber-900 mt-1 flex items-center gap-1.5">
                <AlertOctagon className="w-5 h-5 text-amber-700" />
                <span>Obrigatória</span>
              </div>
              <p className="text-xs text-amber-800 mt-2">
                Exige esteira com Reunião de Entendimento (E1) e homologação.
              </p>
            </div>

            {/* Security Audit */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 shadow-xs">
              <span className="text-xs uppercase tracking-wider text-emerald-800 font-semibold block">
                Revisão de Segurança
              </span>
              <div className="text-lg font-bold text-emerald-900 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>Necessária</span>
              </div>
              <p className="text-xs text-emerald-800 mt-2">
                Controle de acessos, segregação de credenciais e proteção LGPD.
              </p>
            </div>
          </div>

          {/* Eixo 2 Technical Type Suggestion Box */}
          <div className="bg-white border border-purple-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                      Sugestão de Eixo 2 (Tipo Técnico)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Confiança: <strong>{typeSuggestion.confidence}</strong>
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-slate-900">
                    Sugestão Baseada em Palavras-Chave de Tecnologia:{' '}
                    <span className="text-purple-800">
                      Tipo {typeSuggestion.suggestedType} ({PROJECT_TYPE_INFO[typeSuggestion.suggestedType].name})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {typeSuggestion.explanation}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-500 font-medium">Termos identificados:</span>
                    {typeSuggestion.matchedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200 font-bold"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <div className="text-xs text-slate-500">
                  Tipo Atual: <strong>Tipo {project.projectType || 'A'}</strong>
                </div>
                {project.projectType !== typeSuggestion.suggestedType ? (
                  <button
                    onClick={handleApplySuggestedType}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    {appliedTypeSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tipo Aplicado!</span>
                      </>
                    ) : (
                      <>
                        <Workflow className="w-3.5 h-3.5" />
                        <span>Aplicar Tipo {typeSuggestion.suggestedType}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tipo Alinhado</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Dimensions Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-800" />
              <span>Detalhamento por Dimensão de Risco (Matriz Shadow IT)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Segurança */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Segurança da Informação</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {project.dimensionsInitial.seguranca} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (project.dimensionsInitial.seguranca / 15) * 100)}%` }}
                  ></div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 mt-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Credenciais de bancos de dados gravadas em scripts abertos.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Tokens de API de ERP sem expiração nem segregação de perfil.</span>
                  </li>
                </ul>
              </div>

              {/* LGPD */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span>Privacidade & LGPD</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {project.dimensionsInitial.lgpd} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (project.dimensionsInitial.lgpd / 10) * 100)}%` }}
                  ></div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 mt-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Dados de motoristas (CPF, CNH, telefone) compartilhados via Google Sheets.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Ausência de política de expiração automática de documentos.</span>
                  </li>
                </ul>
              </div>

              {/* Operacional */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Continuidade & Operação</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {project.dimensionsInitial.operacional} pts
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (project.dimensionsInitial.operacional / 10) * 100)}%` }}
                  ></div>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 mt-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Dependência de pessoa única para suporte e manutenção da planilha.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Risco de bloqueio operacional em época de safra de sementes.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Criteria Evaluation Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Critérios Determinísticos Pontuados ({project.criteria.length} regras)
              </h3>
              <button
                onClick={onNavigateToActionPlan}
                className="text-xs text-emerald-800 font-bold hover:underline"
              >
                Ver Plano de Ação & Mitigações →
              </button>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600">
                  <th className="py-2.5 px-4 font-semibold">Critério Avaliado</th>
                  <th className="py-2.5 px-4 font-semibold">Dimensão</th>
                  <th className="py-2.5 px-4 font-semibold">Evidência / Justificativa</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {project.criteria.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.criterion}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          c.dimension === 'Segurança'
                            ? 'bg-red-50 text-red-700'
                            : c.dimension === 'LGPD'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {c.dimension}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.evidence}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      +{c.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Deterministic Rules Simulator View */
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Simulador de Regras de Triagem (Determinístico)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Avalie previamente uma descrição de chamado para simular o score de risco e as regras disparadas.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Texto de Descrição do Chamado / Solução:
            </label>
            <textarea
              rows={5}
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={runDeterministicTriage}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <Sliders className="w-4 h-4" />
            <span>Avaliar por Regras</span>
          </button>

          {simResult && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Resultado da Simulação:</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {simResult.score} pontos ({simResult.level})
                </span>
              </div>
              <div className="text-xs text-slate-700">
                <div className="font-semibold mb-1">Regras Acionadas ({simResult.rules.length}):</div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {simResult.rules.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
