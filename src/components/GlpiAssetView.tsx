import React, { useState } from 'react';
import {
  QrCode,
  Save,
  Info,
  ExternalLink,
  GitBranch,
  ShieldAlert,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Code2,
  CheckCircle,
  HelpCircle,
  Clock,
  UserCheck,
  Building,
  RefreshCw,
  Eye,
  Edit3,
  FileText,
  Workflow,
  Server,
  Database,
  ShieldCheck,
  ArrowRight,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  Shield,
  Download,
  BookOpen,
  Lock
} from 'lucide-react';
import { SolutionProject, SheetBaseInfo } from '../types';
import { getRiskColorClass } from '../utils/riskCalculations';

interface GlpiAssetViewProps {
  project: SolutionProject;
  residualScore: number;
  onNavigateTab: (tab: 'diagnostic' | 'action_plan' | 'evolution') => void;
  onSave?: (updatedData: {
    name: string;
    status: any;
    technicalResponsible: string;
    groupEncargado: string;
    businessResponsible: string;
    objective: string;
    initialDoc: string;
  }) => void;
}

export const GlpiAssetView: React.FC<GlpiAssetViewProps> = ({
  project,
  residualScore,
  onNavigateTab,
  onSave
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'live_preview'>('edit');
  const [docSectionFilter, setDocSectionFilter] = useState<'all' | 'overview' | 'sheets' | 'ops' | 'security'>('all');
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetCategory, setSheetCategory] = useState<string>('all');

  const [name, setName] = useState(project.name);
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

  const currentRiskColor = getRiskColorClass(
    residualScore <= 5 ? 'BAIXO' : residualScore <= 12 ? 'MEDIO' : residualScore <= 20 ? 'ALTO' : 'CRITICO'
  );

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
        initialDoc
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

## 6. DICIONÁRIO DE DADOS & CATÁLOGO DE ABAS (${sheetsCatalog?.length || 31} ABAS)
${(sheetsCatalog || []).map((s) => `- ${s.name} [${s.category}] (Sensibilidade: ${s.sensitivity}): ${s.purpose}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* GLPI Breadcrumb & Quick Governance Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>GLPI</span>
            <span>›</span>
            <span>Ativos</span>
            <span>›</span>
            <span>Soluções Setoriais & Automações</span>
            <span>›</span>
            <span className="text-slate-800 font-semibold">{name}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-bold text-slate-900">{name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              ID: {project.assetId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Chamado: {project.glpiTicketId}
            </span>
          </div>
        </div>

        {/* Dynamic Criticality Badge and Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher: Form GLPI vs Documentação Viva Preview */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'edit'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ficha Cadastral GLPI</span>
            </button>
            <button
              onClick={() => setViewMode('live_preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'live_preview'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Documentação Viva & Técnica</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Risco Residual</span>
              <span className="text-xs font-extrabold text-slate-900 font-mono">
                {residualScore} pts
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('evolution')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${currentRiskColor.badge}`}
            >
              {residualScore <= 5 ? 'Baixo' : residualScore <= 12 ? 'Médio' : residualScore <= 20 ? 'Alto' : 'Crítico'}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Standard GLPI Asset Form View */}
      {viewMode === 'edit' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {/* GLPI Header Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800 text-sm">Dados Principais do Ativo (GLPI)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <button
                onClick={() => setViewMode('live_preview')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Ver Documentação Viva Completa
              </button>
              <span>•</span>
              <span>
                Cadastrado por: <strong className="text-slate-700">{project.registeredBy}</strong>
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side: GLPI Form Inputs */}
              <div className="lg:col-span-9 space-y-5">
                {/* Row 1: Nome & Status */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <label className="md:col-span-3 text-right font-medium text-slate-700 text-sm">
                    Nome
                  </label>
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <label className="md:col-span-2 text-right font-medium text-slate-700 text-sm">
                    Status
                  </label>
                  <div className="md:col-span-3">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    >
                      <option value="Uso">Uso</option>
                      <option value="Homologação">Homologação</option>
                      <option value="Em Adequação">Em Adequação (Governança)</option>
                      <option value="Descontinuado">Descontinuado</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Técnico encarregado & Grupo encarregado */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <label className="md:col-span-3 text-right font-medium text-slate-700 text-sm flex items-center justify-end gap-1">
                    <span>Técnico encarregado</span>
                  </label>
                  <div className="md:col-span-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={techResponsible}
                      onChange={(e) => setTechResponsible(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  <label className="md:col-span-2 text-right font-medium text-slate-700 text-sm">
                    Grupo encarregado
                  </label>
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      value={groupEncargado}
                      onChange={(e) => setGroupEncargado(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Row 3: Usuário & Grupo */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <label className="md:col-span-3 text-right font-medium text-slate-700 text-sm flex items-center justify-end gap-1">
                    <span>Usuário (Resp. Negócio)</span>
                  </label>
                  <div className="md:col-span-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={userResponsible}
                      onChange={(e) => setUserResponsible(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  <label className="md:col-span-2 text-right font-medium text-slate-700 text-sm">
                    Grupo
                  </label>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-800">
                      <span className="font-semibold">{userGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Row 4: Objetivo */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
                  <label className="md:col-span-3 text-right font-medium text-slate-700 text-sm pt-2">
                    Objetivo
                  </label>
                  <div className="md:col-span-9">
                    <div className="border border-slate-300 rounded-t-md bg-slate-50 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-slate-600 text-xs border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-medium">
                          Simples ▾
                        </span>
                        <span className="font-bold cursor-pointer hover:text-black">B</span>
                        <span className="italic cursor-pointer hover:text-black">I</span>
                        <span className="underline cursor-pointer hover:text-black">A ▾</span>
                        <span className="cursor-pointer hover:text-black">🖍 ▾</span>
                        <span className="text-slate-300">|</span>
                        <span className="cursor-pointer hover:text-black">• List</span>
                        <span className="cursor-pointer hover:text-black">1. Num</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewMode('live_preview')}
                        className="text-[11px] text-emerald-700 font-semibold hover:underline"
                      >
                        Visualizar na Documentação Viva
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-b-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Row 5: Documentação Inicial */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
                  <label className="md:col-span-3 text-right font-medium text-slate-700 text-sm pt-2">
                    Documentação inicial
                  </label>
                  <div className="md:col-span-9">
                    <div className="border border-slate-300 rounded-t-md bg-slate-50 px-3 py-1.5 flex flex-wrap items-center gap-2 text-slate-600 text-xs border-b-0">
                      <span className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 font-medium">
                        Simples ▾
                      </span>
                      <span className="font-bold cursor-pointer hover:text-black">B</span>
                      <span className="italic cursor-pointer hover:text-black">I</span>
                      <span className="underline cursor-pointer hover:text-black">A ▾</span>
                    </div>
                    <textarea
                      rows={3}
                      value={initialDoc}
                      onChange={(e) => setInitialDoc(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-b-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: QR Code, URL do Ativo & Links Rápidos */}
              <div className="lg:col-span-3 space-y-4">
                {/* QR Code Card */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
                    <span>URL do ativo</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="bg-white p-3 rounded-md border border-slate-300 inline-block shadow-xs">
                    <img
                      src={project.qrCodeUrl}
                      alt="QR Code Ativo GLPI"
                      className="w-36 h-36 mx-auto object-contain"
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 truncate font-mono">
                    {project.assetId} | GLPI ATTO
                  </div>
                </div>

                {/* Connected Resources */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                    Artefatos & Repositórios
                  </span>

                  {project.links.githubRepo && (
                    <a
                      href={project.links.githubRepo}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 group transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <GitBranch className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-mono text-[11px] truncate">grupoatto/portal-logistica</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </a>
                  )}

                  {project.links.spreadsheet && (
                    <a
                      href={project.links.spreadsheet}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 group transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">Planilha Base (31 abas)</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </a>
                  )}

                  {project.links.script && (
                    <a
                      href={project.links.script}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 group transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Code2 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate">Apps Script (~30k linhas)</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-700 shrink-0" />
                    </a>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setViewMode('live_preview')}
                    className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Acessar Documentação Viva</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('diagnostic')}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-md border border-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Diagnóstico IA de Risco</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('action_plan')}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Plano de Ação ({project.actionPlan.length} itens)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GLPI Footer Bar with Save Button */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Última modificação registrada: {project.lastUpdated}</span>
            </div>

            <div className="flex items-center gap-3">
              {isSavedToast && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Alterações salvas com sucesso!
                </span>
              )}

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Comprehensive Living Interactive Technical Documentation */}
      {viewMode === 'live_preview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Bar for Living Doc */}
          <div className="bg-emerald-900 text-white p-5 rounded-lg shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-800 rounded-lg">
                <FileText className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-800 text-emerald-200 text-[10px] rounded uppercase font-extrabold tracking-wider border border-emerald-700">
                    Padrão ATTO Sementes
                  </span>
                  <span className="text-emerald-300 text-xs">Ficha Oficial do Ativo • GLPI 10.x</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Documentação Técnica e Funcional Viva
                </h3>
                <p className="text-xs text-emerald-200">
                  Visão consolidada com arquitetura, dicionário de dados interativo (31 abas), sustentação e conformidade LGPD.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyLivingDoc}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-md border border-emerald-600 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedDoc ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copiado (Markdown)!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Doc Completa</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setViewMode('edit')}
                className="px-3.5 py-2 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Editar Ficha GLPI</span>
              </button>
            </div>
          </div>

          {/* Internal Section Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <span className="text-xs font-semibold text-slate-500 mr-1">Seções da Doc:</span>
            {[
              { id: 'all', label: 'Visão Geral Completa' },
              { id: 'overview', label: '1. Resumo & Arquitetura' },
              { id: 'sheets', label: `2. Dicionário de Dados (${sheetsCatalog?.length || 31} Abas)` },
              { id: 'ops', label: '3. Sustentação & Operação' },
              { id: 'security', label: '4. Segurança & LGPD' }
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => setDocSectionFilter(sec.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  docSectionFilter === sec.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
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
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-emerald-700" />
                      <span>1. Resumo Executivo & Responsabilidades</span>
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded border border-slate-200">
                      Status: {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-slate-500 block">Responsável Técnico / Desenvolvedor:</span>
                      <strong className="text-slate-900 text-sm">{techResponsible}</strong>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{groupEncargado}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <span className="text-slate-500 block">Responsável de Negócio / Área:</span>
                      <strong className="text-slate-900 text-sm">{userResponsible}</strong>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{userGroup}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed space-y-2 pt-1">
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider">
                      Objetivo Principal da Solução:
                    </strong>
                    <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {objective}
                    </div>
                  </div>
                </div>

                {/* Topologia da Arquitetura */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-700" />
                      <span>2. Topologia da Arquitetura de Software</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      GitHub: grupoatto/portal-logistica
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Code2 className="w-4 h-4 text-blue-600" />
                        <span>Apresentação (Frontend)</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {technicalDoc?.frontend || 'Web Apps em Google Workspace com interface HTML/CSS responsiva para usuários internos e externos.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Server className="w-4 h-4 text-purple-600" />
                        <span>Motor de Negócio (Backend)</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {technicalDoc?.backend || 'Google Apps Script (~30.000 linhas de código), versionado em repositório GitHub com CI/CD.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Base de Dados & ERP</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {technicalDoc?.database || 'Google Sheets estruturado em 31 abas relacionais com integração via API REST ao ERP Senior Sapiens.'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Technical Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Geração de Documentos:</span>
                      <span className="text-slate-800 font-medium">{technicalDoc?.pdfGeneration}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Disparo de E-mails:</span>
                      <span className="text-slate-800 font-medium">{technicalDoc?.emailDispatch}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Classificação:</span>
                      <span className="text-slate-800 font-medium">{technicalDoc?.classification}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Governance Summary & Badges */}
              <div className="space-y-6">
                {/* Governance Health Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Saúde & Governança do Ativo</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-600">Score Residual Atual:</span>
                      <strong className="text-emerald-800 font-mono font-bold">{residualScore} pts</strong>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-600">Controle de Versão:</span>
                      <span className="font-mono text-emerald-700 font-semibold">GitHub Ativo ✓</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-600">Backup Automatizado:</span>
                      <span className="text-emerald-700 font-semibold">Diário (Snapshot) ✓</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-600">Total de Abas Mapeadas:</span>
                      <span className="font-bold text-slate-800">{sheetsCatalog?.length || 31} abas</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-600">Homologação TI:</span>
                      <span className="text-emerald-700 font-semibold">Em Acompanhamento ✓</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => onNavigateTab('action_plan')}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Abrir Plano de Ação ({project.actionPlan.length} itens)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs text-center space-y-3">
                  <div className="text-xs font-semibold text-slate-700">Etiqueta & QR Code do Ativo</div>
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 inline-block shadow-2xs">
                    <img
                      src={project.qrCodeUrl}
                      alt="QR Code Ativo GLPI"
                      className="w-32 h-32 mx-auto object-contain"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {project.assetId} | Chamado {project.glpiTicketId}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Dicionário de Dados Completo (31 Abas Mapeadas) */}
          {(docSectionFilter === 'all' || docSectionFilter === 'sheets') && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <span>Dicionário de Dados & Estrutura de Abas ({sheetsCatalog?.length || 31} Abas Mapeadas)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mapeamento detalhado de cada aba da planilha base com categoria operacional, objetivo funcional e nível de sensibilidade LGPD.
                  </p>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full shrink-0">
                  {filteredSheets.length} de {sheetsCatalog?.length || 31} abas exibidas
                </span>
              </div>

              {/* Filters & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome da aba ou finalidade..."
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={sheetCategory}
                    onChange={(e) => setSheetCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
                  >
                    <option value="all">Todas as Categorias ({sheetsCatalog?.length || 31})</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sheets Grid Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-200">
                  {filteredSheets.map((sheet, index) => (
                    <div
                      key={sheet.name}
                      className="p-3.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {sheet.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {sheet.category}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {sheet.purpose}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            sheet.sensitivity === 'Alta'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : sheet.sensitivity === 'Média'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          Sensibilidade: {sheet.sensitivity}
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredSheets.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Nenhuma aba encontrada com os filtros selecionados.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Sustentação, Continuidade e Operação */}
          {(docSectionFilter === 'all' || docSectionFilter === 'ops') && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-emerald-700" />
                  <span>3. Sustentação, Continuidade de Negócio & Operação</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                    Backup de Dados & Código
                  </span>
                  <div className="space-y-1.5 text-slate-600">
                    <p><strong>Dados:</strong> {technicalDoc?.backupData}</p>
                    <p><strong>Código-Fonte:</strong> {technicalDoc?.backupCode}</p>
                    <p><strong>Versionamento:</strong> {technicalDoc?.versionControl}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                    Tratamento de Incidentes & Contingência
                  </span>
                  <div className="space-y-1.5 text-slate-600">
                    <p><strong>Incidentes:</strong> {technicalDoc?.incidentHandling}</p>
                    <p><strong>Contingência:</strong> {technicalDoc?.contingency}</p>
                    <p><strong>Maturidade Técnica:</strong> {technicalDoc?.maturity}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Segurança da Informação & LGPD */}
          {(docSectionFilter === 'all' || docSectionFilter === 'security') && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-700" />
                  <span>4. Segurança da Informação, LGPD & Gestão de Acessos</span>
                </h4>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                  Em Conformidade
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                    Tratamento de Dados Pessoais
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {technicalDoc?.personalDataSummary}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                    <strong>Base Legal:</strong> {technicalDoc?.legalBasis}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                    Dados Confidenciais & Retenção
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {technicalDoc?.confidentialDataSummary}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                    <strong>Política de Retenção:</strong> {technicalDoc?.retentionPolicy}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                    Gestão de Acessos & Logs
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {technicalDoc?.accessControlSummary}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                    <strong>Logs:</strong> {technicalDoc?.logsSummary}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
