#!/usr/bin/env node
// e7 (26.10) : met à jour `verif.attendu` des six états de Substituer qui lisaient Citra cryo à la 3e place du face à face.
// D115 (w1, b1d73ea1) : à 60′, le face à face ne prend plus un candidat « produit d'arôme » : la 3e carte est Galaxy (35 g, double
// usage) et non Citra cryo (24 g, aromatique). Convention e3/e6 : `attendu` = ce que la maquette construite montre ;
// `choisie.attendu` = les valeurs de la maquette choisie (déjà là, intactes) ; `note` = la raison et les captures regardées.
// Usage : node maj-e7.mjs [--ecrire]   (sans --ecrire : montre seulement ce qui changerait)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const chemin = path.resolve(ici, '..', '..', '..', '..', 'refonte-frontend', 'v4', 'choix', 'etats', 'substituer.json');
const ecrire = process.argv.includes('--ecrire');
const AVANT = (id) => `work/missions/2026-10-25-integration-houblons/voies/e6-ecarts-lot/paires/${id}.png (moitié droite : avant w1)`;
const APRES = (id) => `work/missions/2026-10-25-integration-houblons/voies/e7-bloquants-b1d7/captures/${id}-construite.png`;
const RAISON = 'D115 : face à face sans produit d’arôme à 60′ (w1, b1d73ea1) : la 3e carte est Galaxy (35 g, double usage, premier du stock qui suffit) et non Citra cryo (24 g, aromatique) ; le classement de la liste (Trident, Yeoman, Helios, Centennial, Magnat, Citra cryo, Motueka, Galaxy), les cartes de Nugget et de Trident et le dessin sont identiques. ';

// id → { attendu, detail } ; seuls les mots de la 3e carte changent.
const CHANGES = {
  'etat-subst-face': { attendu: ['Face à face, même IBU', 'Nugget', '46 g', 'Trident', '43–54 g', 'Galaxy', '35 g', 'double usage', 'Épuisé'],
    detail: 'Les trois bandes : Nugget (épuisé, 46 g), Trident (premier sûr à acheter, 43–54 g), Galaxy (premier du stock qui suffit, 35 g, double usage ; plus de mot « aromatique », qui était la marque de Citra cryo).' },
  'etat-subst-alpha': { attendu: ['9–16', '11–14', '11–19,8', 'lot 13', 'lot 17,2'],
    detail: 'Les trois rangées α sont Nugget 9–16 (lot 13), Trident 11–14, Galaxy 11–19,8 (lot 17,2, son lot en stock) ; le repère « article 24,8 » de Citra cryo disparaît avec lui.' },
  'etat-subst-aromes': { attendu: ['Arômes', '16D', 'Floral', 'Herbacé', 'Terreux', 'Hors 16D', 'Agrumes', 'Tropicaux', 'Résineux', 'Épicé', 'Fiches lues', 'Nugget 10', 'Trident 2', 'Galaxy 5', 'Pointillé', 'Noyau', 'Pépins', 'Baies', 'Melon', 'Végétal', 'sans famille'],
    detail: 'Fiches lues : Nugget 10, Trident 2, Galaxy 5 (avant Citra cryo 7) ; mêmes colonnes et mêmes groupes.' },
  'etat-subst-radar': { attendu: ['Radar des citations : Nugget, Trident, Galaxy', 'Nugget (l’original, contour seul)', 'gras : attendu en 16D', 'Du centre vers le bord', 'non décrit, cité, marqué'],
    detail: 'Le radar compare Nugget, Trident et Galaxy ; mêmes anneaux, même contour seul pour l’original.' },
  'etat-subst-beta': { attendu: ['3–8', '4–5', '5–11,6', 'un par plage qui diffère', 'milieu moyen des sources'],
    detail: 'Rangées β : Nugget 3–8, Trident 4–5, Galaxy 5–11,6 (avant Citra cryo 2,7–4,5) ; même légende.' },
  'etat-subst-style': { attendu: ['16D Foreign Extra Stout', 'attend floral, herbacé, terreux', 'IBU 50–70', 'la recette est à 59,7 et chaque dose la garde', 'cite les trois', 'ne cite aucune des trois', 'fruité, agrumes, fruits tropicaux, fruit de la passion', 'fruit de la passion, agrumes, pêche, ananas, fruits tropicaux, cannabis', 'Employé en Hazy IPA, IPA', 'Employé en IPA, NEIPA', 'aucune stout citée'],
    detail: 'Les quatre lignes sont la 16D, Nugget, Trident (« ne cite aucune des trois ») et Galaxy (« ne cite aucune des trois. fruit de la passion, agrumes, pêche, ananas, fruits tropicaux, cannabis. Employé en IPA, NEIPA ») ; la ligne « garde floral (marqué), perd herbacé et terreux » était celle de Citra cryo.' }
};

const j = JSON.parse(fs.readFileSync(chemin, 'utf8'));
let n = 0;
for (const [id, ch] of Object.entries(CHANGES)) {
  const e = j.etats.find((x) => x.id === id);
  if (!e) throw new Error(`état absent : ${id}`);
  const v = e.verif;
  if (!v.choisie?.attendu) throw new Error(`${id} : pas de choisie.attendu (la maquette choisie perdrait ses valeurs)`);
  console.log(`${id} : ${JSON.stringify(v.attendu)}\n   → ${JSON.stringify(ch.attendu)}`);
  v.attendu = ch.attendu;
  v.note = `${v.note ? v.note + ' — ' : ''}e7, 26.10 : ${RAISON}${ch.detail} (captures avant : ${AVANT(id)} ; après : ${APRES(id)}, regardées.)`;
  n += 1;
}
if (ecrire) fs.writeFileSync(chemin, JSON.stringify(j, null, 1) + '\n');
console.log(`${n} états ${ecrire ? 'écrits' : '(à blanc : rien écrit)'}`);
