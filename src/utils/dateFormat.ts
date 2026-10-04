/**
 * Formatadores de data em pt-BR.
 *
 * O banco agora armazena timestamptz reais (antes eram strings livres como
 * "há 2 dias" produced pelo mock). A camada de apresentação continua exibindo
 * rótulos relativos/curtos, então a conversão acontece na fronteira.
 */

const MONTHS_SHORT = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

type DateInput = string | Date | null | undefined;

function toDate(value: DateInput): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function clock(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** "Hoje, 10:15" / "Ontem, 18:02" / "12 Mar 2026, 09:40" */
export function formatDateTimeWithDay(value: DateInput): string {
    const date = toDate(value);
    if (!date) return '';

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return `Hoje, ${clock(date)}`;
    if (isSameDay(date, yesterday)) return `Ontem, ${clock(date)}`;
    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}, ${clock(date)}`;
}

/** "Hoje às 09:15" / "16 Mar 2026" */
export function formatDayAndTime(value: DateInput): string {
    const date = toDate(value);
    if (!date) return '';

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return `Hoje às ${clock(date)}`;
    if (isSameDay(date, yesterday)) return `Ontem às ${clock(date)}`;
    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "14 Mar 2026" */
export function formatShortDate(value: DateInput): string {
    const date = toDate(value);
    if (!date) return '';
    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Agora mesmo" / "Há 5 min" / "há 2 dias" / "há 3 semanas" / "há 2 meses" */
export function formatRelative(value: DateInput): string {
    const date = toDate(value);
    if (!date) return '';

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ontem';
    if (days < 7) return `há ${days} dias`;

    const weeks = Math.floor(days / 7);
    if (weeks === 1) return 'há 1 semana';
    if (weeks < 5) return `há ${weeks} semanas`;

    const months = Math.floor(days / 30);
    if (months === 1) return 'há 1 mês';
    if (months < 12) return `há ${months} meses`;

    const years = Math.floor(days / 365);
    return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}