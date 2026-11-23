# Vision 6 · 1280×800 · carnet porté (18.11)

Banc : worktree `port-carnet` (HEAD b3bb2d0fd), `vite` dev sur port libre, `?preview=carnets&theme=clair|sombre`, fixture « ZZ TEST — … », IA simulée, rien écrit hors mémoire. Chrome via puppeteer-core. Script : `scratchpad/vision6.cjs` (dossier scratchpad de la session).

Environnement : le worktree n'a pas de `.env`, donc le banc ne démarrait pas (« Impossible de charger la brasserie », 138 erreurs Firebase « Configuration absente »). Relancé avec des variables placeholder (`VITE_FIREBASE_API_KEY=banc-sans-cle`, `VITE_FIREBASE_PROJECT_ID=banc-local`, `VITE_USE_FIREBASE_EMULATORS=0`), sans fichier `.env` écrit.

Build : `npm run build` relancé, `dist/index.html` daté 05:36 (après le commit 05:34), drapeaux « OK » dans le journal. La ligne `EXIT` n'a pas été enregistrée : le build est allé jusqu'à `check-build-flags`.

Compte : 40 états × 2 thèmes joués, avec une capture avant la bascule de veille (21a) : 82 captures d'état. Ouvertes et regardées : 14 (clair 01, 07, 09, 10, 14, 18, 20, 21, 21a, 22, 28, 32 ; sombre 07, 14). Les 68 autres ne sont pas ouvertes : leur ligne ci-dessous dit « non ouvert », donc rien n'est validé pour elles.

Fichiers obsolètes : 4 captures `…-ECHEC.png` (article-ouvert, article-veille-bascule, deux thèmes) de la passe 2, avant correction du sélecteur. Leur suppression a été refusée par le garde-fou ; elles restent sur disque et doivent être retirées par le pilote.

## États (n° → fichier → ce qui se voit → agit)

Fichiers : `d1280-<clair|sombre>-<nn>-<état>.png` dans ce dossier.

