import type { HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import usagePack from '../../data/hopStyleUsageBootstrap.json';

export type HopStyleFamily = 'american-ipa' | 'hazy-ipa' | 'english-ipa';
interface HopStyleUse {
  families: (HopStyleFamily | 'ipa')[];
  /** Original style labels are kept beside our coarser UI families. */
  styles: string[];
  roles: string[];
  note: string;
  source: HopSource;
}
interface HopStyleUsage { name: string; aliases: string[]; identitySources?: HopSource[]; uses: HopStyleUse[] }
export interface HopStyleGuidance {
  status: 'documented' | 'unknown';
  styleLabel: string;
  reason: string;
  roles: string[];
  sources: HopSource[];
  specificity: 'style' | 'ipa-family' | 'unknown';
}

const fold = (text: string) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
const identity = (text: string) => fold(text).replace(/[^a-z0-9]/g, '');
const alphabetical = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
const labels: Record<HopStyleFamily, string> = {
  'american-ipa': 'American / Double IPA', 'hazy-ipa': 'Hazy / NEIPA', 'english-ipa': 'English IPA',
};
const usageRows = usagePack.varieties as HopStyleUsage[];
const byIdentity = new Map<string, HopStyleUsage>();
for (const row of usageRows) for (const name of [row.name, ...row.aliases]) byIdentity.set(identity(name), row);

export function isIpaStyleName(styleName: string): boolean {
  return /\b(ipa|neipa|dipa|iipa|wcipa)\b|\bindia[ -]+pale[ -]+ale\b/.test(fold(styleName));
}

/** Style names identify a brewing family; aroma words never identify a style. */
export function hopStyleFamily(styleName: string): HopStyleFamily | undefined {
  const name = fold(styleName);
  if (!isIpaStyleName(styleName)) return undefined;
  if (/\b(english|british|anglaise?|britannique)\b/.test(name)) return 'english-ipa';
  if (/\b(hazy|neipa|juicy|new[ -]+england)\b|\bne[ -]+(?:double[ -]+)?(?:ipa|dipa|iipa)\b/.test(name)) return 'hazy-ipa';
  // Those IPA families need their own process and usage evidence. Do not label
  // them American merely because they contain the letters IPA.
  if (/\b(belgian|belge|black|noire?|brown|rye|seigle|red|rouge|white|blanche?|brut|sour)\b/.test(name)) return undefined;
  return 'american-ipa';
}

export function isModernIpaStyle(styleName: string): boolean {
  const family = hopStyleFamily(styleName);
  return family === 'american-ipa' || family === 'hazy-ipa';
}

function guidanceForNames(names: string[], styleName: string): HopStyleGuidance {
  const family = hopStyleFamily(styleName);
  const rows = [...new Set(names.map(name => byIdentity.get(identity(name))).filter((r): r is HopStyleUsage => !!r))];
  const allUses = rows.flatMap(row => row.uses);
  const uniqueSources = (uses: HopStyleUse[]) => [...new Map(
    [...uses.map(use => use.source), ...rows.flatMap(row => row.identitySources ?? [])].map(source => [source.reference, source])
  ).values()];
  if (rows.length > 1) return {
    status: 'unknown', styleLabel: family ? labels[family] : (styleName || 'Style non précisé'),
    reason: 'Plusieurs identités variétales sont indiquées dans cette référence. Précise son nom et ses alias avant de lui rattacher un usage.',
    roles: [], sources: uniqueSources(allUses), specificity: 'unknown',
  };
  const exact = family ? allUses.filter(use => use.families.includes(family)) : [];
  // A supplier's unspecified IPA recommendation supports the broad American /
  // Double chooser, but does not establish an English or Hazy application.
  const generic = family === 'american-ipa' ? allUses.filter(use => use.families.includes('ipa')) : [];
  const matching = [...new Set([...exact, ...generic])];
  if (matching.length) return {
    status: 'documented',
    styleLabel: exact.length ? labels[family!] : 'IPA · sous-style non précisé',
    reason: [...new Set(matching.map(use => use.note))].join(' '),
    roles: [...new Set(matching.flatMap(use => use.roles))],
    sources: uniqueSources(matching),
    specificity: exact.length ? 'style' : 'ipa-family',
  };
  const otherUse = allUses.length ? 'Des usages dans d’autres IPA sont documentés, sans attestation pour ce sous-style. ' : '';
  return {
    status: 'unknown', styleLabel: family ? labels[family] : (styleName || 'Style non précisé'),
    reason: family
      ? otherUse + 'Usage non documenté pour ce style dans les sources intégrées ; cela ne signifie pas incompatible.'
      : 'Pas de classement documentaire intégré pour ce style. La variété reste disponible pour la comparaison.',
    roles: [], sources: uniqueSources(allUses), specificity: 'unknown',
  };
}

/** Documentary facts only, shared with the CPU worker. Neither this helper nor
 * a missing source changes the sensory score or prohibits an ingredient. */
export function hopStyleGuidance(variety: HopVariety, styleName: string): HopStyleGuidance {
  return guidanceForNames([variety.name, ...(variety.aliases ?? [])], styleName);
}

/** Every attested reference is available, with a stable alphabetical order.
 * No favourite-name weight, inferred taste taxonomy or fixed-length shortlist. */
export function suggestedHopVarieties(varieties: HopVariety[], styleName: string): HopVariety[] {
  return varieties.filter(v => !v.archived && hopStyleGuidance(v, styleName).status === 'documented')
    .sort((a, b) => alphabetical.compare(a.name, b.name) || a.id.localeCompare(b.id));
}

/** Examples for the recipe summary come from the same evidence as its catalogue. */
export function documentedHopNamesForStyle(styleName: string): string[] {
  return usageRows.filter(row => guidanceForNames([row.name], styleName).status === 'documented')
    .map(row => row.name).sort(alphabetical.compare);
}

export function hopNameHasStyleUsage(name: string, styleName: string, otherNames: string[] = []): boolean {
  return guidanceForNames([name, ...otherNames], styleName).status === 'documented';
}
