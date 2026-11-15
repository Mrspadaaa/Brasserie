# Port de za3 — Stocks › Matériel (15.11)

Son choix, mot pour mot : « za3 Une date, pas un compteur mieux ». Règle n° 1 : sa maquette est la base de l'écran, reprise
telle quelle ; un port retire ce qu'elle n'a pas (L03). Maquette : `M/v2/za3/etat.html` (états `?etat=repos|geste|traiter|ajout|vide`,
`&theme=cave`, `&l=1280`), ses captures `M/v2/za3/za3-*.png`, sa NOTE.md (liste des mots).
M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.
Code : worktree `C:/Users/mrspa/AppData/Local/Temp/materiel-port`, branche `claude/materiel-port`, base `en-ligne/2026-11-15-atelier-kckd`.
Rien dans le dossier partagé `openai-clean-start` hors `M/`. Aucun commit sauf demandé dans la voie, par chemins.

## Inventaire (tout ce que montre za3 ; rien de plus)
1. **Barre** : `Tout 13` · `À traiter 4` (chiffre en encre, pas rouge), loupe (ouvre la recherche existante), `Achat` (ouvre
   la Dépense, intent matériel, acquis). À 1280 : « Enregistrer un achat ».
2. **Le fil** (repos) : un rail vertical. En haut, les appareils à traiter, chacun : nœud rond à picto (rouge seulement pour la
   panne ; ambre pour dû ; pointillé pour jamais étalonné), nom, sous-ligne « verbe · date » (« fuit au raccord · depuis le 05.11 »,
   « étalonner · prévu le 11.11 », « détartrer · après 5 brassins », « pas encore étalonné »), geste à droite 44 px (Réparée,
   Étalonner, ✓ Fait, Étalonner). Puis le point « aujourd'hui 14.11 ». Puis l'avenir à sa vraie distance (3,5 px par jour), bande
   teintée « 30 j », repères de mois à gauche, coupure (deux traits obliques) quand l'écart est grand ; chaque ligne : picto, nom,
   sous-ligne verbe (« nettoyer le filtre », « dégivrer »), date à droite (01.12) — jamais « dans N j ».
3. **Sans échéance** (n) : grille 2 colonnes, picto + nom.
4. **Pied** : `Déjà possédé`, `Projets ↗` (vers Atelier › Matériel, acquis `onOpenEquipmentProjects`), « 1 739 CHF · 2 prix connus »
   (somme des prix connus seulement).
5. **Après un geste** (traiter) : la ligne quitte le haut, une note « ✓ pH-mètre à jour jusqu'au 14.12 », la ligne reparaît à sa
   date sur le fil ; toast « Étalonné · à jour jusqu'au 14.12 · Annuler » (Annuler rétablit l'appareil d'avant).
   « Étalonner » ouvre la fiche à l'étape d'étalonnage (saisie des valeurs) ; « Fait » et « Réparée » agissent d'un toucher.
