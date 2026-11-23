# Vision 8, 1280×800, clair et sombre (18.11) : carnet porté, banc `?preview=carnets`

Méthode : `vite` en DEV (port 5489), car le drapeau `?preview=carnets` n'existe qu'en DEV (`src/main.tsx:28`) ; `vite preview` sur `dist/` n'aurait pas servi le banc. Variables `VITE_*` factices (tout le `.env.example`), pas de données réelles. `dist/` non reconstruit : il est plus récent que le dernier commit (09:29 contre 09:21). Script : `vision-8/d1280.mjs` ; journaux : `journal-d1280.txt` (passe finale), `journal-d1280-passe1.txt`, `journal-d1280-passe2.txt`. Frappe au clavier réel (`type`, délai 25 ms). Les lignes d'une note en vrac sont séparées par Maj+Entrée (Entrée seule envoie le message). Chaque geste : écran avant et après comparés par empreinte (`agit` = empreinte changée ; une empreinte peut changer sans effet visible, par exemple le curseur). Captures : `<clair|sombre>` en `d1280-<thème>-<nn>-<état>.png`.

Ouvertes et lues à l'œil (17 captures, clair et sombre) : 01 clair, 01 sombre, 06, 10, 13 (passe 1 et reprise), 22, 23, 30, 38, 49, 49b, 50, 55b, 47.

## États (n°) → fichier → ce qui se voit → agit

