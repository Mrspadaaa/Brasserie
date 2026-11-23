/**
 * Visible wording of a sealed V5.5 trace line. The sealed text stays unchanged in the archive;
 * only its display replaces technical identifiers (addition, recipe line, catalogue entry) by the
 * brewer's names. An identifier without a known name gets a generic French wording, never its key.
 */
export type HopV55TraceNames = ReadonlyMap<string, string>;

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
const recipeLine = /(?:[\w-]+:)?recipe-hop:(\d+)/gu;
const fallbacks: Array<[RegExp, string]> = [
  [/scenario-hop:[\w-]+/gu, 'ajout de la branche'],
  [/(?:variety|lot):[\w-]+/gu, 'matière du catalogue'],
];

export function hopV55TraceLine(line: string, names: HopV55TraceNames): string {
  let shown = line.replace(recipeLine, (_whole, index: string) => names.get(`recipe-hop:${index}`) ?? `ligne ${Number(index) + 1} du brouillon d’origine`);
  const ids = [...names.keys()].filter(id => id && !id.startsWith('recipe-hop:')).sort((a, b) => b.length - a.length);
  if (ids.length) {
    shown = shown.replace(new RegExp(`(?<![\\w:-])(?:${ids.map(escape).join('|')})(?![\\w:-])`, 'gu'), id => names.get(id) ?? id);
  }
  for (const [pattern, wording] of fallbacks) shown = shown.replace(pattern, wording);
  return shown;
}
