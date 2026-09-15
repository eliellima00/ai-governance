import React, { useState } from 'react';
import { X, Sparkles, Building2, CheckCircle2, ShieldAlert, Server, Clock } from 'lucide-react';
import {
  SolutionProject,
  ActionItem,
  RiskCriterion,
  RiskLevel,
  ProjectType,
  GenerationTool,
  GovStage
} from '../types';
import { calculateRiskLevel } from '../utils/riskCalculations';
import { getDefaultEstimationInputs } from '../utils/estimation';
import { PROJECT_TYPE_INFO, DISCOUNTS_CATALOG } from '../data/estimationCatalog';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: SolutionProject) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Controladoria');
  const [businessResp, setBusinessResp] = useState('');
  const [techResp, setTechResp] = useState('');
  const [objective, setObjective] = useState('');
  const [hasLgpd, setHasLgpd] = useState(true);
  const [hasConfidential, setHasConfidential] = useState(true);
  const [hasErp, setHasErp] = useState(true);
  const [isSheetsDrive, setIsSheetsDrive] = useState(true);
  const [hasExternalUsers, setHasExternalUsers] = useState(false);
  const [impact, setImpact] = useState<'Crítico' | 'Alto' | 'Médio' | 'Baixo'>('Crítico');
  const [hasDoc, setHasDoc] = useState(false);

  // Eixo 2: Tipo Técnico & Vibe Coding
  const [projectType, setProjectType] = useState<ProjectType>('A');
  const [generationTool, setGenerationTool] = useState<GenerationTool>('Gemini (copia-e-cola)');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [declaredDiscounts, setDeclaredDiscounts] = useState<Record<string, boolean>>({
    D1: false,
    D2: false,
    D3: false,
    D4: false
  });

  if (!isOpen) return null;

  const handleToggleDeclaredDiscount = (id: string) => {
    setDeclaredDiscounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate score based on criteria
    let score = 0;
    let seguranca = 0;
    let lgpd = 0;
    let operacional = 0;

    const criteria: RiskCriterion[] = [];
    const actionPlan: ActionItem[] = [];
    let actId = 1;

    if (hasLgpd) {
      score += 5;
      lgpd += 5;
      criteria.push({
        id: 'c-lgpd',
        criterion: 'Utiliza dados pessoais (LGPD)',
        evidence: 'Sim (Informado no chamado inicial)',
        points: 5,
        dimension: 'LGPD'
      });
      actionPlan.push({
        id: actId++,
        title: 'Adequação LGPD e mapeamento de dados pessoais',
        responsible: 'TI / Compliance',
        deadline: '30 dias',
        priority: 'Alta',
        status: 'Aguardando',
        riskPointsImpact: 3,
        dimension: 'LGPD'
      });
    }

    if (hasConfidential) {
      score += 5;
      seguranca += 5;
      criteria.push({
        id: 'c-conf',
        criterion: 'Utiliza dados confidenciais',
        evidence: 'Sim (Informado no chamado inicial)',
        points: 5,
        dimension: 'Segurança'
      });
      actionPlan.push({
        id: actId++,
        title: 'Controle de acesso granular e proteção contra vazamento',
        responsible: 'TI Segurança',
        deadline: '15 dias',
        priority: 'Crítica',
        status: 'Aguardando',
        riskPointsImpact: 4,
        dimension: 'Segurança'
      });
    }

    if (hasErp) {
      score += 4;
      operacional += 4;
      criteria.push({
        id: 'c-erp',
        criterion: 'Integra com sistemas corporativos (ERP Senior)',
        evidence: 'Sim (API ou banco de dados)',
        points: 4,
        dimension: 'Operacional'
      });
      actionPlan.push({
        id: actId++,
        title: 'Autenticação segura e rotação de credenciais de integração',
        responsible: 'TI Dev',
        deadline: '20 dias',
        priority: 'Crítica',
        status: 'Aguardando',
        riskPointsImpact: 3,
        dimension: 'Segurança'
      });
    }

    if (isSheetsDrive) {
      score += 3;
      seguranca += 3;
      criteria.push({
        id: 'c-drive',
        criterion: 'Utiliza conta/plataforma externa ou Sheets não gerenciado',
        evidence: 'Sim (Google Sheets / Drive)',
        points: 3,
        dimension: 'Segurança'
      });
      actionPlan.push({
        id: actId++,
        title: 'Migração para Shared Drive corporativo e rotina de backup',
        responsible: 'TI Infra',
        deadline: '10 dias',
        priority: 'Alta',
        status: 'Aguardando',
        riskPointsImpact: 2,
        dimension: 'Operacional'
      });
    }

    if (hasExternalUsers) {
      score += 4;
      seguranca += 4;
      criteria.push({
        id: 'c-ext',
        criterion: 'Utilizado por terceiros ou mais de 20 usuários',
        evidence: 'Sim (Parceiros ou clientes externos)',
        points: 4,
        dimension: 'Segurança'
      });
      actionPlan.push({
        id: actId++,
        title: 'Implementação de autenticação e logs de auditoria externa',
        responsible: 'TI Dev',
        deadline: '25 dias',
        priority: 'Alta',
        status: 'Aguardando',
        riskPointsImpact: 3,
        dimension: 'Segurança'
      });
    }

    if (impact === 'Crítico') {
      score += 5;
      operacional += 5;
      criteria.push({
        id: 'c-impact',
        criterion: 'Impacto alto/crítico em caso de indisponibilidade',
        evidence: 'Crítico para a operação',
        points: 5,
        dimension: 'Operacional'
      });
      actionPlan.push({
        id: actId++,
        title: 'Definição de responsável formal de sustentação e homologação',
        responsible: 'Gestão TI',
        deadline: '7 dias',
        priority: 'Alta',
        status: 'Aguardando',
        riskPointsImpact: 3,
        dimension: 'Operacional'
      });
    }

    if (!hasDoc) {
      score += 2;
      operacional += 2;
      criteria.push({
        id: 'c-doc',
        criterion: 'Documentação inexistente',
        evidence: 'Sem documentação formal inicial',
        points: 2,
        dimension: 'Operacional'
      });
      actionPlan.push({
        id: actId++,
        title: 'Elaborar Documentação Técnica e Funcional Padrão ATTO',
        responsible: techResp || 'Dev Responsável',
        deadline: '15 dias',
        priority: 'Alta',
        status: 'Aguardando',
        riskPointsImpact: 2,
        dimension: 'Governança'
      });
    }

    const randomId = 'ATIVO-' + department.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    
    // Preparar inputs de estimativa e descontos declarados
    const defaultEstimation = getDefaultEstimationInputs(projectType, startDate);
    defaultEstimation.generationTool = generationTool;
    defaultEstimation.discounts = defaultEstimation.discounts.map((d) => ({
      ...d,
      declared: !!declaredDiscounts[d.id],
      confirmed: false // Cadastro é declaração, não fato!
    }));

    const newProject: SolutionProject = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: name || 'Nova Solução Setorial',
      glpiTicketId: `CH-2026-${Math.floor(1200 + Math.random() * 800)}`,
      assetId: randomId,
      department,
      businessResponsible: businessResp || 'Não informado',
      technicalResponsible: techResp || 'Não informado',
      status: 'Em Adequação',
      createdAt: new Date().toLocaleDateString('pt-BR') + ' 10:00',
      lastUpdated: new Date().toLocaleDateString('pt-BR') + ' 10:00',
      registeredBy: 'Triagem Automática GLPI + IA',
      groupEncargado: 'T.I - Sistemas Corporativos & Governança',
      userGroup: `Dir. Operacional > ${department}`,
      objective: objective || 'Solução departamental para automação de processos.',
      initialDoc: 'Registrado via triagem com cálculo prévio de criticidade.',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://glpi.attosementes.com.br/front/computer.form.php?id=${randomId}`,
      links: {},
      initialScore: score,
      initialRisk: calculateRiskLevel(score),
      dimensionsInitial: { seguranca, lgpd, operacional },
      criteria,
      actionPlan,
      sheetsCatalog: [],
      // Eixo 2 & Governança
      projectType,
      generationTool,
      govStage: 'E0',
      estimation: defaultEstimation,
      technicalDoc: {
        version: '1.0.0',
        classification: score > 20 ? 'Solução Corporativa Crítica' : 'Solução Departamental',
        frontend: 'Interface Setorial',
        backend: 'Script / Automação',
        database: isSheetsDrive ? 'Google Sheets / Drive' : 'Banco Relacional',
        integrations: hasErp ? 'ERP Senior Sapiens' : 'Arquivos Locais',
        pdfGeneration: 'Conforme demanda',
        emailDispatch: 'Notificações por e-mail',
        hosting: 'Google Workspace ATTO',
        environments: 'Homologação / Produção',
        domain: 'Interno',
        aiAssistance: generationTool,
        backupData: 'Snapshot diário',
        backupCode: 'GitHub grupoatto',
        incidentHandling: 'Fila GLPI T.I Governança',
        featureRollout: 'Validação prévia',
        versionControl: 'Git',
        contingency: 'Processo manual de contingência',
        maturity: 'Inicial',
        personalDataSummary: hasLgpd ? 'Trata dados pessoais' : 'Não se aplica',
        pdfStorageSummary: 'Drive corporativo restrito',
        legalBasis: 'Execução de atividades corporativas',
        confidentialDataSummary: hasConfidential ? 'Trata informações confidenciais do setor' : 'Baixa',
        retentionPolicy: 'Conforme política de retenção da área',
        logsSummary: 'Logs de execução básicos',
        accessControlSummary: 'Controle de acesso por grupo de usuários',
        accountsSummary: 'Contas corporativas @attosementes.com.br',
        credentialsSummary: 'Secret Manager'
      }
    };

    onAddProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-grey-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-grey-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-grey-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-grey-900">
                Cadastrar Nova Solução de Outro Setor (GLPI + Diagnóstico IA)
              </h3>
              <p className="text-xs text-grey-500">
                Preencha as informações do chamado para classificar a criticidade e gerar o plano de governança.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-grey-400 hover:text-grey-600 p-1 font-bold text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Identificação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-grey-700 block mb-1">Nome da Solução:</label>
              <input
                type="text"
                required
                placeholder="Ex: Planilha de Montagem de Cargas CTVs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:ring-2 focus:ring-brand-main focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-grey-700 block mb-1">Área Demandante:</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs bg-white focus:outline-hidden"
              >
                <option value="Logística / Expedição">Logística / Expedição</option>
                <option value="Controladoria & Finanças">Controladoria & Finanças</option>
                <option value="P&D / Laboratório Qualidade">P&D / Laboratório Qualidade</option>
                <option value="Agronomia / Produção de Campo">Agronomia / Produção de Campo</option>
                <option value="Comercial & Vendas (CTVs)">Comercial & Vendas (CTVs)</option>
                <option value="Suprimentos & Compras">Suprimentos & Compras</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-grey-700 block mb-1">Responsável de Negócio:</label>
              <input
                type="text"
                required
                placeholder="Ex: Gerente ou Analista do setor"
                value={businessResp}
                onChange={(e) => setBusinessResp(e.target.value)}
                className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-grey-700 block mb-1">Responsável Técnico / Desenvolvedor:</label>
              <input
                type="text"
                required
                placeholder="Ex: Criador do script / planilha"
                value={techResp}
                onChange={(e) => setTechResp(e.target.value)}
                className="w-full px-3 py-1.5 border border-grey-300 rounded text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-grey-700 block mb-1">Objetivo e Processo:</label>
            <textarea
              rows={3}
              required
              placeholder="Descreva o que a solução faz e quais processos manuais ela substitui..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full p-2 border border-grey-300 rounded text-xs focus:outline-hidden"
            />
          </div>

          {/* Perguntas de Criticidade e Risco */}
          <div className="bg-grey-50 p-3.5 rounded-lg border border-grey-200 space-y-2.5">
            <span className="font-bold text-grey-800 block text-xs">
              Critérios de Governança & Diagnóstico de Risco:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-grey-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasLgpd}
                  onChange={(e) => setHasLgpd(e.target.checked)}
                  className="rounded text-brand-main"
                />
                <span>Trata dados pessoais (LGPD) (+5 pts)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasConfidential}
                  onChange={(e) => setHasConfidential(e.target.checked)}
                  className="rounded text-brand-main"
                />
                <span>Trata dados confidenciais (+5 pts)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasErp}
                  onChange={(e) => setHasErp(e.target.checked)}
                  className="rounded text-brand-main"
                />
                <span>Integra com ERP Senior / Sistemas (+4 pts)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSheetsDrive}
                  onChange={(e) => setIsSheetsDrive(e.target.checked)}
                  className="rounded text-brand-main"
                />
                <span>Usa Google Sheets / Drive pessoal (+3 pts)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasExternalUsers}
                  onChange={(e) => setHasExternalUsers(e.target.checked)}
                  className="rounded text-brand-main"
                />
                <span>Usado por terceiros externos (+4 pts)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hasDoc}
                  onChange={(e) => setHasDoc(!e.target.checked)}
                  className="rounded text-brand-main"
                />
                <span>Documentação inexistente (+2 pts)</span>
              </label>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <span className="font-semibold text-grey-700">Impacto se parar amanhã:</span>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as any)}
                className="px-2 py-1 bg-white border border-grey-300 rounded font-semibold text-xs text-grey-800"
              >
                <option value="Crítico">Crítico (+5 pts)</option>
                <option value="Alto">Alto (+3 pts)</option>
                <option value="Médio">Médio (+1 pt)</option>
                <option value="Baixo">Baixo (+0 pts)</option>
              </select>
            </div>
          </div>

          {/* Eixo 2: Tipo Técnico, Ferramenta & Declarações de Entrada */}
          <div className="bg-grey-50 p-3.5 rounded-lg border border-grey-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-grey-800 text-xs flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-brand-dark" />
                <span>Eixo 2 — Tipo Técnico & Vibe Coding</span>
              </span>
              <span className="text-[10px] text-grey-500 font-mono">
                Base: {projectType === 'B' ? '19.0h' : '15.5h'}
              </span>
            </div>

            {/* Seletor Tipo A / B / C */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['A', 'B', 'C'] as ProjectType[]).map((tKey) => {
                const info = PROJECT_TYPE_INFO[tKey];
                const isSelected = projectType === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setProjectType(tKey)}
                    className={`text-left p-2.5 rounded-full border text-xs transition-all ${
                      isSelected
                        ? 'border-brand-main bg-brand-lighter text-brand-dark font-semibold ring-1 ring-brand-main'
                        : 'border-grey-200 bg-white text-grey-700 hover:bg-grey-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px]">Tipo {tKey}</span>
                      {info.statusBadge && (
                        <span className="text-[9px] bg-warning-50 text-warning-600 px-1 rounded font-bold">
                          {info.statusBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-grey-500 mt-1 line-clamp-2">
                      {info.shortDesc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold text-grey-700 block mb-1">Ferramenta de Geração / IA:</label>
                <select
                  value={generationTool}
                  onChange={(e) => setGenerationTool(e.target.value as GenerationTool)}
                  className="w-full px-2.5 py-1.5 border border-grey-300 rounded text-xs bg-white focus:outline-hidden"
                >
                  <option value="Codex">Codex</option>
                  <option value="Claude Code">Claude Code</option>
                  <option value="Gemini (copia-e-cola)">Gemini (copia-e-cola)</option>
                  <option value="ChatGPT">ChatGPT</option>
                  <option value="Manual">Manual</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-grey-700 block mb-1">Data de Início da Contagem:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-grey-300 rounded text-xs bg-white font-mono focus:outline-hidden"
                />
              </div>
            </div>

            {/* Declarações no cadastro */}
            <div className="pt-2 border-t border-grey-200">
              <span className="text-[11px] font-bold text-grey-700 block mb-1.5">
                Declarações no Cadastro (auditadas pela T.I na etapa E1):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-grey-700">
                {DISCOUNTS_CATALOG.map((disc) => (
                  <label key={disc.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!declaredDiscounts[disc.id]}
                      onChange={() => handleToggleDeclaredDiscount(disc.id)}
                      className="rounded text-brand-main w-3.5 h-3.5"
                    />
                    <span>{disc.label} (-{disc.hours}h)</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-grey-400 mt-1 italic">
                * Conforme governança da T.I: O cadastro é declaração, não fato consumado. Descontos só se tornam efetivos após confirmação na E1.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-grey-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-grey-200 hover:bg-grey-300 text-grey-800 font-semibold rounded-full"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-dark hover:bg-brand-dark text-white font-semibold rounded-full shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Ativo GLPI & Diagnóstico</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
