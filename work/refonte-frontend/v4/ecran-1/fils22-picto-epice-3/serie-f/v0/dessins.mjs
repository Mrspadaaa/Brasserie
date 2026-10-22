// Série F, « l'épice réelle, cadrée librement » (chaude) : les huit propositions. viewBox 24, trait 2.571, bouts
// ronds, au ton Épicé #7a4e3a, sans halo ni disque (D88), aucune mise à l'échelle (une seule épaisseur de trait).
// Importé par generer.mjs et par la loupe de travail (captures/travail/loupe.mjs). Chaque dessin a été regardé en
// vrais pixels à 12, 16 et 24 px, et à densité 3 (un téléphone), contre la feuille et les brins.
// Trouvaille de la série : le bouton du clou dessiné presque plein (cercle de rayon 1,7 sous un trait de 2,571).
// Avec un bouton en anneau (série A, r4), le clou se lit « clé » ou « épingle » ; plein, il se lit clou de girofle.
// Croisements : l'objet de derrière s'interrompt là où passe celui de devant, par un masque posé hors du symbole
// (masque) ; ses formes ne comptent donc ni dans le trait ni dans la signature du dessin.
export const TON = '#7a4e3a';

// Le clou, debout : bouton presque plein, couronne de trois sépales visibles, tige effilée.
const CLOU = '<circle cx="12" cy="4.6" r="1.7"/><path d="M8.4 4.4 10.4 9 12 7.6 13.6 9 15.6 4.4"/><path d="M10.6 9.4 12 21 13.4 9.4"/>';
// Le même, tige raccourcie (posé au-dessus de la cuve).
const CLOU_COURT = '<circle cx="12" cy="4.6" r="1.7"/><path d="M8.4 4.4 10.4 9 12 7.6 13.6 9 15.6 4.4"/><path d="M10.6 9.4 12 17.6 13.4 9.4"/>';
// Le bâton de cannelle, debout : le tube, et son bout roulé en spirale (trois demi-tours, rayons 4,2 / 3 / 1,6).
const CANNELLE = '<path d="M7.8 6v20M16.2 6v20"/><path d="M16.2 6A4.2 4.2 0 0 0 7.8 6 3 3 0 0 0 13.8 6 1.6 1.6 0 0 0 10.6 6"/>';
// La gousse de vanille, longue et fine, sa crosse au bout.
const VANILLE = '<path d="M2.6 21.2C3.4 16.4 7.4 13.2 10.8 10.6 14 8.2 15.4 6.2 18.8 4.2"/><path d="M2.6 21.2C7.2 20 10.4 17 12.8 14 15 11.2 16.4 8 18.8 4.2"/><path d="M18.8 4.2c1.4-1.2 3.2-1 3.4.6"/>';
const VANILLE_COURTE = '<path d="M4.4 19.6C6 15.4 9.4 11.8 13 9.4 15 8 16.8 6.6 18.2 5.2"/><path d="M4.4 19.6C8.4 18 11.6 15.2 14.2 12 15.6 10.2 17 7.8 18.2 5.2"/><path d="M18.2 5.2c.6-1.2 1.8-1.6 2.6-1"/>';

// Masque d'un croisement : tout visible, sauf une bande de 6,4 autour de l'objet de devant.
const masque = (id, devant) => `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><g stroke="#000" stroke-width="6.4" fill="none" stroke-linecap="round" stroke-linejoin="round">${devant}</g></mask>`;
const clouF1 = `<g transform="rotate(-40 12 14)">${CLOU}</g>`;
const clouF2 = `<g transform="translate(0 1.4) rotate(-30 12 17)">${CLOU}</g>`;