6. **Fiche** (geste) : en-tête retour « Stocks · Matériel », ⋯ (Gestion : vendu, réformé, supprimer avec confirmation journalisée ;
   modifier nom/catégorie/notes/achat) ; picto, nom, « Mesure · utilisé dans 7 brassins » ; « À étalonner · prévu le 11.11 » ;
   fil de l'appareil : prochain (pointillé) « 14.12 prochain, si étalonné », aujourd'hui « Étalonner · tolérance ±0,05 »,
   étapes rincer / pH 7 / pH 4 / ranger (pastilles cochables), saisie « pH 7,00 [7,01 lu] +0,01 ✓ » et « pH 4,00 [4,02 lu] +0,02 ✓ »
   (clavier décimal, jamais `type="number"`), historique « 11.10 Étalonné 4,03 · 7,02 »… ; Rythme (semaine · mois · 3 mois · brassin) ;
   État (Neuf · Bon · À entretenir · À réparer) ; Dépenses reliées « 37,40 CHF · 2 prix connus », lignes date / libellé / montant,
   « Achat · date et prix inconnus » ; pied : `Payer un entretien` (Dépense, ligne entretien reliée à l'appareil), `✓ Étalonné`
   (ou `✓ Fait` / `Réparée` selon l'appareil). Appareil sans étalonnage : même fiche sans les étapes ni la saisie.
7. **Nouveau matériel** (ajout) : feuille, trois tuiles Enregistrer un achat · Déjà possédé (choisie) · Projets d'équipement ;
   Nom ; Catégorie en puces (5) ; État en puces (4) ; Entretien (aucun · mois · 3 mois · an) ; Dernier fait (date suisse) ; aperçu
   « prochain le 01.02 » sur une petite réglette ; Annuler · ✓ Ajouter.
8. **Vide** : voir `za3-vide-390.png` (comment ajouter : Achat, Déjà possédé).
9. **1280** : trois colonnes : la liste (fil, sans échéance, pied) | le fil de l'appareil choisi (mois, points) | la fiche.
10. **Cave** : jetons de l'app, `za3-repos-cave-390.png`.

## Modèle (champs neufs, tous optionnels ; collection `equipment` inchangée, écriture par `StorageService.updateEquipment`)
`task?` (verbe : « Étalonner », « Détartrer »…), `rhythm?: {every, unit: 'jour'|'semaine'|'mois'|'brassin'}`, `lastDone?` (ISO),
`brokenSince?`, `brokenNote?`, `history?: EquipmentEvent[]` (date, kind entretien|etalonnage|panne|reparation|sortie, readings
`{label, expected, read}[]`, note), `calibration?: {points: {label, expected}[], tolerance}`, `retired?: {date, reason: 'vendu'|'réformé'}`.
L'ancien `maintenance` (texte libre) reste lu : sous-ligne quand pas de `task`. `state` reste écrit (panne → « À réparer »,
dû → « À entretenir ») pour la compatibilité. Brassins : `Batch.brewDate` (comptés depuis `lastDone`, ou depuis l'achat pour
« utilisé dans N brassins »). Dépenses : lignes `finance.lines[].equipmentRef` des transactions. Préréglages d'étalonnage par nom :
pH-mètre (pH 7,00 / pH 4,00, ±0,05), densimètre (eau 1,000, ±0,002), réfractomètre (eau 0,0 °Bx, ±0,2).

## Voies
- d1 (Sonnet) : domaine pur + types + tests. Possède `src/domain/equipment/**`, `src/types/index.ts` (EquipmentItem seul),
  `tests/unit/equipment*.test.ts`.
- d2a (Sonnet, après d1) : liste (fil), barre, sans échéance, pied, toast/Annuler, nouveau matériel, vide, câblage StocksTab et
  mise en page 1280 (colonne liste + emplacement du détail). Possède `src/ui/EquipmentList.tsx`, `src/ui/equipment/List*.tsx`,
  `src/ui/equipment/NewEquipment*.tsx`, `src/ui/equipment-compact.css`, `src/ui/equipment/list.css`, `src/components/tabs/StocksTab.tsx`
  (bloc `materiel` seul), tests d'intégration de la liste.
- d2b (Sonnet, après d1, en parallèle de d2a) : fiche (feuille à 390, panneau à 1280 avec le fil de l'appareil), étalonnage,
  rythme/état, dépenses reliées, Gestion. Possède `src/ui/EquipmentSheet.tsx`, `src/ui/equipment/Detail*.tsx`, `src/ui/equipment/detail.css`,
  tests de la fiche. Interface fixée : `EquipmentDetail({ item, batches, transactions, today, layout: 'sheet'|'pane', onChange(item, toast?),
  onClose, onPayMaintenance(item), onDelete(item) })` exportée par `src/ui/equipment/Detail.tsx` ; `EquipmentSheet` l'enveloppe dans `Sheet`.
- Puis : captures au banc (executant), test d'écran du critique Opus, corrections, build, contrôles, déploiement (pilote).
