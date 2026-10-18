# Refonte du rail de l'étape houblons (base v4) — brief auteur

Tu refais **le rail des étapes** de la base (index.html, cas-k2, cas-k3, cas-ebu45/120/200), après
l'intégration v3 (radar unique et fiche). Écris en français. Répertoire :
C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus). Texte avec barres
obliques inverses ou accents graves : outil Write, jamais `node -e` dans Bash.

## Ce que le brasseur a dit (mot pour mot, 18.10)

- « j'aimerais aussi pouvoir une fois mon houblons sélectionner pouvoir glisser comme un slider
  le moment de l'ajout » ; « Je veux choisir pas de 10' défini, pas de timing imposé hein » ;
  « Soit pas supide, c'est des tranche de 5'. »
- « toujours garder des variables dynamique car cela peut changer » ; puis, sur le réglage de
  l'ébullition posé sur l'étape : « C'est defini ailleur dans l'application... »
- « On a un 10' qui sort de null part. C'est pas encore ça, les possible ajoute d'houblon sont
  vraiment à la bonne place ? Pourquoi celui choisi à de l'ombre ? »
- « Que du j+3 SI on est en dehors du boil, le passage entre 10' et 5' de fait très mal car on
  doit passe au dessus des houblons... » ; « Le slider fonctionne pour le boil mais pas pour les
  autres étape, pas dechelle pour les autres que des choix fix » ; « Et le slider est clancky
  pas fluide du tout » ; « Probablement lié au recalcule de l'ibu pas forcément utile à la volée
  instantané.. »
- Ce qu'il a aimé : le visuel de p2, la levure intégrée au rail comme dans p8, le geste lui-même
  (« c'est l'idée »).

## Ce qu'il faut

1. **Un rail = une échelle continue, segment par segment**, chacun régulier :
   - ébullition : minutes restantes par tranches de 5′, de la durée de la recette à 0′ ;
   - whirlpool : température de 100 à 60 °C par 5 (et sa durée, réglable sur la carte) ;
   - la levure comme étape (fin du whirlpool, début de fermentation) ;
   - fermentation, puis post-fermentation : jour J+0 à J+14.
   Les repères écrits : la durée d'ébullition, 0′, les noms des segments et les moments des
   lignes de la recette ; pas de « 10′ » orphelin.
2. **Le rail ne porte que la recette.** Les ajouts proposés quittent le rail : une zone d'ajout
   à part, chaque carte avec son moment suggéré (« 10′ suggéré »), α, rôle, arômes en couleur ;
   un toucher l'ajoute et la ligne se pose à ce moment sur le rail.
3. **Le geste** : la carte suit le doigt en translation seule (aucun réordonnancement, aucun
   recalcul pendant le geste) ; l'étiquette du moment suit la tranche ; au lâcher, la carte
   s'accroche à la tranche, puis l'IBU de la ligne et le total se recalculent (tables du pack).
   Les autres cartes s'écartent sans être recouvertes ; ombre seulement pendant le geste ; un
   geste interrompu (pointercancel) rend la carte à sa place.
4. **L'ébullition** se lit dans la recette (« Ébullition 60′ » + renvoi vers l'endroit où elle se
   règle), sans champ ni −/+ ; le rail s'adapte à 45′, 120′, 200′ (pages cas-ebu45, -120, -200).
5. Garde tout le reste de la base v3 tel quel (radar, fiche, Ma bière, α, rôles, stock en icône).

## Référence d'interaction (qui passe le contrôle)

`C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\055d83f7-e384-467e-9f02-749828cb09f6\scratchpad\temoin-rail-positif\p01\`
(minimal, sans soin visuel : à habiller au visuel de la base).

## Contrôle, avant de t'arrêter

`node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/base --mots=80 --fill=0.8 --boosters=4 --recette --rail --detail --palette --radar --fiche --coherence --objets`
→ `LOT OK`. Le rail est jugé par `controle-rail.mjs` (D27, D28, D34 à D37, D41 à D46 ; lis son
en-tête). Capture toi-même le geste au doigt (avant, pendant, après) dans les trois segments, et
regarde-les. Trois passes au plus.
