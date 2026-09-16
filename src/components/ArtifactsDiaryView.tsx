import React, { useState, useMemo } from 'react';
import {
  FolderArchive,
  BookOpen,
  FileText,
  FileSpreadsheet,
  Plus,
  Search,
  ExternalLink,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Paperclip,
  Upload,
  Link as LinkIcon,
  Filter,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  SolutionProject,
  ProjectArtifact,
  MeetingDiaryEntry,
  ArtifactCategory,
  ArtifactFileType,
  MeetingEntryType,
  UserRole
} from '../types';
import { Card, Badge, Button, Modal, FormField, SearchInput } from './ui';

interface ArtifactsDiaryViewProps {
  project: SolutionProject;
  userRole: UserRole;
  onUpdateProject: (updatedProject: SolutionProject) => Promise<void> | void;
}

const CATEGORY_COLORS: Record<ArtifactCategory, { bg: string; text: string; border: string }> = {
  'Pauta / Ata de Reunião': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Especificação Funcional': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Arquitetura & Segurança': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Homologação & Evidências': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Apresentação & Relatório': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  'Código & Repositório': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Outro': { bg: 'bg-grey-100', text: 'text-grey-800', border: 'border-grey-300' }
};

const FILE_TYPE_CONFIG: Record<
  ArtifactFileType,
  { label: string; iconColor: string; bgColor: string }
