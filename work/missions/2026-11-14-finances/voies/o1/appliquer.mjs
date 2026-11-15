// Applique les remplacements v6a (une fois). Conserve les fins de ligne du fichier (CRLF). Chaque motif doit exister, une fois au moins.
import { readFileSync, writeFileSync } from 'node:fs';

function appliquer(chemin, paires) {
  const brut = readFileSync(chemin, 'utf8');
  const crlf = brut.includes('\r\n');
  let s = brut.replace(/\r\n/g, '\n');
  for (const [a, b] of paires) {
    if (!s.includes(a)) throw new Error(`absent dans ${chemin} : ${a.slice(0, 60)}`);
    s = s.split(a).join(b);
  }
  writeFileSync(chemin, crlf ? s.replace(/\n/g, '\r\n') : s);
}

appliquer('src/ui/finance/operations.css', [
  ['/* Opérations (v6b : lignes serrées, le geste à côté du montant).', '/* Opérations (v6a : « Lignes serrées », deux étages gardés, le geste sous le montant).'],
  ['/* Liste : groupes toujours ouverts, une opération = deux étages */', '/* Liste : groupes toujours ouverts, une opération = deux étages (hauteurs de v6a, filet compris : 44 sans geste, 47 avec ; en-tête 28) */'],
  ['grid-template-columns:20px 1fr auto; gap:6px; align-items:center; padding:4px 0 0; margin:0; }', 'grid-template-columns:22px 1fr auto; gap:6px; align-items:center; padding:5px 0 1px; margin:0; }'],
  ['.ops-sq { width:20px; height:20px;', '.ops-sq { width:22px; height:22px;'],
  ['.ops-row { position:relative; display:grid; grid-template-columns:4px minmax(0,1fr) auto auto; column-gap:8px; align-items:center; padding:3px 0; border-bottom:1px solid var(--ops-bord); }',
    '/* Trois colonnes (liseré, nom et état, montant) sur deux rangées : le montant en haut à droite, le geste dessous (v6a). Le bouton principal couvre les deux rangées. */\n.ops-row { position:relative; display:grid; grid-template-columns:4px minmax(0,1fr) auto; grid-template-rows:18px minmax(18px,auto); column-gap:8px; align-items:center; padding:2px 0 5px; border-bottom:1px solid var(--ops-bord); }'],
  ['.ops-bar { align-self:stretch;', '.ops-bar { grid-column:1; grid-row:1 / 3; align-self:stretch;'],
  ['.ops .ops-main.finance-op { display:block; grid-column:2; grid-template-columns:none; grid-template-areas:none; min-height:0; padding:0; min-width:0; width:100%; }',
    '.ops .ops-main.finance-op { display:block; grid-column:2; grid-row:1 / 3; align-self:start; grid-template-columns:none; grid-template-areas:none; min-height:0; padding:1px 0 0; min-width:0; width:100%; }'],
  ['font-size:14px; font-weight:600; line-height:15px; }', 'font-size:14px; font-weight:600; line-height:16px; }'],
  ['/* v6b : deux étages, jamais trois (la maquette : « état et pièce sans retour à la ligne »).', '/* v6a : deux étages, jamais trois (état et pièce sans retour à la ligne, repris de v6b pour les noms longs).'],
  ['gap:0 6px; font-size:12px; color:var(--ops-t2); line-height:14px; min-height:14px; min-width:0; }', 'gap:0 6px; font-size:12px; color:var(--ops-t2); line-height:16px; min-height:18px; min-width:0; }'],
  ['border-radius:999px; line-height:14px; font-size:12px;', 'border-radius:999px; line-height:16px; font-size:12px;'],
  ['.ops-a { grid-column:4; font-size:14px; text-align:right; line-height:15px; align-self:start; padding-top:1px; }', '.ops-a { grid-column:3; grid-row:1; font-size:14px; text-align:right; line-height:18px; align-self:center; }'],
  ['.ops-act { grid-column:3; position:relative; z-index:1; justify-self:end; align-self:center; text-align:center; }',
    '/* Le geste sous le montant, 24 px de haut (cible B12) : 1 px sous l\'étage, 4 px rendus au filet, soit 47 px pour la ligne. */\n.ops-act { grid-column:3; grid-row:2; position:relative; z-index:1; justify-self:end; align-self:center; margin:1px 0 -4px; text-align:center; }'],
  ['.ops-btn { min-height:28px;', '.ops-btn { min-height:24px;'],
  ['.ops-erreur { grid-column:2 / -1;', '.ops-erreur { grid-column:2 / -1; grid-row:3;'],
]);

appliquer('src/ui/finance/TransactionRow.tsx', [
  ['Une opération du journal (v6b) : deux étages serrés, le geste à côté du montant.\n *   étage 1 : quoi · qui                    [geste]  montant\n *   étage 2 : état · échéance ou date · pièce',
    'Une opération du journal (v6a, « Lignes serrées ») : deux étages serrés, le geste sous le montant.\n *   étage 1 : quoi · qui                      montant\n *   étage 2 : état · échéance ou date · pièce   [geste]'],
  ['v6b état « Après »', 'v6a état « Après »'],
  ['<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"'],
]);
console.log('appliqué');
