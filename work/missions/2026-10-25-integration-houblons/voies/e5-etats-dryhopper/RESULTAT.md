ECHEC — 10 états Dryhopper sur fb0d14e3 : valeurs chiffrées ~1 point sous l'attendu, cause non identifiée (classe c, SUSPECT)

Fichiers écrits : ce RESULTAT.md seul. Rien mis à jour dans le dépôt ni dans la copie propre. Scripts de mesure hors dépôt : `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/e5/` (ctl.mjs = controle-etats avec dump du texte, cmp-idaho.mjs, mots-idaho.mjs, probe-idaho.mts).

Critères :
- Rejeu `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours --ecran=dryhopper --montre` dans la copie propre : ETATS ECHEC (10/20), mêmes 10 états que le journal 06b. Sortie : `scratchpad/e5/etats-montre.log`.
- Texte trouvé relevé avec ctl.mjs (dump TEXTE) : `scratchpad/e5/ctl-texte.log`.
- Valeurs de 6e368cbd non relevées à nouveau (le probe vite-node a échoué, voir Douteux). Les « attendu » viennent de `work/refonte-frontend/v4/choix/etats/dryhopper.json` et des mots absents du journal.

Table (attendu → trouvé ; « ★ actif · 1 j » est présent dans tous les états où il est attendu) :
- etat-dryh-repos : attendu ~+29 ; trouvé ~+28 (floral), ~+25 (baies), ~+21 (résineux) ; classe c.
- etat-dryh-bandeau : attendu ~+29 · ~+26 · ~+22 ; trouvé ~+28 · ~+25 · ~+21 ; classe c.
- etat-dryh-loupe : attendu ≈+19 · ~+19 · ~+29 · ~+15 · « contre ★ : floral ~−10 · baies ~−8 · résineux ~−8 » ; trouvé ~+18 (floral, ★ au 1 j), « contre ★ : floral ~−9 · baies ~−8 · résineux ~−7 · trop amer », ~+17, ~+14, ~+28 (2 j) ; classe c.
- etat-dryh-etape-ebullition : attendu « contre ★ : floral ~−26 · baies ~−23 · résineux ~−19 » ; trouvé « contre ★ : floral ~−25 · baies ~−22 · résineux ~−19 · trop amer » ; classe c.
- etat-dryh-etape-wp : attendu ~+19 · ~+15 · « contre ★ : floral ~−10 · baies ~−8 · résineux ~−8 » ; trouvé ~+18 · ~+17 · ~+14 · « contre ★ : floral ~−9 · baies ~−8 · résineux ~−7 · trop amer » ; classe c.
- etat-dryh-etape-apres : attendu ~+29 · ~+27 ; trouvé ~+28 · ~+26 ; classe c.
- etat-dryh-jour-1 : attendu ~+29 · ~+26 · ~+22 ; trouvé ~+28 · ~+25 · ~+21 ; classe c.
- etat-dryh-jour-7 : attendu ~+29 · ~+26 · ~+23 ; trouvé ~+28 · ~+25 · ~+22 ; classe c.
- etat-dryh-barres : attendu ~+29 · ~+9 · ~+26 · ~+22 · ~+15 ; trouvé ~+28 (floral), ~+25 (baies), ~+21 (résineux), ~+12 (herbacé), ~+8 (végétal). Le « ~+9 » et « ~+15 » attendus n'ont pas de correspondance nette : non mesuré précisément ; classe c.
- etat-dryh-absolu : attendu ~+22 ; trouvé ~+21 (résineux) ; classe c.

Écart de la fiche d'Idaho 7 (6e368cbd → fb0d14e3, `src/data/hopV4/proto-data.json`) :
- Contenu identique : 28 mots décodés, mêmes sources (Charles Faram 2024, Crosby, HPA, John I. Haas 2020, HopDatabase), même α 9,5–14,9, mêmes huiles (myrcène 45–55, humulène 10–20, caryophyllène 6–10, farnésène 0–1, autres 14–39), 5 fiches, même complément (`complements.json`, entrée identique).
- Seul l'encodage bouge : `descMots` passe de 430 à 452 mots (insertion dès l'indice 146) ; les indices de la fiche changent, pas les mots.
- `descSources` : 11 → 12 (Freestyle Hops et NZ Hops échangés aux rangs 9–10, « USA Hops » ajouté en 11). Idaho n'en cite aucun.
- Variétés : 318 → 317 (Equinox fusionné dans Ekuanot, `idsFusionnes`). `alias-noms.json` est nouveau (absent de 6e), 8 entrées, aucune vers Idaho 7.
- Nombre de fiches Idaho : 5 dans les deux. Mots : 28 dans les deux. Familles citées : 5 dans les deux.
- Conclusion : la fiche d'Idaho 7 n'a pas changé en contenu. Classe (a) non retenue pour Idaho 7.

