# Vision m390 — carnet, passe 3 (18.11)

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (HEAD a5ca204b1, « Port carnet : correction tour 2 »). `npm run build` lancé car `dist/` (00:40) était plus vieux que le dernier commit (01:09) : EXIT 0, drapeaux OK.

## Écarts au brief (à lire d'abord)

1. **Pas de `vite preview`.** Le build de production ne lance pas le banc : `src/config/carnetIA.ts` met l'IA simulée et `&ia=`, `&aides=`, `&hors-ligne=` derrière `import.meta.env.DEV`. Essai fait : `vite preview` sur 5471 répond 200 mais affiche « Impossible de charger la brasserie » (Firebase : `Configuration absente`, 130 erreurs console en clair, 126 en sombre). Banc relancé en `vite` (dev) sur 5472, avec des variables `VITE_FIREBASE_*` factices passées en ligne de commande (projet `demo-banc-local`, pas de `.env`). Aucun appel Gemini. Serveurs arrêtés ensuite.
2. **`CRITIQUE-2.md` n'existe pas** dans la mission ni dans le worktree (même constat que `corr2-corr2-L1-fil-rangement/RESULTAT.md`). Je ne peux donc pas dire si ses problèmes sont corrigés. Les problèmes listés plus bas sont ceux que j'ai vus, numérotés ici (P1 à P10). Ils ne remplacent pas CRITIQUE-2.
3. **Non joués, faute de route dans le banc** : 53 (page de choix voie E), 56 et 57 (Calendrier, dev-local seulement). Non scriptés : 20 (lien collé depuis la liste après lecture). 29, 49, 50 : aucune fixture de choix revu, de lien À venir sur Ventilation ni de plan réalisé.
4. **Icônes sans texte** (✕ de la lecture, 📷, 🎤) : tapées par coordonnées. Le sélecteur de fichier et la dictée sont natifs : rien ne se voit dans Chrome headless.
5. Les captures sont prises après remise en haut de page (`scrollTop = 0`). Une première passe montrait certains carnets à mi-hauteur ; la deuxième passe remplace les fichiers de même nom.

## Captures

