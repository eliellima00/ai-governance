import React, { useState } from 'react';
import { BookOpen, Calendar, CheckCircle2, Check, Clock, Copy, Edit2, Paperclip, Plus, Trash2, Users } from 'lucide-react';
import { MeetingDiaryEntry, MeetingEntryType, SolutionProject, StageTab, UserRole } from '../types';
import { getActiveConfig } from '../config/governanceConfig';
import { can } from '../utils/permissions';
import { getCurrentStage, getStageMeetings, isStageTab, stageLabel, STAGE_TABS } from '../utils/projectStatus';
import { Badge, Button, Card, Field, Input, Modal, ModalFooter, Select, Textarea } from './ui';

interface MeetingLogPanelProps {
  project: SolutionProject;
  userRole: UserRole;
  onUpdateProject: (updatedProject: SolutionProject) => void;
  /** Etapa cujas reuniões são listadas; também é a etapa padrão de um novo registro. */
  stage: StageTab;
}

type DiaryForm = {
  date: string;
  subject: string;
  entryType: MeetingEntryType;
  participants: string;
  summary: string;
  nextSteps: string;
  registeredBy: string;
  hoursSpent: number;
  linkedArtifactId: string;
  stage: StageTab;
};

const nowStamp = () =>
  new Date().toLocaleDateString('pt-BR') +
  ' ' +
  new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Reuniões e atas registradas em uma etapa da esteira. */
