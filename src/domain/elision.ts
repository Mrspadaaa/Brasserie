/**
 * RL-3 (rejeu ff0f822e) : « 5,3 mL de Acide lactique 80 % » : le nom d'un produit se pose après « de » avec l'élision et la minuscule
 * d'une phrase : « d’acide lactique 80 % », « de gypse », « d’houblon ». Seule la première lettre change ; « 80 % » et les sigles (CaCl₂) restent.
 */
export function deNom(nom: string): string {
  const t = nom.trim();
  if (!t) return t;
  // Un premier mot qui porte une autre majuscule, un chiffre ou un indice est un sigle ou une formule (CaCl₂, MgSO₄) : on n'y touche pas.
  const sigle = /[A-ZÀ-Ý0-9₀-₉]/.test((t.split(/\s/)[0] ?? '').slice(1));
  const mot = sigle ? t : t.charAt(0).toLocaleLowerCase('fr') + t.slice(1);
  const voyelle = /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(mot.normalize('NFC'));
  return `${voyelle ? 'd’' : 'de '}${mot}`;
}
