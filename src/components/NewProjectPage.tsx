import React, { useEffect, useState } from 'react';
import { Sparkles, Server } from 'lucide-react';
import {
  SolutionProject,
  ActionItem,
  RiskCriterion,
  ProjectType,
  GenerationTool,
  UserRole
} from '../types';
import { calculateRiskLevel } from '../utils/riskCalculations';
import { getDefaultEstimationInputs } from '../utils/estimation';
import { PROJECT_TYPE_INFO, DISCOUNTS_CATALOG } from '../data/estimationCatalog';
import { can } from '../utils/permissions';
import { getActiveConfig } from '../config/governanceConfig';
import { Card, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Field, Input, Select, Textarea } from './ui/FormField';
import { PageHeader } from './ui/PageHeader';
import { PageContainer } from './ui/PageContainer';

interface NewProjectPageProps {
  userRole: UserRole;
  onAddProject: (project: SolutionProject) => void;
  onNavigateToPortfolio: () => void;
}

export const NewProjectPage: React.FC<NewProjectPageProps> = ({
  userRole,
  onAddProject,
  onNavigateToPortfolio
}) => {
  const canCreate = can('create_project', userRole);
  const { departments: departmentOptions, generationTools: generationToolOptions } =
    getActiveConfig().auxiliaryLists;

  useEffect(() => {
    if (!canCreate) onNavigateToPortfolio();
  }, [canCreate, onNavigateToPortfolio]);

  const [name, setName] = useState('');
  const [department, setDepartment] = useState(departmentOptions[0] || 'Controladoria & Finanças');
  const [businessResp, setBusinessResp] = useState('');
  const [techResp, setTechResp] = useState('');
  const [objective, setObjective] = useState('');
  const [assetIdInput, setAssetIdInput] = useState('');
  const [glpiTicketIdInput, setGlpiTicketIdInput] = useState('');
  const [hasLgpd, setHasLgpd] = useState(true);
  const [hasConfidential, setHasConfidential] = useState(true);
  const [hasErp, setHasErp] = useState(true);
  const [isSheetsDrive, setIsSheetsDrive] = useState(true);
  const [hasExternalUsers, setHasExternalUsers] = useState(false);
  const [impact, setImpact] = useState<'Crítico' | 'Alto' | 'Médio' | 'Baixo'>('Crítico');
  const [hasDoc, setHasDoc] = useState(false);

  // Eixo 2: Tipo Técnico & Vibe Coding
  const [projectType, setProjectType] = useState<ProjectType>('A');
  const [generationTool, setGenerationTool] = useState<GenerationTool>(
    generationToolOptions[0] || 'Gemini (copia-e-cola)'
  );
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [declaredDiscounts, setDeclaredDiscounts] = useState<Record<string, boolean>>({
    D1: false,
    D2: false,
    D3: false,
    D4: false
  });

  if (!canCreate) return null;

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

    const randomId =
      assetIdInput.trim() ||
      'ATIVO-' + department.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    const glpiTicketId = glpiTicketIdInput.trim() || `CH-2026-${Math.floor(1200 + Math.random() * 800)}`;

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
      glpiTicketId,
      assetId: randomId,
      department,
      businessResponsible: businessResp || 'Não informado',
      technicalResponsible: techResp || 'Não informado',
      status: 'Em Adequação',
      createdAt: new Date().toLocaleDateString('pt-BR') + ' 10:00',
      lastUpdated: new Date().toLocaleDateString('pt-BR') + ' 10:00',
      stageEnteredAt: new Date().toISOString().split('T')[0],
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
      // Eixo 2 & Governança
      projectType,
      generationTool,
      govStage: 'E0',
      stage: 'Levantamento & Ficha',
      executivePriority: 'P2 - Média',
      isPriorityForManagement: false,
      estimation: defaultEstimation,
      technicalDoc: {
        version: '1.0.0',
        classification:
          score > getActiveConfig().riskThresholds.altoMax
            ? 'Solução Corporativa Crítica'
            : 'Solução Departamental',
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
  };

  return (
    <PageContainer>
      <PageHeader
        title="Cadastrar Nova Solução de Outro Setor"
        subtitle="Preencha as informações do chamado (GLPI) para classificar a criticidade e gerar o plano de governança."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-sm font-bold text-grey-900">Identificação</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da Solução">
              <Input
                required
                placeholder="Ex: Planilha de Montagem de Cargas CTVs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Área Demandante">
              <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departmentOptions.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Responsável de Negócio">
              <Input
                required
                placeholder="Ex: Gerente ou Analista do setor"
                value={businessResp}
                onChange={(e) => setBusinessResp(e.target.value)}
              />
            </Field>

            <Field label="Responsável Técnico / Desenvolvedor">
              <Input
                required
                placeholder="Ex: Criador do script / planilha"
                value={techResp}
                onChange={(e) => setTechResp(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Objetivo e Processo">
            <Textarea
              rows={3}
              required
              placeholder="Descreva o que a solução faz e quais processos manuais ela substitui..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </Field>

          <div className="pt-3 border-t border-grey-200">
            <span className="text-xs font-bold text-grey-700 block mb-2">
              Origem no GLPI (opcional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Identificador do Ativo (GLPI)">
                <Input
                  placeholder="Ex: ATIVO-LOG-231 (deixe em branco para gerar um novo)"
                  value={assetIdInput}
                  onChange={(e) => setAssetIdInput(e.target.value)}
                  className="font-mono"
                />
              </Field>

              <Field label="Nº do Chamado GLPI de Origem">
                <Input
                  placeholder="Ex: CH-2024-0587 (deixe em branco para gerar um novo)"
                  value={glpiTicketIdInput}
                  onChange={(e) => setGlpiTicketIdInput(e.target.value)}
                  className="font-mono"
                />
              </Field>
            </div>
            <p className="text-xs text-grey-400 mt-2 italic">
              * Se esta solução já existe e está em andamento no GLPI e a gestão dela está migrando
              para cá, informe o ID do ativo e o número do chamado originais para manter a
              rastreabilidade. Deixe os dois campos em branco para uma solução nova (IDs serão
              gerados automaticamente).
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-bold text-grey-900">
            Critérios de Governança & Diagnóstico de Risco
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-grey-700">
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

          <div className="pt-2 flex items-center gap-2 text-sm">
            <span className="font-semibold text-grey-700">Impacto se parar amanhã:</span>
            <Select
              value={impact}
              onChange={(e) => setImpact(e.target.value as any)}
              className="w-auto font-semibold"
            >
              <option value="Crítico">Crítico (+5 pts)</option>
              <option value="Alto">Alto (+3 pts)</option>
              <option value="Médio">Médio (+1 pt)</option>
              <option value="Baixo">Baixo (+0 pts)</option>
            </Select>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-grey-900 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-brand-dark" />
              <span>Arquitetura da Solução & Stack Técnica</span>
            </h2>
            <span className="text-xs text-grey-500 font-mono">
              Base: {projectType === 'B' ? '19.0h' : '15.5h'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['A', 'B', 'C'] as ProjectType[]).map((tKey) => {
              const info = PROJECT_TYPE_INFO[tKey];
              const isSelected = projectType === tKey;
              return (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setProjectType(tKey)}
                  className={`text-left p-3 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'border-brand-main bg-brand-lighter text-brand-dark font-semibold ring-1 ring-brand-main'
                      : 'border-grey-200 bg-white text-grey-700 hover:bg-grey-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">{info.label}</span>
                    {info.statusBadge && (
                      <span className="text-[10px] bg-warning-50 text-warning-600 px-1.5 py-0.5 rounded-full font-bold">
                        {info.statusBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-grey-500 mt-1 line-clamp-2">{info.shortDesc}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ferramenta de Geração / IA">
              <Select
                value={generationTool}
                onChange={(e) => setGenerationTool(e.target.value as GenerationTool)}
              >
                {generationToolOptions.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Data de Início da Contagem">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>

          <div className="pt-3 border-t border-grey-200">
            <span className="text-xs font-bold text-grey-700 block mb-2">
              Declarações no Cadastro (auditadas pela T.I na etapa E1):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-grey-700">
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
            <p className="text-xs text-grey-400 mt-2 italic">
              * Conforme governança da T.I: o cadastro é declaração, não fato consumado. Descontos
              só se tornam efetivos após confirmação na E1.
            </p>
          </div>

          <CardFooter>
            <Button type="button" color="secondary" onClick={onNavigateToPortfolio}>
              Cancelar
            </Button>
            <Button type="submit" color="primary" leftIcon={<Sparkles className="w-4 h-4" />}>
              Gerar Ativo GLPI & Diagnóstico
            </Button>
          </CardFooter>
        </Card>
      </form>
    </PageContainer>
  );
};
