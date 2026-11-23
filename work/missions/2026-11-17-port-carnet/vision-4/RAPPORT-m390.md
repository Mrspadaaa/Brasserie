# Vision m390 — carnet, passe 4 (18.11)

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (HEAD e0073224e, « Port carnet : correction tour 3 »).
Banc : `vite` (dev) sur 60425, `?preview=carnets&theme=clair|sombre`, fixture « ZZ TEST — … », IA simulée, bandeau « Banc — données simulées ». Lancé par `vision-4/lancer.sh` (rejeu `rejeu-banc.cjs`), serveurs arrêtés ensuite. Aucun appel Gemini, aucune donnée réelle.

## Écarts au brief (à lire d'abord)

1. **CRITIQUE-3.md absent.** Le fichier n'existe pas dans `work/missions/2026-11-17-port-carnet/` ni dans le worktree. Le seul `CRITIQUE-3.md` trouvé concerne le port du calendrier (`work/missions/2026-11-17-port-calendrier/`) : hors sujet, non utilisé. Donc je ne peux pas dire si des problèmes de CRITIQUE-3 sont corrigés. Les constats ci-dessous sont ceux que j'ai vus, pas une liste reprise.
2. **Build.** `npm run build` lancé (dist plus vieux que le commit de 24 s). `vite build` : OK (`built in 43.01s`). Puis `scripts/check-private-research.mjs` a échoué : « Build required before privacy check » (dist/index.html absent au moment du contrôle). Aujourd'hui `dist/index.html` existe (02:37:59). Cause non trouvée : soit une autre session a vidé `dist/` pendant le build, soit un souci de chemin Windows. Non relancé. Voir `vision-4/build.log`.
3. **Journal partagé.** `vision-4/lancer.log` est écrit par plusieurs passes à la fois (une autre session a lancé un rejeu dev-local dans le même fichier). Les libellés de ce journal sont donc faux. Les journaux **par passe** `journal-m390-<thème>.txt` et `erreurs-m390-<thème>.txt` font foi. La reprise (`-reprise`) a aussi tourné avec un filtre `ETATS` que le script n'applique pas : elle a rejoué tous les états, et ses captures non ciblées sont des doublons.
4. **Non joués ici** (hors banc, 1280 ou dev-local) : 31 (Réalisés de l'app), 46, 47, 48, 56, 57. Hors de ma part (390 banc).
5. **Ouvert par moi : 11 captures sur 180** (voir § Captures). Les autres ne sont **pas ouvertes** : leur verdict dit « contrôle du journal », pas « vu ».

## Résultat des contrôles (journal) et échecs reproduits

Le journal vérifie, pour chaque état, les textes attendus (présent / absent) et les gestes (toucher, attente). Résultat : **82 états sur 89 passent**, 7 échouent. Les 7 échecs sont **les mêmes dans la passe et dans la reprise, clair et sombre** : ce ne sont pas des problèmes de timing du script.

| État | Clair | Sombre | Ce qui manque ou ne marche pas |
|---|---|---|---|
| 12 doublon-pendant (G11) | ECHEC | ECHEC | « Garder à part » et « elles seront fusionnées » jamais affichés. Capture : la note reste dans le cadre « va atterrir ici », pas de bandeau de doublon. |
| 12b doublon-garder-a-part | ECHEC | ECHEC | Bouton « Garder à part » introuvable. Le doublon n'est pas détecté à l'écran. (Le fusion sans « Garder à part », 12c, passe.) |
| 21 lien-illisible | NON | NON | « page non lue » et « Ouvrir ↗ » absents. |
| 33 note-aide-ia (G25–G27) | NON | NON | « Ressemble à un critère » et « Passer » absents. Capture 33 : carnet défilé, pas la feuille de note : l'état n'est pas atteint. |
| 35c note-supprimee-annulee (G31) | ECHEC | ECHEC | Bandeau « Note supprimée · Annuler » visible, mais « attendre l’avis du ferblantier » reste listée dessous. Douteux : la note est-elle vraiment retirée ? |
| 36b supprimer-idee-veille-deplacer (G35) | NON | NON | « Déplacer » et « en veille » absents. La feuille affichée est « Supprimer le carnet … » (6 articles, 3 façons, 2 notes). L'offre de déplacer les articles en veille n'apparaît pas. |
| 52d ecarter-raison (A9) | NON | NON | Mot « /trop étroit/ » absent. Mais l'écarté avec sa raison s'affiche (voir la passe 52c et le tableau, « brasse la buée sans la sortir »). À juger : fixture ou texte attendu différent. |

## États → fichiers → ce qui se voit → agit

Légende : **Vu** = capture ouverte par moi. **Journal** = contrôle automatique passé, capture non ouverte. « Agit » = le geste produit l'effet attendu (Vu, ou journal si le texte attendu est présent).

| n° | État | Fichier clair | Clair | Sombre | Agit |
|---|---|---|---|---|---|
| 01 | liste au repos (R01) | m390-clair-01-liste-repos.png | Vu : À comparer 1, Idée 1, Choisi 3, « Coller un lien », champ « Une idée, un besoin… » + bouton + | m390-sombre-01-liste-repos.png, Vu : même structure, thème sombre lisible | n/a (repos) |
| 02 / 02b | liste vide, exemple | m390-clair-02-liste-vide.png, 02b | Journal | Journal | non vérifié |
| 03 | créer · avant, champ focus | m390-clair-03-creer-avant.png | Journal | Journal | oui (journal) |
| 04 | créer · pendant, carnet proche | m390-clair-04-creer-pendant-proche.png | Journal : « ✻ Déjà un carnet proche : Évier inox » | Journal | oui (journal) |
| 05 | créer · pendant, aucun proche | m390-clair-05-creer-pendant-aucun-proche.png | Journal : « Aucun de vos 5 carnets n’en parle » | Journal | oui (journal) |
| 06 | créer · pendant, « Ce qui compte » | m390-clair-06-creer-pendant-ce-qui-compte.png | Journal | Journal | oui (journal) |
| 07 | créer · après, « ✓ Carnet créé · Annuler » | m390-clair-07-creer-apres.png | Journal : « ✓ Carnet créé, en tête des Carnets » | Journal | oui (journal) |
| 08 | créer · après, Annuler | m390-clair-08-creer-apres-annule.png | Journal : liste revenue | Journal | oui (journal) |
| 09 | carnet ouvert (R03) | m390-clair-09-carnet-ouvert.png | Journal : sans tuiles | Journal | oui (journal) |
| 10 | ajouter · avant, bulle G8 | m390-clair-10-ajouter-avant-bulle.png | Journal : « Ajouter à », « peut trancher entre » | Journal | oui (journal) |
| 11 | texte · pendant, G9 Évier | m390-clair-11-texte-pendant-g9.png | **Vu** : cadre « va atterrir ici », « Va dans » (Ce qui compte sélectionné), texte « fond de bac 38 cm minimum » tapé, aperçu « les articles seront rangés… 38 cm au moins », bouton Ajouter | Journal | **oui** (texte tapé et aperçu visibles) |
| 12 | texte · pendant, doublon (G11) | m390-clair-12-doublon-pendant.png | **Vu** : cadre sans bandeau de doublon | ECHEC | **non** (reproduit) |
| 12b | doublon · « Garder à part » | m390-clair-12b-doublon-garder-a-part.png | ECHEC, bouton introuvable | ECHEC | **non** (reproduit) |
| 12c | doublon · fusion | m390-clair-12c-doublon-fusion.png | Journal : « ✓ » en 622 ms, Annuler | Journal | oui (journal) |
| 13 | texte · après, « ✓ Rangé ici » | m390-clair-13-texte-apres-range.png | Journal : « ✓ Rangé ici », « votre phrase » | Journal | oui (journal) |
| 13b | texte · après, Évier (G9) | m390-clair-13b-texte-apres-range-g9.png | **Vu** : « ✓ Rangé ici, à l'instant · Annuler », « Un fût de 30 L couché entre dans le bac », « votre phrase : fond de bac 38 cm minimum » | Journal | **oui** |
| 14 | texte depuis la liste, pendant | m390-clair-14-texte-depuis-liste-pendant.png | Journal : ligne Évier présente | Journal | oui (journal) |
| 14b | texte depuis la liste, après | m390-clair-14b-texte-depuis-liste-apres.png | Journal : « ✓ Carnet créé » | Journal | oui (journal) |
| 15 | lien · avant, puce « Coller : … » | m390-clair-15-lien-avant-coller.png | Journal : « Coller » présent | Journal | oui (journal) |
| 16 | lien · pendant, lecture | m390-clair-16-lien-pendant.png | Journal : « lecture de la page… » | Journal | oui (journal) |
| 17 / 17b | lien collé depuis la liste, pendant / après | m390-clair-17-…, 17b-… | Journal | Journal | oui (journal) |
| 18 | lien · après, carte complète | m390-clair-18-lien-apres-carte.png | **Vu** : « ✓ Article rangé ici, à l'instant · Annuler », « Hotte inox 140 cm + extracteur, 1 980 », « Veille du prix, tous les 3 jours » éteinte, « lu sur la page : nom, prix, débit, tient 80 °C : oui », « votre phrase : … hotte-140 », tableau qui naît dessous | Vu : même carte, thème sombre, bonne lisibilité | **oui** |
| 19 | lien · après, 2e tableau | m390-clair-19-lien-2e-tableau-nait.png | Journal | Journal | oui (journal) |
| 20 | lien collé depuis la liste, « Rangé dans … » | m390-clair-20-lien-colle-liste-range-dans.png | Journal | Journal | oui (journal) |
| 21 | lien illisible | m390-clair-21-lien-illisible.png | ECHEC : « page non lue », « Ouvrir » absents | ECHEC | **non** (reproduit) |
| 22 | note en vrac · pendant | m390-clair-22-note-vrac-pendant.png | Journal : 3 lignes collées | Journal | oui (journal) |
| 23 | note en vrac · après | m390-clair-23-note-vrac-apres.png | Journal | Journal | oui (journal) |
| 24 | notes ref/ rangées | m390-clair-24-notes-ref-rangees.png | Journal | Journal | oui (journal) |
| 25 | cartes d'article (R04) | m390-clair-25-cartes-article.png | Journal | Journal | n/a |
| 26 / 26a / 26b / 26c | article ouvert, veille éteinte / fixture allumée / allumée / retour | m390-clair-26-…, 26a, 26b, 26c | Journal | Journal | oui (journal) |
| 27 / 27b | comparer sur le critère, défilement | m390-clair-27-comparer-critere.png, 27b | Journal ; le tableau « rangé par : tient 80 °C d'abord, puis le débit » est lu dans le texte du journal, capture non ouverte | Journal | oui (journal) |
| 28 / 28b | choisir, pourquoi, choisi | m390-clair-28-choisir-pourquoi.png, 28b | Journal | Journal | oui (journal) |
| 29 / 29b | choix revu, ancien choix lisible | m390-clair-29-choix-revu.png, 29b | Journal | Journal | oui (journal) |
| 30 / 30b / 30c | envoyer dans À venir, « du carnet … », « Ouvrir le carnet » | m390-clair-30-…, 30b, 30c | Journal | Journal | oui (journal) |
| 31b | Réalisés (banc) | m390-clair-31b-realises-banc.png | Journal | Journal | oui (journal) |
| 32 / 32b0 / 32b / 32c | note : feuille ···, ferblantier, modifier pendant, après | m390-clair-32-note-feuille.png, 32b0, 32b, 32c | Journal | Journal | oui (journal) |
| 33 | note · aide IA (G25–G27) | m390-clair-33-note-aide-ia.png | ECHEC : capture = carnet défilé (tableau, Notes 2), feuille non atteinte | ECHEC | **non** (reproduit) |
| 34 / 34b / 34c / 34d | renommer : avant, pendant, après, annulé | m390-clair-34-…, 34b, 34c, 34d | Journal | Journal | oui (journal) |
| 35 / 35b | supprimer une note, « Note supprimée » | m390-clair-35-supprimer-note-menu.png, 35b | Journal | Journal | oui (journal) |
| 35c | note supprimée, Annuler | m390-clair-35c-note-supprimee-annulee.png | **Vu** : bandeau « Note supprimée · Annuler » ; « attendre l’avis du ferblantier » encore listée dessous | ECHEC | **douteux** |
| 36 | supprimer une idée sans lien (G34, G36) | m390-clair-36-supprimer-idee-confirm.png | Journal : champ et + grisés, Supprimer allumé | Journal | oui (journal) |
| 36b | supprimer une idée à veille (G35 « Déplacer ») | m390-clair-36b-supprimer-idee-veille-deplacer.png | **Vu** : feuille « Supprimer le carnet … ? », 6 articles, 3 façons, 2 notes, « ni dans À venir, ni en commande », Supprimer outline rouge, Garder. Pas de « Déplacer » ni « en veille » | **Vu** : même feuille, sombre | **non** pour « Déplacer » (reproduit) ; ouverture oui |
| 37 / 37b | carnet supprimé, Annuler | m390-clair-37-carnet-supprime.png, 37b | Journal | Journal | oui (journal) |
| 38 | supprimer une idée liée à À venir (Suppression v2) | m390-clair-38-…png | Journal | Journal | oui (journal) |
| 39 | clavier 300 px, champ et dernière note visibles | m390-clair-39-…png | Journal | Journal | oui (journal) |
| 40 / 40b | IA en cours, ✕ pendant la lecture | m390-clair-40-…, 40b | Journal | Journal | oui (journal) |
| 41 | IA en échec | m390-clair-41-ia-echec.png | Journal | Journal | oui (journal) |
| 42 | IA éteinte | m390-clair-42-ia-eteinte.png | Journal | Journal | oui (journal) |
| 43 | hors ligne, rangement local | m390-clair-43-hors-ligne.png | Journal | Journal | oui (journal) |
| 44 / 44b | photo, « photo non lue » | m390-clair-44-photo-non-lue.png, 44b | Journal | Journal | oui (journal) |
| 45 | dictée dans le champ | m390-clair-45-dictee.png | Journal | Journal | oui (journal) |
| 50 / 50b | idée réalisée : Archiver seul ; Réalisés › Ouvrir le carnet | m390-clair-50-…, 50b | Journal | Journal | oui (journal) |
| 49 / 49b / 49c | Garder le plan sans ce carnet ; À venir « supprimé » | m390-clair-49-…, 49b, 49c | Journal | Journal | oui (journal) |
| 51 / 51b / 51c | aides éteintes : feuille, doublon, renommer | m390-clair-51-…, 51b, 51c | Journal | Journal | oui (journal) |
| 52 / 52b / 52c | comparer : 1 article, 2 articles (tableau naît) | m390-clair-52-…, 52b, 52c | Journal | Journal | oui (journal) |
| 52d | écarté avec sa raison | m390-clair-52d-ecarter-raison.png | ECHEC (mot attendu absent ; raison affichée) | ECHEC | à juger |
| 53 | page de choix voie E | m390-clair-53-page-voie-E.png | Journal | Journal | n/a |
| 54 / 54b | bandeau de tâches | m390-clair-54-…, 54b | Journal | Journal | oui (journal) |
| 55 / 55b / 55c | pastille « lié à », aperçu, idée sans lien | m390-clair-55-…, 55b, 55c | Journal | Journal | oui (journal) |

Noms de fichiers : les tirets (`…`) abrègent le nom complet, qui figure en tête de chaque entrée du journal (`### <n> <état> → <fichier>`). Les états 26a, 32b0, 50b, 55c et d'autres sont dans le journal mais pas tous détaillés ici.

Les 7 ECHEC ci-dessus (12, 12b, 21, 33, 35c, 36b, 52d) se retrouvent dans les deux thèmes. Les états 46, 47, 48, 56, 57 ne sont pas joués ici (§ Écarts 4).

Thème sombre : mêmes états, mêmes 7 échecs. Vu (sombre) : 01, 18, 36b. Le contraste est bon : texte clair sur fond sombre, bouton Garder lisible, accent jaune sur Carnets.

## Captures

- Passe : `vision-4/m390-<clair|sombre>-<nn>-<état>.png` (90 par thème).
- Reprise : `vision-4/m390-<clair|sombre>-reprise-<nn>-<état>.png` (58 par thème), même script, sans filtre effectif.
- Ouvertes et regardées par moi (11) : clair 01, 11, 12, 13b, 18, 33, 35c, 36b ; sombre 01, 18, 36b.
- Journaux : `vision-4/journal-m390-<thème>.txt` (+ `-reprise`), `vision-4/erreurs-m390-<thème>.txt`.

## Erreurs console

- Par passe : 18 requêtes Google Fonts coupées (`fonts.googleapis.com`, `net::ERR_FAILED`). Le sandbox n'a pas d'Internet : environnemental, pas un défaut de l'app.
- `pageerror` : 0.
- Les « ECHEC ACTION » sont des échecs de script, pas des erreurs console.

## Ce qui reste douteux

- CRITIQUE-3.md absent : aucune liste de problèmes à vérifier.
- 35c : la suppression d'une note est-elle effective ? Le bandeau paraît, la note reste listée.
- 52d : la raison d'écart est affichée ; le mot attendu « /trop étroit/ » n'apparaît pas. Fixture ou texte attendu à vérifier.
- 12 / 12b : le doublon ne se détecte pas au banc à 390. Vrai défaut, ou fixture qui n'entre pas dans la règle : non tranché ici.
- Build : `vite build` OK, check de confidentialité en échec (dist absent au moment du contrôle). Non relancé.
