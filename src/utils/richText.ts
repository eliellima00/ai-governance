const HTML_TAG = /<\/?[a-z][\s\S]*?>/i;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Converte o conteúdo salvo para HTML do editor; textos antigos (texto puro) viram parágrafos. */
export function toEditorHtml(value?: string): string {
  if (!value) return '';
  if (HTML_TAG.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** HTML vazio do editor ("<p></p>") conta como sem conteúdo. */
export function normalizeEditorHtml(html: string): string {
  const trimmed = html.trim();
  return trimmed === '' || trimmed === '<p></p>' ? '' : trimmed;
}

/** Texto puro para resumos de uma linha (cards, listas). */
export function richTextToPlain(value?: string): string {
  if (!value) return '';
  if (!HTML_TAG.test(value)) return value;
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
