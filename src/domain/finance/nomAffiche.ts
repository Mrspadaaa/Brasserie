/**
 * R18 (C53-5, 24.11) : un préfixe n'est jamais doublé dans ce que le brasseur lit (« ZZ TEST — ZZ TEST — achat » → « ZZ TEST — achat »).
 * Le nom écrit en base garde sa forme ; seul l'affichage (étiquettes des courbes) retire la répétition : un préfixe qui revient deux fois
 * prend la place d'un nom de 10 signes et chasse l'étiquette de sa marche à 390 px.
 * Un préfixe = un début court suivi d'un tiret long (« — » ou « – ») ; il n'est retiré que s'il se répète à l'identique, tout de suite après lui-même.
 */
const PREFIXE_REPETE = /^(.{2,40}?\s[—–]\s)\1+/;

export function sansPrefixeDouble(nom: string): string {
  return nom.trim().replace(PREFIXE_REPETE, (_tout, prefixe: string) => prefixe);
}
