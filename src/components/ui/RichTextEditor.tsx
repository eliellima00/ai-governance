import React, { useEffect } from 'react';
import { EditorContent, useEditor, useEditorState, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2
} from 'lucide-react';
import { normalizeEditorHtml, toEditorHtml } from '../../utils/richText';

export interface RichTextEditorProps {
  value: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  minHeightClassName?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    aria-pressed={active}
    className={`p-1.5 rounded text-grey-600 hover:bg-grey-200 hover:text-grey-900 disabled:opacity-30 disabled:hover:bg-transparent ${
      active ? 'bg-grey-200 text-grey-900' : ''
    }`}
  >
    {children}
  </button>
);

const Separator = () => <span className="w-px h-5 bg-grey-300 mx-0.5" aria-hidden />;

const Toolbar: React.FC<{ editor: Editor }> = ({ editor }) => {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      code: e.isActive('codeBlock'),
      link: e.isActive('link'),
      table: e.isActive('table'),
      alignCenter: e.isActive({ textAlign: 'center' }),
      alignRight: e.isActive({ textAlign: 'right' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo()
    })
  });

  const chain = () => editor.chain().focus();

  const handleLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Endereço do link (deixe vazio para remover):', previous || 'https://');
    if (url === null) return;
    if (url.trim() === '' || url.trim() === 'https://') {
      chain().extendMarkRange('link').unsetLink().run();
    } else {
      chain().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-grey-200 bg-grey-50 rounded-t-md">
      <ToolbarButton title="Desfazer" onClick={() => chain().undo().run()} disabled={!state.canUndo}>
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Refazer" onClick={() => chain().redo().run()} disabled={!state.canRedo}>
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton title="Título" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Subtítulo" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton title="Negrito" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Itálico" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Sublinhado" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Tachado" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Link" active={state.link} onClick={handleLink}>
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton title="Lista com marcadores" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Lista numerada" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Citação" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Bloco de código" active={state.code} onClick={() => chain().toggleCodeBlock().run()}>
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Linha divisória" onClick={() => chain().setHorizontalRule().run()}>
        <Minus className="w-4 h-4" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        title="Alinhar à esquerda"
        active={!state.alignCenter && !state.alignRight}
        onClick={() => chain().setTextAlign('left').run()}
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Centralizar" active={state.alignCenter} onClick={() => chain().setTextAlign('center').run()}>
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Alinhar à direita" active={state.alignRight} onClick={() => chain().setTextAlign('right').run()}>
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        title="Inserir tabela"
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>
      {state.table && (
        <span className="flex items-center gap-0.5 text-[11px]">
          <button type="button" className="px-1.5 py-1 rounded hover:bg-grey-200" onClick={() => chain().addRowAfter().run()}>
            + linha
          </button>
          <button type="button" className="px-1.5 py-1 rounded hover:bg-grey-200" onClick={() => chain().addColumnAfter().run()}>
            + coluna
          </button>
          <button type="button" className="px-1.5 py-1 rounded hover:bg-grey-200" onClick={() => chain().deleteRow().run()}>
            − linha
          </button>
          <button type="button" className="px-1.5 py-1 rounded hover:bg-grey-200" onClick={() => chain().deleteColumn().run()}>
            − coluna
          </button>
          <button
            type="button"
            className="px-1.5 py-1 rounded hover:bg-danger-50 text-danger-600"
            onClick={() => chain().deleteTable().run()}
          >
            excluir tabela
          </button>
        </span>
      )}
      <Separator />
      <ToolbarButton title="Limpar formatação" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
};

/** Editor de texto completo (TipTap). Em modo somente leitura, renderiza o mesmo conteúdo sem barra. */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  editable = true,
  minHeightClassName = 'min-h-40'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: !editable, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }
      }),
      TableKit.configure({ table: { resizable: false } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: toEditorHtml(value),
    editable,
    immediatelyRender: true,
    onUpdate: ({ editor: e }) => onChange?.(normalizeEditorHtml(e.getHTML()))
  });

  // Conteúdo trocado por fora (ex.: restaurar uma versão do histórico)
  useEffect(() => {
    if (!editor) return;
    const incoming = toEditorHtml(value);
    if (normalizeEditorHtml(editor.getHTML()) !== normalizeEditorHtml(incoming)) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return null;

  return (
    <div
      className={`rounded-md border ${
        editable ? 'border-grey-300 bg-white focus-within:ring-2 focus-within:ring-brand-main' : 'border-grey-200 bg-grey-50'
      }`}
    >
      {editable && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className={`rich-text px-3 py-2 text-sm text-grey-900 ${editable ? minHeightClassName : ''}`}
      />
    </div>
  );
};
