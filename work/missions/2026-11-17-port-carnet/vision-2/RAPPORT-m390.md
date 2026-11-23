# Vision m390 — carnet, passe 2 (17.11)

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (HEAD 0fea5f478). `npm run build` relancé : EXIT 0 ; drapeaux OK (`VITE_HOP_V4`, `VITE_ENRICHISSEMENT_IA`, `VITE_RANGER_NOTE_IA`).

Banc : `vite` (dev) sur `http://127.0.0.1:5417`, `?preview=carnets&theme=clair|sombre`. Écart au § Vérification : pas `vite preview`, parce que le banc et l'IA simulée n'existent qu'en dev (`src/main.tsx`, `src/config/carnetIA.ts`). Variables Firebase factices (projet `demo-banc-local`, émulateurs), sans `.env`. Aucun appel Gemini. Données « ZZ TEST — … » tapées au clavier. Puppeteer-core, Chrome, 390×844, `isMobile`, `hasTouch`, DPR 2, tap réel.

Scripts et journaux (hors dépôt) : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/vision-m390-2.mjs`, `…/vision-m390-2-suite.mjs`, journaux `vision2-journal-clair.txt`, `vision2-journal-sombre.txt`, `vision2-journal-suite.txt` (même dossier).

CRITIQUE-1.md : introuvable (recherche `*CRITIQUE*` dans la mission et le worktree). Je ne peux donc pas dire si ses problèmes sont corrigés.

Dossier : le dossier `vision-2/` contenait déjà des `d1280-clair-*` (23:44, écriture d'une autre passe pendant la mienne). Les `m390-clair-*` d'une passe antérieure que j'avais vus à 23:05-23:23 n'y étaient plus à mon relevé. Mes `m390-<thème>-<nn>-<état>.png` portent des noms qui ont pu écraser des fichiers de même nom.

## États (n° du § Vérification) → fichier → ce qui se voit → agit

Fichiers clair ; sombre = même nom avec `sombre`. « Ouvert » = capture ouverte et regardée.

| n° | état | fichier | ce qui se voit | agit ? |
|---|---|---|---|---|
| 01 | liste au repos | m390-clair-01-liste-repos (ouvert) | bandeau « Banc — données simulées » ; segments À venir 1 / Carnets 4 / Réalisés 0 ; À comparer 1, Idée 1 (« Coller un lien »), Choisi 2 (« Dans À venir depuis le 16 nov. »), En veille 3 ; champ « Une idée, un besoin… » en bas | n/a |
| 02 | liste vide | m390-clair-02-liste-vide | non ouverte ; journal : chargement fini, `vide=1` | non jugé |
| 03 | créer · avant | m390-clair-03-creer-avant | non ouverte ; journal : champ pris au toucher | non jugé |
| 04 | créer · pendant (proche) | m390-clair-04-creer-pendant ; sombre ouvert | cadre tireté « Nouveau carnet · Idée · arrive ici », titre tapé en gras, bulle « Déjà un carnet proche : Ventilation de la salle de brassage » et « Y ajouter en façon » ; saisie visible | oui (apparaît à la frappe) ; voir problème 1 |
| 07 | créer · après | m390-clair-07-creer-apres (ouvert) | bandeau « ✓ Rangé dans Frigo de garde pour fûts, à l'instant · Annuler », « votre message : « … » » ; pas de « ✓ Carnet créé » | oui ; écart au contrat (problème 1) |
| 08 | créer · après, Annuler | m390-clair-08-creer-apres-annule | non ouverte ; journal : bandeau parti, liste initiale | texte seul |
| 09 | carnet ouvert | m390-clair-09-carnet-ouvert | non ouverte ; le carnet s'ouvre (vu en 10) | texte seul |
| 10 | ajouter · avant | m390-clair-10-ajouter-avant (ouvert) | carnet Ventilation défilé : le haut du contenu passe sous la barre de segments, sans fondu ; champ « Ajouter à Ventilation de la s… » avec curseur | oui (focus) ; voir problème 6 |
| 11 | texte · pendant | m390-clair-11-texte-pendant (ouvert) | bulle G8 « Le critère « plus de condensation au plafond » peut trancher entre Hotte inox + extracteur et Extracteur mural seul » ; « Va dans » (Ce qui compte, Note sélectionné, Façon) ; bouton Ajouter | oui (bulle à la frappe) ; le cadre G10 « va atterrir ici » n'est pas dans le cadre |
| 13 | texte · après | m390-clair-13-texte-apres | non ouverte ; journal : carnet mis à jour | texte seul |
| 15 | lien · avant | m390-clair-15-lien-avant-frappe | non ouverte ; journal : URL tapée | non jugé |
| 16 | lien · pendant | m390-clair-16-lien-pendant ; sombre ouvert | déjà « ✓ Rangé dans Ventilation de la salle de brassage · Annuler », « exemple.test », message du lien ; pas de squelette ni de puces de progression | partiel : la lecture finit avant la capture (problème 3) |
| 18 | lien · après, carte | m390-clair-18-lien-apres (ouvert) | identique à 16 ; la carte complète n'est pas dans le cadre | non : état non atteint (problème 3) |
| 22 | note en vrac · pendant | m390-clair-22-note-vrac-pendant ; sombre ouvert | cadre « Votre note, découpée sur place : 3 lignes, 3 carnets » ; 3 lignes « note » : → Évier inox ; « aucun carnet proche » ; → Ventilation ; « Va dans : selon chaque ligne » ; « Texte d'origine » | oui ; voir problème 2 |
| 23 | note en vrac · après | m390-clair-23-note-vrac-apres (ouvert) | « ✓ Rangé dans Évier inox, à l'instant · Annuler » ; les 3 lignes dans un seul bandeau ; Ventilation et Évier inchangés | oui (bandeau) ; la découpe n'est pas appliquée (problème 2) |
| 27 | comparer | m390-clair-27-comparer | non atteint : le geste a touché la pastille « À comparer », capture = liste | non (problème 4) |
| 30 | À venir | m390-clair-30-a-venir | non ouverte ; journal : « Besoin · PROCHAIN ACHAT · ZZ TEST — Frigo de garde pour fûts 4 900 CHF » | texte seul |
| 31 | Réalisés | m390-clair-31-realises | non ouverte ; journal : « Archives · Tes projets réalisés… » | texte seul |
| 36 | supprimer une idée | m390-clair-36-supprimer-idee (ouvert, reprise par menu « Plus ») | feuille « Supprimer le carnet Ventilation de la salle de brassage ? Il part avec 6 articles, 3 façons et 2 notes. » ; « ni dans À venir, ni en commande » ; « Supprimer » (rouge, contour) et « Garder » (noir) | oui (Plus → Supprimer ouvre la confirmation) ; cas G34 (champ et + grisés) non vérifié |
| 39 | clavier ouvert, 544 px | m390-clair-39-clavier-544 (ouvert) | liste et non carnet ouvert ; champ « Une idée » avec curseur en bas ; la dernière note n'est pas visible | partiel (problème 7) |
| 41 | IA en échec | m390-clair-41-ia-echec ; sombre ouvert | « ✓ Carnet créé, en tête des Carnets · Annuler » ; « L'IA n'a pas répondu : rangé sur place, rien n'est perdu. » ; « Ce qui compte · rien encore », « Façons · aucune », « Articles · aucun : collez un lien » | oui |
| 42 | IA éteinte | m390-clair-42-ia-eteint | non ouverte ; journal : carnet créé (compteur 5) | texte seul |
| 43 | hors ligne | m390-clair-43-hors-ligne | non ouverte ; journal : carnet « Idée · 17 nov. » créé | texte seul |
| 46 | + volant « Nouvelle idée » | m390-clair-46-plus-volant | non joué : le + volant n'est pas dans le banc (App, `?dev-local`) ; capture = liste | non |
| 51 | aides éteintes | m390-clair-51-aides-eteintes | non ouverte ; journal : rangé sans aide | texte seul |
| 54 | bandeau de tâches | m390-clair-54-taches | non ouverte ; journal : « Tâche 1 / 5 · Créer « embouteillage » 0.0 s · 0 geste · ✓ Fait » | texte seul |

Sombre : même parcours et mêmes fichiers. Ouverts : 04, 16, 22, 41. Sombre 36 (capture faite) non ouverte.

## Problèmes (clair, numérotés ; sombre pareil sauf mention)

1. Cible incohérente : 04 propose « Ventilation de la salle de brassage » ; après Entrée (07), la phrase va dans « Frigo de garde pour fûts », et le bandeau dit « Rangé dans », non « Carnet créé ». À vérifier : pilote ou fixture.
2. Découpe non appliquée à l'envoi : 22 annonce « 3 lignes, 3 carnets » avec deux cibles et une ligne « aucun carnet proche » ; 23 range les trois lignes dans « Évier inox ». Le compteur « 3 carnets » ne correspond pas à 2 cibles. La ligne 2 répète son titre.
3. États non atteints : la lecture de lien (16) finit avant la capture, sans squelette ; 18 n'a pas la carte complète.
4. Gestes non atteints : Comparer (27) ouvre la pastille « À comparer » ; le + volant (46) est hors banc.
5. Contrôle à faire : après création, la veille et la date de relève ne sont pas vues (non ouvertes).
6. Défilement : en 10, 11 et 36, le haut du contenu passe sous la barre de segments sans fondu. À juger : est-ce voulu ?
7. 39 : à 544 px, la liste s'affiche au lieu du carnet ouvert ; la dernière note n'est pas dans le cadre.

## Erreurs

- Console (error et warning) : 0 en clair, 0 en sombre (journaux `vision2-journal-*.txt`).
- `pageerror` : 0.
- Une passe précédente, sans les variables Firebase factices, affichait « Impossible de charger la brasserie » (console : `auth/invalid-api-key`). Corrigé par les variables factices ; hors de cette passe.

## Bilan

- États captés : 26 sur 57 (01 à 54 du § Vérification, sans 05, 06, 12, 14, 17, 19, 20, 21, 24, 25, 26, 28, 29, 32, 33, 34, 35, 37, 38, 40, 44, 45, 47, 48, 49, 50, 52, 53, 55, 56, 57).
- Captures : 52 (26 par thème).
- Ouvertes et regardées : 17 (clair 13 ; sombre 4).
- Erreurs console : 0.
- Non joués ou non atteints : 27, 46 ; 18 et 16 sans l'état voulu.
