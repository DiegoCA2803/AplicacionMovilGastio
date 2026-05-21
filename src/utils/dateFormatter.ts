export const dateFormatter = {
  formatDatePeru: (utcDateString: string | null | undefined): string => {
    if (!utcDateString) return '---';

    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';

    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, 
    }).format(date);
  }
};
