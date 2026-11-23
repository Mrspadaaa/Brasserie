# Vision 8, 390 tactile, clair et sombre (18.11), carnet porté

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, dernier commit 1b769bbf2 (09:21). `dist/` (09:29) plus récent : pas de build relancé.
Banc : serveur de **dev** (`npx vite --port 5483 --strictPort --force`, variables `VITE_FIREBASE_*` factices, projet `banc-factice`), et non `vite preview` : le paquet ne contient pas le banc (`count preview=carnets` = 0 dans dist). Le serveur tourne encore à la rédaction : le pilote doit l'arrêter (port 5483).
Outils : puppeteer-core (`port-carnet/node_modules`), Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`, viewport 390×844, DPR 2, `isMobile`, `hasTouch`. Scripts : `vision-8/captures-m390.mjs` (passe 1), `captures-m390-reprise.mjs` (reprise 1), `captures-m390-reprise2.mjs` (reprise 2). Journaux : `journal-m390.txt`, `journal-m390-reprise.txt`, `journal-m390-reprise2.txt`.
Données : fixture « ZZ TEST — … », IA simulée (`&ia=…`), réseau Firebase/Google coupé. Rien n'est écrit hors du banc en mémoire. Non joué : `?dev-local` (émulateurs coupés, voir 47).

Captures : 180 écrites par ces trois passes, 90 par thème, nommées `m390-<thème>-<nn>-<état>.png`. Note : `vision-8/` contient déjà 168 fichiers `d1280-*` et des `m390-*` d'un autre processus, écrits pendant la passe ; je n'ai pas pu séparer ces fichiers à coup sûr, donc je ne revendique que les 180 du journal.
Ouvertes et regardées : 17 (clair 01, 02, 07, 09, 11, 18, 23, 27, 38, 38b, 26b, 46b, 47, 49, 49c ; sombre 18, 26b). Les autres sont capturées, **non ouvertes** : elles ne valident rien. « Agit » = hachage avant/après différent (journal), pas une lecture visuelle.

## Méthode, défauts du test (à lire avant les constats)

- Un champ multi-lignes tapé avec `\n` envoie chaque ligne à la touche Entrée. La note en vrac (22, 23) n'a donc **pas** été testée comme une seule note : le test ne tranche pas le constat CRITIQUE-7 n° 1.
- Le banc garde l'état en mémoire : toute nouvelle page repart de zéro. Un geste suivi d'une ouverture de page nouvelle ne prouve rien sur la persistance (49c de la passe 1 l'a montré : invalide, refait dans la même page).
- Libellés non trouvés dans le chemin joué (INTROUVABLE) : « Modifier », « Annuler » (35), « ✕ » (40b), « Revoir le choix » (29), « Envoyer dans À venir » sur le carnet Choisi (30), « Matériel » et « Carnets » (47 clair). Ces états ne sont pas joués.
- Vérifications texte (VU / ABSENT) : certains attendus étaient faux (ex. « Ajouter à » est le placeholder du champ, pas une rangée « quoi ? ») ; je ne les compte pas comme échecs produit.
- `?dev-local` : le serveur de dev renvoie 504 « Outdated Optimize Dep » et `StocksTab.tsx` ne charge pas ; l'écran reste « Chargement de l'écran… » (47 clair).

## États (§ Vérification, 57 numéros)

Légende : **ouvert** = capture regardée ; **texte** = seul le texte a été vérifié ; **non joué** = le geste n'a pas pu être fait ou la capture n'a pas l'état voulu.

| n° | fichier(s) | ce qui se voit | agit |
|---|---|---|---|
| 01 | clair-01-liste-repos (ouvert), sombre-01 | liste : À comparer 1, Idée 2, Choisi 3 ; « Coller un lien » ; + bas droite ; champ « Une idée, un besoin… » | n/a |
| 01b | 01b-liste-en-veille | non ouvert | non vérifié |
| 01c | 01c-veille-off-vers-on | pas d'interrupteur sur la liste (INTROUVABLE) : non joué | non |
| 02 | clair-02-liste-vide (ouvert), sombre-02 | « Carnets 0 », « arrive ici », exemples, « Une note en vrac marche aussi » ; pas de flèche | n/a |
| 03 | 03-creer-avant-focus | non ouvert | non vérifié |
| 04 | 04-creer-pendant-carnet-proche | texte « Déjà un carnet proche » : **texte** | non vérifié |
| 05 | 05-creer-pendant-aucun-proche | texte « arrive ici » : **texte** | non vérifié |
| 06 | 06-creer-pendant-ce-qui-compte | « Ce qui compte » absent du texte, deux thèmes : **texte** | non vérifié |
| 07 | clair-07-creer-apres (ouvert), sombre-07 | bandeau « Carnet créé, en tête des Carnets · Annuler », « votre phrase en titre », « Ce qui compte : rien encore : l'IA le proposera » (aucun critère tiré de « Sachets de levure ») | oui (liste 6 → 7) |
| 08 | 08-creer-apres-annule | non ouvert ; « Sachets de levure » absent après Annuler (texte) | non vérifié |
| 09 | clair-09-carnet-ouvert (ouvert) | « ZZ TEST — Ventilation », Articles 6 · Comparer, pas de rangée « quoi ? » ; champ « Ajouter à ZZ TEST… » | n/a |
| 10 | 10-ajouter-avant-bulle-g8 | bulle « peut trancher » absente du texte, deux thèmes ; non ouvert | non vérifié |
| 11 | clair-11-texte-pendant-consequence (ouvert) | cadre « ↓ va atterrir ici · tiré de votre phrase », « Ce qui compte : fond de bac 38 cm minimum », « les articles seront rangés sur le fond de bac, 38 cm au moins », « Va dans » coupée à droite ; champ tapé lu en entier | oui (conséquence apparaît à la frappe) ; le critère de la carte reste « 2 bacs » |
| 12 | 12-texte-pendant-doublon, 12b, 12c (aides 0) | non ouverts ; « Garder à part » vu en texte | non vérifié |
| 13 | 13-texte-apres-range-ici | non ouvert ; le rendu réel est celui de 23 | non vérifié |
| 14 | 14-texte-apres-depuis-liste | texte « câble de sonde » : **texte** | non vérifié |
| 15 | 15-lien-avant-focus | « Coller » absent du texte ; non ouvert | non vérifié |
| 16 | 16-lien-pendant | « lecture de la page » : **texte** | non vérifié |
| 17 | 17-lien-pendant-liste | non ouvert | non vérifié |
| 18 | clair-18-lien-apres-carte (ouvert), sombre-18 (ouvert) | « Article rangé ici, à l'instant · 1er sur 5 · tient 80 °C oui · Annuler » ; fiche Hotte inox 140 ; « lu sur la page : … tient 80 °C : oui » ; phrase citée ; bascule de veille éteinte | oui (7 articles, rang annoncé) |
| 19 | 19-2e-lien-tableau | « Pompe magnétique rangée » absent du texte ; non ouvert | non vérifié |
| 20 | 20-lien-apres-liste-range-dans | « Rangé dans » absent du texte ; non ouvert | non vérifié |
| 21 | 21-lien-illisible | « page non lue » : **texte** | non vérifié |
| 22 | 22-note-vrac-pendant | non ouvert ; test invalide (cf. Méthode) | non valide |
| 23 | clair-23-note-vrac-apres (ouvert) | carnet « hotte au-dessus de la cuve », « Rangé ici, à l'instant · Annuler », une seule ligne « résine qui tient la soude chaude » citée ; pas de « 3 lignes rangées dans 2 carnets » ; « Photos · aucune » affichée | oui, mais test invalide |
| 24 | 24-note-prochain-brassage | non ouvert | non vérifié |
| 25 | 25-cartes-article | non ouvert | non vérifié |
| 26 | 26-article-ouvert-avant | non ouvert (son hachage diffère de 26b) | non vérifié |
| 26b | clair-26b (ouvert), sombre-26b (ouvert) | fiche Hotte inox 120 cm : « Veille du prix, tous les 3 jours · demandée · pas encore relevée », bascule verte, « Choisi · Inox Broye » ; picto à la place de la photo | oui (hachage 26 ≠ 26b, bascule ON vue ; journal « SWITCH » ambigu) |
| 27 | clair-27-comparer-critere (ouvert) | « Côte à côte 4 », « classées par tient 80 °C d'abord, puis le débit, puis le prix », colonnes 1re, 2e, 3e, 4e ; « la 4e… moins bien que la 3e sur tout » ; « Retenir la hotte » | n/a (lecture) |
| 27b | 27b-comparer-defile | non ouvert | non vérifié |
| 28 | 28-choisir-pourquoi | non ouvert | non vérifié |
| 28b | 28b-pourquoi-ouvert | « Pourquoi ce choix » absent du texte ; non ouvert | non vérifié |
| 29 | 29-choix-revu | libellé introuvable : non joué | non |
| 30 | 30-frigo-choisi-avant, 30b-envoyer-a-venir | « Envoyer dans À venir » introuvable : non joué | non |
| 31 | 31-realises | non ouvert | non vérifié |
| 32 | 32-note-menu | non ouvert ; « Modifier » introuvable ensuite | non vérifié |
| 33 | 33-modifier-se-modifie-ici | « Se modifie ici » absent, « Modifier » introuvable : non joué | non |
| 33b | 33b-note-modifiee | « Note modifiée » absent : non joué | non |
| 34 | 34-renommer-idee, 34b-renommer-aides-0 | non ouverts ; « Renommer » trouvé | non vérifié |
| 35 | 35-note-supprimee, 35c | « Note supprimée » absent, « Annuler » introuvable : non joué | non |
| 36 | 36-supprimer-idee-sans-lien | « ni dans À venir, ni en commande » : **texte** | non vérifié |
| 37 | 37-carnet-supprime-liste, 37b | « Carnet supprimé » : **texte** ; non ouverts | non vérifié |
| 38 | clair-38-supprimer-1-lien-retient (ouvert) | fiche de la Ventilation (pas le Frigo) : « ni dans À venir, ni en commande », 0 lien. **Non conforme** : le param `lien-retient` ouvre le Frigo ; refait en 38b | oui (mais état faux) |
| 38b | clair-38b (ouvert), sombre-38b (texte) | Frigo : « Supprimer le carnet… Il part avec 4 articles, 1 façon, 1 façon écartée et 1 note », « 1 lien le retient », « ZZ TEST — Frigo… · plan dans À venir », « Garder le plan sans ce carnet », Supprimer en tirets grisé, Garder ; pastille « À venir · … » et « Dans À venir depuis le 16 nov. » (doublon, CRITIQUE n° 16) | oui (38 → 38b : 0 lien → 1 lien) |
| 39 | 39-clavier-300px-simule | non ouvert | non vérifié |
| 40 | 40-ia-en-cours | « ✻ » vu en texte ; non ouvert | non vérifié |
| 40b | 40b-ia-arretee | « ✕ » introuvable : non joué | non |
| 41 | 41-ia-echec | « rien n'est perdu » absent (apostrophe ?) ; non ouvert | non vérifié |
| 42 | 42-ia-eteinte | non ouvert | non vérifié |
| 43 | 43-hors-ligne-range-local | « Acheter 2 sachets » vu, « Ranger maintenant » absent : **texte** | non vérifié |
| 44 | 44-photo | effet non visible en headless | non visible |
| 45 | 45-micro-dictee | effet non visible en headless | non visible |
| 46 | clair-46-plus-volant-avant, clair-46b (ouvert) ; sombre 46b | + en bas à droite ; 46b : feuille « Actions rapides » : Écriture, Facture, Vente, Recette, Brassin, Compagnon ; « Sur Carnets » : « Nouvelle idée » en vert ; le + devient × | oui (menu ouvert, focus sur un bouton) |
| 47 | clair-47-stocks-segment-nav (ouvert) | « L'Affinée » visible en en-tête, « Chargement de l'écran… » bloqué ; sombre : « Carnets » vu en texte, non ouvert | non joué |
| 48 | 48-zero-liste-vide, 48a frigo, 48b ventilation, 48c évier, 48d | frigo et évier vus en texte ; « ventilation de la salle de brassage » absent (phrase reformulée ?) ; non ouverts | non vérifié |
| 49 | clair-49-garder-plan-appuye (ouvert) | feuille après « Garder le plan sans ce carnet » : 0 lien, « ni dans À venir, ni en commande », Supprimer plein rouge | oui (1 lien → 0 lien) |
| 49b | non capturé à part | n/a | — |
| 49c | clair-49c-meme-page (ouvert), sombre-49c (texte) | **Défaut** : À venir, même page, montre encore le Frigo « Sans date · Ajouté le 16 nov. · depuis son carnet · Ouvrir le carnet » (pas de « du carnet … · supprimé »), et le carnet apparaît aussi dans « Choisis, pas encore dans À venir · 3 » : le plan et le carnet se contredisent | oui sur la feuille ; **résultat À venir faux** |
| 50 | 50-realise-archiver-seul | « Archiver » : **texte** ; « Garder le plan sans ce carnet » absent ; non ouvert | non vérifié |
| 51 | 51-aides-eteintes | non ouvert | non vérifié |
| 52 | 52-comparer-1-article | non ouvert | non vérifié |
| 53 | — | page de choix de la voie E absente du banc : non joué | non |
| 54 | 54-taches-bandeau | non ouvert | non vérifié |
| 55 | 55-pastille-lie-a, 55b-apercu-lien-sur-place | « À venir » vu en texte ; non ouverts. La pastille « À venir · ZZ TEST — Frigo… » se voit sur 38b | non vérifié |
| 56 | — | calendrier (`?dev-local` bloqué) : non joué | non |
| 57 | — | icône de la bande en S47 : non joué | non |

## CRITIQUE-7 : constats revus sur ces captures

1. Note en vrac non découpée : **non tranché** (test invalide, cf. Méthode).
2. Levures « tiennent 80 °C » : **non joué** (la phrase de test n'en contient pas).
3. Critère annoncé ≠ critère : **persiste** (11 : la conséquence apparaît, mais « Critère : 2 bacs… » ne change pas).
4. Frigo à 43 °C : **partiel** : la colonne porte maintenant « amb. max °C » (49, 38) ; la valeur 43 reste, le sens métier à juger.
5. Embouteillage contradictoire : **persiste en partie** : 49c liste le carnet dans « Choisis, pas encore dans À venir » ; Réalisés non joué.
6. Pourquoi faux : **non joué** (28b non ouvert).
7. Dépôt de lien sans rang : **corrigé en partie** : 18 annonce « 1er sur 5 » ; l'effet sur les autres rangs non vu.
8. En-tête L'Affinée et segment Stocks : **non tranché** : absents du banc par construction ; `?dev-local` bloqué (47).
9. Preuve manquante : **partielle** : jouées et vues 38b, 46b, 49, 50 (texte), 26b, 43 (texte) ; non jouées 29, 30, 33, 35, 40b, 53, 56, 57.
10. Bulle G8 tronquée : **non tranché** (10 non ouvert).
11. Phrase reprise telle quelle : **persiste** (23 : « votre phrase : « sol du local… » » cité ; 07 : « votre phrase en titre »).
14. Écarté sans raison : **non tranché** (27 : « 4e… moins bien que la 3e sur tout » ; raison de l'écarté non vérifiée).
16. Lien À venir dit deux fois : **persiste** (38b : pastille + « Dans À venir depuis le 16 nov. »).
17. Article ouvert, photo remplacée par un picto : **persiste** (26b).
22. « Photos · aucune » montrée vide : **persiste** (23).
24. Pas de fil de chat : **persiste** (report voulu, R39).
25. Un seul critère affiché : **corrigé** (09 : « tient 80 °C, puis le débit »).
27. Carte Idée : « Coller un lien » en une ligne (01) : **corrigé** ; « ZZ TEST — Extracteur… » coupé : **persiste**.
28. « Va dans » coupée à droite : **persiste** (11).
32. Liste vide, promesse de veille : **persiste** (02 : « on garde sa photo, son prix, et on le surveille »).

## Erreurs

- PAGEERROR : **0** dans les trois journaux.
- Console, erreurs applicatives : **2**, toutes sur `?dev-local` (sombre) : 504 « Outdated Optimize Dep » et import dynamique de `StocksTab.tsx` en échec. Cause probable : cache du serveur de dev, non l'app ; à rejouer sur un serveur neuf avec émulateurs.
- Console, `net::ERR_FAILED` : nombreuses, **volontaires** (Firebase et Google coupés par le test). Non comptées comme erreurs.
- RECHARGEMENT-INVALIDE : 0. ECHEC de scénario : 0.

## Ce qui reste douteux

- La note en vrac (22, 23) et la découpe en lignes : non testées comme une seule note.
- Photo (44) et dictée (45) : aucun effet visible en headless.
- 49c : le plan reste dans À venir avec « depuis son carnet » après « Garder le plan sans ce carnet » : soit le détachement n'est pas écrit côté plan, soit l'affichage ne le relit pas. Constat à verser à `work/missions/BUGS.md` par le pilote, non résolu ici.
- Sombre : seules 18 et 26b sont ouvertes ; le reste du thème sombre n'est vérifié que par texte.

Bilan chiffré : 15 numéros ouverts et regardés sur 57 (17 captures ouvertes) ; 11 numéros non joués ou libellé introuvable (01c, 29, 30, 33, 33b, 35, 40b, 47 clair, 53, 56, 57) ; les autres sont capturés ou vérifiés en texte seulement, donc non validés.
