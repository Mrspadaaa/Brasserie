// Phrases houblon du guide BJCP 2021, relevées le 18.10.2026 sur les pages publiques
// bjcp.org (citations courtes, sections Aroma et Flavor). Source de vérité des bandes :
// scripts/build-bands.mjs les convertit avec la table « mots → bandes » en data/style-bands.json.
//
// Champs d'une phrase :
//   field        'aroma' | 'flavor'
//   quote        extrait court, mot pour mot
//   from, to     niveaux de la table (to absent = même niveau) ; upTo : borne basse 0 (« up to »)
//   optional     la présence de houblon est facultative (« optional », « may ») : borne basse 0
//   families     familles nommées (ids V5.5) ; [] = intensité générale sans famille
//   required     les familles sont exigées (« and », famille seule) ; sinon alternatives (« or »,
//                « such as », « often ») : chaque famille a une borne basse 0
//   exclude      familles exclues par le texte (« not grassy or herbal »)
// Correspondances de mots BJCP → familles V5.5 : voir FAMILY_WORDS dans build-bands.mjs.
const FRUITY = ['stoneFruit', 'pomeFruit', 'berries'];
const NEW_WORLD = ['citrus', 'floral', 'resin', 'spice', 'tropical', 'stoneFruit', 'berries', 'melon'];
const s = (field, quote, from, families = [], extra = {}) => ({ field, quote, from, families, ...extra });

