# Dossier du jury — refaire l'étape « Identité 1/7 » de l'assistant de recette (31.10, niveau rapide)

Méthode : `.claude/skills/jury/SKILL.md`. Le jury répond d'après ce dossier ; il n'ouvre une source que pour vérifier un
point précis. Mission de l'écran : `work/missions/2026-10-31-ecran-identite/MISSION.md`. Ce cadrage est l'entrée du lot de
mini maquettes (entonnoir, `.claude/skills/voies/references/entonnoir.md`).

## Hypothèse du pilote (confiance 60 %)
Sur l'étape Identité, le brasseur pose ce qui fixe la recette (nom, style, volume, durée d'ébullition, NOLO, matériel) et
vérifie d'un coup d'œil que son installation tient. Le reste (repères du style, calcul d'espace libre, détail du
matériel) se replie. Sous 70 % : on ignore s'il veut voir les repères du style au repos, et si l'espace libre du
fermenteur a sa place avant le choix de la levure (étape 4).

## Captures (2)
- `work/missions/2026-10-31-ecran-identite/brasseur-identite-avant.jpg` : sa capture de production, téléphone.
- `work/refonte-frontend/v4/ecran-1/base/captures/consolide-390.png` : l'étape Houblons choisie (base v4.10), même
  assistant ; son en-tête et son bandeau IBU · OG · EBC.

## Extraits, mot pour mot

**Ses mots sur cet écran** (`work/refonte-frontend/v4/SPEC-BRASSEUR.md`, l. 822 et MISSION.md de l'écran) :
- « Une fois terminé avec houblons on va refaire tout les écrans de l'app un à un comme houblons » (31.10).
- « On va tester tout ça en refaisant ce premier écran, identité dans la création de recette » (31.10).

**Ce que montre l'écran** (MISSION.md de l'écran, d'après sa capture) :
- l'en-tête « ‹ Identité 1/7 · Abandonner », les icônes « coller une recette » et thème, puis les onglets des 7 étapes :
  Identité, Malts/sucres, Houblons, Levure, Paliers, Eau, Récap. ;
- le bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 (curseur) · EBC 9,5, et le bouton « Coller une recette trouvée » ;
- le bloc « Identité » : nom, style (liste), « Repères du style · 22A · BJCP 2021 » repliable, volume en fermenteur
  (24 L), durée d'ébullition (60 min), « 3 L évaporés — autant d'eau à prévoir en plus dans la cuve » ;
- « Objectif NOLO · ≤ 0,5 % », case à cocher ;
- « Choix pour ce brassin » : « 24 / 30 L · 6 L libres », « Repère provisoire : 20 % d'espace libre, à ajuster selon la
  recette et la levure », « Espace libre choisi (%) » 20, « Remplissage conseillé » 24 L ;
- « Matériel du plan : Royal Catering · cuve 45 L », et un + flottant, posé sur « Remplissage conseillé ».

**Faits du code** (lus par le pilote, `src/pages/BrewWizard.tsx` l. 2112–2150 et 2335–2407) :
- L'icône de l'en-tête et le bouton « Coller une recette trouvée » ouvrent le même import (`setImporting(true)`).
- Commentaire du code : « Le chemin le plus rapide vers une recette complète : la coller. Ressaisir quatre malts, huit
  ajouts de houblon avec leur moment, la levure et les paliers prend vingt minutes et se trompe. »
- Le bandeau : « ce sont les quatre chiffres qu'un brasseur regarde en composant sa facture, et rien d'autre » ; il est le
  même à toutes les étapes sauf Eau ; sur une recette neuve, il est vide.
- « Repères du style » (`src/ui/BrewingStyleDetails.tsx`) : replié ; ouvert, les plages OG, FG, alcool, IBU, SRM, la
  source, et deux boutons « Proposer l'empâtage … » et « Proposer la conduite … ».
- « 3 L évaporés » : calculé du taux d'évaporation du matériel et de la durée.
- NOLO (`src/ui/NoloPanel.tsx`, 222 lignes) : la case ouvre un atelier entier (souches, sucres, mesures, simulateur).
- « Choix pour ce brassin » (`src/ui/RecipeInstallationChoice.tsx`) : l'espace libre conseillé vient de la levure ; un
  bouton « Reprendre le conseil de la levure » ; une alerte si le volume dépasse le fermenteur ; une case pour le
  rinçage à chaud au-delà des litres habituels (bouilloire annexe).
- « Matériel du plan » : « Adapter la recette à N L », « Adapter à mon matériel actuel · … », un résumé du matériel
  (`BrewEquipmentSummary`).
- Le + flottant est le lanceur général de l'app (facture, vente, recette, brassin, compagnon), gardé dans l'assistant.

**L'en-tête de l'assistant, ses mots** (SPEC-BRASSEUR) :
- Sur « Houblons 3/7 », maquette publiée (24.10, soir) : « Text header inutile ».
- Sur l'app déployée : « Aussi le header, bouger ces info sur le haut. » (« Brouillon repris sur cet appareil » barré,
  « Abandonner » à monter dans l'en-tête) ; « Et mettre le header et info en haut comme pour les hautes seul houblons a
  une variation.... Changé ça » ; « Tout cette partie là » (en-tête, onglets, brouillon, bandeau IBU · OG · EBC).
- « Fait attention aux header, footer, sur la continuité de l'app ect... » (24.10) : même en-tête et même pied d'un
  écran à l'autre (D129).
- Sur le bouton retour des outils : « Juste une croix bien positionné, facile, dans le thème suffirait » (23.10, D109).
- « Il faudra remplacer tout ça par le vrai Stepper de la vrai app » (23.10) : `WizardStepName`, `WizardStepRail`.
- « tu peux ajouter dans le header le choix de thèmes à côté de l'import » (25.10).
- Le registre `work/refonte-frontend/v4/choix/ecrans.json` : l'étape Houblons est « choisi » (« Ça c'est le bon »), avec
  `controle-stepper.mjs`. L'étape Identité n'y est pas.