> = {
  pdf: { label: 'Documento PDF', iconColor: 'text-red-600', bgColor: 'bg-red-50' },
  docx: { label: 'Word (DOCX)', iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  xlsx: { label: 'Planilha (XLSX)', iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  pptx: { label: 'Apresentação (PPTX)', iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  drive: { label: 'Google Drive', iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },
  link: { label: 'Link Web / Nuvem', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  outro: { label: 'Arquivo / Documento', iconColor: 'text-grey-600', bgColor: 'bg-grey-100' }
};

export const ArtifactsDiaryView: React.FC<ArtifactsDiaryViewProps> = ({
  project,
  userRole,
  onUpdateProject
}) => {
  // Navigation between the two main sections
  const [activeSection, setActiveSection] = useState<'artifacts' | 'diary'>('artifacts');

  // Artifact filters & search
  const [artifactSearch, setArtifactSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Diary filters & search
  const [diarySearch, setDiarySearch] = useState('');
  const [selectedDiaryType, setSelectedDiaryType] = useState<string>('all');

  // Copy feedback state
  const [copiedDiaryId, setCopiedDiaryId] = useState<string | null>(null);

  // Modal states for Artifacts
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<ProjectArtifact | null>(null);
  const [artifactForm, setArtifactForm] = useState<{
    title: string;
    category: ArtifactCategory;
    fileType: ArtifactFileType;
    sourceMode: 'link' | 'upload';
    url: string;
    fileName: string;
    fileSize: string;
    fileData: string;
    version: string;
    author: string;
    description: string;
  }>({
    title: '',
    category: 'Pauta / Ata de Reunião',
    fileType: 'pdf',
    sourceMode: 'link',
    url: '',
    fileName: '',
    fileSize: '',
    fileData: '',
    version: 'v1.0',
    author: project.technicalResponsible || 'TI Governança',
    description: ''
  });

  // Modal states for Diary Entries
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [editingDiary, setEditingDiary] = useState<MeetingDiaryEntry | null>(null);
  const [diaryForm, setDiaryForm] = useState<{
    date: string;
    subject: string;
    entryType: MeetingEntryType;
    participants: string;
    summary: string;
    nextSteps: string;
    registeredBy: string;
    hoursSpent: number;
    linkedArtifactId: string;
  }>({
    date: new Date().toLocaleDateString('pt-BR'),
    subject: '',
    entryType: 'Reunião de Alinhamento',
    participants: `${project.businessResponsible || 'Negócio'}, ${project.technicalResponsible || 'TI Dev'}`,
    summary: '',
    nextSteps: '',
    registeredBy: 'Governança TI',
    hoursSpent: 1,
    linkedArtifactId: ''
  });

  // Lists safely defaulting to arrays
  const artifacts: ProjectArtifact[] = useMemo(() => project.artifacts || [], [project.artifacts]);
  const meetingLogs: MeetingDiaryEntry[] = useMemo(() => project.meetingLogs || [], [project.meetingLogs]);

  // Filtered Artifacts
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(artifactSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(artifactSearch.toLowerCase())) ||
        (item.fileName && item.fileName.toLowerCase().includes(artifactSearch.toLowerCase())) ||
        item.author.toLowerCase().includes(artifactSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [artifacts, artifactSearch, selectedCategory]);

  // Filtered Diary Entries
  const filteredDiary = useMemo(() => {
    return meetingLogs.filter((entry) => {
      const matchesSearch =
        entry.subject.toLowerCase().includes(diarySearch.toLowerCase()) ||
        entry.summary.toLowerCase().includes(diarySearch.toLowerCase()) ||
        (entry.nextSteps && entry.nextSteps.toLowerCase().includes(diarySearch.toLowerCase())) ||
        entry.participants.toLowerCase().includes(diarySearch.toLowerCase());
      const matchesType = selectedDiaryType === 'all' || entry.entryType === selectedDiaryType;
      return matchesSearch && matchesType;
    });
  }, [meetingLogs, diarySearch, selectedDiaryType]);

  // --------------------------------------------------------------------------
  // Artifact Handlers
  // --------------------------------------------------------------------------
  const handleOpenNewArtifactModal = () => {
    setEditingArtifact(null);
    setArtifactForm({
      title: '',
      category: 'Pauta / Ata de Reunião',
      fileType: 'pdf',
      sourceMode: 'link',
      url: '',
      fileName: '',
      fileSize: '',
      fileData: '',
      version: 'v1.0',
      author: project.technicalResponsible || 'TI Governança',
      description: ''
    });
    setIsArtifactModalOpen(true);
  };

  const handleOpenEditArtifactModal = (art: ProjectArtifact) => {
    setEditingArtifact(art);
    setArtifactForm({
      title: art.title,
      category: art.category,
      fileType: art.fileType,
      sourceMode: art.fileData ? 'upload' : 'link',
      url: art.url || '',
      fileName: art.fileName || '',
      fileSize: art.fileSize || '',
      fileData: art.fileData || '',
      version: art.version || 'v1.0',
      author: art.author,
      description: art.description || ''
    });
    setIsArtifactModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    let detectedType: ArtifactFileType = 'outro';
    if (ext === 'pdf') detectedType = 'pdf';
    else if (ext === 'doc' || ext === 'docx') detectedType = 'docx';
    else if (ext === 'xls' || ext === 'xlsx') detectedType = 'xlsx';
    else if (ext === 'ppt' || ext === 'pptx') detectedType = 'pptx';

    // Format size
    const sizeInKB = file.size / 1024;
    const formattedSize =
      sizeInKB > 1024
        ? `${(sizeInKB / 1024).toFixed(1)} MB`
        : `${Math.round(sizeInKB)} KB`;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setArtifactForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: formattedSize,
        fileType: detectedType,
        fileData: result,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveArtifact = async () => {
    if (!artifactForm.title.trim()) return;

    let updatedList: ProjectArtifact[];

    if (editingArtifact) {
      updatedList = artifacts.map((a) => {
        if (a.id !== editingArtifact.id) return a;
        const item: ProjectArtifact = {
          id: a.id,
          title: artifactForm.title.trim(),
          category: artifactForm.category,
          fileType: artifactForm.fileType,
          version: artifactForm.version.trim() || 'v1.0',
          author: artifactForm.author.trim() || 'T.I / Governança',
          createdAt: a.createdAt || new Date().toLocaleDateString('pt-BR')
        };
        if (artifactForm.description.trim()) item.description = artifactForm.description.trim();
        if (artifactForm.sourceMode === 'link' && artifactForm.url.trim()) {
          item.url = artifactForm.url.trim();
        }
        if (artifactForm.sourceMode === 'upload') {
          if (artifactForm.fileName) item.fileName = artifactForm.fileName;
          if (artifactForm.fileSize) item.fileSize = artifactForm.fileSize;
          if (artifactForm.fileData) item.fileData = artifactForm.fileData;
        }
        return item;
      });
    } else {
      const newArtifact: ProjectArtifact = {
        id: `art-${Date.now()}`,
        title: artifactForm.title.trim(),
        category: artifactForm.category,
        fileType: artifactForm.fileType,
        version: artifactForm.version.trim() || 'v1.0',
        author: artifactForm.author.trim() || 'T.I / Governança',
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      if (artifactForm.description.trim()) newArtifact.description = artifactForm.description.trim();
      if (artifactForm.sourceMode === 'link' && artifactForm.url.trim()) {
        newArtifact.url = artifactForm.url.trim();
      }
      if (artifactForm.sourceMode === 'upload') {
        if (artifactForm.fileName) newArtifact.fileName = artifactForm.fileName;
        if (artifactForm.fileSize) newArtifact.fileSize = artifactForm.fileSize;
        if (artifactForm.fileData) newArtifact.fileData = artifactForm.fileData;
      }
      updatedList = [newArtifact, ...artifacts];
    }

    const updatedProject = {
      ...project,
      artifacts: updatedList,
      lastUpdated: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    await onUpdateProject(updatedProject);
    setIsArtifactModalOpen(false);
  };

  const handleDeleteArtifact = async (id: string) => {
    if (!confirm('Deseja realmente remover este artefato?')) return;
    const updatedList = artifacts.filter((a) => a.id !== id);
    const updatedProject = {
      ...project,
      artifacts: updatedList,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    };
    await onUpdateProject(updatedProject);
  };

  const handleDownloadArtifact = (art: ProjectArtifact) => {
    if (art.fileData) {
      const link = document.createElement('a');
      link.href = art.fileData;
      link.download = art.fileName || `${art.title}.${art.fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (art.url) {
      window.open(art.url, '_blank', 'noopener,noreferrer');
    }
  };

  // --------------------------------------------------------------------------
  // Diary Handlers
  // --------------------------------------------------------------------------
  const handleOpenNewDiaryModal = () => {
    setEditingDiary(null);
    setDiaryForm({
      date: new Date().toLocaleDateString('pt-BR'),
      subject: '',
      entryType: 'Reunião de Alinhamento',
      participants: `${project.businessResponsible || 'Negócio'}, ${project.technicalResponsible || 'TI Dev'}`,
      summary: '',
      nextSteps: '',
      registeredBy: 'Governança TI',
      hoursSpent: 1,
      linkedArtifactId: ''
    });
    setIsDiaryModalOpen(true);
  };

  const handleOpenEditDiaryModal = (entry: MeetingDiaryEntry) => {
    setEditingDiary(entry);
    setDiaryForm({
      date: entry.date,
      subject: entry.subject,
      entryType: entry.entryType,
      participants: entry.participants,
      summary: entry.summary,
      nextSteps: entry.nextSteps || '',
      registeredBy: entry.registeredBy,
      hoursSpent: entry.hoursSpent || 1,
      linkedArtifactId: entry.linkedArtifactId || ''
    });
    setIsDiaryModalOpen(true);
  };

  const handleSaveDiaryEntry = async () => {
    if (!diaryForm.subject.trim() || !diaryForm.summary.trim()) return;

    let updatedList: MeetingDiaryEntry[];
    const linkedArt = artifacts.find((a) => a.id === diaryForm.linkedArtifactId);

    if (editingDiary) {
      updatedList = meetingLogs.map((e) => {
        if (e.id !== editingDiary.id) return e;
        const entry: MeetingDiaryEntry = {
          id: e.id,
          date: diaryForm.date,
          subject: diaryForm.subject.trim(),
          entryType: diaryForm.entryType,
          participants: diaryForm.participants.trim(),
          summary: diaryForm.summary.trim(),
          registeredBy: diaryForm.registeredBy.trim(),
          hoursSpent: Number(diaryForm.hoursSpent) || 1,
          createdAt: e.createdAt || new Date().toISOString()
        };
        if (diaryForm.nextSteps.trim()) entry.nextSteps = diaryForm.nextSteps.trim();
        if (diaryForm.linkedArtifactId) {
          entry.linkedArtifactId = diaryForm.linkedArtifactId;
          if (linkedArt) entry.linkedArtifactTitle = linkedArt.title;
        }
        return entry;
      });
    } else {
      const newEntry: MeetingDiaryEntry = {
        id: `diary-${Date.now()}`,
        date: diaryForm.date,
        subject: diaryForm.subject.trim(),
        entryType: diaryForm.entryType,
        participants: diaryForm.participants.trim(),
        summary: diaryForm.summary.trim(),
        registeredBy: diaryForm.registeredBy.trim(),
        hoursSpent: Number(diaryForm.hoursSpent) || 1,
        createdAt: new Date().toISOString()
      };
      if (diaryForm.nextSteps.trim()) newEntry.nextSteps = diaryForm.nextSteps.trim();
      if (diaryForm.linkedArtifactId) {
        newEntry.linkedArtifactId = diaryForm.linkedArtifactId;
        if (linkedArt) newEntry.linkedArtifactTitle = linkedArt.title;
      }
      updatedList = [newEntry, ...meetingLogs];
    }

    const updatedProject = {
      ...project,
      meetingLogs: updatedList,
      lastUpdated: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    await onUpdateProject(updatedProject);
    setIsDiaryModalOpen(false);
  };

  const handleDeleteDiaryEntry = async (id: string) => {
    if (!confirm('Deseja realmente remover este registro do diário de bordo?')) return;
    const updatedList = meetingLogs.filter((e) => e.id !== id);
    const updatedProject = {
      ...project,
      meetingLogs: updatedList,
      lastUpdated: new Date().toLocaleDateString('pt-BR')
    };
    await onUpdateProject(updatedProject);
  };

  const handleCopyMeetingSummary = (entry: MeetingDiaryEntry) => {
    let text = `📋 *REGISTRO DE ALINHAMENTO — ${project.name}*\n`;
    text += `📅 *Data:* ${entry.date} (${entry.entryType})\n`;
    text += `🎯 *Pauta / Assunto:* ${entry.subject}\n`;
    text += `👥 *Participantes:* ${entry.participants}\n\n`;
    text += `📝 *Deliberações & Decisões:*\n${entry.summary}\n`;
    if (entry.nextSteps) {
      text += `\n🚀 *Próximos Passos & Pendências:*\n${entry.nextSteps}\n`;
    }
    if (entry.linkedArtifactTitle) {
      text += `\n📎 *Documento / Ata Vinculada:* ${entry.linkedArtifactTitle}\n`;
    }
    text += `\nRegistrado por: ${entry.registeredBy} | Governança TI ATTO`;

    navigator.clipboard.writeText(text);
    setCopiedDiaryId(entry.id);
    setTimeout(() => setCopiedDiaryId(null), 3000);
  };

  return (
    <div id="artifacts-diary-container" className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white border border-grey-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-brand-lighter text-brand-dark">
                {activeSection === 'artifacts' ? (
                  <FolderArchive className="w-5 h-5" />
                ) : (
                  <BookOpen className="w-5 h-5" />
                )}
              </span>
              <div>
                <h2 className="text-lg font-bold text-grey-900">
                  {activeSection === 'artifacts'
                    ? 'Central de Ativos, Documentos & Artefatos'
                    : 'Diário de Bordo & Atas de Reuniões'}
                </h2>
                <p className="text-xs text-grey-500">
                  {activeSection === 'artifacts'
                    ? 'Repositório de documentos oficiais, PDFs, especificações, planilhas base e homologações vinculadas.'
                    : 'Histórico cronológico de decisões tomadas, pautas executivas e alinhamentos técnicos e de negócio.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center bg-grey-100 p-1 rounded-lg border border-grey-200 shrink-0">
            <button
              onClick={() => setActiveSection('artifacts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeSection === 'artifacts'
                  ? 'bg-white text-brand-dark shadow-xs'
                  : 'text-grey-600 hover:text-grey-900'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Documentos & Artefatos</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-grey-200 text-grey-700 font-mono">
                {artifacts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('diary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeSection === 'diary'
                  ? 'bg-white text-brand-dark shadow-xs'
                  : 'text-grey-600 hover:text-grey-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Diário de Bordo</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-grey-200 text-grey-700 font-mono">
                {meetingLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-grey-100 text-xs">
          <div className="bg-grey-50 rounded-lg p-2.5 border border-grey-200">
            <span className="text-grey-500 font-medium block">Total de Documentos</span>
            <span className="text-lg font-black text-grey-900 font-mono">{artifacts.length}</span>
          </div>
          <div className="bg-grey-50 rounded-lg p-2.5 border border-grey-200">
            <span className="text-grey-500 font-medium block">Atas & Pautas Registradas</span>
            <span className="text-lg font-black text-blue-900 font-mono">
              {artifacts.filter((a) => a.category === 'Pauta / Ata de Reunião').length + meetingLogs.length}
            </span>
          </div>
          <div className="bg-grey-50 rounded-lg p-2.5 border border-grey-200">
            <span className="text-grey-500 font-medium block">Evidências de Homologação</span>
            <span className="text-lg font-black text-emerald-900 font-mono">
              {artifacts.filter((a) => a.category === 'Homologação & Evidências').length}
            </span>
          </div>
          <div className="bg-grey-50 rounded-lg p-2.5 border border-grey-200">
            <span className="text-grey-500 font-medium block">Horas em Alinhamento</span>
            <span className="text-lg font-black text-purple-900 font-mono">
              {meetingLogs.reduce((acc, curr) => acc + (curr.hoursSpent || 0), 0)}h
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: ARTEFATOS & DOCUMENTOS */}
      {/* ==================================================================== */}
      {activeSection === 'artifacts' && (
        <div className="space-y-4">
          {/* Action Bar & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <SearchInput
                  value={artifactSearch}
                  onChange={(e) => setArtifactSearch(e.target.value)}
                  placeholder="Buscar por título, responsável ou arquivo..."
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-white border border-grey-300 rounded-lg px-3 py-2 text-grey-800 focus:outline-hidden font-medium"
              >
                <option value="all">Todas as Categorias</option>
                <option value="Pauta / Ata de Reunião">Pauta / Ata de Reunião</option>
                <option value="Especificação Funcional">Especificação Funcional</option>
                <option value="Arquitetura & Segurança">Arquitetura & Segurança</option>
                <option value="Homologação & Evidências">Homologação & Evidências</option>
                <option value="Apresentação & Relatório">Apresentação & Relatório</option>
                <option value="Código & Repositório">Código & Repositório</option>
                <option value="Outro">Outros</option>
              </select>
            </div>

            <Button
              color="primary"
              size="sm"
              onClick={handleOpenNewArtifactModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Adicionar Artefato / Documento
            </Button>
          </div>

          {/* Artifacts Grid */}
          {filteredArtifacts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-grey-100 flex items-center justify-center mx-auto mb-3 text-grey-400">
                  <FolderArchive className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-grey-900 mb-1">Nenhum artefato encontrado</h3>
                <p className="text-xs text-grey-500 mb-4">
                  {artifactSearch || selectedCategory !== 'all'
                    ? 'Tente ajustar os filtros de busca para encontrar o documento.'
                    : 'Cadastre os documentos da solução (PDFs de homologação, DOCX de atas, links de Google Drive ou diagramas técnicos).'}
                </p>
                <Button
                  color="primary"
                  size="sm"
                  onClick={handleOpenNewArtifactModal}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Cadastrar Primeiro Artefato
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArtifacts.map((art) => {
                const catColor = CATEGORY_COLORS[art.category] || CATEGORY_COLORS['Outro'];
                const fileConfig = FILE_TYPE_CONFIG[art.fileType] || FILE_TYPE_CONFIG['outro'];

                return (
                  <div
                    key={art.id}
                    className="bg-white border border-grey-200 hover:border-brand-main/50 rounded-xl p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                        >
                          {art.category}
                        </span>

                        {art.version && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-grey-100 text-grey-600 border border-grey-200">
                            {art.version}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fileConfig.bgColor}`}
                          title={fileConfig.label}
                        >
                          {art.fileType === 'pdf' ? (
                            <FileText className={`w-5 h-5 ${fileConfig.iconColor}`} />
                          ) : art.fileType === 'docx' ? (
                            <FileText className={`w-5 h-5 ${fileConfig.iconColor}`} />
                          ) : art.fileType === 'xlsx' ? (
                            <FileSpreadsheet className={`w-5 h-5 ${fileConfig.iconColor}`} />
                          ) : art.fileType === 'drive' ? (
                            <Paperclip className={`w-5 h-5 ${fileConfig.iconColor}`} />
                          ) : (
                            <LinkIcon className={`w-5 h-5 ${fileConfig.iconColor}`} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-sm font-bold text-grey-900 truncate"
                            title={art.title}
                          >
                            {art.title}
                          </h4>
                          <p className="text-[11px] text-grey-500 line-clamp-2 mt-0.5">
                            {art.description || 'Sem descrição informada.'}
                          </p>
                        </div>
                      </div>

                      {/* File Details Tag */}
                      <div className="mt-3 pt-2.5 border-t border-grey-100 flex flex-wrap items-center justify-between text-[11px] text-grey-500 gap-1.5">
                        <span className="truncate max-w-[140px]" title={art.fileName || art.url || ''}>
                          {art.fileName ? art.fileName : art.url ? 'Link Externo' : 'Documento'}
                        </span>
                        {art.fileSize && (
                          <span className="font-mono text-grey-400">({art.fileSize})</span>
                        )}
                        <span className="text-grey-400">•</span>
                        <span>{art.createdAt}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-3 pt-3 border-t border-grey-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-grey-600 font-medium truncate">
                        <span>Por:</span>
                        <strong className="truncate max-w-[100px]">{art.author}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {art.fileData ? (
                          <button
                            onClick={() => handleDownloadArtifact(art)}
                            className="p-1.5 rounded-md hover:bg-brand-lighter text-brand-dark transition-colors"
                            title="Baixar arquivo anexado"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ) : art.url ? (
                          <a
                            href={art.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-brand-lighter text-brand-dark transition-colors"
                            title="Abrir link institucional em nova aba"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : null}

                        <button
                          onClick={() => handleOpenEditArtifactModal(art)}
                          className="p-1.5 rounded-md hover:bg-grey-100 text-grey-600 transition-colors"
                          title="Editar artefato"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteArtifact(art.id)}
                          className="p-1.5 rounded-md hover:bg-danger-50 text-danger-600 transition-colors"
                          title="Excluir artefato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: DIÁRIO DE BORDO & ATAS DE REUNIÕES */}
      {/* ==================================================================== */}
      {activeSection === 'diary' && (
        <div className="space-y-4">
          {/* Action Bar & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <SearchInput
                  value={diarySearch}
                  onChange={(e) => setDiarySearch(e.target.value)}
                  placeholder="Buscar por pauta, participantes ou decisões..."
                />
              </div>

              <select
                value={selectedDiaryType}
                onChange={(e) => setSelectedDiaryType(e.target.value)}
                className="text-xs bg-white border border-grey-300 rounded-lg px-3 py-2 text-grey-800 focus:outline-hidden font-medium"
              >
                <option value="all">Todos os Tipos de Alinhamento</option>
                <option value="Reunião de Alinhamento">Reunião de Alinhamento</option>
                <option value="Pauta Executiva">Pauta Executiva</option>
                <option value="Homologação com Usuário">Homologação com Usuário</option>
                <option value="Ponto de Controle T.I">Ponto de Controle T.I</option>
                <option value="Incidente / Mudança">Incidente / Mudança</option>
                <option value="Decisão de Arquitetura">Decisão de Arquitetura</option>
              </select>
            </div>

            <Button
              color="primary"
              size="sm"
              onClick={handleOpenNewDiaryModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Registrar Alinhamento / Pauta
            </Button>
          </div>

          {/* Timeline View of Diary Entries */}
          {filteredDiary.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-grey-100 flex items-center justify-center mx-auto mb-3 text-grey-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-grey-900 mb-1">Nenhum alinhamento registrado</h3>
                <p className="text-xs text-grey-500 mb-4">
                  {diarySearch || selectedDiaryType !== 'all'
                    ? 'Nenhum registro corresponde aos filtros selecionados.'
                    : 'Utilize o Diário de Bordo para registrar as reuniões executivas, pautas de alinhamento e decisões com os stakeholders.'}
                </p>
                <Button
                  color="primary"
                  size="sm"
                  onClick={handleOpenNewDiaryModal}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Registrar Primeiro Alinhamento
                </Button>
              </div>
            </Card>
          ) : (
            <div className="relative border-l-2 border-grey-200 ml-4 pl-6 space-y-6">
              {filteredDiary.map((entry) => (
                <div key={entry.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-main border-2 border-white shadow-xs group-hover:scale-125 transition-transform" />

                  <Card className="p-5 hover:border-grey-300 transition-all">
                    {/* Entry Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="flex items-center gap-1 text-xs font-bold text-grey-900">
                            <Calendar className="w-3.5 h-3.5 text-grey-500" />
                            {entry.date}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {entry.entryType}
                          </span>
                          {entry.hoursSpent ? (
                            <span className="flex items-center gap-1 text-[11px] text-grey-500 font-medium">
                              <Clock className="w-3 h-3 text-grey-400" />
                              {entry.hoursSpent}h dedicadas
                            </span>
                          ) : null}
                        </div>

                        <h3 className="text-base font-bold text-grey-900 leading-snug">
                          {entry.subject}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          color="secondary"
                          size="sm"
                          onClick={() => handleCopyMeetingSummary(entry)}
                          leftIcon={
                            copiedDiaryId === entry.id ? (
                              <Check className="w-3.5 h-3.5 text-brand-main" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )
                          }
                          title="Copiar ata formatada para colar no WhatsApp / Teams"
                        >
                          <span className="text-xs">
                            {copiedDiaryId === entry.id ? 'Ata Copiada!' : 'Copiar Ata'}
                          </span>
                        </Button>

                        <button
                          onClick={() => handleOpenEditDiaryModal(entry)}
                          className="p-1.5 rounded-md hover:bg-grey-100 text-grey-600 transition-colors"
                          title="Editar alinhamento"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteDiaryEntry(entry.id)}
                          className="p-1.5 rounded-md hover:bg-danger-50 text-danger-600 transition-colors"
                          title="Excluir alinhamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-1.5 text-xs text-grey-600 mb-3 bg-grey-50 px-3 py-1.5 rounded-lg border border-grey-100">
                      <Users className="w-3.5 h-3.5 text-grey-400 shrink-0" />
                      <span className="font-semibold text-grey-700">Participantes:</span>
                      <span className="truncate">{entry.participants}</span>
                    </div>

                    {/* Deliberations & Decisions Block */}
                    <div className="bg-brand-lightest/40 border border-brand-light/30 rounded-lg p-3.5 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-brand-main" />
                        Deliberações & Decisões Acordadas
                      </span>
                      <p className="text-xs text-grey-800 whitespace-pre-line leading-relaxed">
                        {entry.summary}
                      </p>
                    </div>

                    {/* Next Steps Block */}
                    {entry.nextSteps && (
                      <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-3.5 mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                          Próximos Passos & Pendências
                        </span>
                        <p className="text-xs text-grey-800 whitespace-pre-line leading-relaxed">
                          {entry.nextSteps}
                        </p>
                      </div>
                    )}

                    {/* Linked Artifact or Document Shortcut */}
                    {entry.linkedArtifactTitle && (
                      <div className="flex items-center gap-2 text-xs text-grey-600 pt-2 border-t border-grey-100">
                        <Paperclip className="w-3.5 h-3.5 text-grey-400" />
                        <span>Ata / Documento Associado:</span>
                        <span className="font-bold text-brand-dark bg-brand-lighter px-2 py-0.5 rounded text-[11px]">
                          {entry.linkedArtifactTitle}
                        </span>
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="text-[11px] text-grey-400 text-right mt-2">
                      Registrado por <strong>{entry.registeredBy}</strong>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADICIONAR / EDITAR ARTEFATO */}
      {/* ==================================================================== */}
      <Modal
        isOpen={isArtifactModalOpen}
        onClose={() => setIsArtifactModalOpen(false)}
        title={editingArtifact ? 'Editar Artefato / Documento' : 'Novo Artefato / Documento da Solução'}
        size="lg"
      >
        <div className="space-y-4 pt-1">
          <FormField label="Título do Documento *" required>
            <input
              type="text"
              value={artifactForm.title}
              onChange={(e) => setArtifactForm({ ...artifactForm, title: e.target.value })}
              placeholder="Ex.: Ata de Homologação com Logística ou Especificação de APIs"
              className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden focus:border-brand-main"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Categoria do Artefato *">
              <select
                value={artifactForm.category}
                onChange={(e) =>
                  setArtifactForm({ ...artifactForm, category: e.target.value as ArtifactCategory })
                }
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              >
                <option value="Pauta / Ata de Reunião">Pauta / Ata de Reunião</option>
                <option value="Especificação Funcional">Especificação Funcional</option>
                <option value="Arquitetura & Segurança">Arquitetura & Segurança</option>
                <option value="Homologação & Evidências">Homologação & Evidências</option>
                <option value="Apresentação & Relatório">Apresentação & Relatório</option>
                <option value="Código & Repositório">Código & Repositório</option>
                <option value="Outro">Outro</option>
              </select>
            </FormField>

            <FormField label="Versão / Revisão">
              <input
                type="text"
                value={artifactForm.version}
                onChange={(e) => setArtifactForm({ ...artifactForm, version: e.target.value })}
                placeholder="Ex.: v1.0, Rev 2, Final"
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              />
            </FormField>
          </div>

          {/* Source Mode Toggle: Link vs Upload */}
          <div className="border border-grey-200 rounded-xl p-3.5 bg-grey-50">
            <div className="flex items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold text-grey-900 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-grey-500" />
                Formato do Documento / Anexo
              </label>

              <div className="flex items-center bg-grey-200 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setArtifactForm({ ...artifactForm, sourceMode: 'link' })}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    artifactForm.sourceMode === 'link'
                      ? 'bg-white text-grey-900 shadow-2xs'
                      : 'text-grey-600 hover:text-grey-900'
                  }`}
                >
                  Link em Nuvem (Drive/SharePoint)
                </button>
                <button
                  type="button"
                  onClick={() => setArtifactForm({ ...artifactForm, sourceMode: 'upload' })}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    artifactForm.sourceMode === 'upload'
                      ? 'bg-white text-grey-900 shadow-2xs'
                      : 'text-grey-600 hover:text-grey-900'
                  }`}
                >
                  Anexar Arquivo Local
                </button>
              </div>
            </div>

            {artifactForm.sourceMode === 'link' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] text-grey-500 font-medium block mb-1">
                      Tipo de Link
                    </label>
                    <select
                      value={artifactForm.fileType}
                      onChange={(e) =>
                        setArtifactForm({ ...artifactForm, fileType: e.target.value as ArtifactFileType })
                      }
                      className="w-full text-xs border border-grey-300 rounded-lg px-2.5 py-1.5 text-grey-900 bg-white"
                    >
                      <option value="drive">Google Drive</option>
                      <option value="link">SharePoint / Nuvem</option>
                      <option value="pdf">Link para PDF</option>
                      <option value="docx">Link para Word</option>
                      <option value="xlsx">Link para Planilha</option>
                      <option value="pptx">Link para Apresentação</option>
                      <option value="outro">Outro Link</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-grey-500 font-medium block mb-1">
                      URL Direta do Arquivo / Pasta
                    </label>
                    <input
                      type="url"
                      value={artifactForm.url}
                      onChange={(e) => setArtifactForm({ ...artifactForm, url: e.target.value })}
                      placeholder="https://drive.google.com/... ou https://attosementes.sharepoint.com/..."
                      className="w-full text-xs border border-grey-300 rounded-lg px-3 py-1.5 text-grey-900 bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-grey-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-grey-400" />
                  Cole o link corporativo do Google Drive ou SharePoint garantindo as permissões de acesso aos envolvidos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-grey-300 rounded-lg p-5 text-center bg-white hover:border-brand-main transition-colors">
                  <Upload className="w-6 h-6 text-grey-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-xs font-bold text-brand-dark hover:underline">
                      Clique para selecionar o arquivo
                    </span>
                    <span className="text-xs text-grey-500"> (PDF, DOCX, XLSX, PPTX, Imagem)</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg"
                    />
                  </label>
                  {artifactForm.fileName && (
                    <div className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded inline-flex items-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{artifactForm.fileName}</span>
                      <span className="font-mono text-grey-500">({artifactForm.fileSize})</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Responsável / Autor">
              <input
                type="text"
                value={artifactForm.author}
                onChange={(e) => setArtifactForm({ ...artifactForm, author: e.target.value })}
                placeholder="Ex.: Diego Cavalcante ou TI Governança"
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              />
            </FormField>

            <FormField label="Resumo / Observações">
              <input
                type="text"
                value={artifactForm.description}
                onChange={(e) => setArtifactForm({ ...artifactForm, description: e.target.value })}
                placeholder="Breve explicação do conteúdo do documento"
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-grey-200">
            <Button color="secondary" size="sm" onClick={() => setIsArtifactModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={handleSaveArtifact}
              disabled={!artifactForm.title.trim()}
            >
              {editingArtifact ? 'Salvar Alterações' : 'Adicionar Artefato'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: REGISTRAR ALINHAMENTO / PAUTA NO DIÁRIO DE BORDO */}
      {/* ==================================================================== */}
      <Modal
        isOpen={isDiaryModalOpen}
        onClose={() => setIsDiaryModalOpen(false)}
        title={editingDiary ? 'Editar Registro no Diário de Bordo' : 'Registrar Reunião / Alinhamento'}
        size="lg"
      >
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Data da Reunião *" required>
              <input
                type="text"
                value={diaryForm.date}
                onChange={(e) => setDiaryForm({ ...diaryForm, date: e.target.value })}
                placeholder="DD/MM/AAAA"
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              />
            </FormField>

            <FormField label="Tipo de Registro *">
              <select
                value={diaryForm.entryType}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, entryType: e.target.value as MeetingEntryType })
                }
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              >
                <option value="Reunião de Alinhamento">Reunião de Alinhamento</option>
                <option value="Pauta Executiva">Pauta Executiva</option>
                <option value="Homologação com Usuário">Homologação com Usuário</option>
                <option value="Ponto de Controle T.I">Ponto de Controle T.I</option>
                <option value="Incidente / Mudança">Incidente / Mudança</option>
                <option value="Decisão de Arquitetura">Decisão de Arquitetura</option>
              </select>
            </FormField>

            <FormField label="Horas Dedicadas (h)">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={diaryForm.hoursSpent}
                onChange={(e) =>
                  setDiaryForm({ ...diaryForm, hoursSpent: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              />
            </FormField>
          </div>

          <FormField label="Pauta / Assunto Principal *" required>
            <input
              type="text"
              value={diaryForm.subject}
              onChange={(e) => setDiaryForm({ ...diaryForm, subject: e.target.value })}
              placeholder="Ex.: Alinhamento sobre expurgo LGPD de 2 safras e aprovação de minutas"
              className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden focus:border-brand-main"
            />
          </FormField>

          <FormField label="Participantes & Áreas *">
            <input
              type="text"
              value={diaryForm.participants}
              onChange={(e) => setDiaryForm({ ...diaryForm, participants: e.target.value })}
              placeholder="Ex.: Diego Cavalcante (Logística), Roger (Dev), Eliel Lima (TI Governança)"
              className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
            />
          </FormField>

          <FormField label="Deliberações & Decisões Acordadas *" required>
            <textarea
              rows={4}
              value={diaryForm.summary}
              onChange={(e) => setDiaryForm({ ...diaryForm, summary: e.target.value })}
              placeholder="Descreva o que foi discutido e as decisões tomadas nesta reunião..."
              className="w-full text-xs border border-grey-300 rounded-lg p-3 text-grey-900 focus:outline-hidden focus:border-brand-main"
            />
          </FormField>

          <FormField label="Próximos Passos & Pendências">
            <textarea
              rows={3}
              value={diaryForm.nextSteps}
              onChange={(e) => setDiaryForm({ ...diaryForm, nextSteps: e.target.value })}
              placeholder="Ações que ficaram acordadas e seus respectivos responsáveis..."
              className="w-full text-xs border border-grey-300 rounded-lg p-3 text-grey-900 focus:outline-hidden"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Vincular a um Artefato / Ata (Opcional)">
              <select
                value={diaryForm.linkedArtifactId}
                onChange={(e) => setDiaryForm({ ...diaryForm, linkedArtifactId: e.target.value })}
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              >
                <option value="">Nenhum documento vinculado</option>
                {artifacts.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title} ({art.category})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Registrado Por">
              <input
                type="text"
                value={diaryForm.registeredBy}
                onChange={(e) => setDiaryForm({ ...diaryForm, registeredBy: e.target.value })}
                className="w-full text-xs border border-grey-300 rounded-lg px-3 py-2 text-grey-900 focus:outline-hidden"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-grey-200">
            <Button color="secondary" size="sm" onClick={() => setIsDiaryModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={handleSaveDiaryEntry}
              disabled={!diaryForm.subject.trim() || !diaryForm.summary.trim()}
            >
              {editingDiary ? 'Salvar Registro' : 'Registrar Alinhamento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
