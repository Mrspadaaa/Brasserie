// Verdict d'un brasseur-lecteur sur les 10 premiers de `substitutes()` des houblons phares (L14), écrit à la main après lecture
// de resultats.json du 26.10 (e1-banc-eval). Ces phrases sont du jugement, pas une mesure : elles ne changent pas le JSON des
// métriques. Clé : id sans le préfixe « beermaverick- ». Si le moteur change, relire : le banc affiche les listes à côté.
export const VERDICTS_PHARES: Record<string, { dry: string; a60: string }> = {
  'nelson-sauvin': {
    dry: 'Non. Tête : Boomerang, Herkules, Phoenix, Kazbek… des houblons à peine décrits ou nobles/neutres ; aucun ne dit vin blanc ni sauvignon. Hallertau Blanc, le plus proche pour un brasseur, est 155e ; Riwaka 206e. Nelson Sauvin n’a que 2 familles décrites et 78 % de mots sans famille (L14).',
    a60: 'Défendable pour de l’amertume (Boomerang, Herkules, Pacific Jade sont des α 10–14 propres), mais Hallertau Blanc 125e et Riwaka 250e : la liste ne garde rien de l’identité du houblon.',
  },
  'citra': {
    dry: 'Moyen. Amarillo (8e) et Sabro sont de bons voisins ; Bitter Gold, Mistral et Palisade en tête ne sont pas des houblons de Citra. Centennial 39e, Cascade 33e, Simcoe 103e, Mosaic 106e (les quatre de la page Beer Maverick).',
    a60: 'Défendable : à 60′ on remplace une amertume (Bravo, Loral, Nectaron, α hauts). Mais Trident, Caliente, Petoskey n’ont pas de rapport avec Citra, et Cascade est 163e.',
  },
  'motueka': {
    dry: 'Plausible côté agrumes (Shaddock, Mandarina Bavaria, Cascade, Southern Sublime), ce qui colle à « citron vert ». Mais ne dit rien du mojito ni du tropical. Les deux substituts Beer Maverick (Saaz US 291e, Sterling 198e) n’ont presque rien en commun avec la liste : la référence est discutable ici.',
    a60: 'Peu parlant : des α de 4–6 % ou inconnus (Vienna Gold, Zula, Buzz Bullets, huiles inconnues) arrivent en tête avec un « arôme 100 » qui ne dit que l’absence d’arôme étranger.',
  },
  'mosaic': {
    dry: 'Presque juste. Idaho 7 (2e) et Simcoe (3e) sont ce qu’un brasseur répond ; Styrian Fox 1er est discutable ; Galena et Brewer’s Gold sont des amérisants résineux, pas Mosaic. Citra 63e (référence : Citra, Simcoe).',
    a60: 'Défendable : Loral, Bravo, Azacca, Magnat. Simcoe 22e et Citra 30e restent derrière TNT Blend, Altus, Trident et Zenia, des profils sans huiles dont l’« arôme 100 » ne veut rien dire.',
  },
  'galaxy': {
    dry: 'Plausible (Nectaron, Samba, Zamba Blend, Idaho Gem : tropicaux), mais la liste est faite de blends et de codes expérimentaux (YQH-1380, NZH-107) peu utiles à un brasseur ; Citra 32e, Simcoe 43e, Amarillo 66e.',
    a60: 'Hors de propos pour le goût (Eclipse, HPA-016, Satus) ; correct seulement comme amertume. Citra 216e.',
  },
  'simcoe': {
    dry: 'Bon début : Idaho 7, Mosaic, Strata, Sabro sont de vrais voisins. Newport et Talus (amérisant/résineux) sont plus loin. Mosaic 4e, Cascade 51e, Citra 55e.',
    a60: 'Correct pour l’amertume : Warrior, Yeoman, Newport (α hauts, propres) ; Summit 46e (Beer Maverick l’a en premier).',
  },
  'saaz-cz': {
    dry: 'Oui. Pacific Crest, Tettnang US, Styrian Golding, Hallertau Tradition, Spalter Select : la famille noble que le brasseur attend. Saaz US 19e et Sterling 40e (Beer Maverick). Tettnang et Polish Lublin non reliés dans les données.',
    a60: 'Oui : Mount Hood, Saaz Late, Spalt, Tettnang US, Saphir, Tettnanger ; le mot « noble » tient.',
  },
  'cascade': {
    dry: 'Plausible (agrumes : Mandarina Bavaria, Sasquatch, Olympic, Southern Cross), mais les voisins classiques américains sont loin : Ahtanum 17e, Centennial 51e, Summit 61e, Amarillo 108e.',
    a60: 'Hors de propos pour l’identité (Aloha Blend, Diamant, Sun) ; défendable comme amertume seulement. Ahtanum 208e.',
  },
  'idaho-7': {
    dry: 'Oui pour la tête : Simcoe, Mosaic, HBC 630, Hydra, Strata. Mais les substituts de Beer Maverick (Azacca 98e, El Dorado 101e, Citra 43e, Amarillo 46e) sont loin derrière Nugget (7e).',
    a60: 'Défendable pour l’amertume (Bravo, Simcoe, Magnat, Marco Polo, Nugget) ; la liste dit « α élevé propre », pas « Idaho 7 ». Citra 214e.',
  },
};
