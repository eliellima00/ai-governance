import React, { useState } from 'react';
import {
  Save,
  ExternalLink,
  GitBranch,
  Sparkles,
  FileSpreadsheet,
  Code2,
  CheckCircle,
  HelpCircle,
  Clock,
  Building,
  Eye,
  Edit3,
  FileText,
  Workflow,
  Server,
  Database,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Lock,
  FolderArchive
} from 'lucide-react';
import { SolutionProject, ProjectTab, UserRole } from '../types';
import { getActiveConfig } from '../config/governanceConfig';
import { can } from '../utils/permissions';
import {
  Button,
  Card,
  Badge,
  Field,
  Input,
  Select,
  Textarea,
  Tabs,
  StatTile,
  SearchInput
} from './ui';

interface GlpiAssetViewProps {
  project: SolutionProject;
  residualScore: number;
  userRole: UserRole;
  onNavigateTab: (tab: ProjectTab) => void;
  onSave?: (updatedData: {
    name: string;
    status: any;
    technicalResponsible: string;
    groupEncargado: string;
    businessResponsible: string;
    objective: string;
    initialDoc: string;
    assetId: string;
    glpiTicketId: string;
  }) => void;
}

/** Instância única de QR Code (estilo unificado) usada tanto na Ficha GLPI quanto na Documentação Viva. */
const QrCodeBlock: React.FC<{ project: SolutionProject; caption: string }> = ({ project, caption }) => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-grey-700 mb-2">
      <span>Etiqueta & QR Code do ativo</span>
      <HelpCircle className="w-3.5 h-3.5 text-grey-400" />
    </div>
    <div className="w-32 h-32 bg-white p-2 rounded-lg border border-grey-300 mx-auto flex items-center justify-center shadow-2xs">
      <img src={project.qrCodeUrl} alt="QR Code Ativo GLPI" className="max-w-full max-h-full object-contain" />
    </div>
    <div className="mt-2 text-[11px] text-grey-500 truncate font-mono">{caption}</div>
  </div>
);

