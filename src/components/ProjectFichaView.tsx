import React, { useState } from 'react';
import { Building, CheckCircle, Clock, History, Lock, Save } from 'lucide-react';
import { RichTextField, SolutionProject, TextVersion, UserRole } from '../types';
import { getActiveConfig } from '../config/governanceConfig';
import { can } from '../utils/permissions';
import { normalizeEditorHtml, toEditorHtml } from '../utils/richText';
import { Button, Field, Input, Select } from './ui';
import { RichTextEditor } from './ui/RichTextEditor';
import { DocumentLinksPanel } from './DocumentLinksPanel';
import { TextVersionHistoryModal } from './TextVersionHistoryModal';

const RICH_FIELDS: { field: RichTextField; label: string }[] = [
  { field: 'objective', label: 'Objetivo' },
  { field: 'initialDoc', label: 'Documentação inicial / observações' }
];

const ROLE_LABELS: Record<UserRole, string> = { admin: 'Perfil Admin', padrao: 'Perfil Padrão' };

/**
 * Monta as novas versões dos textos alterados. Na primeira alteração de um campo, o conteúdo que já
 * existia entra como "versão original", para que também possa ser restaurado.
 */
function appendTextVersions(
  project: SolutionProject,
  next: Record<RichTextField, string>,
  savedBy: string
): TextVersion[] {
  const versions = [...(project.textVersions || [])];
  const now = new Date().toISOString();
  RICH_FIELDS.forEach(({ field }, idx) => {
    const previous = normalizeEditorHtml(toEditorHtml(project[field]));
    const current = normalizeEditorHtml(toEditorHtml(next[field]));
    if (previous === current) return;
    if (!versions.some((v) => v.field === field) && previous) {
      versions.push({ id: `tv-${Date.now()}-${idx}-orig`, field, html: previous, savedAt: project.createdAt || now, savedBy: 'Versão original' });
    }
    versions.push({ id: `tv-${Date.now()}-${idx}`, field, html: current, savedAt: now, savedBy });
  });
  return versions;
}

interface ProjectFichaViewProps {
  project: SolutionProject;
  userRole: UserRole;
  onUpdateProject: (updatedProject: SolutionProject) => void;
}

/** Exibição estática de um campo, usada no lugar do input/select/textarea quando o perfil não pode editar. */
const ReadOnlyField: React.FC<{ value: string; multiline?: boolean; className?: string }> = ({
  value,
  multiline,
  className = ''
}) => (
  <div
    className={`w-full px-3 py-2 border border-grey-200 rounded-md text-sm bg-grey-50 text-grey-700 ${
      multiline ? 'whitespace-pre-line leading-relaxed' : 'truncate'
    } ${className}`}
  >
    {value || '—'}
  </div>
);

