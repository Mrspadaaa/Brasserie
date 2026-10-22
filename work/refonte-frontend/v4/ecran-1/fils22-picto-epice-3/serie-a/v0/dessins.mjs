// Série A, « l'épice douce vue autrement » : les huit propositions (viewBox 24, trait 2.571, bouts ronds,
// au ton Épicé #7a4e3a, sans remplissage ni halo, D88). Importé par generer.mjs et par la loupe de travail
// (captures/travail/loupe.mjs). Chaque dessin a été regardé en vrais pixels à 12, 16 et 24 px.
export const TON = '#7a4e3a';

export const VARIANTES = [
  {
    id: 'a1-cannelle-bout', genre: 'coupe', epice: 'cannelle', nom: 'Cannelle, vue de bout',
    dit: 'Le bâton roulé vu par son bout : la spirale de l’écorce.',
    risque: 'Spirale nue : « escargot » ou « roulé » si on ne pense pas épice.',
    // Demi-cercles de rayons 1,9 / 3,8 / 5,7 / 7,6 (pas de 3,8 : la spirale reste ouverte à 12 px),
    // puis le bord de l'écorce, coupé net.
    dessin: '<path d="M12.5 12.4A1.9 1.9 0 0 0 8.7 12.4 3.8 3.8 0 0 0 16.3 12.4 5.7 5.7 0 0 0 4.9 12.4 7.6 7.6 0 0 0 20.1 12.4V10"/>',
  },
  {
    id: 'a2-vanille-fendue', genre: 'objet', epice: 'vanille', nom: 'Gousse de vanille fendue',
    dit: 'La gousse longue et fine, sa queue en crochet, la pointe ouverte sur une graine.',
    risque: 'À 12 px, une gousse sans plus : « haricot » possible.',
    // Les deux bords se séparent vers la pointe (la gousse « fendue » du négoce) ; une graine sort.
    dessin: '<path d="M3.6 5c3.4.4 6 2.8 8 6l3.6 5.4c1.2 1.8 3 3 5 3.4"/><path d="M3.6 5c.4 3 2 5.4 4.4 7.4l4 3.4c1.6 1.4 2.6 3.2 2.8 5"/><path d="M3.6 5C2.4 4.6 2 3.4 2.6 2.4"/><path d="M16.4 19.8h.01"/>',
  },
  {
    id: 'a3-pain-epices', genre: 'emblème', nom: 'Bonhomme de pain d’épices',
    dit: 'Cannelle, muscade et gingembre réunis : l’épice douce que tout le monde nomme.',
    risque: 'Dit « Noël, biscuit » ; peut se lire « personne » sans ses boutons.',
    dessin: '<circle cx="12" cy="5" r="3"/><path d="M9.5 8.6H5.2a1.7 1.7 0 0 0 0 3.4h3.2v2.2L6 19.6a1.6 1.6 0 0 0 2.8 1.5L12 17l3.2 4.1a1.6 1.6 0 0 0 2.8-1.5l-2.4-5.4V12h3.2a1.7 1.7 0 0 0 0-3.4h-4.3"/><path d="M12 11h.01M12 14h.01"/>',
  },
  {
    id: 'a4-gingembre', genre: 'objet', epice: 'gingembre', nom: 'Racine de gingembre',
    dit: 'La « main » de gingembre : deux doigts noueux, leurs anneaux.',
    risque: 'À 12 px, une forme noueuse : « gland » ou « champignon » possibles.',
    dessin: '<path d="M3 16.5c0-2.4 1.8-3.9 4-3.6l2-4.4c.6-1.4 2.5-1.6 3.3-.3l1 1.6 2.4-4.1c.8-1.3 2.7-1.1 3.3.3.4 1-.1 1.8-.6 2.6l-2 3.4c2.6.2 4.1 2 3.6 4.2-.5 2-2.4 3-4.4 2.6-1.2 1.6-3.2 2.4-5.4 1.9-1.5 1-3.8 1-5.2-.2C3.6 19.8 3 18.3 3 16.5Z"/><path d="M8.6 12.6l2.2 1M15 9.8l2 1.1M9 19.6c.4-1.4.2-2.6-.6-3.6"/>',
  },
  {
    id: 'a5-girofle', genre: 'objet', epice: 'girofle', nom: 'Clou de girofle',
    dit: 'Le clou debout, penché : son bouton rond, les sépales en pointes, la tige fine.',
    risque: 'À 24 px, le bouton frôle les sépales ; « épingle » possible. Dessin neuf, pas celui de r4.',
    // Tige effilée plus fine que la tête (sinon « cornet de glace »), penchée de 28° (debout, la couronne
    // fait des « bras levés »).
    dessin: '<g transform="rotate(-28 12 12)"><circle cx="12" cy="4.4" r="2.6"/><path d="M6.6 5.8 10.6 10.4h2.8l4-4.6"/><path d="M11 10.6 12 22.6 13 10.6"/></g>',
  },
  {
    id: 'a6-sachet', genre: 'usage', nom: 'Sachet d’épices pour la cuve',
    dit: 'La mousseline nouée qu’on plonge en fin d’ébullition ou au fermenteur, sa ficelle.',
    risque: 'Se lit « sac » ou « bourse » ; l’épice n’y est pas dessinée.',
    dessin: '<path d="M9.4 9.6C6 11 4.2 13.8 4.2 16.6c0 3 3.4 4.8 7.8 4.8s7.8-1.8 7.8-4.8c0-2.8-1.8-5.6-5.2-7"/><path d="M9.4 9.6h5.2"/><path d="M9.6 9.4 8 6.4M14.4 9.4 16 6.4M12 9.4V6.8"/><path d="M14.6 9.6c2.6-1.4 4-3.6 3.8-6.6"/>',
  },
  {
    id: 'a7-cardamome-coupe', genre: 'coupe', epice: 'cardamome', nom: 'Cardamome tranchée',
    dit: 'La gousse coupée en travers : trois loges autour du cœur.',
    risque: 'Signe abstrait pour qui n’a pas tranché de cardamome : « recyclage » possible.',
    dessin: '<path d="M12 3.2c2 0 3.2 1 4.4 3l4 7c1.2 2 1.2 3.6.2 5.2-1 1.6-2.4 2.4-4.8 2.4H8.2c-2.4 0-3.8-.8-4.8-2.4-1-1.6-1-3.2.2-5.2l4-7c1.2-2 2.4-3 4.4-3Z"/><path d="M12 14.4V9M12 14.4l-4.6 2.6M12 14.4l4.6 2.6"/>',
  },
  {
    id: 'a8-cannelle-batons', genre: 'objet', epice: 'cannelle', nom: 'Bâtons de cannelle',
    dit: 'Deux bâtons couchés, chacun avec la lèvre roulée de son écorce au bout.',
    risque: 'À 12 px, deux « allumettes » ; la lèvre roulée ne se voit qu’à 16 px et plus.',
    // Deux bâtons de 5 de large, 4,9 d'écart (blanc visible à 12 px), la lèvre de l'écorce au bout haut.
    dessin: '<path d="M2.83 11.63 11.63 2.83A2.5 2.5 0 0 1 15.17 6.37L6.37 15.17A2.5 2.5 0 0 1 2.83 11.63Z"/><path d="M8.83 17.63 17.63 8.83A2.5 2.5 0 0 1 21.17 12.37L12.37 21.17A2.5 2.5 0 0 1 8.83 17.63Z"/><path d="M12.4 5.8a1.3 1.3 0 1 1 1.8 0"/><path d="M18.4 11.8a1.3 1.3 0 1 1 1.8 0"/>',
  },
];

export const DESSINS = Object.fromEntries(VARIANTES.map((v) => [v.id, v.dessin]));