- **01 liste-repos** → `d1280-clair-01-liste-repos.png` (ouvert). Segment « À venir 1 · Carnets 6 · Réalisés 0 », groupes À comparer 1 / Idée 2 / Choisi 3, cartes avec picto et prix, champ « Une idée, un besoin… » en bas. Agit : affichage (oui). Sombre : non ouvert.
- **02 liste-vide** → non ouvert.
- **03 créer-avant** → non ouvert.
- **04 créer-pendant** → non ouvert (texte « frigo de garde pour 6 fûts, 2 à 3 °C » tapé).
- **05 créer-apres** → non ouvert.
- **06 créer-apres-annule** → non ouvert.
- **07 carnet-ouvert** → `…-clair-07-carnet-ouvert.png`, `…-sombre-07-carnet-ouvert.png` (ouverts). Titre Ventilation, « 2 façons à comparer · attendre l'avis du ferblantier », « Critère : tient 80 °C, puis le débit · proposé par l'IA » (plus de « capter la buée » en tête), Articles 5 lus, tableau rang·article. Sombre : palette cave, segment jaune, lisible. Agit : ouverture oui.
- **08 ajouter-avant-bulle-g8** → non ouvert.
- **09 texte-pendant-evier** → `…-clair-09-texte-pendant-evier.png` (ouvert). Frappe réelle : « fond de bac 38 cm minimum » dans le champ. Cadre « va atterrir ici · tiré de votre phrase », « Ce qui compte : fond de bac 38 cm minimum », chips « Va dans : Ce qui compte · Note · Façon », bouton « Ajouter ». Agit : oui (la frappe s'affiche, le cadre se met à jour).
- **10 texte-apres** → `…-clair-10-texte-apres.png` (ouvert). « Rangé ici, à l'instant · Annuler », « Fond de bac 38 cm minimum · de votre phrase », citation « votre phrase : « fond de bac 38 cm minimum » ». Pas de « 30 L » : le chiffre inventé n'apparaît pas. Agit : oui (la phrase sort du champ et se range).
- **11 texte-depuis-liste-pendant** → non ouvert.
- **12 lien-avant-liste** → non ouvert.
- **13 lien-pendant** → non ouvert.
- **14 lien-apres** → `…-clair-14-lien-apres.png`, `…-sombre-14-lien-apres.png` (ouverts). « Lien rangé ici · page non lue · Annuler », URL « exemple.invalid/hotte-inox-80c », « Ouvrir ↗ ». Aucune carte (débit, °C, « lu sur la page ») à 3,5 s : la page n'est pas lue. Agit : oui (le lien est rangé).
- **15 lien-apres-2e-tableau** → non ouvert.
- **16 lien-depuis-liste-apres** → non ouvert.
- **17 note-vrac-pendant** → non ouvert (3 lignes tapées avec Maj+Entrée).
- **18 note-vrac-apres** → `…-clair-18-note-vrac-apres.png` (ouvert). « 3 lignes rangées dans 1 carnet · Annuler », lignes typées (à acheter / note ▾), carnet « → Nouveau carnet « Sol local » ▾ », « Texte d'origine ▾ ». Un seul carnet au lieu de deux. Agit : oui.
- **19 cartes-article** → non ouvert.
- **20 article-ouvert** → `…-clair-20-article-ouvert.png` (ouvert ; sombre non ouvert). « Hotte murale 100 cm », cadre photo avec picto grand (pas de photo), façon hotte inox + extracteur, réglette débit 1 200 m³/h, « 3e sur 4 », bornes 1 800 (la plus haute des 4) et 1 100, Offre Gastro Lüftung 1 450 CHF, Caractéristiques. Agit : ouverture oui.
- **21a article-veille-avant** → `…-clair-21a-article-veille-avant.png` (ouvert). Veille déjà allumée sur cette fixture : « Veille du prix, tous les 3 jours », bascule ON, « demandée · pas encore relevée ».
- **21 article-veille-bascule** → `…-clair-21-article-veille-bascule.png` (ouvert). Après le clic : bascule OFF, la ligne « demandée » disparaît. Agit : oui (ON vers OFF). Le sens éteinte vers demandée n'a pas été joué, car la fixture part allumée.
- **22 comparer** → `…-clair-22-comparer.png` (ouvert). Quatre colonnes (1re à 4e) plus l'écarté « Ventilateur de plafond » (180 CHF), « Ce qui compte : tient 80 °C », « capter la buée » marqué sans valeur à comparer, « rangé par : tient 80 °C d'abord, puis le débit, puis le prix », « la 4e… : moins bien que la 3e sur tout », bloc Compromis. Agit : oui. Le bouton Choisir est sous le pli.
- **23 choisir** → non ouvert.
- **24 menu-plus** → non ouvert.
- **25 renommer** → non ouvert.
- **26 note-actions** → non ouvert.
- **27 supprimer-note** → non ouvert.
- **28 supprimer-idee-sans-lien** → `…-clair-28-supprimer-idee-sans-lien.png` (ouvert ; rejoué sur Évier, la première version sur Frigo était un état « lien retient », capture écrasée). « Supprimer le carnet Évier inox ? · Il est vide · ni dans À venir, ni en commande », Supprimer actif (contour rouge), Garder en noir. Agit : oui (Plus puis Supprimer ouvre la confirmation).
- **29 supprimer-idee-lien-retient** → non ouvert.
- **30 a-venir** → non ouvert.
- **31 realises** → non ouvert.
- **32 ia-echec** → `…-clair-32-ia-echec.png` (ouvert). « L'IA n'a pas répondu : rangé sur l'appareil, tel quel ; rien n'est perdu · Annuler », message gardé « Ce qui compte : « hotte inox 80 °C, pas de buée » ». Agit : oui.
- **33 ia-eteint** → non ouvert.
- **34 hors-ligne** → non ouvert.
- **35 ia-en-cours-lent** → non ouvert.
- **36 taches** → non ouvert.
- **37 aides-0-feuille** → non ouvert.
- **38 zero-vide-scenario** → non ouvert.
- **39 carnet-frigo-ouvert** → non ouvert.
- **40 liste-sans-prefixe** → non ouvert.

Non joués dans ce passage : clavier 300 px (mobile seulement), G35, Réalisés avec paiement, Choisir, l'idée du calendrier (hors banc, en `dev-local`), les pastilles « lié à », le scénario de zéro en plein, et la photo ou la dictée.

## Erreurs console

Passes 2 à 6 : 0 erreur ni avertissement consigné. Passe 1 (sans placeholder Firebase) : 138 erreurs, dues à l'environnement, pas au carnet.

## Critique 5 : état sur les captures ouvertes

- n° 4 (« 30 L » inventé) : **corrigé**, clair 10. Sombre non ouvert.
- n° 6 (lien après, carte absente) : **non corrigé** sur ce chemin (clair 14, sombre 14) : « page non lue », pas de carte.
- n° 7 (note en vrac) : **partiel**. Après : un carnet au lieu de deux (clair 18). Pendant (17) non ouvert.
- n° 8 (photo de l'article ouvert) : **non corrigé**, picto grand à la place de la photo (clair 20).
- n° 22 (critère incohérent) : **corrigé** dans le titre et Comparer (clair 07, 22). « capter la buée » reste, marqué sans valeur.
- n° 23 (« moins bien partout ») : **corrigé**, clair 22.
- n° 24 (IA en échec) : **corrigé** à 1280 pour le cas simple, clair 32.
- n° 28 (article maigre) : **partiel**, quatre caractéristiques et « Choisir » visibles (clair 21).
- n° 29 (vignettes) : **inchangé**, picto trait fin sur carré gris (clair 01, 07).
- n° 34 (placeholder tronqué) : **corrigé** à 1280, « Ajouter à Ventilation de la salle de brassage… » (clair 07). Le 390 n'a pas été vu ici.
- n° 36 (réglette sans borne gauche) : **corrigé**, clair 20.
- Non jugés (captures non ouvertes ou gestes non joués) : n° 1, 2, 3, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 25, 26, 27, 30, 31, 32 (partie), 33 à 43.

## Problèmes relevés sur les captures ouvertes (liste numérotée)

1. Lien après (14) : « page non lue » à 3,5 s, aucune carte.
2. Article (20) : photo remplacée par un picto grand, pas la photo de la page.
3. Note en vrac après (18) : un seul carnet, pas de deux carnets nommés.
4. Veille (21a, 21) : la fixture part allumée ; l'état « éteinte, puis demandée » n'a pas été joué.
5. Comparer (22) : « capter la buée » affiché comme critère, avec la mention « sans valeur ».
6. Pictos (01, 07) : vignettes au trait fin sur carré gris.
7. Suppression (28) : réglette et contour rouge, cohérents avec l'état vide ; rien à corriger vu.

## Ce qui reste douteux

- 68 captures sur 82 ne sont pas ouvertes. Les états marqués « non ouvert » ne sont pas validés.
- Le thème sombre n'est regardé que sur 07 et 14.
- Les quatre `…-ECHEC.png` restent sur disque (suppression refusée).
