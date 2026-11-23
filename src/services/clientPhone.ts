/**
 * Le téléphone d'un client : une seule lecture pour le formulaire, « Appeler » et « WhatsApp » (TE-2).
 *
 * Avant : « abc » s'enregistrait, la fiche proposait `tel:abc` et `wa.me/` (vide) ; et un numéro suisse « 026 408 33 33 » donnait
 * `wa.me/0264083333`, qui n'existe pas (WhatsApp veut l'indicatif du pays, sans « + » ni « 0 » de tête).
 *
 * Règle : des chiffres, avec les séparateurs usuels (espace, point, tiret, barre, parenthèses) et un « + » ou « 00 » de tête
 * facultatif. Entre 7 et 15 chiffres (E.164 : 15 au plus). Un « 0 » de tête seul est un numéro suisse (indicatif 41).
 */
export type TelephoneLu = { ok: true; tel: string; whatsapp: string | null } | { ok: false; message: string };

export const MESSAGE_TELEPHONE = 'Vérifie le numéro : des chiffres seulement, par exemple 026 408 33 33 ou +41 26 408 33 33.';

export function lireTelephone(texte: string): TelephoneLu {
  const brut = texte.trim();
  if (!/^\+?[\d\s().\/-]+$/.test(brut)) return { ok: false, message: MESSAGE_TELEPHONE };
  const international = brut.startsWith('+') || /^00/.test(brut.replace(/[\s().\/-]/g, ''));
  let chiffres = brut.replace(/\D/g, '');
  if (/^00/.test(chiffres) && !brut.startsWith('+')) chiffres = chiffres.slice(2);
  /* « +41 (0)26 … » : le 0 entre parenthèses n'appartient pas au numéro international. */
  if (international && chiffres.startsWith('410')) chiffres = `41${chiffres.slice(3)}`;
  if (chiffres.length < 7 || chiffres.length > 15) return { ok: false, message: MESSAGE_TELEPHONE };
  /* Sans indicatif ni « 0 » de tête, le pays est inconnu : on peut appeler tel quel, mais WhatsApp ne se devine pas. */
  if (!international && !chiffres.startsWith('0')) return { ok: true, tel: chiffres, whatsapp: null };
  const complet = international ? chiffres : `41${chiffres.slice(1)}`;
  return { ok: true, tel: `+${complet}`, whatsapp: complet };
}
