import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { TextVersion } from '../types';
import { normalizeEditorHtml } from '../utils/richText';
import { Badge, Button, Modal, ModalFooter } from './ui';
import { RichTextEditor } from './ui/RichTextEditor';

interface TextVersionHistoryModalProps {
  title: string;
  versions: TextVersion[]; // mais antigas primeiro
  currentHtml: string;
  canRestore: boolean;
  onRestore: (html: string) => void;
  onClose: () => void;
}

function formatSavedAt(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Lista as versões salvas de um texto da Ficha e permite trazer uma delas de volta para o editor. */
export const TextVersionHistoryModal: React.FC<TextVersionHistoryModalProps> = ({
  title,
  versions,
  currentHtml,
  canRestore,
  onRestore,
  onClose
}) => {
  const ordered = [...versions].reverse();
  const [selectedId, setSelectedId] = useState<string | null>(ordered[0]?.id || null);
  const selected = ordered.find((v) => v.id === selectedId);
  const latestId = ordered[0]?.id;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={`Histórico — ${title}`}
      subtitle="Cada vez que a ficha é salva com este texto alterado, uma nova versão é guardada."
    >
      {ordered.length === 0 ? (
        <p className="text-xs text-grey-500">Nenhuma versão salva ainda. A primeira é criada ao salvar uma alteração.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ul className="sm:col-span-1 space-y-1 max-h-80 overflow-y-auto">
            {ordered.map((version, idx) => (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(version.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md text-xs border ${
                    version.id === selectedId ? 'border-brand-main bg-brand-lighter/60' : 'border-transparent hover:bg-grey-50'
                  }`}
                >
                  <div className="font-semibold text-grey-900 flex items-center gap-1.5">
                    Versão {ordered.length - idx}
                    {version.id === latestId && (
                      <Badge className="bg-grey-100 text-grey-600 border-grey-200 text-[9px]">mais recente</Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-grey-500 mt-0.5">{formatSavedAt(version.savedAt)}</div>
                  <div className="text-[11px] text-grey-400">{version.savedBy}</div>
                </button>
              </li>
            ))}
          </ul>
          <div className="sm:col-span-2 max-h-80 overflow-y-auto">
            {selected &&
              (normalizeEditorHtml(selected.html) ? (
                <RichTextEditor key={selected.id} value={selected.html} editable={false} />
              ) : (
                <p className="text-xs text-grey-500 italic">Texto vazio nesta versão.</p>
              ))}
          </div>
        </div>
      )}

      <ModalFooter>
        <Button color="secondary" onClick={onClose}>
          Fechar
        </Button>
        {canRestore && selected && (
          <Button
            color="primary"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            disabled={normalizeEditorHtml(selected.html) === normalizeEditorHtml(currentHtml)}
            onClick={() => onRestore(selected.html)}
            title="Coloca esta versão no editor; salve a ficha para confirmar"
          >
            Restaurar no editor
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
