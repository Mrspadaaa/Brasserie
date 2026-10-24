import axes from '../../../../src/data/hopKnowledgeBootstrap.json';

/** Les 12 axes V5.5, dans leur ordre canonique (src/data/hopKnowledgeBootstrap.json). */
export const FAMILIES = ['citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'floral', 'herbal', 'resin', 'spice', 'green', 'earthy'] as const;
export type FamilyId = (typeof FAMILIES)[number];

const names = new Map((axes as { kind: string; id: string; name: string }[]).filter((a) => a.kind === 'axis').map((a) => [a.id, a.name]));
/** Noms français tirés des axes V5.5 (« Agrumes », « Floral »…). */
export const FAMILY_NAMES = Object.fromEntries(FAMILIES.map((f) => [f, names.get(f) ?? f])) as Record<FamilyId, string>;

export const isFamily = (id: string): id is FamilyId => (FAMILIES as readonly string[]).includes(id);
