# Vision d1280 — carnet porté (1280 × 800, clair et sombre)

Banc : `npm run build` vert (exit 0) ; banc servi par `vite` dev sur `http://127.0.0.1:5187/?preview=carnets` (le banc est
DEV seulement : `vite preview` d'un build ne le sert pas). Variables `VITE_FIREBASE_*` fictives (projet « banc-fictif »),
aucune donnée réelle, IA simulée, fixture « ZZ TEST — … ». Thèmes : `&theme=clair` et `&theme=sombre`.
Scripts de jeu : `scratchpad/vision1.cjs` puis `scratchpad/vision1b.cjs` (le second corrige l'envoi et rejoue 4, 7, 8, 15, 16, 18).
Captures : 60 fichiers `d1280-<thème>-<nn>-<état>.png` (dont un doublon `15-lien-avant` / `15-lien-avant-frappe` par thème).
Les fichiers `m390-*` présents dans ce dossier ne sont pas de moi ; je n'y ai pas touché.

## États (n° du § Vérification) → fichier → ce qui se voit → agit

Clair (ouvertes et regardées sauf mention) :

- 1 liste au repos → `d1280-clair-01-liste-repos.png` → non ouverte ; même fond que 03 (À comparer, Idée, Choisi, En veille). Non vérifié à part. agit : n/a.
- 2 liste vide → `d1280-clair-02-liste-vide.png` → non ouverte. Non vérifié (G1, G2 non vus). agit : n/a.
- 3 créer · avant → `d1280-clair-03-creer-avant.png` → liste, champ « Une idée, un besoin… » focus, pas de cadre. agit : n/a (premier état).
- 4 créer · pendant (carnet proche) → `d1280-clair-04-creer-pendant.png` (v1, phrase complète tapée) → cadre pointillé « Nouveau carnet · Idée », titre « ZZ TEST — Ventilation cuisine, 2 ventilateurs », « ✻ Déjà un carnet proche : Ventilation de la salle de brassage », puce « Y ajouter en façon », « ↓ arrive ici », flèche d'envoi verte. agit : oui (liste → cadre).
- 5 créer · pendant, suite → `d1280-clair-05-creer-pendant-suite.png` → non ouverte.
- 7 créer · après → `d1280-clair-07-creer-apres.png` (v2) → bandeau « ✓ Carnet créé, en tête des Carnets · ↺ Annuler », phrase citée « ZZ TEST — Ventilation cuisine… · votre phrase en titre ». **Doute : la nouvelle idée n'apparaît pas dans la liste** (Idée reste à 1, seule « Évier inox »). agit : oui.
- 8 créer · après, annulé → `d1280-clair-08-creer-apres-annule.png` (v2) → liste redevenue identique à 01/03 (Idée 1, Évier inox). agit : oui (07 → 08).
- 9 carnet ouvert, au repos → `d1280-clair-09-carnet-ouvert.png` → « Ventilation de la salle de brassage » : « Ce qui compte » (3 lignes tirées de la phrase), 2 façons en tuiles, Articles avec « Comparer côte à côte », tableau à 5 colonnes, champ « Ajouter à Ventilation d… ». Pas de rangée « Ajouter à … : quoi ? » (conforme R03). agit : oui (liste → carnet).
- 10 ajouter · avant → `d1280-clair-10-ajouter-avant.png` → non ouverte. Le geste « Ajouter » introuvable (GESTE NON TROUVÉ). Non vérifié.
- 11 texte · pendant → `d1280-clair-11-texte-pendant.png` → cadre « ↓ va atterrir ici · tiré de votre phrase · ✕ », « Ce qui compte : fond de bac 38 cm minimum », ligne « les articles seront rangés sur le fond de bac, 38 cm au moins » (R45 vu), champ « fond de bac 38 cm minimum » + « Ajouter ». **Puces « Va dans » absentes** sur la capture (G10 non vu). agit : oui (frappe → cadre et ligne).
- 13 texte · après → `d1280-clair-13-texte-apres.png` → non ouverte. Non vérifié.
- 15 lien · avant → `d1280-clair-15-lien-avant.png` et `-frappe.png` → non ouverts. Non vérifié.
- 16 lien · pendant → `d1280-clair-16-lien-pendant.png` (v2) → cadre « ↓ Arrive ici, dans Articles · exemple.invalid/hotte-murale-100-cm · ✻ lecture de la page… · nom, prix, photo, cotes : rien d'affiché avant d'être lu », article en « ? » ; **le titre du carnet est l'URL brute** (« https://exemple.invalid/… »). agit : oui (champ → carnet créé).
- 18 lien · après → `d1280-clair-18-lien-apres.png` (v2) → bandeau « ✓ Carnet créé, en tête des Carnets · Annuler », phrase citée = l'URL. **Écart :** le compteur de « Ventilation de la salle de brassage » passe de 5 à 6 articles (« 2 façons · 6 articles ») : le lien est rangé dans un carnet existant pendant que le bandeau dit « Carnet créé ». La carte complète (g5:v06-10, veille, « tient 80 °C ») n'est pas vue. agit : oui, mais état partiel.
- 22 note en vrac · pendant → `d1280-clair-22-note-pendant.png` → non ouverte.
- 23 note en vrac · après → `d1280-clair-23-note-apres.png` → bandeau « ✓ 3 lignes rangées dans 3 carnets · Annuler », liste derrière. Mission : « 2 carnets » ; ma note de test est différente (3 cibles), écart de texte, pas de défaut. agit : oui.
- 25 cartes d'article → `d1280-clair-25-cartes-article.png` → non ouverte.
- 26 article ouvert → `d1280-clair-26-article-ouvert.png` → non ouverte.
- 27 comparer → `d1280-clair-27-comparer.png` → « Côte à côte 5 », « rangé par : tient 80 °C d'abord, puis le débit », colonnes 1re à 5e, « moins bien partout » sur la 4e, bouton « Choisir » pleine largeur, champ en bas. **Aucun écarté visible** dans cette fixture (R26 « écartés à la fin » non vu). agit : oui (carnet → tableau).
- 30 « Dans À venir » → `d1280-clair-30-a-venir-voir.png` → non ouverte. Le geste « Dans À venir » a été cliqué. Non vérifié.
- 31 Réalisés → `d1280-clair-31-realises.png` → non ouverte ; geste « Réalisés » **introuvable** : non joué.
- 36 supprimer une idée → `d1280-clair-36-supprimer-idee.png` → **le geste n'a pas été joué** (« Supprimer » introuvable). La capture montre l'idée « ZZ TEST — Frigo de garde pour fûts » : « Choisi le 10 oct. », pastille « À venir · ZZ TEST — Frigo de garde pour fûts » (R47 vu), « Choisi : Chambre froide en kit », « Dans À venir depuis le 16 nov. ». Pas de confirmation vue. agit : non joué.
- 41 IA en échec → `d1280-clair-41-ia-echec.png` → bandeau « ✓ Carnet créé · Annuler », avis « L'IA n'a pas répondu : rangé sur place, rien n'est perdu. », « Ce qui compte : rien encore », « Façons : aucune », « Articles : aucun : collez un lien », « Notes : aucune », champ « Ajouter à Test IA en éc… ». agit : n/a (état d'après envoi).
- 42 IA éteinte → `d1280-clair-42-ia-eteint.png` → non ouverte.
- 43 hors ligne → `d1280-clair-43-hors-ligne.png` → non ouverte.
- 46 + volant sur Carnets → `d1280-clair-46-liste-plus-volant.png` → non ouverte ; le + n'a pas été cliqué.
- 51 aides éteintes → `d1280-clair-51-aides-eteintes.png` → non ouverte.
- 54 tâches → `d1280-clair-54-taches.png` → non ouverte.

Sombre :

- 27 comparer → `d1280-sombre-27-comparer.png` → même tableau en thème sombre (fond sombre, « tient 80 °C » et valeurs vertes, « moins bien partout » ambré, « Choisir » jaune plein, lisible). agit : oui.
- 07 créer · après → `d1280-sombre-07-creer-apres.png` (v2) → non ouverte après la relance.
- Les autres états sombres sont écrits en fichiers, non ouverts ni regardés.

Non joués, faute de geste trouvé ou de matériel : Photo (44), Dicter (45), Supprimer (36, geste introuvable), Réalisés (31), + volant (46 non cliqué), clavier 300 px (39, non simulé), IA en cours (40), états 37, 38, 47 à 50, 52, 53, 55 à 57.

## Constats (liste numérotée, sans jugement de qualité)

1. Créer · après (07) : bandeau « Carnet créé » sans nouvelle carte visible dans « Idée ». À vérifier.
2. Lien · après (18) : bandeau « Carnet créé » et URL rangée dans un carnet existant (5 → 6 articles). Incohérence.
3. Lien · pendant (16) : titre de carnet = URL brute.
4. Texte · pendant (11) : puces « Va dans » absentes sur la capture.
5. Comparer (27) : aucun écarté visible dans la fixture.
6. Supprimer une idée (36) : geste non joué ; geste « Réalisés » (31) introuvable.
7. Chaque état écrit par script ne vaut que par son image ouverte : 46 des 60 fichiers ne sont pas regardés.

## Essais et erreurs

- Essais : 2 passes de jeu (vision1, vision1b). Le premier envoi a cliqué une puce du fil (« Y ajouter en façon ») : les captures 07 et 18 de la première passe étaient fausses, elles sont remplacées par la seconde passe.
- Erreurs console : 0 `error` et 0 `pageerror` sur les deux passes, clair et sombre. Avertissements non relevés.

## Ce qui reste douteux

- Constats 1 et 2 : soit le rangement, soit l'affichage de la liste est en cause ; je ne peux pas le trancher sans lire le code du banc.
- Les états non ouverts ne sont ni validés ni invalidés.

VISION d1280 11/57 états vus en clair (+27 en sombre), 60 captures, 0 erreur console.
