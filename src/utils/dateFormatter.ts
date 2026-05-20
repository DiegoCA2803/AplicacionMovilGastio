// Este es tu "pipe" (utilería) para transformar fechas UTC a la hora de Perú.

export const dateFormatter = {
  // Recibe una fecha en formato UTC (ej. "2026-05-20T03:59:37Z") 
  // y la devuelve formateada en la zona horaria de Perú (UTC-5).
  formatUtcToPeruTime: (utcDateString: string): string => {
    if (!utcDateString) return 'Fecha no disponible';

    const date = new Date(utcDateString);

    // Verificamos si la fecha es válida
    if (isNaN(date.getTime())) return 'Fecha inválida';

    // Formateamos la fecha específicamente para la zona horaria de Lima, Perú
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // Formato AM/PM
    }).format(date);
  }
};
