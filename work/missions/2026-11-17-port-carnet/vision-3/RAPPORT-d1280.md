# Vision d1280, 3e passe — carnet porté (1280 × 800, clair et sombre)

Banc : worktree `port-carnet`, commit `a5ca204b1`. `dist` plus vieux que le commit (00:40 contre 01:09) : `npm run build` relancé, exit 0, drapeaux OK (`vision-3/build.log`).
Serveur : `vite` dev sur `http://127.0.0.1:5293/?preview=carnets` (port libre choisi ici ; le banc est DEV seulement, `vite preview` ne le sert pas, cf. vision-2). Variables `VITE_FIREBASE_*` fictives, fixture « ZZ TEST — … », IA simulée, requêtes Google coupées (0 coupée).
Scripts : `vision-3/rejeu-banc.cjs` (copie de vision-2, sortie dans vision-3), `vision-3/reprise.cjs` (reprise 18 et 38). Journaux : `journal-d1280-{clair,sombre}.txt`, `erreurs-d1280-{clair,sombre}.txt`, `reprise-{clair,sombre}.log`.

Constat de base : `CRITIQUE-2.md` est absent du dossier `2026-11-17-port-carnet` (comme noté en vision-2). Les constats repris sont ceux de `vision-1/RAPPORT-d1280.md` (1 à 7), et les défauts relevés en vision-2.
Non joué au banc, à l'image : `CARNET-CLAV` (39) n'est pas dans le rejeu. Les états 31, 46, 47, 48, 56, 57 demandent `?dev-local` : non lancé ici.
Dossier vision-3 : 122 captures `m390-*` (61 clair, 61 sombre) s'y trouvent, elles ne viennent pas de ce rejeu ; non touchées.

Ouvert = image ouverte et regardée. « non ouvert » = fichier produit, geste joué sans ECHEC de script, agit non vérifié à l'image.

## États (n° du § Vérification) → fichier → ce qui se voit → agit