Classe (b), D99 : `voies.ts` ne change que `overflowRang` dans `proposeVoies` ; `minoritaire.ts` n'a qu'une constante. `profil-simule.ts`, qui fait `simulerCas`, est inchangé et ne lit pas `apportMinoritaire`. Le frise de Dryhopper passe par `simulerMoment` → `simulerCas`. D99 ne peut donc pas expliquer −1 point sur les effets. (b) non retenue.

Classe (c) SUSPECT : aucune cause trouvée pour les −1 point (floral 29 → 28, baies 26 → 25, résineux 22 → 21, et 1 j = 2 j à ~+28 au lieu de 1 j ~+29 / 2 j ~+22). Autres changements de données vus : c6 modifie la fiche de Cascade (`froidDryhopper.test.ts` : vert 20,6 → 20,0, résineux 27,5 → 27,2) et les empreintes `moteurInchange` bougent. Un effet à travers le catalogue reste possible, non vérifié.

Essais utilisés : 1 rejeu complet, 1 rejeu avec texte, 1 comparaison de données, 1 tentative de probe moteur (échouée). Essais par critère : 1.

Douteux :
- Pas de mesure directe du moteur sur les deux arbres. Le probe `probe-idaho.mts` a échoué : import `data.ts` introuvable depuis la copie `deploy-63130965` (chemin absolu mal résolu), et `tree-6e` (git archive de `src` seul) importe `../../functions/src/hopBitternessSchema`, hors archive.
- Les attendus 6e (~+29, etc.) viennent de `dryhopper.json` et d'e4 (138/138 sur 6e), non rejoués ici.
- Le ★ au 1 j n'est plus le même moment qu'en 6e (2 j ~+22 en 6e, 1 j ~+28 en fb) : je n'ai pas tranché si c'est le même effet.
- « ~+9 » et « ~+15 » de barres : correspondance incertaine.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune (la comparaison de données par indices (`fiches`) a d'abord été lue comme un changement de mots ; le `descSources[s]` de `fiches[0]` a été identifié après coup. Règle : lire la structure d'encodage (`data.ts` descriptionsDe) avant de décoder.)

## Mise à jour (26.10)

La ligne 1 reste le verdict du premier rejeu. Cette section le corrige.

Cause : 846b76aa (c6, rattachements par alias ; le commit regroupe D99 et c6), classe a retenue par le pilote. Relevé 6e368cbd (20/20 OK) → fb0d14e3 (10/20) : chaque valeur de la fiche barres et du bandeau baisse de 1 point (floral 29→28, baies 26→25, résineux 22→21, herbacé 13→12, terreux 9→8, agrumes 21→20, tropicaux 26→25, noyau 15→14, végétal 9→8). Épicé (3) et pépins (0) ne bougent pas. Les « ~+9 » et « ~+15 » sans correspondance du rapport étaient Terreux/Végétal et Noyau de 6e.

Table vérifiée sur le texte complet (ctl relu, copie propre sur fb0d14e3, `scratchpad/e5/ctl-texte-relu.log` ; 6e : `scratchpad/e5/ctl-texte-6e.log`). Elle tient, avec deux compléments : etat-dryh-etape-apres affiche aussi résineux ~+28 (sans attendu) ; etat-dryh-etape-ebullition affiche bandeau floral ~+3 (conforme). Les autres valeurs du rapport sont exactes.

Registre modifié : `work/refonte-frontend/v4/choix/etats/dryhopper.json`, 10 états. `verif.attendu` passe aux valeurs trouvées ; `verif.choisie` reste à l'ancien (convention e3/e4, page p4b2f statique) ; `verif.note` reçoit « c6 (846b76aa) : rattachements par alias, profil de la stout S1 −1 point, « trop amer » au contre ★. ». `etat-dryh-avant-inconnu` non touché.

Contrôle dans la copie propre (fb0d14e3 + ce registre), sans `--ecran` :
`ETATS OK (138/138) ; 15 voulu(s) non rejoué(s) ; 1 en attente de son choix : etat-dryh-avant-inconnu (données (D83, 26.10) : plus aucune famille de la bière « avant » n'est inconnue avec Idaho 7 dans la fixture, donc « ? → » ne s'écrit plus ; à rejouer avec une fixture qui l'exhibe (RESULTAT, DÉCISION À PRENDRE))`
Journal : `scratchpad/e5/controle-etats-complet.log` (0 ECHEC, 138 OK). Copie restaurée (`git status` vide).

Douteux : l'attribution à c6 seul n'est pas isolée (846b76aa mêle D99 et c6). Le registre garde `choisie` ancien : `--choisie` affiche donc toujours les anciennes valeurs de p4b2f, par convention.

Essais : 1 par critère (aucune correction de contrôle n'a été nécessaire).
