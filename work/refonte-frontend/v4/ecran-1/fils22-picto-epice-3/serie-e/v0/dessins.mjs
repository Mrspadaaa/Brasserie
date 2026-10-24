// Série E, « l'épice entière, au trait » : huit épices réelles, chacune vue entière (de face, de profil ou de
// trois quarts) avec le détail qui la nomme. viewBox 24, trait 2.571, bouts ronds, au ton Épicé #7a4e3a, sans
// remplissage ni halo (D88). Importé par generer.mjs et par la loupe de travail (captures/travail/loupe.mjs).
// Chaque dessin a été regardé en vrais pixels à 12, 16 et 24 px, à côté de la feuille et des brins.
export const TON = '#7a4e3a';
const f = (n) => Math.round(n * 100) / 100;
const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [f(12 + r * Math.cos(a)), f(12 + r * Math.sin(a))]; };
// Badiane : huit carpelles en barque, flancs bombés et pointe nette (pas l'étoile à angles vifs de r4).
const carpelles = (n, rv, rt, larg) => {
  let d = '';
  for (let k = 0; k < n; k++) {
    const t = k * 360 / n, h = 180 / n;
    const v0 = pt(rv, t - h), v1 = pt(rv, t + h), tip = pt(rt, t);
    const a1 = pt(rt * 0.62, t - larg), a2 = pt(rt * 0.9, t - 3), b1 = pt(rt * 0.9, t + 3), b2 = pt(rt * 0.62, t + larg);
    d += (k ? '' : `M${v0}`) + `C${a1} ${a2} ${tip}C${b1} ${b2} ${v1}`;
  }
  return d.replace(/,/g, ' ') + 'Z';
};