export const GlpiAssetView: React.FC<GlpiAssetViewProps> = ({
  project,
  residualScore,
  userRole,
  onNavigateTab,
  onSave
}) => {
  const { auxiliaryLists, featureFlags } = getActiveConfig();
  const showDataDictionary = !!featureFlags?.dataDictionary;
  const canEdit = can(userRole, 'edit_project_glpi');

  const [viewMode, setViewMode] = useState<'edit' | 'live_preview'>('edit');
  const [docSectionFilter, setDocSectionFilter] = useState<'all' | 'overview' | 'sheets' | 'ops' | 'security'>(
    'overview'
  );
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetCategory, setSheetCategory] = useState<string>('all');

  const [name, setName] = useState(project.name);
  const [assetIdVal, setAssetIdVal] = useState(project.assetId);
  const [glpiTicketIdVal, setGlpiTicketIdVal] = useState(project.glpiTicketId);
  const [status, setStatus] = useState(project.status);
  const [techResponsible, setTechResponsible] = useState(project.technicalResponsible);
  const [groupEncargado, setGroupEncargado] = useState(project.groupEncargado);
  const [userResponsible, setUserResponsible] = useState(project.businessResponsible);
  const [userGroup, setUserGroup] = useState(project.userGroup);
  const [objective, setObjective] = useState(project.objective);
  const [initialDoc, setInitialDoc] = useState(project.initialDoc);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

  const { technicalDoc, sheetsCatalog } = project;

  const filteredSheets = (sheetsCatalog || []).filter((sheet) => {
    if (sheetCategory !== 'all' && sheet.category !== sheetCategory) return false;
    if (
      sheetSearch &&
      !sheet.name.toLowerCase().includes(sheetSearch.toLowerCase()) &&
      !sheet.purpose.toLowerCase().includes(sheetSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const categories = Array.from(new Set((sheetsCatalog || []).map((s) => s.category)));

  const handleSave = () => {
    setIsSavedToast(true);
    if (onSave) {
      onSave({
        name,
        status,
        technicalResponsible: techResponsible,
        groupEncargado,
        businessResponsible: userResponsible,
        objective,
        initialDoc,
        assetId: assetIdVal,
        glpiTicketId: glpiTicketIdVal
      });
    }
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleCopyLivingDoc = () => {
    const text = `# DOCUMENTAÇÃO TÉCNICA E FUNCIONAL VIVA - ${name} (GLPI ID: ${project.assetId})
Status: ${status} | Chamado GLPI: ${project.glpiTicketId}
Área: ${project.department} (${userGroup})
Responsável Técnico: ${techResponsible} | Grupo: ${groupEncargado}
Responsável Negócio: ${userResponsible}
Classificação de Risco: ${residualScore} pts (${residualScore <= 5 ? 'Baixo' : residualScore <= 12 ? 'Médio' : residualScore <= 20 ? 'Alto' : 'Crítico'})

## 1. OBJETIVO & ESCOPO OPERACIONAL
${objective}

## 2. HISTÓRICO & DOCUMENTAÇÃO INICIAL
${initialDoc}

## 3. ARQUITETURA DE SOFTWARE & TOPOLOGIA
- Camada Apresentação (Frontend): ${technicalDoc?.frontend || 'Google Workspace WebApp'}
- Motor de Negócio (Backend): ${technicalDoc?.backend || 'Google Apps Script (~30k linhas)'}
- Base de Dados: ${technicalDoc?.database || 'Google Sheets (31 abas relacionais)'}
- Integrações ERP: ${technicalDoc?.integrations || 'API REST Senior Sapiens'}
- Repositório Git: ${project.links.githubRepo || 'grupoatto/portal-logistica'}
- Geração de Relatórios/PDF: ${technicalDoc?.pdfGeneration || 'Apps Script + Drive'}
- Disparo de E-mails: ${technicalDoc?.emailDispatch || 'Gmail API Corporativa'}

## 4. SUSTENTAÇÃO, CONTINUIDADE & BACKUP
- Backup de Dados: ${technicalDoc?.backupData || 'Snapshot diário automatizado'}
- Backup de Código: ${technicalDoc?.backupCode || 'GitHub Repositório'}
- Tratamento de Incidentes: ${technicalDoc?.incidentHandling || 'Chamados via GLPI'}
- Contingência Operacional: ${technicalDoc?.contingency || 'Planilha Base'}

## 5. SEGURANÇA, LGPD & GESTÃO DE ACESSOS
- Dados Pessoais: ${technicalDoc?.personalDataSummary || 'Motoristas, CPF, Placas de Veículos'}
- Base Legal: ${technicalDoc?.legalBasis || 'Execução de Contrato de Frete (Art. 7º, V, LGPD)'}
- Dados Confidenciais: ${technicalDoc?.confidentialDataSummary || 'Valores de fretes e contratos comerciais'}
- Política de Retenção: ${technicalDoc?.retentionPolicy || '5 anos para auditoria fiscal'}
- Controle de Acesso: ${technicalDoc?.accessControlSummary || 'Autenticação Google Workspace'}
${
  showDataDictionary
    ? `
## 6. DICIONÁRIO DE DADOS & CATÁLOGO DE ABAS (${sheetsCatalog?.length || 31} ABAS)
${(sheetsCatalog || []).map((s) => `- ${s.name} [${s.category}] (Sensibilidade: ${s.sensitivity}): ${s.purpose}`).join('\n')}
`
    : ''
}`;
    navigator.clipboard.writeText(text);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher: Ficha Cadastral GLPI vs. Documentação Viva & Técnica */}
      <Tabs<'edit' | 'live_preview'>
        items={[
          { id: 'edit', label: 'Ficha Cadastral GLPI' },
          { id: 'live_preview', label: 'Documentação Viva & Técnica' }
        ]}
        value={viewMode}
        onChange={setViewMode}
      />

      {/* VIEW MODE 1: Standard GLPI Asset Form View */}
      {viewMode === 'edit' && (
        <div className="bg-white border border-grey-200 rounded-lg shadow-xs overflow-hidden">
          {/* GLPI Header Bar */}
          <div className="bg-grey-100 border-b border-grey-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Building className="w-4 h-4 text-grey-600" />
              <span className="font-semibold text-grey-800 text-sm">Dados Principais do Ativo (GLPI)</span>
              <Badge className="bg-info-50 text-info-700 border-info-200 font-mono">
                ID: {project.assetId}
              </Badge>
              <Badge className="bg-brand-lighter text-brand-dark border-brand-light">
                Chamado: {project.glpiTicketId}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-grey-500">
              <button
                onClick={() => setViewMode('live_preview')}
                className="text-brand-dark hover:text-brand-main font-semibold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Ver Documentação Viva Completa
              </button>
              <span>•</span>
              <span>
                Cadastrado por: <strong className="text-grey-700">{project.registeredBy}</strong>
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: GLPI Form Inputs */}
              <div className="lg:col-span-9 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nome">
                    <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
                  </Field>

                  <Field label="Status">
                    <Select value={status} onChange={(e) => setStatus(e.target.value as any)} disabled={!canEdit}>
                      {auxiliaryLists.statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Identificador do Ativo (GLPI)">
                    <Input
                      value={assetIdVal}
                      onChange={(e) => setAssetIdVal(e.target.value)}
                      className="font-mono"
                      disabled={!canEdit}
                    />
                  </Field>

                  <Field label="Nº do Chamado GLPI de Origem">
                    <Input
                      value={glpiTicketIdVal}
                      onChange={(e) => setGlpiTicketIdVal(e.target.value)}
                      className="font-mono"
                      disabled={!canEdit}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Técnico encarregado">
                    <Input value={techResponsible} onChange={(e) => setTechResponsible(e.target.value)} disabled={!canEdit} />
                  </Field>

                  <Field label="Grupo encarregado">
                    <Input value={groupEncargado} onChange={(e) => setGroupEncargado(e.target.value)} disabled={!canEdit} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Usuário (Resp. Negócio)">
                    <Input value={userResponsible} onChange={(e) => setUserResponsible(e.target.value)} disabled={!canEdit} />
                  </Field>

                  <Field label="Grupo">
                    <Input value={userGroup} disabled readOnly />
                  </Field>
                </div>

                <Field label="Objetivo">
                  <div className="flex justify-end mb-1.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('live_preview')}
                      className="text-[11px] text-brand-dark font-semibold hover:underline"
                    >
                      Visualizar na Documentação Viva
                    </button>
                  </div>
                  <Textarea
                    rows={6}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="leading-relaxed"
                    disabled={!canEdit}
                  />
                </Field>

                <Field label="Documentação inicial">
                  <Textarea
                    rows={3}
                    value={initialDoc}
                    onChange={(e) => setInitialDoc(e.target.value)}
                    disabled={!canEdit}
                  />
                </Field>
              </div>

              {/* Right Side: QR Code, URL do Ativo & Links Rápidos */}
              <div className="lg:col-span-3 space-y-4">
                {/* QR Code */}
                <div className="border border-grey-200 rounded-lg p-4 bg-grey-50 shadow-xs">
                  <QrCodeBlock project={project} caption={`${project.assetId} | GLPI ATTO`} />
                </div>

                {/* Connected Resources */}
                <div className="border border-grey-200 rounded-lg p-3 bg-white space-y-2 text-xs">
                  <span className="font-bold text-grey-800 block text-[11px] uppercase tracking-wider">
                    Artefatos & Repositórios
                  </span>

                  {project.links.githubRepo && (
                    <a
                      href={project.links.githubRepo}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-grey-50 hover:bg-grey-100 border border-grey-200 text-grey-700 group transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <GitBranch className="w-3.5 h-3.5 text-grey-600" />
                        <span className="font-mono text-[11px] truncate">grupoatto/portal-logistica</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-grey-400 group-hover:text-grey-700 shrink-0" />
                    </a>
                  )}

                  {project.links.spreadsheet && (
                    <a
                      href={project.links.spreadsheet}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-grey-50 hover:bg-grey-100 border border-grey-200 text-grey-700 group transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-brand-main" />
                        <span className="truncate">Planilha Base (31 abas)</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-grey-400 group-hover:text-grey-700 shrink-0" />
                    </a>
                  )}

                  {project.links.script && (
                    <a
                      href={project.links.script}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-grey-50 hover:bg-grey-100 border border-grey-200 text-grey-700 group transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Code2 className="w-3.5 h-3.5 text-info-600" />
                        <span className="truncate">Apps Script (~30k linhas)</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-grey-400 group-hover:text-grey-700 shrink-0" />
                    </a>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setViewMode('live_preview')}
                    color="primary"
                    className="w-full"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Acessar Documentação Viva
                  </Button>

                  <Button
                    onClick={() => onNavigateTab('artifacts')}
                    color="secondary"
                    className="w-full"
                    leftIcon={<FolderArchive className="w-3.5 h-3.5 text-brand-dark" />}
                  >
                    Artefatos & Acompanhamento
                  </Button>

                  <Button
                    onClick={() => onNavigateTab('diagnostic')}
                    color="secondary"
                    className="w-full"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                  >
                    Diagnóstico IA de Risco
                  </Button>

                  <Button
                    onClick={() => onNavigateTab('action_plan')}
                    color="secondary"
                    className="w-full"
                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                  >
                    Plano de Ação ({project.actionPlan.length} itens)
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* GLPI Footer Bar with Save Button */}
          <div className="bg-grey-50 border-t border-grey-200 px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-grey-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Última modificação registrada: {project.lastUpdated}</span>
            </div>

            <div className="flex items-center gap-3">
              {isSavedToast && (
                <span className="text-xs font-semibold text-brand-dark bg-brand-lighter px-2.5 py-1 rounded border border-brand-light flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Alterações salvas com sucesso!
                </span>
              )}

              {canEdit ? (
                <Button onClick={handleSave} color="primary" leftIcon={<Save className="w-4 h-4" />}>
                  Salvar
                </Button>
              ) : (
                <span className="text-xs text-grey-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Somente leitura para o seu perfil
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Comprehensive Living Interactive Technical Documentation */}
      {viewMode === 'live_preview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Bar for Living Doc */}
          <div className="bg-brand-dark text-white p-5 rounded-lg shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-white/10 rounded-lg">
                <FileText className="w-6 h-6 text-brand-light" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/10 text-brand-light border-white/20 text-[10px] uppercase tracking-wider">
                    Padrão ATTO Sementes
                  </Badge>
                  <span className="text-brand-light text-xs">Ficha Oficial do Ativo • GLPI 10.x</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">Documentação Técnica e Funcional Viva</h3>
                <p className="text-xs text-brand-light">
                  Visão consolidada com arquitetura, dicionário de dados interativo (31 abas), sustentação e conformidade LGPD.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCopyLivingDoc}
                color="primary"
                size="sm"
                className="border border-brand-main"
                leftIcon={copiedDoc ? <Check className="w-3.5 h-3.5 text-brand-light" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedDoc ? 'Copiado (Markdown)!' : 'Copiar Doc Completa'}
              </Button>

              <Button
                onClick={() => setViewMode('edit')}
                color="secondary"
                size="sm"
                className="text-brand-dark! hover:bg-brand-lighter!"
                leftIcon={<Edit3 className="w-3.5 h-3.5 text-brand-dark" />}
              >
                Editar Ficha GLPI
              </Button>
            </div>
          </div>

          {/* Internal Section Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-grey-200 pb-3">
            <span className="text-xs font-semibold text-grey-500 mr-1">Seções da Doc:</span>
            {[
              { id: 'all', label: 'Visão Geral Completa' },
              { id: 'overview', label: '1. Resumo & Arquitetura' },
              ...(showDataDictionary
                ? [{ id: 'sheets', label: `2. Dicionário de Dados (${sheetsCatalog?.length || 31} Abas)` }]
                : []),
              { id: 'ops', label: '3. Sustentação & Operação' },
              { id: 'security', label: '4. Segurança & LGPD' }
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => setDocSectionFilter(sec.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  docSectionFilter === sec.id
                    ? 'bg-grey-900 text-white shadow-xs'
                    : 'bg-white text-grey-600 hover:text-grey-900 border border-grey-200 hover:bg-grey-50'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* SECTION 1: Resumo, Identificação & Arquitetura */}
          {(docSectionFilter === 'all' || docSectionFilter === 'overview') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Resumo, Escopo e Topologia */}
              <div className="lg:col-span-2 space-y-6">
                {/* Executive Summary Card */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-grey-200 pb-3">
                    <h4 className="font-bold text-grey-900 text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-brand-dark" />
                      <span>1. Resumo Executivo & Responsabilidades</span>
                    </h4>
                    <Badge className="bg-grey-100 text-grey-700 border-grey-200">Status: {status}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <StatTile
                      label="Responsável Técnico / Desenvolvedor"
                      value={techResponsible}
                      subtext={groupEncargado}
                    />
                    <StatTile
                      label="Responsável de Negócio / Área"
                      value={userResponsible}
                      subtext={userGroup}
                    />
                  </div>

                  <div className="text-xs text-grey-700 leading-relaxed space-y-1.5 pt-1">
                    <strong className="text-grey-900 block text-xs uppercase tracking-wider">
                      Objetivo Principal da Solução:
                    </strong>
                    <p className="text-grey-800 whitespace-pre-line leading-relaxed font-sans">{objective}</p>
                  </div>
                </Card>

                {/* Topologia da Arquitetura */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-grey-200 pb-3">
                    <h4 className="font-bold text-grey-900 text-sm flex items-center gap-2">
                      <Server className="w-4 h-4 text-brand-dark" />
                      <span>2. Topologia da Arquitetura de Software</span>
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {technicalDoc?.classification && (
                        <Badge className="bg-grey-100 text-grey-700 border-grey-200 text-[10px]">
                          {technicalDoc.classification}
                        </Badge>
                      )}
                      <span className="text-[11px] text-grey-500 font-mono">GitHub: grupoatto/portal-logistica</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-grey-50 rounded-lg border border-grey-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-grey-900">
                        <Code2 className="w-4 h-4 text-info-600" />
                        <span>Apresentação (Frontend)</span>
                      </div>
                      <p className="text-grey-600 text-[11px] leading-relaxed">
                        {technicalDoc?.frontend ||
                          'Web Apps em Google Workspace com interface HTML/CSS responsiva para usuários internos e externos.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-grey-50 rounded-lg border border-grey-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-grey-900">
                        <Server className="w-4 h-4 text-purple-600" />
                        <span>Motor de Negócio (Backend)</span>
                      </div>
                      <p className="text-grey-600 text-[11px] leading-relaxed">
                        {technicalDoc?.backend ||
                          'Google Apps Script (~30.000 linhas de código), versionado em repositório GitHub com CI/CD.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-grey-50 rounded-lg border border-grey-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-grey-900">
                        <Database className="w-4 h-4 text-brand-main" />
                        <span>Base de Dados & ERP</span>
                      </div>
                      <p className="text-grey-600 text-[11px] leading-relaxed">
                        {technicalDoc?.database ||
                          'Google Sheets estruturado em 31 abas relacionais com integração via API REST ao ERP Senior Sapiens.'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Governance Summary & Badges */}
              <div className="space-y-6">
                {/* Governance Health Card */}
                <Card className="space-y-4">
                  <h4 className="font-bold text-grey-900 text-sm flex items-center gap-2 border-b border-grey-200 pb-3">
                    <ShieldCheck className="w-4 h-4 text-brand-dark" />
                    <span>Saúde & Governança do Ativo</span>
                  </h4>

                  <div className="divide-y divide-grey-100 text-xs">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-grey-600">Score Residual Atual:</span>
                      <strong className="text-brand-dark font-mono font-bold">{residualScore} pts</strong>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-grey-600">Total de Abas Mapeadas:</span>
                      <span className="font-bold text-grey-800">{sheetsCatalog?.length || 31} abas</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => onNavigateTab('action_plan')}
                    color="primary"
                    className="w-full"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Abrir Plano de Ação ({project.actionPlan.length} itens)
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* SECTION 2: Dicionário de Dados Completo — atrás da feature flag (Configurações > Funcionalidades) */}
          {showDataDictionary && (docSectionFilter === 'all' || docSectionFilter === 'sheets') && (
            <Card className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-grey-200 pb-4">
                <div>
                  <h4 className="font-bold text-grey-900 text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-brand-dark" />
                    <span>Dicionário de Dados & Estrutura de Abas ({sheetsCatalog?.length || 31} Abas Mapeadas)</span>
                  </h4>
                  <p className="text-xs text-grey-500 mt-0.5">
                    Mapeamento detalhado de cada aba da planilha base com categoria operacional, objetivo funcional e nível
                    de sensibilidade LGPD.
                  </p>
                </div>

                <Badge className="bg-brand-lighter text-brand-dark border-brand-light shrink-0">
                  {filteredSheets.length} de {sheetsCatalog?.length || 31} abas exibidas
                </Badge>
              </div>

              {/* Filters & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <SearchInput
                    placeholder="Buscar por nome da aba ou finalidade..."
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-4">
                  <Select value={sheetCategory} onChange={(e) => setSheetCategory(e.target.value)}>
                    <option value="all">Todas as Categorias ({sheetsCatalog?.length || 31})</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Sheets List */}
              <div className="border border-grey-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto divide-y divide-grey-200">
                  {filteredSheets.map((sheet) => (
                    <div
                      key={sheet.name}
                      className="p-3.5 hover:bg-grey-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-grey-900 bg-grey-100 px-2 py-0.5 rounded border border-grey-200">
                            {sheet.name}
                          </span>
                          <Badge className="bg-info-50 text-info-700 border-info-200 text-[10px]">
                            {sheet.category}
                          </Badge>
                        </div>
                        <p className="text-grey-600 text-xs leading-relaxed">{sheet.purpose}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <Badge
                          className={`text-[10px] ${
                            sheet.sensitivity === 'Alta'
                              ? 'bg-danger-50 text-danger-800 border-danger-300'
                              : sheet.sensitivity === 'Média'
                              ? 'bg-warning-50 text-warning-600 border-warning-200'
                              : 'bg-grey-100 text-grey-700 border-grey-200'
                          }`}
                        >
                          Sensibilidade: {sheet.sensitivity}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {filteredSheets.length === 0 && (
                    <div className="p-8 text-center text-grey-500 text-xs">
                      Nenhuma aba encontrada com os filtros selecionados.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 3: Sustentação, Continuidade e Operação */}
          {(docSectionFilter === 'all' || docSectionFilter === 'ops') && (
            <Card className="space-y-4">
              <div className="border-b border-grey-200 pb-3">
                <h4 className="font-bold text-grey-900 text-base flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-brand-dark" />
                  <span>3. Sustentação, Continuidade de Negócio & Operação</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-grey-50 rounded-lg border border-grey-200 space-y-2">
                  <span className="font-bold text-grey-800 text-xs uppercase tracking-wider block">
                    Backup de Dados & Código
                  </span>
                  <div className="space-y-1.5 text-grey-600">
                    <p>
                      <strong>Dados:</strong> {technicalDoc?.backupData}
                    </p>
                    <p>
                      <strong>Código-Fonte:</strong> {technicalDoc?.backupCode}
                    </p>
                    <p>
                      <strong>Versionamento:</strong> {technicalDoc?.versionControl}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-grey-50 rounded-lg border border-grey-200 space-y-2">
                  <span className="font-bold text-grey-800 text-xs uppercase tracking-wider block">
                    Tratamento de Incidentes & Contingência
                  </span>
                  <div className="space-y-1.5 text-grey-600">
                    <p>
                      <strong>Incidentes:</strong> {technicalDoc?.incidentHandling}
                    </p>
                    <p>
                      <strong>Contingência:</strong> {technicalDoc?.contingency}
                    </p>
                    <p>
                      <strong>Maturidade Técnica:</strong> {technicalDoc?.maturity}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 4: Segurança da Informação & LGPD */}
          {(docSectionFilter === 'all' || docSectionFilter === 'security') && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-grey-200 pb-3">
                <h4 className="font-bold text-grey-900 text-base flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-dark" />
                  <span>4. Segurança da Informação, LGPD & Gestão de Acessos</span>
                </h4>
                <Badge className="bg-brand-lighter text-brand-dark border-brand-light">Em Conformidade</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-grey-50 rounded-lg border border-grey-200 space-y-2">
                  <span className="font-bold text-grey-900 text-xs uppercase tracking-wider block">
                    Tratamento de Dados Pessoais
                  </span>
                  <p className="text-grey-600 leading-relaxed">{technicalDoc?.personalDataSummary}</p>
                  <div className="pt-2 text-[11px] text-grey-500 border-t border-grey-200">
                    <strong>Base Legal:</strong> {technicalDoc?.legalBasis}
                  </div>
                </div>

                <div className="p-4 bg-grey-50 rounded-lg border border-grey-200 space-y-2">
                  <span className="font-bold text-grey-900 text-xs uppercase tracking-wider block">
                    Dados Confidenciais & Retenção
                  </span>
                  <p className="text-grey-600 leading-relaxed">{technicalDoc?.confidentialDataSummary}</p>
                  <div className="pt-2 text-[11px] text-grey-500 border-t border-grey-200">
                    <strong>Política de Retenção:</strong> {technicalDoc?.retentionPolicy}
                  </div>
                </div>

                <div className="p-4 bg-grey-50 rounded-lg border border-grey-200 space-y-2">
                  <span className="font-bold text-grey-900 text-xs uppercase tracking-wider block">
                    Gestão de Acessos & Logs
                  </span>
                  <p className="text-grey-600 leading-relaxed">{technicalDoc?.accessControlSummary}</p>
                  <div className="pt-2 text-[11px] text-grey-500 border-t border-grey-200">
                    <strong>Logs:</strong> {technicalDoc?.logsSummary}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
