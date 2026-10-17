// Stock houblons de production au 17.10.2026 (instantané en lecture seule, sans donnée
// personnelle) : les 9 articles avec une quantité, noms tels qu'en base.
// pattern : comment reconnaître la variété à l'écran, quel que soit le nom de l'article.
export const productionHopStock = [
  { name: 'Houblon Cryo Hops Citra 24.8%', pattern: 'Citra', grams: 65, alphaPct: 24.8 },
  { name: 'Cascade', pattern: 'Cascade', grams: 60, alphaPct: 6.5 },
  { name: 'Houblon Galaxy 17.2%', pattern: 'Galaxy', grams: 60, alphaPct: 17.2 },
  { name: 'Houblon Nelson Sauvin 9.6%', pattern: 'Nelson\\s+Sauvin', grams: 100 },
  { name: 'Houblon Sabro 13.4%', pattern: 'Sabro', grams: 30 },
  { name: 'Houblon Hallertauer Blanc 9.5% CH', pattern: 'Hallertau(?:er)?\\s+Blanc', grams: 30 },
  { name: 'Houblon Motueka 8.1%', pattern: 'Motueka', grams: 20 },
  { name: 'Houblon Idaho 7 12.7%', pattern: 'Idaho\\s+7', grams: 20 },
  { name: 'Houblon Target 11.3%', pattern: 'Target', grams: 5, alphaPct: 11.3 },
];
// Houblons connus mais à 0 g : ils ne doivent pas passer avant le stock.
export const productionCatalogueOnly = ['East Kent Goldings', 'Fuggle', 'Nugget', 'Simcoe'];