### Lecture de la liste et son état
- **01 Liste** → `d1280-clair-01-liste.png`, `d1280-sombre-01-liste.png` → Carnets 6 ; À comparer 1 (Ventilation, « 1 en veille »), Idée 2 (Évier inox, Extracteur, « Coller un lien »), Choisi 3 (Densimètre, Embouteillage, Frigo). Sombre lisible, en-tête et onglets reconnaissables → agit : non (repos).
- **01b Liste, en veille** → `…-01b-liste-en-veille.png` → prise après défilement, non regardée → agit : non joué.
- **01c Veille OFF→ON depuis la liste** → `…-01c-veille-off-vers-on.png` → aucune bascule dans la liste (elle est sur la fiche d'article) → **agit non** (écran identique, deux thèmes).
- **02 Liste vide** → `…-02-liste-vide.png`, `…-02z-zero-liste-vide.png` → non regardée ; « Chargement » absent (texte) → agit : non joué.

### Créer (R09 à R11)
- **03 Créer · avant** → `…-03-creer-avant.png` → non regardée → agit : non joué.
- **04 Créer · pendant, carnet proche** → `…-04-creer-pendant-carnet-proche.png` → texte « Déjà un carnet proche » présent (texte), non regardée → agit : non joué.
- **05 Créer · pendant, aucun proche** → `…-05-creer-pendant-aucun-proche.png` → « arrive ici » présent (texte), non regardée.
- **06 Créer · pendant, « Ce qui compte » tiré de la phrase** → `…-06-creer-pendant-ce-qui-compte.png` → **état non atteint** : la phrase « frigo de garde pour 6 fûts » fait apparaître « Déjà un carnet proche » (le Frigo existe dans la fixture), pas « Ce qui compte ». → agit : non joué ; à rejouer avec une phrase sans carnet proche.
- **07 Créer · après** → `…-07-creer-apres.png` → « Carnet créé » et « Annuler » présents (texte), non regardée.
- **08 Créer · après, puis Annuler** → `…-08-creer-apres-annule-liste.png` → **agit oui** (empreinte changée après Annuler) ; image non regardée.

### Carnet ouvert et ajout (R03, R12)
- **09 Carnet ouvert** → `…-09-carnet-ouvert.png` → « Ventilation » présent (texte), non regardée.
- **10 Ajouter · avant, bulle G8** → `…-10-ajouter-avant-bulle-g8.png` → champ « Ajouter à ZZ TEST — Ventilation… » visible ; **aucune bulle « peut trancher »** au-dessus du champ (texte absent). → **état non vu** (G8 absent à 1280 ou non déclenché).
- **11 Texte · pendant, conséquence (G9)** → `…-11-texte-pendant-consequence.png` → phrase « les articles seront rangés sur » présente (texte), non regardée.
- **12 Doublon, Garder à part** → `…-12-doublon-garder-a-part.png` (texte « Garder à part » présent), **12b** `…-12b-doublon-retire.png` → **agit oui** (empreinte changée) ; images non regardées.

### Texte et lien (R13 à R21)
- **13 Texte · après, Rangé ici** → `…-13-texte-apres-range-ici.png` (reprise, ouverte) → « Rangé ici, à l'instant » et « Annuler » ; « Hotte murale 1 200 m³/h au moins · de votre phrase » ; « votre phrase : « hotte murale… » » cités. → état voulu atteint. **Problème (critique n° 11)** : la phrase est reprise telle quelle, pas mise en forme. La passe 1 (bac inox, liste) montre « Carnet créé », autre état, supplanté.
- **14 Texte · après, depuis la liste** → `…-14-texte-apres-depuis-liste.png` → non regardée.
- **15 Lien · avant** → `…-15-lien-avant.png` → « Coller » présent (texte), non regardée.
- **16 Lien · pendant** → `…-16-lien-pendant.png` → « lecture de la page » présent (texte), non regardée.
- **17 Lien · pendant, depuis la liste** → `…-17-lien-pendant-liste.png` → non regardée.
- **18 Lien · après, carte** → `…-18-lien-apres-carte.png` → « veille demandée » absent (texte) ; non regardée.
- **19 Lien · 2e tableau** → `…-19-lien-2e-tableau.png` → présence du tableau non vérifiée au texte ; non regardée.
- **20 Lien · après, depuis la liste (« Rangé dans … »)** → `…-20-lien-apres-liste-range-dans.png` → non regardée.
- **21 Lien illisible** → `…-21-lien-illisible.png` → « page non lue » présent (texte), non regardée.

### Note en vrac (R18, R19)
- **22 Note en vrac · pendant** → `…-22-note-vrac-pendant.png` (reprise, ouverte) → « L'IA découpe votre note : 3 lignes, 2 carnets » avec 3 lignes typées (« hotte au-dessus de la cuve : doit tenir 80 °C », « sol du local… », « la hotte : 1 200 m³/h au moins ») et leur destination. → **agit : oui**, la note est découpée (critique n° 1 et 19 corrigés à 1280). Le texte découpé se voit.
- **23 Note en vrac · après** → `…-23-note-vrac-apres.png` (reprise, ouverte) → « 3 lignes rangées dans 2 carnets · Annuler » ; trois lignes avec leur étiquette « note » et leur carnet ; « Texte d'origine » présent à l'image (le texte cherché avec apostrophe typographique était absent). Problème n° 1 corrigé à 1280. Note : Entrée seule envoyait chaque ligne séparément dans la passe 1.
- **24 Notes ref collées** → `…-24-notes-ref-rangees.png` → non regardée.

### Cartes, article, comparer (R04 à R07)
- **25 Cartes d'article** → `…-25-cartes-article.png` → non regardée.
- **26 Article ouvert, bascule de veille avant/après (R05, R31)** → `…-26-article-ouvert-avant.png`, `…-26b-article-veille-apres.png` → **agit non** : le toucher n'a pas ouvert l'article (Hotte/Extracteur/Ventilateur absents du DOM à ce moment), écran identique.
- **27 Comparer sur le critère** → `…-27-comparer-critere.png`, `…-27c-comparer-defile.png` → « classées par » vu (texte) ; non regardée. Critère 13 (« 2 bacs »…) non vérifié.
- **28 Choisir, pourquoi** → `…-28-choisir.png`, `…-28b-pourquoi-ouvert.png` → « Pourquoi › » introuvable : **état non atteint**, pas de capture valide.
- **29 Choix revu (ADR)** → `…-29-choix-revu-adr.png` → non regardée ; « Pourquoi » introuvable.
- **30 Envoyer dans À venir** → `…-30-envoyer-a-venir.png` (ouverte) → carnet Ventilation, pas de bouton « Envoyer dans À venir » (il n'apparaît que sur l'idée choisie). **agit non (non joué).**
- **30b / 30c À venir, Ouvrir le carnet** → non atteints.
- **31 Réalisés** → `…-31-realises.png` → non regardée.

### Notes (R20, R21, R22)
- **32 Note, menu ···** → `…-32-note-menu-ouvert.png` → non regardée.
- **32b Modifier, pendant** → `…-32b-note-modifier-pendant.png` → « Se modifie ici » absent (texte), « Modifier » introuvable : **non atteint**.
- **33 Note modifiée** → `…-33-note-modifiee-apres.png` → « Note modifiée » absent (texte) → non atteint.
- **34 Renommer, pendant** → `…-34-renommer-pendant.png` → « proposé d'après » absent ; **34b** (`&aides=0`) → idem. Titre proposé non vu (G29).
- **35b Note supprimée / 35c revenue** → `…-35b-note-supprimee.png`, `…-35c-note-revenue.png` → « Note supprimée » absent (texte) ; non regardées. Agit : non vérifié.

### Supprimer une idée (R23, Suppression v2)
- **36 Supprimer une idée sans lien** → `…-36-supprimer-idee-sans-lien.png` → « ni dans À venir » présent (texte) ; non regardée.
- **37 Carnet supprimé, liste / annulé** → `…-37-carnet-supprime-liste.png`, `…-37b-carnet-supprime-annule.png` → « Carnet supprimé » absent (texte), « Annuler » introuvable à un cran : non atteint.
- **38 Supprimer, 1 lien le retient** → `…-38-supprimer-1-lien-retient.png` (ouverte) → « 1 lien le retient » ; la ligne « ZZ TEST — Frigo de garde pour fûts · plan dans À venir » et le bouton « Garder le plan sans ce carnet » ; **Supprimer en pointillé, grisé** ; « Garder » en noir. Conforme à D-47b.
- **49 Garder le plan, compteur** → `…-49-garder-plan-compteur-zero.png` (texte « Garder le plan sans ce carnet » présent ; « n liens le retiennent » absent, le texte réel est « 1 lien le retient ») → **agit oui** après le toucher ; **49b** `…-49b-a-venir-carnet-supprime.png` (ouverte) → l'écran affiche **l'Embouteillage** (« Réalisés 1 », « Archiver »), pas le Frigo. Comportement inattendu après « Garder le plan », **à rejouer** avant de le tenir pour un défaut.

### Autres gestes
- **39 Clavier 300 px** → `…-39-clavier-300px-simule.png` → non regardée.
- **40 IA en cours, ✕** → `…-40-ia-en-cours.png` (« ✕ » absent), `…-40b-ia-arretee.png` → **agit non** (✕ introuvable).
- **41 IA en échec / 42 IA éteinte** → `…-41-ia-echec.png`, `…-42-ia-eteinte.png` → non regardées.
- **43 Hors ligne** → `…-43-hors-ligne-range-local.png`, `…-43b-hors-ligne-apres.png` → non regardées.
- **44 Photo (📷)** → `…-44-photo.png` → non regardée ; l'effet n'est pas prouvé (aucune relève visible au banc).
- **45 Micro (🎤)** → `…-45-micro-dictee.png` → **non atteint** (bouton introuvable).
- **46 + volant** → `…-46a-plus-volant-avant.png`, `…-46-plus-volant-touche.png` → **agit non** (écran identique après le clic).
- **47 Stocks › Matériel › Carnets (?dev-local)** → `…-47-stocks-segment-nav.png` (ouverte) → en-tête « L'Affinée » visible (problème n° 8 : ce bandeau manquait au banc), mais l'écran reste « Chargement de l'écran… » : les sous-segments Matériel et Carnets n'ont pas été atteints. **Partiel.**
- **48a / 48b / 48c Zéro, frigo, ventilation, évier** → `…-48a-zero-frigo.png`, `…-48b-zero-ventilation.png`, `…-48c-zero-evier.png`, `…-38z-zero-trois-carnets.png` → non regardées ; la phrase tapée n'apparaît pas au texte de la liste finale (ABSENT) : **à vérifier**.
- **49b, 50, 51, 52** : 50 ouverte, voir ci-dessous ; 51 `…-51-aides-eteintes.png` non regardée ; 52a `…-52a-comparer-1-article.png` non regardée ; 52b `…-52b-comparer-2-articles.png` : « rangé par » absent (texte).
- **50 Idée avec plan réalisé, Archiver seul** → `…-50-realise-archiver-seul.png` (ouverte) → « 1 lien le retient », « ZZ TEST — Embouteillage · plan réalisé », **Archiver seul** (sans « Garder le plan sans ce carnet »), Garder en noir, Supprimer absent. Conforme à D-47b. **agit** : état atteint.
- **54 Bandeau de tâches** → `…-54-taches-bandeau.png` → non regardée.
- **55 Pastille « lié à »** → `…-55-pastille-lie-a.png` (texte « À venir » présent, non regardée) ; **55b** `…-55b-apercu-lien-sur-place.png` (ouverte, Frigo) → pastille « À venir · ZZ TEST — Frigo de garde pour fûts », aperçu « dans À venir · Ouvrir dans À venir ». **Problème n° 16 persistant** : la même information apparaît trois fois (pastille, aperçu, « Dans À venir depuis le 16 nov. »). **agit oui** (aperçu ouvert).
- **56 Idée du calendrier, 57 icône de bande** → `…-56-calendrier-idee.png`, `…-57-icone-idee-bande.png` → « Calendrier » cliqué, non regardées ; état non prouvé.
- **53 Page de choix de la voie E** → non joué : hors du banc, pas de capture.

## Problèmes de CRITIQUE-7 vus à 1280 (sur les captures ouvertes)

| n° | Constat (CRITIQUE-7) | Vu à 1280 |
|---|---|---|
| 1 | Note en vrac non découpée | corrigé (22, 23 : 3 lignes, 2 carnets) |
| 2 | Levures « tiennent 80 °C » | non joué |
| 3 | Critère annoncé non rangé | non vu (13 : phrase reprise, critère non séparé) |
| 4 | Frigo à 43 °C | libellé « amb. max °C » ajouté (38, 49b, 55b) ; la valeur 43 reste |
| 5 | Embouteillage, trois états | Embouteillage : « Réalisés 1 », « plan réalisé », Archiver ; À venir non vérifié |
| 6 | Pourquoi faux | non vu (28 non atteint) |
| 7 | Dépôt sans rang ni G20 | non vu (19 non regardée) |
| 8 | En-tête et segment Stocks absents | en-tête présent (47) ; segment non atteint |
| 9 | Preuve manquante | Archiver (50) et Suppression v2 à 1 lien (38) présents ; 49b inattendu |
| 10 | Bulle G8 tronquée | absente (10) |
| 11 | Pas de mise en forme | persiste (13 : phrase recitée) |
| 12 | Lien collé sur liste vide | non regardé |
| 16 | Lien À venir dit 2 ou 3 fois | persiste (55b) |
| 22 | « Photos · aucune » affichée vide | masquée (23) |
| autres (13 à 32) | — | non vérifiés à 1280 |

## Erreurs console

- Passe finale : 0 `PAGEERROR`, 0 échec d'état, 0 rechargement invalide.
- 133 `Failed to load resource: net::ERR_FAILED` : requêtes Google et Firebase coupées par le script (`request.abort`), attendues dans le banc.
- Passe 1 sans variables Firebase : `auth/invalid-api-key` et « Configuration absente » (corrigé par des variables factices, sans effet sur les captures finales).

## Bilan

- Captures : 152 nouvelles en `d1280-<thème>-…` (dont 17 ouvertes et lues) ; 16 anciennes captures de `vision-8` non régénérées.
- États : 55 numéros joués (33 fondu dans 32 ; 53 non joué). Vus sans défaut relevé : 01, 13, 22, 23, 38, 50, 55b. Non atteints ou à rejouer : 06, 10, 26, 28, 30, 32b, 33, 37, 40, 45, 46, 47 (segment), 49b, 56, 57. Les autres ont une capture et un texte, sans lecture à l'œil.
- Cette passe ne valide pas les gestes non joués ; le critique n'a pas encore vu ces captures.
