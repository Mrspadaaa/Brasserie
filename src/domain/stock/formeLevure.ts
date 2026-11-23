/**
 * ST-T33 : la forme d'une levure, lue du libellé seul (jamais devinée sans signe). Un mot dit sèche (« sèche », « dry », « Trocken ») ou liquide (« liquide », « liquid », fiole,
 * Wyeast, White Labs, WLP, Omega, Imperial, « Activator ») ; à défaut, un fabricant de sèches (Fermentis, Lallemand, Safale, Safbrew, SafLager, Mangrove Jack's, Muntons). Rien de reconnu : indéfinie
 * (« type non connu » reste vrai, la bulle ne dit ni sèche ni liquide). Un mot explicite l'emporte sur la marque (« Wyeast sèche » n'existe pas : aucun conflit, on suit le mot).
 */
export function formeLevureLue(libelle: string): 'sèche' | 'liquide' | undefined {
  const t = libelle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(seche|dry|trocken\w*|dried)\b/.test(t)) return 'sèche';
  if (/\b(liquide|liquid|fiole|flacon|vial|smack|activator)\b|wyeast|white\s?labs?|\bwlp\s?\d|\bwy\s?\d{4}|omega\s+yeast|imperial\s+organic|\bkveik\b/.test(t)) return 'liquide';
  if (/fermentis|lallemand|safale|safbrew|saflager|safspirit|mangrove|muntons|\b(us|s|t|w|k|be|wb)[- ]?\d{2,3}\b/.test(t)) return 'sèche';
  return undefined;
}
