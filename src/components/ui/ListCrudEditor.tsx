import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './Button';

export interface ListCrudEditorProps {
  /** Título curto da lista (ex.: "Área / Departamento"). */
  label: string;
  /** Explicação de onde essa lista é usada no app. */
  description?: string;
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Editor genérico de lista de strings (add / renomear / remover / reordenar), usado em
 * Configurações > Listas & Categorias para as listas parametrizáveis de GovernanceSettings
 * (departamentos, status, prioridades, ferramentas de IA, categorias de artefato, tipos de
 * diário). Projetos que já usam um valor removido da lista continuam mostrando esse valor
 * normalmente — remover aqui não apaga dado nenhum, só tira a opção de aparecer em novos cadastros.
 */
export const ListCrudEditor: React.FC<ListCrudEditorProps> = ({
  label,
  description,
  items,
  onChange,
  disabled = false,
  placeholder = 'Novo item...'
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const value = newItem.trim();
    if (!value || items.includes(value)) return;
    onChange([...items, value]);
    setNewItem('');
  };

  const handleRename = (idx: number, value: string) => {
    const updated = [...items];
    updated[idx] = value;
    onChange(updated);
  };

  const handleRemove = (idx: number) => {
    const item = items[idx];
    if (!window.confirm(`Remover "${item}" desta lista? Projetos que já usam esse valor não são alterados.`)) return;
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-extrabold text-grey-900">{label}</h4>
        {description && <p className="text-[11px] text-grey-500 mt-0.5">{description}</p>}
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 p-1.5 rounded-lg border border-grey-200 bg-grey-50/50"
          >
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                disabled={disabled || idx === 0}
                onClick={() => handleMove(idx, -1)}
                className="text-grey-400 hover:text-grey-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Mover para cima"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || idx === items.length - 1}
                onClick={() => handleMove(idx, 1)}
                className="text-grey-400 hover:text-grey-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Mover para baixo"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              value={item}
              disabled={disabled}
              onChange={(e) => handleRename(idx, e.target.value)}
              className="flex-1 min-w-0 text-xs bg-white border border-grey-200 rounded-md px-2 py-1.5 text-grey-900 focus:outline-hidden focus:ring-1 focus:ring-brand-main disabled:bg-grey-100 disabled:text-grey-400"
            />

            <button
              type="button"
              disabled={disabled}
              onClick={() => handleRemove(idx)}
              className="p-1.5 rounded-md hover:bg-danger-50 text-danger-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              title="Remover item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-[11px] text-grey-400 italic px-1.5">Nenhum item cadastrado.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newItem}
          disabled={disabled}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-xs bg-white border border-grey-300 rounded-md px-2.5 py-1.5 text-grey-900 focus:outline-hidden focus:ring-1 focus:ring-brand-main disabled:bg-grey-100"
        />
        <Button
          type="button"
          size="sm"
          color="secondary"
          disabled={disabled || !newItem.trim() || items.includes(newItem.trim())}
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
};
