/**
 * E35-12 (23.11) : ce que la recherche des Opérations porte quand on ouvre une pièce depuis le Calendrier : le NOM de la chose
 * (« ZZ TEST — Vente »), jamais l'identifiant technique (« MAIN-545e015f-… »). Sans nom, le tiers ; sans l'un ni l'autre, rien
 * (la recherche reste vide plutôt que de montrer un code).
 */
export function nomDeLaChose(t: { description?: string; finance?: { vendor?: string } }): string {
  return (t.description ?? '').trim() || (t.finance?.vendor ?? '').trim();
}