| État | Fichier clair (sombre) | Ce qui se voit | Agit | Ouvert |
|---|---|---|---|---|
| 1 liste au repos | `d1280-clair-01-liste-repos.png` (`d1280-sombre-01-liste-repos.png`) | Carnets 4, À comparer 1, Idée 1, Choisi 2, En veille 3 ; champ en bas. Sombre : onglet Carnets en ambre, lisible | n/a | clair oui, sombre oui |
| 2 liste vide | `…-02-liste-vide.png`, `…-02b-liste-vide-exemple.png` | non ouvert | n/a | non |
| 3 créer · avant | `…-03-creer-avant.png` | champ « Une idée, un besoin… » focus | n/a | non |
| 4 créer · pendant, proche | `…-04-creer-pendant-proche.png` | cadre « Nouveau carnet · Idée », titre tapé au clavier, « Déjà un carnet proche : Évier inox », « Y ajouter en façon », « arrive ici » | oui (cadre apparaît à la frappe) | oui (clair) |
| 5 pendant, aucun proche | `…-05-creer-pendant-aucun-proche.png` | non ouvert | non vérifié | non |
| 6 pendant, « Ce qui compte » | `…-06-creer-pendant-ce-qui-compte.png` | non ouvert | non vérifié | non |
| 7 créer · après | `…-07-creer-apres.png` | « ✓ Carnet créé, en tête des Carnets · Annuler », phrase en titre, carnet ouvert (Moulin à malt) ; la v2 sans bandeau est corrigée | oui | oui (clair) |
| 8 après, annulé | `…-08-creer-apres-annule.png` | non ouvert | non vérifié | non |
| 9 carnet ouvert | `…-09-carnet-ouvert.png` | non ouvert | non vérifié | non |
| 10 ajouter · avant | `…-10-ajouter-avant-bulle.png` | non ouvert | non vérifié | non |
| 11 texte · pendant | `…-11-texte-pendant-g9.png` | non ouvert (cadre et puces non relevés) | non vérifié | non |
| 11b texte · envoyé | `…-11b-texte-pendant-g9-envoye.png` | « ✓ Rangé ici, à l'instant · Annuler », « votre phrase : « fond de bac 38 cm minimum » », « Un fût de 30 L couché entre dans le bac », carnet Évier inox | oui | oui (clair) — c'est l'état 13, pas 11 |
| 12 doublon · pendant | `…-12-doublon-pendant.png` | non ouvert | non vérifié | non |
| 12b doublon · « Garder à part » | `…-12b-doublon-garder-a-part.png` | ECHEC script : « Garder à part » absent ; capture non conforme | non (geste non joué) | non |
| 13 texte · après | `…-13-texte-apres-range.png` | non ouvert ; l'état est vu sur 11b | non vérifié | non |
| 14 depuis liste | `…-14-texte-depuis-liste-pendant.png`, `…-14b-…-apres.png` | non ouvert | non vérifié | non |
| 15 lien · avant | `…-15-lien-avant-coller.png` | non ouvert | non vérifié | non |
| 16 lien · pendant | `…-16-lien-pendant.png` | cadre « Arrive ici, dans Articles · exemple.test/zz-test-hotte-3 · ✻ lecture de la page… », « nom, prix, photo, cotes : rien d'affiché avant d'être lu », titre = « ZZ TEST — Ventilation de la salle de brassage » (plus l'URL brute, constat 3 vision-1 corrigé) | oui | oui (clair) |
| 17 lien · collé depuis liste | `…-17-lien-colle-liste-pendant.png` | non ouvert | non vérifié | non |
| 18 lien · après, carte | `…-18-lien-apres-carte.png` (5 s) : toujours « lecture de la page » ; `d1280-clair-r2-18-lien-apres-r2.png` (20 s) : carte rangée, « Ce qui compte, tiré de votre phrase », 3 façons, « Articles 5 lus, 2 sans aperçu », tableau Comparer | le 1er rejeu n'attend pas la fin de lecture (5 s insuffisants) ; en reprise, la carte est complète. Le bandeau « Rangé dans… · Annuler » n'est pas dans le cadre de la capture | oui après 20 s (clair) ; à reprendre en sombre | oui (clair r2) |
| 19 2e lien · après | `…-19-lien-2e-apres.png` | non ouvert | non vérifié | non |
| 20 lien collé depuis liste · après | `…-20-lien-colle-liste-range-dans.png` | non ouvert | non vérifié | non |
| 21 lien illisible | `…-21-lien-illisible.png` | non ouvert | non vérifié | non |
| 22 note en vrac · pendant | `…-22-note-vrac-pendant.png` | non ouvert | non vérifié | non |
| 23 note en vrac · après | `…-23-note-vrac-apres.png` | non ouvert | non vérifié | non |
| 24 notes ref/ rangées | `…-24-notes-ref-rangees.png` | non ouvert | non vérifié | non |
| 25 cartes d'article | `…-25-cartes-article.png` | non ouvert | non vérifié | non |
| 26 article ouvert, veille | `…-26-article-ouvert-veille-eteinte.png`, `…-26b-article-veille-allumee.png`, `…-26c-retour-carnet.png` | non ouverts | non vérifié | non |
| 27 comparer · critère | `…-27-comparer-critere.png` | « Côte à côte 5 », « rangé par : tient 80 °C d'abord, puis le débit », 4e « moins bien partout », colonne « écarté » avec « Ventilateur de plafond écartée : brasse la buée sans la sortir », bouton « Choisir » | oui | oui (clair) ; sombre non |
| 27b comparer · défilé | `…-27b-comparer-defile.png` | non ouvert | non vérifié | non |
| 28 choisir · pourquoi | `…-28-choisir-pourquoi.png`, `…-28b-choisi.png` | ECHEC script (sélecteur « Pourquoi ce choix » absent) : la feuille « Pourquoi » n'est pas relevée | non (geste non joué) | non |
| 29 choix revu | `…-29-choix-revu.png` | ECHEC script (bouton Choisir absent) | non | non |
| 30 envoyer dans À venir | `…-30-envoyer-a-venir.png` | non ouvert ; l'état À venir (pastille « À venir · … » sur carnet Frigo) se voit sur d1280-clair-38 | non vérifié | non |
| 31 Réalisés | non joué (dev-local) | — | — | — |
| 32, 32b, 32c note · modifier | `…-32-note-feuille.png`, `…-32b-…-pendant.png`, `…-32c-…-apres.png` | non ouverts | non vérifié | non |
| 33 modifier, aide IA | `…-33-note-aide-ia.png` | non ouvert | non vérifié | non |
| 34, 34b, 34c, 34d renommer | `…-34-renommer-avant.png`, `…-34b…`, `…-34c…`, `…-34d-renomme-annule.png` | non ouverts | non vérifié | non |
| 35 supprimer note · menu | `…-35-supprimer-note-menu.png` | non ouvert | non vérifié | non |
| 35b, 35c note supprimée · annulée | `…-35b…`, `…-35c…` | ECHEC script (« Supprimer » dans menuitem absent) | non | non |
| 36 supprimer idée · confirmation | `…-36-supprimer-idee-confirm.png` | « Supprimer le carnet Évier inox ? », « Il est vide. », « ni dans À venir, ni en commande » ; Garder plein, Supprimer en contour rouge ; champ et + atténués | oui (confirmation apparaît) ; « Supprimer allumé » non net à l'image | oui (clair) |
| 36b veille · Déplacer | `…-36b-supprimer-idee-veille-deplacer.png` | non ouvert | non vérifié | non |
| 37, 37b carnet supprimé · annulé | `…-37-carnet-supprime.png`, `…-37b…` | non ouverts | non vérifié | non |
| 38 suppression, idée liée | `…-38-supprimer-idee-liee.png` (1er rejeu : ouvre le carnet, pas le confirm) ; reprise `d1280-clair-r2-38a-menu-frigo-ouvert.png` (menu : Renommer, Supprimer l'idée) et `d1280-clair-r2-38b-supprimer-idee-liee-confirm.png` | reprise : « Supprimer le carnet Frigo de garde pour fûts ? Il part avec 4 articles, 2 façons et 1 note », « 1 lien le retient », « À venir · ZZ TEST — Frigo… », « Garder le plan sans ce carnet » (contour), Supprimer en contour gris, Garder plein ; choix Chambre froide grisé | oui après reprise (clair) | oui (clair r2) ; sombre `d1280-sombre-r2-38b-…` non ouvert |
| 39 clavier ouvert, 300 px | non joué (hors rejeu) | — | — | — |
| 40, 40b IA en cours | `…-40-ia-en-cours.png`, `…-40b-ia-en-cours-annulee.png` | non ouverts | non vérifié | non |
| 41 IA en échec | `…-41-ia-echec.png` | non ouvert | non vérifié | non |
| 42 IA éteinte | `…-42-ia-eteinte.png` | non ouvert | non vérifié | non |
| 43 hors ligne | `…-43-hors-ligne.png` | non ouvert | non vérifié | non |
| 44 photo non lue | `…-44-photo-non-lue.png` | non ouvert | non vérifié | non |
| 45 dictée | `…-45-dictee.png` | non ouvert | non vérifié | non |
| 46 + volant | non joué (dev-local) | — | — | — |
| 47 Stocks › Matériel | non joué (dev-local) | — | — | — |
| 48 CARNET-COEUR | non joué (dev-local) | — | — | — |
| 49 garder le plan sans ce carnet | `…-49-garder-plan-sans-carnet.png`, `…-49b-carnet-supprime-plan-garde.png` | ECHEC script (« Garder le plan sans ce carnet » non cliqué sur la voie du 1er rejeu) ; la reprise 38b montre le bouton, non cliqué | non | non |
| 50 réalisé, archiver | `…-50-realise-archiver.png` | ECHEC script (`.cn-carnet-corps` absent) | non | non |
| 51, 51b, 51c aides éteintes | `…-51-aides-eteintes-feuille.png`, `…-51b…`, `…-51c…` | non ouverts | non vérifié | non |
| 52, 52b, 52c comparer 1 et 2 articles | `…-52-comparer-1-article.png`, `…-52b…`, `…-52c-comparer-2-tableau.png` | non ouverts | non vérifié | non |
| 52d écarter, raison | `…-52d-ecarter-raison.png` | ECHEC script (« Écarter » absent) | non | non |
| 53 page de choix voie E | `…-53-page-voie-E.png` | non ouvert (page hors banc) | non vérifié | non |
| 54, 54b bandeau de tâches | `…-54-taches-bandeau.png`, `…-54b-taches-premiere.png` | non ouverts | non vérifié | non |
| 55, 55b pastille « lié à » | `…-55-pastille-lie-a.png`, `…-55b-pastille-apercu.png` | non ouverts | non vérifié | non |
| 55c sans lien, sans pastille | `…-55c-sans-lien-sans-pastille.png` | ECHEC script (carnet « Ventilation » absent de la liste) ; capture sur la liste du Frigo | non | non |
| 56, 57 calendrier | non joués (dev-local) | — | — | — |

## Constats (vision-1 1 à 7, et défauts vision-2)

1. Créer · après : bandeau et carnet visibles (7) — corrigé.
2. Lien · après (18) : lecture non finie à 5 s ; à 20 s, carte complète (r2-18). Bandeau « Rangé dans … » non vu à l'image — à confirmer. Partiel.
3. Lien · pendant (16) : titre = nom du carnet, plus l'URL brute — corrigé.
4. Texte · pendant (11) : puces « Va dans » non relevées à l'image (11 non ouvert) — non vérifié.
5. Comparer (27) : écarté visible, ligne « Écarté » et « moins bien partout » — corrigé. Reste : 5e article affiché « exemple.invalid » (domaine seul), comme en vision-2.
6. Supprimer une idée (36) et liée (38) : geste joué ; 36 confirmé, 38 après reprise ; « Garder à part », « Supprimer » de note, « Renommer » ... non joués (10 échecs).
7. 46 des 60 fichiers non regardés : ici 12 ouverts sur 158 (voir ci-dessous).

## Ce qui reste douteux

- 10 gestes en ECHEC de script, dans les deux thèmes : 12b, 28, 29, 35b, 35c, 49, 49b, 50, 52d, 55c. Leurs captures ne montrent pas l'état voulu. Non refaites : à corriger dans `rejeu-banc.cjs` (sélecteurs).
- 6 états dev-local non lancés : 31, 46, 47, 48, 56, 57 ; 39 hors rejeu.
- 18 : la lecture de la page dépasse 5 s ; le rejeu d'origine capturait avant la fin.
- Sombre : 1 capture ouverte (01), plus `d1280-sombre-r2-38b` non ouverte (nom erroné en lecture). Les autres sombres n'ont pas été regardés.
- « Supprimer allumé » (36, 38) : le contraste du bouton Supprimer est faible à l'image ; à juger en pleine taille.
- Captures non ouvertes : une capture non regardée ne valide pas l'interface.

## Erreurs console

- Clair : 0 `console.error` / `pageerror` ; 11 ECHEC de script (10 gestes + 38 avant reprise). Journal : `erreurs-d1280-clair.txt`.
- Sombre : 0 `console.error` / `pageerror` ; 11 ECHEC de script (mêmes). Journal : `erreurs-d1280-sombre.txt`.
- Requêtes coupées : 0 (clair et sombre).
- Log `vite` : imports non résolus dans `prototypes/houblons-v4` (hors carnet), non bloquant : `vite-5293.log`.
