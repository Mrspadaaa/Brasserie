OK — corrigés 6/6 : Annuler stable, IA en cours/fini distincts, Va dans, photo, dictée, bandeau en vue

Lot C3-L3-champ-fil-bandeau-etat-ia, tour 3. Worktree `port-carnet`, branche `claude/port-carnet-1711`, pas de commit.
CRITIQUE-3.md absent : je suis parti des numéros de vision-3 (RAPPORT-m390.md, RAPPORT-d1280.md) donnés par le brief.

## Fichiers écrits (tous dans « Possède »)
- `src/ui/carnets/CarnetsVue.tsx` : retour avec clé stable `id`, `retourRef`, fin de l'IA qui complète le retour affiché sans le remplacer, Annuler qui lit le retour courant, « ✓ Rangé » à la place de l'état en cours, photo jointe avant l'envoi.
- `src/ui/carnets/EtatIA.tsx` : en cours « ✻ L'IA range… « phrase » ••• ✕ » ; état `range` « ✓ Rangé » ; ✕ `aria-label="Arrêter l'IA"` ; l'état vient en vue à son arrivée.
- `src/ui/carnets/ChampCarnet.tsx` : libellé « Va dans » insécable ; vignette « photo jointe · lecture… » avec ✕ « Retirer la photo » ; micro en état écoute.
- `src/ui/carnets/Bandeau.tsx` : le bandeau vient en vue une fois, à son arrivée.
- `src/ui/carnets/carnets.css` : styles `cn-`, deux thèmes par les jetons existants, `prefers-reduced-motion` respecté.
- `tests/unit/carnetsCorrection3Fil.test.tsx` (neuf, 16 tests).
- Preuves : `preuve.cjs`, `journal-m390-{clair,sombre}.txt`, `journal-d1280-{clair,sombre}.txt`, captures `m390-*` et `d1280-*` dans ce dossier.
Pas touché : CadreArrivee.tsx, Photos.tsx, photo.ts (aucun besoin), Comparer, Choisir, SupprimerCarnet, domaine.

## Problème → fait → preuve
1. **m390-P8 (bloquant), R11 : Annuler de « ✓ Carnet créé » sans effet.**
   Fait : chaque retour a un `id` ; le bandeau est monté sous `key={retour.id}`. Si l'IA finit pendant que le retour de ce message est
   affiché, elle ne le remplace plus. Elle garde la clé, met à jour le texte quand la sorte est la même, et étend `inverse` à ses
   écritures. Annuler lit `retourRef`, coupe l'IA en cours puis défait tout. La ligne « Annuler » ne bouge pas.
   Preuve vitest : même nœud DOM avant et après la fin de l'IA, puis le clic défait tout (retour à la liste, nombre de carnets de
   départ). Même résultat pour la phrase de l'état 08 (lien et prix), avec Annuler pendant la lecture de la page puis après la fin.
   Preuve Chrome 390 tactile, deux thèmes, au doigt : « avant Annuler : carnets 6 (départ 5) » puis « après Annuler : carnets 5 ; vue
   liste », pendant l'IA et après (journal-m390-*.txt ; captures p8a à p8d).
   Cause probable au banc, non démontrée : je n'ai pas pu faire échouer la logique (jsdom vert avant correction). Le remplacement du
   retour à la fin de l'IA, ou le minuteur de 8 s qui recommence alors, faisait bouger la cible au moment du toucher. Les deux sont
   maintenant tenus.
2. **m390-P10 (gênant) : en cours et fini se confondent.**
   Fait : en cours = cadre pointillé violet de l'IA, « ✻ L'IA range… », sa phrase citée sur une ligne, trois points qui respirent
   (immobiles sous `prefers-reduced-motion`), `aria-busy`. Fini = fond vert de zone, « ✓ Rangé », sans ✻ ni mouvement (Q19), à la même
   place, tant que le retour reste affiché. Ailleurs, le bandeau final dit déjà que c'est fini.
   Preuve : tests EtatIA (en cours / fini) et test de vue. Captures ouvertes : `m390-clair-p10a-ia-en-cours.png` puis
   `m390-clair-p10b-ia-fini.png` (sombre aussi). Les deux états sont distincts à l'image.
3. **m390-40b (gênant) : ✕ sans texte accessible.**
   Fait : `aria-label="Arrêter l'IA"` (et `title`).
   Preuve : test `getByRole('button', { name: "Arrêter l'IA" })`. Chrome : « aria-label = « Arrêter l'IA » », puis après le ✕ l'IA
   est coupée et le rangement local reste (« ✓ Rangé ici · Annuler »). L'état en cours vient aussi en vue dans un long carnet ;
   capture ouverte `m390-sombre-p40b-a-ia-en-cours-carnet.png`.
