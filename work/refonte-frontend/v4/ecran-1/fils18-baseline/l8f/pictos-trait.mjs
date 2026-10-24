// Commun à l8e et l8f : ce qui change par rapport à l'habillage de l8b, hors du dessin des pictos.
// Les pictos d'arôme au trait : un seul trait, rendu à la même épaisseur à toute taille (vector-effect) ; le
// disque pâle de la tête de colonne disparaît. L'usage plein si un fournisseur l'atteste, pâle s'il est
// déduit de l'α (comme q2b) ; la case « non établi » hachurée.
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
export const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const net = (inner) => inner.replace(/<(path|circle|ellipse|line|rect|polyline|polygon)\b/g, '<$1 vector-effect="non-scaling-stroke"');
export const EXTRA = `
  .th .pi { width: 18px; height: 18px; padding: 0; background: none; border-radius: 0; }
  .us { background: none; border-radius: 0; padding: 0; color: var(--encre); }
  .us.deduit { background: none; color: var(--encre); opacity: .45; }
  .cf.ne .mb-z::before { background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .leg-b:hover { background: #ececf1; }
  .legende { box-shadow: 0 -8px 28px rgba(0,0,0,.2); }
  .leg-x { background: #ececf1; }
  .leg-s + .leg-s { border-top: 1px solid var(--trait); padding-top: 8px; }
  .vr.f-source { background: #fff; }`;