**Sa règle d'écran** (SPEC § 3, PRODUCT.md) :
- « Il faut que ce soit dense sur téléphone car je veux voir un Max d'info au même endroit mais ça doit pas être
  surchargé, et surtout on doit voir que en premier plan les informations réellement utilise. Ensuite on peut trouver
  plus d'infos avec des raccords, renvoie, replis ou autre. » (18.10)
- « Ce que tu caches c'est les infos pas les actionable. » (C080) ; « regarde que les info sont des actionnable pas des
  "information, warning" ou explication » (C081) ; « pas d'info surplus en doublon ou inutile. » (C084).
- « BOUTON TOUJOURS TROP GROS IMPOSANT !! maximise la place !! » (C089) ; « réduir le header au stric minimum sur
  mobile » (C086).
- « plein d'outils UI à dispo autre que les boutons ou champs text » (C091) ; « Actuellement l'application est très
  textuel. » (C094) ; « plus de couleurs de quoi se retrouver facilement. » (C097).
- SPEC § 0 : « au premier plan seulement l'utile et l'actionnable, le reste à un toucher, 80 mots au plus. Pas d'écran de
  cockpit. » ; le thème de ses maquettes (page blanche, gris neutres) pour toute l'app.

**Produit** (PRODUCT.md) :
- « elle refuse d'inventer un chiffre plausible. […] Aucun champ n'arrive prérempli d'une mesure qui n'a pas été prise. »
- Scène : l'assistant de recette est rangé en « Cuverie » (téléphone, une main, attention fragmentée).
- « Le fermenteur fait 30 L : 24 L est un repère, pas son plafond physique. La place pour la mousse dépend du style, de
  la levure et du choix expliqué du brasseur. » ; « La cuve fait 45 L, avec une limite utile provisoire de 35 L à vérifier. »
- « Les recettes et brassins conservent leur profil matériel figé. […] adapter une recette existante est une action
  explicite qui recalcule aussi l'eau et son traitement. »
- « Les conduites spécialisées, dont lager et NOLO, conservent leurs phases, paramètres, conditions et bilans propres. »
- « Hors ligne d'abord. » ; « Une modification d'écran ne doit jamais forcer une modification de calcul. »

**Saisie** (`cerveau/produit/saisie-mobile.md`) : jamais `type="number"` ; chaque champ numérique porte sa borne.

## Les questions (réponse recommandée par le pilote après ➡️)
J1. Qui, dans quelle scène ? ➡️ Le brasseur seul, au bureau plutôt qu'en cuverie : on crée une recette avant le jour J,
    téléphone en main.
J2. Que vient-il décider ici, en un geste ? ➡️ « Quelle bière, combien, avec quoi » : nom, style, volume ; le reste en découle.
J3. Pourquoi maintenant ? ➡️ Écran textuel, en formulaire, sans représentation ; c'est le premier écran du programme.
J4. La réussite, mesurable ? ➡️ Le premier écran à 390 px montre nom, style, volume, ébullition, NOLO et l'état du
    fermenteur, en 80 mots au plus, sans défilement pour l'essentiel.
J5. Acquis à garder tels quels ? ➡️ L'en-tête et les onglets communs aux 7 étapes (choix Houblons), le bandeau des
    quatre chiffres, l'import collé, le hors ligne, la saisie sans `type="number"`.
J6. Déjà refusé ? ➡️ Cockpit, texte au premier plan, en-tête qui change d'une étape à l'autre, bouton imposant,
    superposition, « Text header inutile ».
J7. Contrainte et valeur qui gagne ? ➡️ Ne rien inventer (ni volume ni espace libre présenté comme mesuré) ; la densité
    utile gagne sur la pédagogie.
J8. Les mots ? ➡️ « Choix pour ce brassin », « Repère provisoire », « Matériel du plan » sont flous ; « Objectif NOLO » est
    son mot.
J9. Le code contre les sources ? ➡️ Import en double (icône et bouton) ; l'espace libre dépend de la levure, choisie à
    l'étape 4 ; le + flottant cache une valeur.
J10. Premier plan, repli, ailleurs ? ➡️ Premier plan : nom, style, volume, ébullition, NOLO, une jauge du fermenteur.
     Repli : repères du style, détail du matériel, rinçage à chaud. Ailleurs : l'espace libre fin, à l'étape Levure.
J11. Scénarios limites ? ➡️ Recette neuve (bandeau vide), recette collée, style inconnu ou créé, NOLO coché, volume au-delà
     du fermenteur, matériel différent du plan, brouillon en lecture seule.
J12. Hors périmètre ? ➡️ Les six autres étapes, le moteur, l'atelier NOLO lui-même, le schéma des données.
J13. Approches réalistes, goûts ou sources ? ➡️ (a) formulaire compacté, (b) carte « bière » à éditer sur place, (c) jauge
     du fermenteur au premier plan. Le choix entre elles est un goût.
J14. Suppositions implicites ? ➡️ À lister par le jury.
J15. Le vouloir réel ? ➡️ À dire par le Brasseur.
J16. Irréversible ou externe ? ➡️ Rien, tant que les données et le calcul ne changent pas.
J17. Le contrôle du bâtisseur : retiré au niveau rapide (Bâtisseur absent).
J18. Autre chose ? ➡️ À dire par le jury.