4. **m390-P6 (mineur), R13 : « Va dans » coupé.**
   Fait : `Va dans`, `white-space: nowrap`, `flex: none`. Ce sont les puces qui passent à la ligne (`flex-wrap`).
   Preuve : test (libellé insécable). Chrome : « Va dans : 20 px de haut, 1 boîte(s) » à 390 et à 1280, deux thèmes. Captures ouvertes :
   `m390-clair-p6-va-dans.png` (« Façon » passe à la ligne, le libellé non) et `d1280-clair-p6-va-dans.png` (une ligne).
5. **m390-P7 (gênant) : aucun retour après 📷 et 🎤.**
   Photo : choisie → « photo jointe · lecture… » dans le champ, puis la vignette et « photo jointe ». ✕ « Retirer la photo » ; une
   lecture qui finit après le ✕ est ignorée (jeton). Rien n'est rangé avant l'envoi : l'envoi la range dans le carnet ouvert.
   Dictée : le micro reste visible pendant l'écoute, même quand le texte arrive. Il prend la couleur de zone et affiche « Arrêter la
   dictée » ; le champ dit « J'écoute… ». Ni onde ni écran voix (CR-VOIX, D-83).
   Preuve : quatre tests vitest. Chrome : « photo jointe · lecture… » puis « photo jointe », puis envoyée : « Photos 1 photo non lue ».
   Dictée : « micro « Arrêter la dictée », pressé true ». Captures ouvertes : `m390-clair-p7a-photo-jointe.png`,
   `m390-clair-p7c-dictee-ecoute.png`.
6. **d1280-18 (mineur), R27, G21 : bandeau « Rangé dans … · Annuler » hors du cadre visible.**
   Fait : à son arrivée, le bandeau (et l'état de l'IA) défile en vue avec `scrollIntoView({ block: 'nearest' })`. Un
   `scroll-margin` lit `--cn-champ-h` et `--cn-clavier`, donc rien ne passe sous le champ ni sous le clavier. Une seule fois par
   clé : la fin de l'IA ne fait rien bouger (point 1).
   Preuve : test (bandeau défilé en vue). Chrome, liste défilée jusqu'en bas, lien collé, envoyé :
   « VISIBLE au-dessus du champ » à 390 (haut 78, bas 264, champ 733) et à 1280 (haut 78, bas 225, champ 729), deux thèmes.
   Capture ouverte : `d1280-sombre-d18-range-dans-visible.png`.

## Critères
- `npx vitest run tests/unit/carnets* port-q3/q4/q5-carnet` : 21 fichiers, 346 tests verts (dont mes 16).
- `npx tsc --noEmit -p .` : 0 erreur.
- Chrome (vite dev à moi, port 5477, arrêté après) : 390 tactile et 1280, clair et sombre. Aucune erreur de page, HMR 0.
- Essais : P8 1 ; P10 2 (l'état en cours sortait du cadre dans un long carnet : il vient maintenant en vue) ; les autres 1.

## Doutes et limites
- **Incident** : au premier lancement, le port 5391 était déjà pris par un serveur vite d'une autre session (`ports-nuit`). Mon
  vite a refusé de démarrer, mon script a joué sur ce serveur, puis ma commande d'arrêt a tué ce processus (pid 18584). Si une autre
  voie s'en servait, elle doit le relancer. Ensuite, j'ai vérifié que le port était libre avant de lancer.
- La dictée est simulée au banc (headless n'a pas de micro) : un `SpeechRecognition` factice qui écoute jusqu'à `stop()`. Seul
  l'état du bouton est prouvé, pas la reconnaissance réelle.
- La cause exacte de P8 au banc n'est pas reproduite (voir 1) ; la correction tient les deux causes plausibles, et le toucher au
  doigt marche au banc.
- La dernière retouche (le texte du bandeau suit la réponse, même clé) est prouvée par vitest seulement. Les captures Chrome ont été
  prises juste avant.
- Vu en passant, hors de ce lot : à 1280, le champ du bas paraît étroit (~270 px) dans la liste (`d1280-sombre-d18…`). Défaut
  existant, non mesuré.
- Les puces « Va dans » prennent deux lignes à 390 quand trois puces ne tiennent pas : c'est la consigne (passer à la ligne), mais
  cela coûte une ligne de hauteur au-dessus du champ.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un retour « … · Annuler » affiché pendant que l'IA tourne se complète sous la même clé (`id`), sans être remplacé ;
Annuler lit le retour courant par une référence.
LEÇON PROPOSÉE : avant de lancer un serveur sur un port, vérifier qu'il est libre (`netstat` et `curl`) et lire le journal de
démarrage. N'arrêter que le PID qu'on a soi-même lancé, jamais « celui qui écoute sur le port ».