/** Ficha do ativo (dados do GLPI) e repositório de documentos e links do projeto. */
export const ProjectFichaView: React.FC<ProjectFichaViewProps> = ({ project, userRole, onUpdateProject }) => {
  const { auxiliaryLists } = getActiveConfig();
  const canEdit = can(userRole, 'edit_project_glpi');

  const [form, setForm] = useState({
    name: project.name,
    status: project.status,
    assetId: project.assetId || '',
    glpiTicketId: project.glpiTicketId || '',
    technicalResponsible: project.technicalResponsible,
    groupEncargado: project.groupEncargado || '',
    businessResponsible: project.businessResponsible,
    objective: project.objective,
    initialDoc: project.initialDoc,
    classification: project.technicalDoc?.classification || ''
  });
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [historyField, setHistoryField] = useState<RichTextField | null>(null);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    const { classification, ...fields } = form;
    onUpdateProject({
      ...project,
      ...fields,
      textVersions: appendTextVersions(project, form, ROLE_LABELS[userRole]),
      // O bloco legado da Documentação Viva é preservado; só a classificação continua editável
      technicalDoc: project.technicalDoc
        ? { ...project.technicalDoc, classification }
        : ({ classification } as SolutionProject['technicalDoc']),
      lastUpdated:
        new Date().toLocaleDateString('pt-BR') +
        ' ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const textField = (field: keyof typeof form, label: string, mono = false) => (
    <Field label={label}>
      {canEdit ? (
        <Input value={form[field]} onChange={set(field)} className={mono ? 'font-mono' : ''} />
      ) : (
        <ReadOnlyField value={form[field]} className={mono ? 'font-mono' : ''} />
      )}
    </Field>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-grey-200 rounded-lg shadow-xs overflow-hidden">
        <div className="bg-grey-100 border-b border-grey-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-grey-600" />
            <span className="font-semibold text-grey-800 text-sm">Ficha do ativo (GLPI)</span>
          </div>
          <span className="text-xs text-grey-500">
            Cadastrado por: <strong className="text-grey-700">{project.registeredBy || '—'}</strong>
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {textField('name', 'Nome')}
              <Field label="Status">
                {canEdit ? (
                  <Select value={form.status} onChange={set('status')}>
                    {auxiliaryLists.statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <ReadOnlyField value={form.status} />
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {textField('assetId', 'Identificador do ativo (GLPI)', true)}
              {textField('glpiTicketId', 'Nº do chamado GLPI de origem', true)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {textField('technicalResponsible', 'Técnico encarregado')}
              {textField('groupEncargado', 'Grupo encarregado')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {textField('businessResponsible', 'Usuário (responsável de negócio)')}
              <Field label="Grupo">
                <ReadOnlyField value={project.userGroup || ''} />
              </Field>
            </div>

            {textField('classification', 'Classificação da informação (ex.: Confidencial - Uso Interno)')}

            {RICH_FIELDS.map(({ field, label }) => {
              const versionCount = (project.textVersions || []).filter((v) => v.field === field).length;
              return (
                <div key={field}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-grey-700 text-sm">{label}</span>
                    <button
                      type="button"
                      onClick={() => setHistoryField(field)}
                      className="text-xs text-grey-500 hover:text-brand-dark flex items-center gap-1"
                      title="Ver as versões salvas deste texto"
                    >
                      <History className="w-3.5 h-3.5" />
                      Histórico ({versionCount})
                    </button>
                  </div>
                  <RichTextEditor
                    value={form[field]}
                    editable={canEdit}
                    onChange={(html) => setForm((prev) => ({ ...prev, [field]: html }))}
                  />
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-3">
            {project.qrCodeUrl && (
              <div className="border border-grey-200 rounded-lg p-4 bg-grey-50 text-center">
                <div className="text-xs font-semibold text-grey-700 mb-2">Etiqueta & QR Code do ativo</div>
                <div className="w-32 h-32 bg-white p-2 rounded-lg border border-grey-300 mx-auto flex items-center justify-center">
                  <img src={project.qrCodeUrl} alt="QR Code do ativo GLPI" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="mt-2 text-[11px] text-grey-500 truncate font-mono">{project.assetId} | GLPI ATTO</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-grey-50 border-t border-grey-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-grey-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Última modificação: {project.lastUpdated}</span>
          </div>
          <div className="flex items-center gap-3">
            {isSavedToast && (
              <span className="text-xs font-semibold text-brand-dark bg-brand-lighter px-2.5 py-1 rounded border border-brand-light flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Alterações salvas
              </span>
            )}
            {canEdit ? (
              <Button onClick={handleSave} color="primary" leftIcon={<Save className="w-4 h-4" />}>
                Salvar ficha
              </Button>
            ) : (
              <span className="text-xs text-grey-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Somente leitura para o seu perfil
              </span>
            )}
          </div>
        </div>
      </div>

      <DocumentLinksPanel project={project} userRole={userRole} onUpdateProject={onUpdateProject} />

      {historyField && (
        <TextVersionHistoryModal
          title={RICH_FIELDS.find((f) => f.field === historyField)?.label || ''}
          versions={(project.textVersions || []).filter((v) => v.field === historyField)}
          currentHtml={form[historyField]}
          canRestore={canEdit}
          onRestore={(html) => {
            setForm((prev) => ({ ...prev, [historyField]: html }));
            setHistoryField(null);
          }}
          onClose={() => setHistoryField(null)}
        />
      )}
    </div>
  );
};