- Dossier : `work/missions/2026-11-17-port-carnet/vision-3/`, préfixe `m390-<thème>-<nn>-<état>.png`.
- 67 fichiers par thème, 134 au total. Certains doublons de nommage (ex. 12b, 26b, 37b) ne sont pas tous des états distincts.
- Journaux : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/vision4-journal-clair.txt` et `…/vision4-journal-sombre.txt` (script `vision-m390-4.mjs`).
- Ouvertes et regardées : 04 (clair et sombre), 07, 08, 10, 11, 18, 22, 23, 26, 27, 28, 36 (clair et sombre), 37, 40, 44, 45, 46. Les autres fichiers sont produits, mais je ne les ai pas ouverts : leur verdict dit « non ouvert ».

## État → fichier → ce qui se voit → agit

Légende : oui / non / non vérifié. « Ouvert » = capture regardée.

| n° | État | Fichier (clair) | Ce qui se voit | Agit |
|---|---|---|---|---|
| 01 | liste au repos | m390-clair-01-liste-repos | non ouvert ; texte : 4 carnets, À comparer 1 | non vérifié |
| 02 | liste vide | m390-clair-02-liste-vide | non ouvert ; texte : « Aucun carnet encore » | non vérifié |
| 03 | créer · avant | m390-clair-03-creer-avant | non ouvert | non vérifié |
| 04 | créer · pendant | m390-clair-04-creer-pendant (et sombre) | **ouvert** : champ tapé au clavier (phrase, lien, prix) ; cadre « Nouveau carnet · Idée — arrive ici » ; « Déjà un carnet proche : Ventilation » et « Y ajouter en façon » | oui (rangée proche apparaît pendant la frappe) |
| 05 | créer · sans carnet proche | m390-clair-05 | non ouvert ; texte : « Déjà un ca… » encore affiché pour « tabouret inox » | **non** : état voulu non atteint (P9) |
| 06 | créer · « Ce qui compte » | m390-clair-06 | non ouvert ; « Ce qui compte » n'apparaît qu'après création | non vérifié |
| 07 | créer · après | m390-clair-07 | **ouvert** : « ✓ Carnet créé, en tête des Carnets · Annuler » ; phrase citée « votre phrase en titre » ; « Arrive ici, dans Articles », squelette « lecture de la page… » | oui ; titre = phrase brute (P1) |
| 08 | créer · après, annulé | m390-clair-08 | **ouvert** : « Annuler » non effectif, carnet encore là (Carnets 5). Le tap a échoué (nœud détaché après re-rendu) | **non** : état non atteint (P8) |
| 09 | carnet ouvert | m390-clair-09 | ouvert (passe 1, à mi-hauteur) : « buées au-dessus de la cuve », Façons, Articles, tableau. Passe 2 non ouverte | non vérifié |
| 10 | ajouter · avant | m390-clair-10 | **ouvert** : champ « Ajouter à Ventilation… » focus ; bulle « Le critère « plus de condensation au plafond » peut trancher entre Hotte inox + extracteur et Extracteur mural seul », picto local | oui |
| 11 | texte · pendant | m390-clair-11 | **ouvert** : cadre « ↓ va atterrir ici · tiré de votre phrase » avec le texte tapé ; puces « Va dans » (Ce qui compte, Note sélectionné, Façon) | oui ; « Va dans » coupé sur deux lignes (P6) |
| 12 | texte · doublon | m390-clair-12 | non ouvert | non vérifié |
| 12b | doublon · garder à part | — | « Garder à part » introuvable : état non atteint | non |
| 13 | texte · après | m390-clair-13 | non ouvert | non vérifié |
| 14 | texte depuis la liste | m390-clair-14 | non ouvert ; texte : « Nouveau carnet · Idée arrive ici » | non vérifié |
| 15 | lien · avant | m390-clair-15 | non ouvert | non vérifié |
| 16 | lien · pendant | m390-clair-16 | non ouvert ; texte : lien en clair suivi de la phrase | non vérifié |
| 17 | lien depuis la liste | m390-clair-17 | non ouvert ; texte : « Arrive ici, dans Articles · exemple.test/ZZ-TEST-pompe » | non vérifié |
| 18 | lien · après (carte complète attendue) | m390-clair-18 | **ouvert** après 7 s : « Lien sans aperçu · exemple.test · page non lue · Ouvrir » ; titre = URL + phrase brute ; pas de carte complète, pas de veille | **non** : la lecture ne rend pas la carte (P2) |
| 19 | lien · 2e après | m390-clair-19 | non ouvert | non vérifié |
| 20 | lien · collé depuis la liste, « Rangé dans » | — | non scripté | non joué |
| 21 | lien illisible | m390-clair-21 | non ouvert | non vérifié |
| 22 | note en vrac · pendant | m390-clair-22 | **ouvert** : « Votre note, découpée sur place : 3 lignes, 3 carnets » ; lignes typées « note » ; « Va dans : selon chaque ligne » ; « Texte d'origine » | oui |
| 23 | note en vrac · après | m390-clair-23 | **ouvert** : « ✓ 3 lignes rangées dans 3 carnets · Annuler » ; « Texte d'origine » | oui ; « 3 carnets » au lieu de « 2 » de R19 (P3) |
| 24 | note brute collée | m390-clair-24 | non ouvert ; texte : « Idée · 18 nov. » | non vérifié |
| 25 | cartes d'article | m390-clair-25 | non ouvert | non vérifié |
| 26 | article ouvert | m390-clair-26 | **ouvert** : « Hotte inox 120 cm + moteur », offre Inox Broye 2 600, caractéristiques (exemple), bascule « Veille du prix, tous les 3 jours » éteinte, « Choisir · Inox Broye » | oui (navigation) ; sombre non ouvert |
| 26b | article · veille après | m390-clair-26b | non ouvert | non vérifié |
| 27 | comparer sur le critère | m390-clair-27-comparer (sombre non ouvert) | **ouvert** : « Côte à côte 5 », « rangé par : tient 80 °C d'abord, puis le débit », colonnes 1re, 2e, 3e ; « Écarté » vide ; « Choisir » | oui ; tableau coupé à droite (P4) |
| 28 | choisir, pourquoi | m390-clair-28-choisir | **ouvert** : feuille « Choisir chez Inox Broye », champ « une phrase suffit », « Écarter », « Part dans À venir : 2 600 CHF… » | oui ; 5e ligne sans nom ni prix (P5) |
| 29 | choix revu (ADR) | — | non joué : aucune fixture | non joué |
| 30 | À venir | m390-clair-30-a-venir | non ouvert ; texte : « Besoin PROCHAIN ACHAT D'abord · prix trouvé » | non vérifié |
| 30b | envoyer dans À venir | — | « Envoyer dans » introuvable : état non atteint | non |
| 31 | Réalisés | m390-clair-31-realises | non ouvert ; texte : « Archives · Tes projets réalisés » | non vérifié |
| 32 | menu d'une note, avant | m390-clair-32-menu-ouvert-avant | non ouvert | non vérifié |
| 33 | modifier une note avec l'IA | — | « Modifier » introuvable | non |
| 34 | renommer · pendant | m390-clair-34-renommer-pendant | non ouvert ; texte : « Se renomme ici · titre du carnet ✻ proposé d'après » | non vérifié |
| 34b | renommer · annulé | m390-clair-34b | non ouvert | non vérifié |
| 35 | note supprimée | m390-clair-35-note-supprimee | non ouvert | non vérifié |
| 35b | note supprimée · annuler | — | « Annuler » introuvable | non |
| 36 | supprimer une idée | m390-clair-36 (et sombre) | **ouvert** : « Supprimer le carnet Ventilation de la salle de brassage ? Il part avec 6 articles, 3 façons et 2 notes… », « ni dans À venir, ni en commande », « Supprimer » (contour rouge), « Garder » (noir) | oui |
| 37 | carnet supprimé | m390-clair-37-carnet-supprime | **ouvert** : bandeau « Carnet supprimé · Ventilation de la salle de brassage · Annuler », « À comparer 0 » | oui |
| 37b | carnet supprimé · annuler | m390-clair-37b | non ouvert | non vérifié |
| 38 | suppression v2, lien qui retient | — | même flux que 36 ; aucune fixture de lien : non atteint | non |
| 39 | clavier ouvert, 544 px | m390-clair-39-clavier-544 | non ouvert | non vérifié |
| 40 | IA en cours (`&ia=lent`) | m390-clair-40-ia-en-cours | **ouvert** : 500 ms après Entrée, carnet déjà créé, chip violet « ✻ … ✕ » ; le ✻ en cours n'est pas distinct de l'état fini | partiel (P10) |
| 40b | IA en cours, ✕ | — | ✕ sans texte accessible | non joué |
| 41 | IA en échec | m390-clair-41-ia-echec | non ouvert ; texte : « ✓ Carnet créé · Annuler » | non vérifié |
| 42 | IA éteinte | m390-clair-42-ia-eteint | non ouvert | non vérifié |
| 43 | hors ligne | m390-clair-43-hors-ligne | non ouvert ; texte : « Idée · 18 nov. » | non vérifié |
| 44 | photo 📷 | m390-clair-44-photo-non-lue | **ouvert** : liste inchangée (sélecteur natif, rien à voir) | non visible (P7) |
| 45 | micro 🎤 | m390-clair-45-micro-dictee | **ouvert** : liste inchangée | non visible (P7) |
| 46 | + volant | m390-clair-46-plus-volant (sombre non ouvert) | **ouvert** : feuille « Partout » / « Sur Carnets » ; « Nouvelle idée » en tête ; Écriture, Facture, Vente, Recette, Brassin, Compagnon ; X | oui |
| 47 | Stocks › Matériel, segments | m390-clair-47-stocks-materiel-segments | non ouvert | non vérifié |
| 48a/b/c | scénario de zéro, ventilation, évier | m390-clair-48a/48b/48c | non ouvert ; texte : « Idée · 18 nov. ZZ TEST — frigo de garde… » | non vérifié |
| 49 | suppression v2, compteur | — | non joué (pas de lien) | non joué |
| 50 | plan réalisé, « Archiver » | — | non joué (pas de plan réalisé lié) | non joué |
| 51 | aides éteintes (`&aides=0`) | m390-clair-51-aides-eteintes | non ouvert | non vérifié |
| 52 | comparer, tableau | m390-clair-52-comparer-tableau | non ouvert (même geste que 27) | non vérifié |
| 53 | page de choix voie E | — | hors banc | non joué |
| 54 | banc `&taches=1` | m390-clair-54-taches | non ouvert ; texte : « Tâche 1 / 5 · Créer « embouteillage » 0.0 s · 0 geste · ✓ Fait » | non vérifié |
| 55 | pastilles « lié à » | m390-clair-55-pastilles-lie-a | non ouvert | non vérifié |
| 56 | idée du calendrier | — | dev-local seulement | non joué |
| 57 | icône d'idée en S47 | — | dev-local seulement | non joué |

Sombre : même parcours, mêmes fichiers. Ouverts : 04 et 36. Le thème sombre passe la pastille « Carnets », le + et le champ en jaune, zone Stocks (cohérent avec le clair, à juger par le critique).

## Problèmes (vus, numérotés)

1. Titre = phrase brute : 07, 08, 18. Le titre reprend l'URL et le prix (« https://exemple.test/… 189,90 CHF »), la phrase n'est pas mise en forme. À la comparaison, la ligne devient illisible.
2. Lien non lu : 18, après 7 s, reste « Lien sans aperçu · page non lue ». La carte complète (R17) n'apparaît pas, la veille non plus.
3. Découpe : 23 « 3 lignes rangées dans 3 carnets », R19 écrit « 2 carnets » (exemple de la maquette). La ligne 2 part dans « Nouveau carnet » : c'est la fixture, à vérifier avant de juger.
4. Comparer : 27 coupe la 3e colonne à droite sans indice de défilement ; « Écarté » vide.
5. Feuille « Choisir » (28) : une 5e ligne d'offre sans nom ni prix, donc vide.
6. 11 : « Va dans » coupé sur deux lignes dans la puce.
7. 44 et 45 : aucun retour visible (sélecteur de fichier et dictée natifs, non capturables).
8. 08 : le « Annuler » de la création ne s'exécute pas dans le banc (nœud détaché). État non vérifié : à rejouer, ou à juger sur un autre geste.
9. 05 : « tabouret inox » affiche encore « Déjà un carnet proche » : la fixture ou la règle « sans carnet proche » n'est pas atteinte.
10. 40 : le ✻ « en cours » n'est pas distinct du « ✓ » final dans la fenêtre de capture : l'état intermédiaire est à capturer avec un délai plus court.

Problème CRITIQUE-2 : fichier absent, pas de comparaison possible.

## Erreurs

- Console (error et warning) : 0 en clair, 0 en sombre (passe 2 avec dev et variables factices). La passe `vite preview` a donné 130 et 126 erreurs Firebase : hors sujet, c'est la configuration absente du build de preview.
- `pageerror` : 0.

## Bilan

- États du § Vérification (1 à 57) : vus ouverts et conformes 12 (04, 07, 10, 11, 22, 23*, 26, 27, 28, 36, 37, 46) ; ouverts sans effet visible ou partiels 3 (40*, 44, 45) ; ouverts non conformes 2 (08, 18) ; produits mais non ouverts 26 ; non atteints ou non joués 14 (05, 12b, 20, 29, 30b, 33, 35b, 38, 40b, 49, 50, 53, 56, 57). (* = avec réserve, voir problèmes 3 et 10.)
- Captures : 134 (67 par thème), dont 19 ouvertes et regardées.
- Erreurs console : 0.

VISION m390 12/57 états vus et conformes, 134 captures, 0 erreur console
