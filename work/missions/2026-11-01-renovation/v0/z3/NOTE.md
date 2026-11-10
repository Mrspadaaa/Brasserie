# z3 — « Local et travaux », la file dans Prévisions (chaude)

- **Chaleur** : chaude. Forme libre : la suite est une file verticale sur un rail, « Ensuite » en drapeau, un nœud numéroté et
  coloré par manque ; l'argent est celui des Prévisions (la caisse), le temps celui de ses heures.
- **Idée en une phrase** : dans Finances › Prévisions, le second onglet « Projets de matériel » devient « Local et travaux » (le
  mot de l'app) et montre la file de ce qui manque ; au jour 1, la nature se devine depuis le titre (achat + pose, achat, travail,
  hypothèse 2 de la fiche) et se corrige d'un toucher.
- **Axes** : place = Prévisions, Projets de matériel élargis (2) ; forme = file ordonnée (flèches) ; mot = « Local et travaux » ;
  argent = la caisse des Prévisions, « Caisse à renseigner » en ambre (comme « Prévision incomplète » de la base) tant qu'elle est
  inconnue, puis « Caisse 6 240,00 · après le connu 4 880,00 » en barre ; temps = les heures par manque (faites/notées), « fin :
  rythme à régler », jamais une date ; étapes = aucune.
- **Facteur libre** : la place, flèches ▲▼ (`ordre`), le rail et les numéros suivent.
- **Repris de la base** : en-tête, onglets Finances (Prévisions actif), « Anticiper les dépenses » et ses réglages, la
  sous-navigation « Échéances · Local et travaux », la rangée « Prévoir mes prochains paiements · Compagnon brasseur », barre du
  bas (Finances actif).
- **Données** : mêmes fixtures ; heures : sols 5/12 h, site 4/20 h → « 9 h faites sur 32 h notées » ; `ouvert` montre le site
  (Travail, pas d'achat, pas de 20 h, faites 4 h, fin : rythme à régler, bloqué par : chips rien / chantier / artisan / devis /
  argent).
- **Honnêteté** : « Aucun prix connu » au jour 1 ; « 2 prix à estimer, hors du connu » ; la barre de caisse ne compte que le
  connu ; aucune date.
- **États** : jour1, encours, ajout (nœud « 6 » et champ en tête de file, au-dessus du clavier), ouvert, depasse (nœud rouge,
  ligne « Sols : 1 384,50 pour 1 200,00 prévus · +184,50 »), caisse (+ `-apres`), fini, horsligne.

## Boosters UX (boosters-ux)
- Boosters : `ordre` — ajuster ; flèches ; la file se réordonne (joué par script) · `caisse` — déclencher ; lien ambre ; barre de
  caisse (captures `z3-caisse.png` → `z3-caisse-apres.png`) · `solde` — lire ; barre connu/libre · `nature` — choisir ; tag deviné,
  corrigé d'un toucher · `heures` — ajuster ; pas −/+ 1 h · `blocage` — choisir ; chips · `vue` — segment · `ouvrir`, `ajouter`,
  `noter`, `noter-achat`, `compagnon`.
- B1 OK — 12 `data-booster`, 2 effets joués. B2 OK — la file domine, une action noire. B3 OK — MOTS 48. B4 OK. B5 OK. B6 —
  12/13/14, 16 et 18 de la coquille. B7 OK — CONTRASTE OK (pire 5,17:1) ; COULEURS OK après l'ambre de « Caisse à renseigner »
  (un premier passage à 2 teintes : les nœuds bruns comptent comme alerte, 10° à 30°). B8 OK. B9 s.o. B10 OK. B11 — « voilà ma
  file, rien n'est chiffré, je dois renseigner ma caisse ». B12 OK. B13 OK — flèches 25 × 28, nœuds 26 px, tag nature 24 px.
- Écarts voulus : aucun.
