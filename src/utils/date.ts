/**
 * Parsing/formatação de datas compartilhado pela "Minha Semana". Diferente de
 * `parseFlexibleDate` (src/utils/estimation.ts), que assume que a entrada é sempre uma
 * data válida, `parseKnownDate` retorna `null` para textos livres comuns em
 * `ActionItem.deadline` ("15 dias", "Imediato", "A definir", "—") em vez de gerar
 * `Invalid Date` silenciosamente.
 */
export function parseKnownDate(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(date.getTime()) ? null : date;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/** Formata para `YYYY-MM-DD` (usado para gravar em `ScheduledMeeting.date`/`deadline`). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formata para `DD/MM/YYYY` (padrão pt-BR usado no restante do app). */
export function toBrDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Label curto tipo "Ter, 24/09" para cabeçalho de coluna. */
export function formatShortPtBr(date: Date): string {
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${weekday}, ${day}/${month}`;
}

export function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Retorna a segunda-feira da semana de `reference` (offset em semanas a partir de hoje). */
export function getWeekStart(reference: Date): Date {
  const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // domingo (0) volta 6 dias; demais dias voltam até a segunda
  date.setDate(date.getDate() + diff);
  return date;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}