export const MeetingLogPanel: React.FC<MeetingLogPanelProps> = ({ project, userRole, onUpdateProject, stage }) => {
  const { meetingEntryTypes } = getActiveConfig().auxiliaryLists;
  const canManage = can(userRole, 'add_activity_log');
  const meetingLogs = project.meetingLogs || [];
  const artifacts = project.artifacts || [];
  const entries = getStageMeetings(project, stage);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingDiaryEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const emptyForm = (): DiaryForm => ({
    date: new Date().toLocaleDateString('pt-BR'),
    subject: '',
    entryType: meetingEntryTypes[0] || 'Reunião de Alinhamento',
    participants: `${project.businessResponsible || 'Negócio'}, ${project.technicalResponsible || 'TI Dev'}`,
    summary: '',
    nextSteps: '',
    registeredBy: 'Governança TI',
    hoursSpent: 1,
    linkedArtifactId: '',
    stage
  });
  const [form, setForm] = useState<DiaryForm>(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (entry: MeetingDiaryEntry) => {
    setEditing(entry);
    setForm({
      date: entry.date,
      subject: entry.subject,
      entryType: entry.entryType,
      participants: entry.participants,
      summary: entry.summary,
      nextSteps: entry.nextSteps || '',
      registeredBy: entry.registeredBy,
      hoursSpent: entry.hoursSpent || 1,
      linkedArtifactId: entry.linkedArtifactId || '',
      stage: entry.stage || stage
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!canManage || !form.subject.trim() || !form.summary.trim()) return;
    const linkedArt = artifacts.find((a) => a.id === form.linkedArtifactId);
    const entry: MeetingDiaryEntry = {
      id: editing?.id || `diary-${Date.now()}`,
      date: form.date,
      subject: form.subject.trim(),
      entryType: form.entryType,
      participants: form.participants.trim(),
      summary: form.summary.trim(),
      registeredBy: form.registeredBy.trim(),
      hoursSpent: Number(form.hoursSpent) || 1,
      createdAt: editing?.createdAt || new Date().toISOString(),
      stage: form.stage
    };
    if (form.nextSteps.trim()) entry.nextSteps = form.nextSteps.trim();
    if (form.linkedArtifactId) {
      entry.linkedArtifactId = form.linkedArtifactId;
      if (linkedArt) entry.linkedArtifactTitle = linkedArt.title;
    }
    const updatedList = editing
      ? meetingLogs.map((e) => (e.id === editing.id ? entry : e))
      : [entry, ...meetingLogs];
    onUpdateProject({ ...project, meetingLogs: updatedList, lastUpdated: nowStamp() });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canManage || !confirm('Deseja realmente remover este registro de reunião?')) return;
    onUpdateProject({ ...project, meetingLogs: meetingLogs.filter((e) => e.id !== id), lastUpdated: nowStamp() });
  };

  const handleCopy = (entry: MeetingDiaryEntry) => {
    let text = `📋 *REGISTRO DE ALINHAMENTO — ${project.name}*\n`;
    text += `📅 *Data:* ${entry.date} (${entry.entryType})\n`;
    text += `🎯 *Pauta / Assunto:* ${entry.subject}\n`;
    text += `👥 *Participantes:* ${entry.participants}\n\n`;
    text += `📝 *Deliberações & Decisões:*\n${entry.summary}\n`;
    if (entry.nextSteps) text += `\n🚀 *Próximos Passos & Pendências:*\n${entry.nextSteps}\n`;
    if (entry.linkedArtifactTitle) text += `\n📎 *Documento Vinculado:* ${entry.linkedArtifactTitle}\n`;
    text += `\nRegistrado por: ${entry.registeredBy} | Governança TI ATTO`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-grey-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-dark" />
          <span>Reuniões & atas desta etapa</span>
          <span className="text-xs font-normal text-grey-500">({entries.length})</span>
        </h3>
        {canManage && (
          <Button color="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openNew}>
            Registrar reunião
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-grey-500">Nenhuma reunião registrada nesta etapa.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="border border-grey-200 rounded-lg p-4 space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1 text-xs">
                    <span className="flex items-center gap-1 font-bold text-grey-900">
                      <Calendar className="w-3.5 h-3.5 text-grey-500" />
                      {entry.date}
                    </span>
                    <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px]">{entry.entryType}</Badge>
                    {!entry.stage && (
                      <span
                        className="text-[10px] text-warning-600 font-medium"
                        title="Reunião antiga sem etapa gravada: a etapa foi sugerida pela data. Edite e salve para confirmar."
                      >
                        etapa sugerida
                      </span>
                    )}
                    {entry.hoursSpent ? (
                      <span className="flex items-center gap-1 text-[11px] text-grey-500">
                        <Clock className="w-3 h-3" />
                        {entry.hoursSpent}h
                      </span>
                    ) : null}
                  </div>
                  <h4 className="text-sm font-bold text-grey-900">{entry.subject}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => handleCopy(entry)}
                    leftIcon={copiedId === entry.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    title="Copiar ata formatada para colar no WhatsApp / Teams"
                  >
                    {copiedId === entry.id ? 'Copiada!' : 'Copiar ata'}
                  </Button>
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEdit(entry)}
                        className="p-1.5 rounded-md hover:bg-grey-100 text-grey-600"
                        title="Editar reunião"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-md hover:bg-danger-50 text-danger-600"
                        title="Excluir reunião"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-grey-600">
                <Users className="w-3.5 h-3.5 text-grey-400 shrink-0" />
                <span className="truncate">{entry.participants}</span>
              </div>
              <p className="text-xs text-grey-800 whitespace-pre-line leading-relaxed">{entry.summary}</p>
              {entry.nextSteps && (
                <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-3">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    Próximos passos
                  </span>
                  <p className="text-xs text-grey-800 whitespace-pre-line">{entry.nextSteps}</p>
                </div>
              )}
              {entry.linkedArtifactTitle && (
                <div className="flex items-center gap-2 text-xs text-grey-600">
                  <Paperclip className="w-3.5 h-3.5 text-grey-400" />
                  <span>Documento:</span>
                  <span className="font-bold text-brand-dark">{entry.linkedArtifactTitle}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar reunião' : 'Registrar reunião'}
        size="lg"
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Data *">
              <Input
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="DD/MM/AAAA"
              />
            </Field>
            <Field label="Tipo">
              <Select value={form.entryType} onChange={(e) => setForm({ ...form, entryType: e.target.value })}>
                {meetingEntryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Horas dedicadas">
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={form.hoursSpent}
                onChange={(e) => setForm({ ...form, hoursSpent: parseFloat(e.target.value) || 0 })}
              />
            </Field>
          </div>

          <Field label="Pauta / assunto *">
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </Field>

          <Field label="Participantes">
            <Input value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} />
          </Field>

          <Field label="Decisões e deliberações *">
            <Textarea rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </Field>

          <Field label="Próximos passos">
            <Textarea rows={2} value={form.nextSteps} onChange={(e) => setForm({ ...form, nextSteps: e.target.value })} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Etapa">
              <Select
                value={form.stage}
                onChange={(e) => isStageTab(e.target.value) && setForm({ ...form, stage: e.target.value })}
              >
                {STAGE_TABS.map((s) => (
                  <option key={s} value={s}>
                    {stageLabel(s)}
                    {s === getCurrentStage(project) ? ' (atual)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Documento vinculado">
              <Select
                value={form.linkedArtifactId}
                onChange={(e) => setForm({ ...form, linkedArtifactId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {artifacts.map((art) => (
                  <option key={art.id} value={art.id}>
                    {art.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Registrado por">
              <Input value={form.registeredBy} onChange={(e) => setForm({ ...form, registeredBy: e.target.value })} />
            </Field>
          </div>
        </div>

        <ModalFooter>
          <Button color="secondary" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSave} disabled={!form.subject.trim() || !form.summary.trim()}>
            {editing ? 'Salvar' : 'Registrar'}
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  );
};