export const VARIANTES = [
  {
    id: 'f1-croises', genre: 'croisé', epice: 'mélange', nom: 'Cannelle et girofle croisés',
    dit: 'Le bâton roulé et le clou, croisés comme un bouquet : les deux épices qu’il a nommées.',
    risque: 'À 12 px, une croix chargée ; la spirale se lit à 16 px et plus.',
    masque: masque('m-f1-croises', clouF1),
    dessin: `<g mask="url(#m-f1-croises)"><g transform="rotate(40 12 14)">${CANNELLE}</g></g>${clouF1}`,
  },
  {
    id: 'f2-clous-croises', genre: 'emblème', epice: 'girofle', nom: 'Deux clous croisés',
    dit: 'Deux clous de girofle en sautoir, croisés bas, boutons en haut : le clou, deux fois, ne peut pas être autre chose.',
    risque: 'Même croix que f1 ; « outils croisés » possible à 12 px. Garder l’une des deux.',
    masque: masque('m-f2-clous-croises', clouF2),
    dessin: `<g mask="url(#m-f2-clous-croises)"><g transform="translate(0 1.4) rotate(30 12 17)">${CLOU}</g></g>${clouF2}`,
  },
  {
    id: 'f3-poignee', genre: 'tas', epice: 'girofle', nom: 'Une poignée de clous',
    dit: 'Trois clous en éventail, tiges réunies : la poignée qu’on jette dans la cuve.',
    risque: 'À 12 px, une « coquille » ou un « éventail » ; les boutons se comptent à 16 px.',
    dessin: `<g transform="translate(0 1.4) rotate(-44 12 22.6)">${CLOU}</g><g transform="translate(0 1.4)">${CLOU}</g><g transform="translate(0 1.4) rotate(44 12 22.6)">${CLOU}</g>`,
  },
  {
    id: 'f4-cuve', genre: 'en situation', epice: 'girofle', nom: 'Le clou au-dessus du moût',
    dit: 'Un clou qui tombe, la surface du moût dessous : l’épice qu’on met dans la bière.',
    risque: 'La vague peut se lire « eau » seule ; elle double la hauteur occupée.',
    dessin: `<g transform="translate(0 -2.4) rotate(-25 12 12)">${CLOU_COURT}</g><path d="M2.6 19.4c2.4 0 2.4 1.8 4.8 1.8s2.4-1.8 4.8-1.8 2.4 1.8 4.8 1.8 2.4-1.8 4.8-1.8"/>`,
  },
  {
    id: 'f5-bout-roule', genre: 'gros plan', epice: 'cannelle', nom: 'Cannelle, le bout roulé',
    dit: 'Le bâton en gros plan, cadré au ras : l’écorce roulée en spirale vient vers soi.',
    risque: 'À 12 px, une tache ; « rouleau » ou « épingle » si la spirale ne se voit pas.',
    dessin: '<path d="M19.14 10.06 7 -2.1M12.06 17.14-.1 5"/><path d="M12.06 17.14a5 5 0 1 0 7.07-7.07 3.6 3.6 0 0 0-5.09 5.09 2.2 2.2 0 0 0 3.11-3.11"/>',
  },
  {
    id: 'f6-crosse', genre: 'silhouette', epice: 'vanille', nom: 'Gousse de vanille et sa crosse',
    dit: 'La gousse entière d’un coin à l’autre, longue et fine, sa crosse au bout.',
    risque: '« Haricot vert » ou « cosse » : sans le noir de la vraie gousse, seule la longueur la dit.',
    dessin: VANILLE,
  },
  {
    id: 'f7-ouverte', genre: 'gousse ouverte', epice: 'vanille', nom: 'Vanille fendue sur ses graines',
    dit: 'La gousse ouverte en long, la pâte de graines au milieu, la crosse en haut.',
    risque: '« Feuille », « graine de cacao » ou « œil » ; proche de la feuille d’Herbacé par la nervure.',
    dessin: '<g transform="rotate(-45 12 12)"><path d="M1.4 12C4 12.8 6.4 15.6 12 15.6S20 12.8 22.6 12M1.4 12C4 11.2 6.4 8.4 12 8.4S20 11.2 22.6 12"/><path d="M7.4 12h9.2"/><path d="M22.6 12c.8-.4 1-1.2.6-2"/></g>',
  },
  {
    id: 'f8-cote-a-cote', genre: 'paire', epice: 'mélange', nom: 'Vanille et girofle côte à côte',
    dit: 'La gousse et le clou posés en parallèle : une nature morte d’épices douces.',
    risque: 'Deux objets à 12 px : le clou tient, la gousse devient un trait.',
    dessin: `<g transform="translate(-3.6 -3.6)">${VANILLE_COURTE}</g><g transform="translate(3.4 3.4) rotate(45 12 12)"><circle cx="12" cy="6.2" r="1.7"/><path d="M8.4 6 10.4 10.6 12 9.2 13.6 10.6 15.6 6"/><path d="M10.6 11 12 20.4 13.4 11"/></g>`,
  },
];

export const DESSINS = Object.fromEntries(VARIANTES.map((v) => [v.id, v.dessin]));
export const MASQUES = VARIANTES.filter((v) => v.masque).map((v) => v.masque).join('');
