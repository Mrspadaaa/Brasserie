const fs = require('fs');
const path = require('path');
const { edit } = require('./edit-recipe.cjs');
const racine = path.resolve(__dirname, '../../../../..');

// PD-4 : la question « Remplacer sa masse par … ? » se pose sous le champ où l'on a tapé (Ajout), pas sous les repères.
const f = path.join(racine, 'src/ui/fermentescibles/EtapeFermentescibles.tsx');
let s = fs.readFileSync(f, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const debut = s.indexOf('        {remplacer && (');
const finMarque = `        )}${nl}        {refusSaisie &&`;
const fin = s.indexOf(finMarque);
if (debut < 0 || fin < 0) throw new Error('bloc remplacer introuvable');
const bloc = s.slice(debut, fin + `        )}${nl}`.length);
s = s.slice(0, debut) + s.slice(fin + `        )}${nl}`.length);
const ancre = `styleCode={styleCode} ebcVise={ebcVise} ebcMax={ebcMax} onChoisir={choisir} onCreer={creer} />${nl}`;
if (s.split(ancre).length !== 2) throw new Error('ancre Ajout introuvable');
s = s.replace(ancre, () => ancre + `      {/* PD-4 : la question se pose juste sous le champ où l'on a tapé (Entrée), pas sous les repères. */}${nl}      <div data-role="remplacer-zone">${nl}` + bloc.replace(/^        /gm, '          ') + `      </div>${nl}`);
fs.writeFileSync(f, s);

edit('src/ui/fermentescibles/EtapeFermentescibles.tsx', [
  // PI-2 : un grain hors de l'empâtage (compté 0) ne pèse pas dans la barre de composition.
  ["style={{ flexGrow: f.weightKg, ...(f.kind", "style={{ flexGrow: messageMoment(f) ? 0 : f.weightKg, ...(f.kind"],
]);
console.log('ok');
