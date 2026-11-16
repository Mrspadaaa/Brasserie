# Trousse d'identité — charger l'app dans une maquette

Pourquoi : « Ça semble pas du tout respecter l'identité global de l'app ?? » (15.11). Une maquette ressemble à un écran
de l'app, en clair et en cave. Tout vient du code (`src/theme/themes.css`, `tailwind.config.js`, `DESIGN.md`).

## Charger (depuis `voies/<série>/<id>/etat.html`)
```html
<link rel="stylesheet" href="../../../outils/identite/identite.css">
<script src="../../../outils/identite/chrome.js"></script>
<body data-chrome="onglet" data-sous="brassins" data-compteur-brassins="5"> <main>…ta maquette…</main> </body>
```
- `?theme=clair|cave` : thème (clair par défaut). `?etat=…` reste à la maquette.
- `data-chrome="onglet"` : en-tête de l'app, sous-onglets Brassins / Recettes / Atelier / Volumes, barre du bas
  (« Brassins » active), bouton +. `data-sous="aucun"` retire les sous-onglets (fiche plein écran).
- `<section data-chrome="feuille" data-titre="…" data-sous-titre="…">…<div data-pied>…</div></section>` : feuille de l'app.
- `<i data-icone="thermometer"></i>` : icône lucide (liste : `IdTrousse.noms` dans la console).
- Démo complète : `demo/etat.html` (`?etat=feuille` montre lecture, curseur m2, puces, boutons).

## Composants (préfixe `id-`)
Texte : `id-display` 28/600 · `id-title` 18/600 · `id-section` 16/600 · `id-body` 14 · `id-label` 12 · `id-commande` 13 ·
`id-reading` (mono 16/600, `id-reading-grand` 28) + `id-reading-unite`. Encres : `id-t-fort`, `id-t-courant`,
`id-t-second`, `id-t-action`, `id-t-hop`, `id-t-water`, `id-t-alert`, `id-t-attention`.
Boutons : `id-btn` + `id-btn-primaire` (un par écran) / `-secondaire` / `-danger` / `-fantome` ; `id-btn-icone` ; `id-lien`.
Surfaces : `id-panneau`, `id-sureleve`, `id-filet`, `id-carte` (+ `-corps`, `-ref`, `-titre`, `-meta`, `-pied`).
Marques : `id-pastille[data-ton=hop|water|cuivre|eteint|alert|attention]`, `id-style[data-teinte=lime…]`, `id-puce`,
`id-segments`. Curseur m2 : `id-curseur` (`-grads`, `-zone`, `-rail`, `-tic`, `-cible`, `-pouce[data-vide|data-hors]`, `-range`).
Les zones de toucher atteignent 44 px par `::after`, le dessin garde l'échelle compacte de l'app (24 / 28 / 32 px).

## Ce que la maquette garde à elle
Son idée, sa composition, ses graphes et ses marques de données, dans un `<style>` à classes préfixées par son id (L26).
Couleurs, polices, tailles et rayons : seulement par `rgb(var(--jeton))` et l'échelle ci-dessus.

## Couleurs permises pour les données
Familles d'arômes : `src/ui/hopIndex/familyTokens.ts` (base, texte, fond). Styles : `id-style` seulement (BeerStyleTag).
Sémantique : `--hop`, `--water`, `--alert`, `--attention` (+ `-texte`). Bière : `--ebc-gold/amber/copper/brown/stout`.
Rubriques : `--area-*`. Rien d'autre.

## Interdits (contrôle : `outils/controle-identite.mjs`)
Graisse > 700 · texte > 28 px · couleur hors jetons · police autre que Source Sans 3 / IBM Plex Mono · rayon hors
10 / 16 / 24 (4 ou rond pour une marque fine) · `type="number"` · point décimal (virgule : 1,018).
