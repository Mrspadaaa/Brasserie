# u1 — Une ligne par réglage

- **Chaleur** : froide (la fiche actuelle, gardée et resserrée).
- **Axe** : libre (série u, brief minimal) ; A1 à A6 non lus (consigne du pilote), à classer par lui.
- **Idée** : chaque réglage du brassin est une ligne, son nom à gauche, sa valeur à droite, sous le pouce ; le fermenteur se lit en une barre.
- Générateur des six concepts u : `v0/u1/gen-u.mjs` (`node gen-u.mjs`) ; mesure des bandes vides : `v0/u1/vides.mjs`.

## Baseline (hors périmètre, J12 : reprise telle quelle)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème
- [x] Fil des 7 étapes
- [x] Bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 · EBC 9,5
- Écart : « Coller une recette trouvée » retiré du corps (l'icône d'import de l'en-tête le porte) pour tenir les 80 mots.

## Obligatoire
- Honnêteté : évaporation « ≈ 3 L évaporés, estimé » (repli 10 %/h) ; cuve « ≈ 27 L, avant ébullition, estimé » ; repère « 24 L, estimé ». Rien d'inventé ; au-delà de 30 L, la barre passe en alerte et dit « N L de trop ».
- Premier écran, clavier fermé : nom, style, volume, ébullition, NOLO, fermenteur. 76 mots (`mots-premier-ecran --max=80` : MOTS OK). Aucune phrase explicative.
- Interdits : pas de cockpit, pas de légende, en-tête fixe, pas de badge 16D, pas de bouton imposant, pas de superposition (« 6 L libres » sorti de la barre), rien sous 12 px, `type="number"` : 0.

## Boosters UX (boosters-ux)
- volume — ajuster ; pas à pas −/+ 1 L ; barre du fermenteur pleine/hachurée ; vu : 31 L → barre rouge, « 1 L de trop » (`u1-apres.png`).
- ebullition — ajuster ; pas à pas de 5′ ; l'évaporation estimée suit.
- espace-libre — ajuster ; pas à pas de 5 % ; le repère pointillé et « remplissage conseillé » suivent.
- nolo — choisir ; interrupteur.
- style, materiel — choisir ; sélecteur à chevron ⌄.
- B1 OK — toucher joué : l'écran change (TOUCHER OK).
- B2 OK — dominante : la barre noire du fermenteur ; aucun bouton primaire.
- B3 OK — 9 lignes, 76 mots ; le détail (repères du style) au toucher du style.
- B4 OK — deux groupes nommés par le sens : la bière, le brassin.
- B5 à revoir — lignes de 68 px, plus amples que l'échelle compacte (choisi pour remplir l'écran sans texte).
- B6 OK — Source Sans 3 et Plex Mono tabulaire pour les mesures ; rien sous 12 px.
- B7 OK — `controle-contraste` (via commun) : OK.
- B8 OK — dépassement du fermenteur dessiné (rouge) ; inconnu jamais à 0.
- B9 OK — retour d'appui (`:active`) ; `prefers-reduced-motion` respecté.
- B10 OK — `type="text"`, aucun `type="number"`.
- B11 — « Une Double IPA de 24 L, 60 min, sans NOLO ; 6 L libres. »
- B12 OK — `controle-standard` : OK (rayons 8 px, traits ≈ 1,5 px).
- B13 OK — cibles de 40 px et plus.

## Contrôles (sorties)
- `verifier-page` : PAGE OK. `controle-panel` (série u) : PANEL OK, médiane 0,57 ; u1 = 0,46, seule sous 0,50.
- `controle-commun --sans=mots` : survol, blocs, contraste, standard, parlant, brutes OK ; couleurs, au-style, fiche, trait, legende ECHEC — contrôles des écrans houblons (familles, lentille au style, data-houblon, pictos, légende), sans objet sur Identité, qui n'a ni houblon ni famille. Couleurs : une seule teinte franche (EBC or).
- `controle-choix` : sans objet, Identité n'a pas de maquette choisie au registre.

## Ce qui tient, ce qui casse
- Tient : la lecture la plus proche de l'écran actuel ; tout se règle sans clavier.
- Casse : la plus « formulaire » de la série, 90 px vides en bas ; peu de surprise.
