/**
 * gfc n° 5 : °C de la cuve contre °C de l'échantillon, sans champ neuf.
 * `gravityLog[].tempC` reste la température de l'échantillon (elle sert aux corrections de densité). La cuve est rangée dans
 * `gravityLog[].notes`, première ligne `Cuve 19,2 °C`. Absente : la cuve n'a pas été relevée, jamais 0.
 */

const TETE = /^Cuve (-?\d+(?:[.,]\d+)?) °C[ \t]*(?:\n|$)/;

export function cuveDansNotes(notes: string | undefined | null): number | null {
  const m = TETE.exec((notes ?? '').replace(/\r\n?/g, '\n'));
  if (!m) return null;
  const v = Number(m[1].replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

/** Les notes sans la ligne de cuve : ce que le brasseur a écrit, rien d'autre. */
export function notesSansCuve(notes: string | undefined | null): string {
  return (notes ?? '').replace(/\r\n?/g, '\n').replace(TETE, '');
}

/** Les notes avec la cuve en première ligne (remplace une cuve déjà écrite). */
export function notesAvecCuve(notes: string | undefined | null, cuveC: number): string {
  const reste = notesSansCuve(notes);
  const ligne = `Cuve ${cuveC.toFixed(1).replace('.', ',')} °C`;
  return reste.trim() ? `${ligne}\n${reste}` : ligne;
}
