export interface ProfileErrors {
  name?: string;
  phone?: string;
}

export function validateProfile(name: string, phone: string): ProfileErrors {
  const errors: ProfileErrors = {};
  if (name.trim().length < 2) {
    errors.name = 'Le nom doit contenir au moins 2 caractères.';
  }
  const digits = phone.trim().replace(/\s/g, '');
  if (digits && !/^\+?\d{8,15}$/.test(digits)) {
    errors.phone = 'Numéro invalide (8 à 15 chiffres).';
  }
  return errors;
}
