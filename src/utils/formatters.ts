
export function formatCurrency(amount: number, currency: string = 'FCFA'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

export function formatPhoneNumber(phone: string): string {
  // Supprime tous les caractères non numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Format pour les numéros camerounais
  if (cleaned.startsWith('+237')) {
    const number = cleaned.substring(4);
    if (number.length === 9) {
      return `+237 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  }

  return phone;
}

export function formatOpeningHours(hoursString: string): string {
  try {
    const hours = JSON.parse(hoursString);
    if (hours.open === 'closed') {
      return 'Fermé';
    }
    return `${hours.open} - ${hours.close}`;
  } catch {
    return hoursString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}