export const STATEMENTS = {
  '15B': [
    s('aroma', 'Low earthy or floral hop aroma optional.', 'low', ['earthy', 'floral'], { optional: true }),
    s('flavor', 'Balancing factors may include … medium earthy hop flavor.', 'medium', ['earthy'], { optional: true }),
  ],
  '15C': [
    s('aroma', 'Hop aroma low to none, may be lightly earthy or spicy', 'none', ['earthy', 'spice'], { to: 'low', optional: true }),
    s('flavor', 'Medium earthy or spicy hop flavor optional.', 'medium', ['earthy', 'spice'], { optional: true }),
  ],
  '16A': [
    s('aroma', 'Low floral or earthy hop aroma optional.', 'low', ['floral', 'earthy'], { optional: true }),
    s('flavor', 'Low floral or earthy hop flavor optional.', 'low', ['floral', 'earthy'], { optional: true }),
  ],
  '16B': [
    s('aroma', 'Medium-low earthy or floral hop aroma optional.', 'medium-low', ['earthy', 'floral'], { optional: true }),
    s('flavor', 'Medium-low earthy or floral hop flavor optional.', 'medium-low', ['earthy', 'floral'], { optional: true }),
  ],
  '16C': [
    s('aroma', 'Low hop aroma optional.', 'low', [], { optional: true }),
    s('flavor', 'Low hop flavor optional.', 'low', [], { optional: true }),
  ],
  '16D': [
    s('aroma', 'Low earthy, herbal, or floral hop aroma optional.', 'low', ['earthy', 'herbal', 'floral'], { optional: true }),
    s('flavor', 'Moderate earthy, herbal, or floral hop flavor optional.', 'medium', ['earthy', 'herbal', 'floral'], { optional: true }),
  ],
  '20B': [
    s('aroma', 'Medium to very low hop aroma, often with a citrusy or resiny character.', 'very-low', ['citrus', 'resin'], { to: 'medium' }),
    s('flavor', 'Low to high hop flavor, generally citrusy or resiny.', 'low', ['citrus', 'resin'], { to: 'high' }),
  ],
  '20C': [
    s('aroma', 'Very low to fairly aggressive hops, often English or American in character.', 'very-low', [], { to: 'very-high' }),
  ],
  '20A': [
    s('aroma', 'The resiny, earthy, or floral hop character can vary from low to high.', 'low', ['resin', 'earthy', 'floral'], { to: 'high' }),
    s('flavor', 'Low to high resiny, earthy, or floral hop flavor', 'low', ['resin', 'earthy', 'floral'], { to: 'high' }),
  ],
  '13C': [
    s('aroma', 'May have up to a moderate level of floral or earthy hops.', 'medium', ['floral', 'earthy'], { upTo: true, optional: true }),
    s('flavor', 'Up to moderate earthy or floral hop flavor optional.', 'medium', ['earthy', 'floral'], { upTo: true, optional: true }),
  ],
  '9C': [
    s('aroma', 'No hops.', 'none', []),
    s('flavor', 'Hop flavor from slightly spicy hops ranges from none to medium-low.', 'none', ['spice'], { to: 'medium-low' }),
  ],
  '1A': [
    s('aroma', 'Light spicy, floral, or herbal hop aroma optional.', 'low', ['spice', 'floral', 'herbal'], { optional: true }),
    s('flavor', 'Low floral, spicy, or herbal hop flavor optional', 'low', ['floral', 'spice', 'herbal'], { optional: true }),
  ],
  '3A': [
    s('aroma', 'light to moderate spicy or herbal hop bouquet', 'low', ['spice', 'herbal'], { to: 'medium' }),
    s('flavor', 'Low to medium-high spicy or herbal hop flavor.', 'low', ['spice', 'herbal'], { to: 'medium-high' }),
  ],
  '3B': [
    s('aroma', 'medium-low to medium-high spicy, floral, or herbal hop bouquet', 'medium-low', ['spice', 'floral', 'herbal'], { to: 'medium-high' }),
    s('flavor', 'floral and spicy hop flavor … Malt and hop flavors are medium to medium-high', 'medium', ['floral', 'spice'], { to: 'medium-high', required: true }),
  ],
  '4A': [
    s('aroma', 'Low to moderately-low spicy, floral, or herbal hop aroma.', 'low', ['spice', 'floral', 'herbal'], { to: 'medium-low' }),
    s('flavor', 'Low to moderately-low spicy, floral, or herbal hop flavor.', 'low', ['spice', 'floral', 'herbal'], { to: 'medium-low' }),
  ],
  '5B': [
    s('aroma', 'Low floral, spicy, or herbal hop aroma optional.', 'low', ['floral', 'spice', 'herbal'], { optional: true }),
    s('flavor', 'Low to moderately-high floral, spicy, or herbal hop flavor', 'low', ['floral', 'spice', 'herbal'], { to: 'medium-high' }),
  ],
  '5D': [
    s('aroma', 'Moderately to moderately-high flowery, spicy, or herbal hops.', 'medium', ['floral', 'spice', 'herbal'], { to: 'medium-high' }),
    s('flavor', 'Malt and hop flavors similar to aroma (same descriptors and intensities).', 'medium', ['floral', 'spice', 'herbal'], { to: 'medium-high' }),
  ],
  '7B': [
    s('aroma', 'Moderate to low hops … often have a spicy, peppery, or floral character.', 'low', ['spice', 'floral'], { to: 'medium' }),
    s('flavor', 'Medium to low spicy, peppery, or floral hop flavor.', 'low', ['spice', 'floral'], { to: 'medium' }),
  ],
  '10A': [
    s('aroma', 'Light floral, spicy, or herbal hops optional.', 'low', ['floral', 'spice', 'herbal'], { optional: true }),
    s('flavor', 'Very low floral, spicy, or herbal hop flavor optional.', 'very-low', ['floral', 'spice', 'herbal'], { optional: true }),
  ],
  '24A': [
    s('aroma', 'A low spicy-herbal hop aroma is optional, but typically absent.', 'low', ['spice', 'herbal'], { optional: true }),
    s('flavor', 'A spicy-earthy hop flavor can be low to none', 'none', ['spice', 'earthy'], { to: 'low' }),
  ],
  '23A': [
    s('aroma', 'No hop aroma.', 'none', []),
    s('flavor', 'No hop flavor.', 'none', []),
  ],
  '23G': [
    s('flavor', 'No hop flavor.', 'none', []),
  ],
  '21A': [
    s('aroma', 'A prominent to intense hop aroma … such as citrus, floral, pine, resin, spice, tropical fruit, stone fruit, berry, or melon.', 'high', NEW_WORLD, { to: 'very-high' }),
    s('flavor', 'Medium to very high hop flavor (same descriptors as aroma).', 'medium', NEW_WORLD, { to: 'very-high' }),
  ],
  '21C': [
    s('aroma', 'Intense hop aroma, with stone fruit, tropical fruit, citrus, or other fruity qualities; not grassy or herbal.', 'very-high', ['stoneFruit', 'tropical', 'citrus', 'pomeFruit', 'berries', 'melon'], { exclude: ['green', 'herbal'] }),
    s('flavor', 'High to very high fruity hop flavor, same descriptors as aroma.', 'high', ['stoneFruit', 'tropical', 'citrus', 'pomeFruit', 'berries', 'melon'], { to: 'very-high' }),
  ],
  '22A': [
    s('aroma', 'A prominent to intense hop aroma … citrus, floral, pine, resin, spice, tropical fruit, stone fruit, berry, or melon.', 'high', NEW_WORLD, { to: 'very-high' }),
    s('flavor', 'Strong and complex hop flavor (same descriptors as aroma).', 'high', NEW_WORLD),
  ],
  '12C': [
    s('aroma', 'A moderate to moderately-high hop aroma, typically floral, spicy-peppery, or citrus-orange in nature.', 'medium', ['floral', 'spice', 'citrus'], { to: 'medium-high' }),
    s('flavor', 'Hop flavor is medium to high … (floral, spicy-peppery, or citrus-orange).', 'medium', ['floral', 'spice', 'citrus'], { to: 'high' }),
  ],
  '18B': [
    s('aroma', 'Moderate to moderately-high hop aroma … citrus, floral, pine, resin, spice, tropical fruit, stone fruit, berry, or melon.', 'medium', NEW_WORLD, { to: 'medium-high' }),
    s('flavor', 'Hop and malt character similar to aroma (same intensities and descriptors apply).', 'medium', NEW_WORLD, { to: 'medium-high' }),
  ],
  '11B': [
    s('aroma', 'Hop aroma can range from moderate to none, typically with a floral, earthy, resiny, or fruity character.', 'none', ['floral', 'earthy', 'resin', ...FRUITY], { to: 'medium' }),
    s('flavor', 'Moderate to low hop flavor, typically with an earthy, resiny, fruity, or floral character.', 'low', ['earthy', 'resin', ...FRUITY, 'floral'], { to: 'medium' }),
  ],
  '25B': [
    s('aroma', 'Hops are low to moderate and have a continental character (spicy, floral, earthy, or fruity).', 'low', ['spice', 'floral', 'earthy', ...FRUITY], { to: 'medium' }),
    s('flavor', 'hop flavor is low to medium … (same descriptors apply).', 'low', ['spice', 'floral', 'earthy', ...FRUITY], { to: 'medium' }),
  ],
  '26C': [
    s('aroma', 'A low yet distinctive spicy, floral, sometimes perfumy hop character is optional.', 'low', ['spice', 'floral'], { optional: true }),
    s('flavor', 'hops low to moderate … (same descriptors apply)', 'low', ['spice', 'floral'], { to: 'medium' }),
  ],
  '25A': [
    s('aroma', 'Light earthy or spicy hop notes optional.', 'low', ['earthy', 'spice'], { optional: true }),
    s('flavor', 'Light hop flavor, can be spicy or earthy, complementing yeast.', 'low', ['spice', 'earthy']),
  ],
};