export const VARIANTES = [
  {
    id: 'e1-badiane', genre: 'de face', epice: 'badiane', nom: 'Badiane, l’étoile à huit carpelles',
    dit: 'Huit barques bombées à pointe nette autour d’un cœur creux : l’anis étoilé tel qu’il sort du sachet.',
    risque: 'À 12 px, « étoile » ou « flocon » ; à 16 px, « fleur » si on ne compte pas les huit pointes.',
    dessin: `<path d="${carpelles(8, 3.2, 11, 26)}"/>`,
  },
  {
    id: 'e2-muscade', genre: 'trois quarts', epice: 'muscade', nom: 'Noix de muscade dans son macis',
    dit: 'La noix ovale tenue par les lanières du macis, qui partent de la base et s’ouvrent vers le haut.',
    risque: 'À 12 px, « œuf » ; à 24 px, « œuf et arbre » pour qui n’a jamais vu le macis.',
    dessin: '<ellipse cx="12" cy="12.6" rx="6.8" ry="8.6"/><path d="M12 21.2c-1.6-2.4-2-5-1-7.6l-2.6-3.4M11 13.6l1.4-4.6-1.6-3.6M12.4 9l2.8-2.2M12 21.2c2-1.8 3.4-4.6 3.2-7.6"/>',
  },
  {
    id: 'e3-anis-vert', genre: 'de profil', epice: 'anis vert', nom: 'Graine d’anis vert',
    dit: 'La graine en poire, côtelée, et le fil de son pédoncule qui s’enroule : l’anis vert en vrac.',
    risque: 'À 12 px, « goutte » ou « graine » sans plus ; la boucle du pédoncule se lit à 16 px.',
    dessin: '<path d="M10.6 4c1.4 1.4 2.6 3.6 3.4 6 1.2 3.4 1.2 6.6-.2 8.6-.8 1.2-2 1.8-3.2 1.8s-2.4-.6-3.2-1.8c-1.4-2-1.4-5.2-.2-8.6.8-2.4 2-4.6 3.4-6Z"/><path d="M9 9.6c-.8 3.2-.6 6.4.6 9.6M12.2 9.6c.8 3.2.6 6.4-.6 9.6"/><path d="M10.6 4c1-1.6 2.6-2 4.2-1.4 1.6.6 2.2 2.2 1.4 3.6"/>',
  },
  {
    id: 'e4-reglisse', genre: 'de profil', epice: 'réglisse', nom: 'Bâton de réglisse effiloché',
    dit: 'La racine coupée, son nœud, et le bout mâché qui s’effiloche en fibres : le bâton qu’on mâchonne.',
    risque: 'Les fibres au bout : « pinceau » ou « poireau » possibles à 12 px.',
    dessin: '<path d="M3.6 16.8 14 6.4l3.6 3.6L7.2 20.4a2.55 2.55 0 0 1-3.6-3.6Z"/><path d="M14 6.4c-.2-1.6.4-2.8 1.4-3.8M15.8 8.2c1-1.6 2.4-2.4 4.2-2.6M17.6 10c1.4-.6 2.8-.6 4 0M14.9 7.3l2.4-3.9"/><path d="M7.4 13l3.6 3.6"/>',
  },
  {
    id: 'e5-genievre', genre: 'trois quarts', epice: 'genièvre', nom: 'Baie de genièvre sur son rameau',
    dit: 'La baie ronde, l’étoile à trois branches qui la signe, et le rameau aux aiguilles groupées par trois.',
    risque: 'Baie et rameau : « radis » ou signe « ♂ » à 12 px ; baie seule, c’était « hochet », « loupe », « logo ».',
    dessin: '<circle cx="8.6" cy="15.4" r="5.6"/><path d="M8.6 13.4v-1.6M8.6 13.4l-1.4 1M8.6 13.4l1.4 1"/><path d="M12.6 11.4 21 3M15.2 8.8 14 3.4M15.2 8.8l5.4 1.2M18.2 5.8 17.6 2M18.2 5.8l3.6.6"/>',
  },
  {
    id: 'e6-carvi', genre: 'de profil', epice: 'carvi', nom: 'Graine de carvi',
    dit: 'La graine courbée en croissant, effilée aux deux bouts, une côte sur le dos.',
    risque: 'Silhouette courbe : « corne » ou « banane » ; le carvi est la moins connue des huit.',
    dessin: '<path d="M4.4 19.6C3 13 7.8 5.8 16 4.2c1.4-.2 2.6-.2 3.6 0-5.6 2.4-9.6 7.6-10.6 13.4-.2.8-.2 1.6-.2 2.4-1.6.6-3 .4-4.4-.4Z"/><path d="M7 15.4c1.2-3.8 3.8-7 7.4-9"/><path d="M19.6 4.2 21.4 2.8"/>',
  },
  {
    id: 'e7-coriandre', genre: 'trois quarts', epice: 'coriandre', nom: 'Graine de coriandre côtelée',
    dit: 'La graine ronde vue un peu d’en haut : ses côtes, et la petite couronne du calice à son sommet.',
    risque: 'Couronne et côtes : « grenade » ou « oignon » ; sans la couronne, ce serait le poivre refusé.',
    dessin: '<circle cx="12" cy="13.4" r="7.6"/><path d="M10.2 5.6 9.6 3.4M12 5.4V2.8M13.8 5.6l.6-2.2"/><path d="M9.2 8.8c-1.6 3-1.6 6.6 0 9.6M14.8 8.8c1.6 3 1.6 6.6 0 9.6"/>',
  },
  {
    id: 'e8-tonka', genre: 'de profil', epice: 'tonka', nom: 'Fève tonka ridée',
    dit: 'La fève longue et fripée, au bord ondulé, ses rides en travers : la tonka sèche, vanillée et amandée.',
    risque: 'À 12 px, « chips » ou « cacahuète » ; le bord ridé est son seul signe.',
    dessin: '<path d="M3.4 18.6c-.8-2 .4-3 .6-4.6s-.2-2.8 1.2-4.2 2.6-1 4-2.2 1.8-2.6 3.6-3.4 3-.2 4.6-.6 2.8-1.2 4.2-.4c1.4.8.6 2.4.6 3.8s.6 2.8-.4 4.4-2.4 1.6-3.8 2.8-1.6 2.8-3.4 3.8-3.2.6-4.8 1.2-2.8 1.4-4.6.6c-.8-.4-1.4-.8-1.8-1.2Z"/><path d="M8 13.2l1.6 1.8M11.4 10.2l1.6 1.8M14.8 7.4l1.6 1.6"/>',
  },
];

export const DESSINS = Object.fromEntries(VARIANTES.map((v) => [v.id, v.dessin]));
