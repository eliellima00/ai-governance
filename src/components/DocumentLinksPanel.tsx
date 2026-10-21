import React, { useState } from 'react';
import { Download, Edit2, ExternalLink, FolderOpen, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { ArtifactFileType, ProjectArtifact, SolutionProject, UserRole } from '../types';
import { getActiveConfig } from '../config/governanceConfig';
import { can } from '../utils/permissions';
import { Badge, Button, Card, Field, Input, Modal, ModalFooter, Select } from './ui';

interface DocumentLinksPanelProps {
  project: SolutionProject;
  userRole: UserRole;
  onUpdateProject: (updatedProject: SolutionProject) => void;
}

type LegacyLinkKey = keyof SolutionProject['links'];

// Links fixos da ficha antiga: aparecem na mesma lista e viram documentos comuns ao serem editados.
const LEGACY_LINK_LABELS: Record<LegacyLinkKey, string> = {
  spreadsheet: 'Planilha base',
  script: 'Script / automação',
  githubRepo: 'Repositório (GitHub)',
  internalPanel: 'Painel interno',
  externalPortal: 'Portal externo'
};

interface DocRow {
  key: string;
  title: string;
  category: string;
  url?: string;
  description?: string;
  meta?: string;
  artifact?: ProjectArtifact;
  legacyKey?: LegacyLinkKey;
}

interface DocForm {
  title: string;
  category: string;
  url: string;
  description: string;
}

function inferFileType(url: string): ArtifactFileType {
  const lower = url.toLowerCase();
  if (lower.includes('drive.google') || lower.includes('docs.google')) return 'drive';
  if (lower.endsWith('.pdf')) return 'pdf';
  return 'link';
}

function downloadLegacyFile(art: ProjectArtifact) {
  if (!art.fileData) return;
  const link = document.createElement('a');
  link.href = art.fileData;
  link.download = art.fileName || `${art.title}.${art.fileType}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Documentos, manuais e links produzidos pelo projeto (só links; sem upload de arquivo). */
export const DocumentLinksPanel: React.FC<DocumentLinksPanelProps> = ({ project, userRole, onUpdateProject }) => {
  const { artifactCategories } = getActiveConfig().auxiliaryLists;
  const canManage = can(userRole, 'add_notes');
  const artifacts = project.artifacts || [];
  const defaultCategory = artifactCategories[0] || 'Outro';

  const rows: DocRow[] = [
    ...(Object.keys(LEGACY_LINK_LABELS) as LegacyLinkKey[])
      .filter((key) => project.links?.[key])
      .map((key) => ({
        key: `legacy-${key}`,
        title: LEGACY_LINK_LABELS[key],
        category: 'Link da solução',
        url: project.links[key],
        legacyKey: key
      })),
    ...artifacts.map((art) => ({
      key: art.id,
      title: art.title,
      category: art.category,
      url: art.url,
      description: art.description,
      meta: [art.author, art.createdAt].filter(Boolean).join(' · '),
      artifact: art
    }))
  ];

  const [editingRow, setEditingRow] = useState<DocRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<DocForm>({ title: '', category: defaultCategory, url: '', description: '' });

  const openNew = () => {
    setEditingRow(null);
    setForm({ title: '', category: defaultCategory, url: '', description: '' });
    setIsModalOpen(true);
  };

  const openEdit = (row: DocRow) => {
    setEditingRow(row);
    setForm({
      title: row.title,
      category: row.legacyKey ? defaultCategory : row.category,
      url: row.url || '',
      description: row.description || ''
    });
    setIsModalOpen(true);
  };

  const stamp = () => new Date().toLocaleDateString('pt-BR');

  // Anexos antigos (arquivo sem link) continuam editáveis sem exigir URL
  const urlRequired = !editingRow?.artifact?.fileData;
  const canSave = !!form.title.trim() && (!urlRequired || !!form.url.trim());

  const handleSave = () => {
    if (!canManage || !canSave) return;
    const url = form.url.trim();
    const base: ProjectArtifact = {
      ...editingRow?.artifact,
      id: editingRow?.artifact?.id || `art-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      fileType: url ? inferFileType(url) : editingRow?.artifact?.fileType || 'outro',
      url: url || undefined,
      version: editingRow?.artifact?.version || 'v1.0',
      author: editingRow?.artifact?.author || project.technicalResponsible || 'T.I / Governança',
      createdAt: editingRow?.artifact?.createdAt || stamp()
    };
    base.description = form.description.trim() || undefined;

    let links = project.links;
    let updatedArtifacts: ProjectArtifact[];
    if (editingRow?.artifact) {
      updatedArtifacts = artifacts.map((a) => (a.id === base.id ? base : a));
    } else {
      updatedArtifacts = [base, ...artifacts];
      // Editar um link da ficha antiga o converte em documento comum
      if (editingRow?.legacyKey) links = { ...project.links, [editingRow.legacyKey]: '' };
    }
    onUpdateProject({ ...project, artifacts: updatedArtifacts, links, lastUpdated: stamp() });
    setIsModalOpen(false);
  };

  const handleDelete = (row: DocRow) => {
    if (!canManage || !confirm(`Remover "${row.title}" da lista de documentos?`)) return;
    if (row.legacyKey) {
      onUpdateProject({ ...project, links: { ...project.links, [row.legacyKey]: '' }, lastUpdated: stamp() });
    } else {
      onUpdateProject({ ...project, artifacts: artifacts.filter((a) => a.id !== row.key), lastUpdated: stamp() });
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-brand-dark" />
            <span>Documentos & links</span>
            <span className="text-xs font-normal text-grey-500">({rows.length})</span>
          </h3>
          <p className="text-xs text-grey-500 mt-0.5">
            Tudo o que o projeto produziu: manuais, documentação, POPs, repositório, planilhas e evidências.
          </p>
        </div>
        {canManage && (
          <Button color="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openNew}>
            Adicionar link
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-grey-500">Nenhum documento ou link cadastrado.</p>
      ) : (
        <ul className="divide-y divide-grey-100 border border-grey-200 rounded-lg">
          {rows.map((row) => (
            <li key={row.key} className="flex items-start gap-3 px-3.5 py-2.5">
              <LinkIcon className="w-4 h-4 text-grey-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {row.url ? (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-brand-dark hover:underline inline-flex items-center gap-1"
                    >
                      {row.title}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-grey-900">{row.title}</span>
                  )}
                  <Badge className="bg-grey-100 text-grey-600 border-grey-200 text-[10px]">{row.category}</Badge>
                </div>
                {row.description && <p className="text-[11px] text-grey-600 mt-0.5">{row.description}</p>}
                <p className="text-[11px] text-grey-400 mt-0.5 truncate font-mono">
                  {row.url || (row.artifact?.fileName ? `Arquivo anexado: ${row.artifact.fileName}` : '')}
                  {row.meta && <span className="font-sans"> · {row.meta}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {row.artifact?.fileData && (
                  <button
                    onClick={() => row.artifact && downloadLegacyFile(row.artifact)}
                    className="p-1.5 rounded-md hover:bg-brand-lighter text-brand-dark"
                    title="Baixar arquivo anexado (anexos antigos; novos documentos são só links)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                {canManage && (
                  <>
                    <button
                      onClick={() => openEdit(row)}
                      className="p-1.5 rounded-md hover:bg-grey-100 text-grey-600"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="p-1.5 rounded-md hover:bg-danger-50 text-danger-600"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRow ? 'Editar documento' : 'Adicionar documento ou link'}
        subtitle="Cole o link do Drive, SharePoint, GitHub ou GLPI, garantindo que os envolvidos tenham acesso."
      >
        <div className="space-y-3.5">
          <Field label="Título" required>
            <Input
              placeholder="Ex.: Manual do usuário, POP de recuperação, Repositório"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Link" required={urlRequired}>
            <Input
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Categoria">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {artifactCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descrição (opcional)">
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </div>
        <ModalFooter>
          <Button color="secondary" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSave} disabled={!canSave}>
            Salvar
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  );
};
