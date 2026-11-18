# Voie g7-reste — les trois restes de son ticket Bauhaus sur 60a8c25f

Agent : `auteur` (Sonnet). Plafond : 100 tours. Tu codes dans le worktree. Tu ne commites pas : le pilote commite par chemins.

## Contexte
- Son ticket : D328 à D337 (`work/refonte-frontend/decisions.md`). Le lot g les a corrigés dans le code (commit c7069922).
- Rejeu sur 60a8c25f (`voies/g6-rejeu/RESULTAT.md`) : 10 mesures sur 13 sont passées de KO à OK. Trois restent : M1, M5 en sombre, M11.
- Définition des mesures : `voies/g1-audit/RESULTAT.md` § 2. Le script de banc est `scripts/check-invoice-journey-emulator.mjs`.
- Rapports du banc, en lecture seule : `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/apres-G1|G3|G4/report.json.txt`. Captures au même endroit.
- Ses valeurs (noms d'articles, montants, fournisseur) ne s'écrivent nulle part : ni code, ni test, ni RESULTAT. Tes fixtures sont neutres.

## Ce que tu fais
1. **M1 (D328a)**. Deux rangées « à contrôler » restent sur sa pièce, d'un genre précis :
   - `kind: equipment` ;
   - unité imprimée vide ;
   - quantité × prix = montant.
   Règle nouvelle (D353, 02.11) : une ligne hors ingrédients (matériel, service) sans unité imprimée se lit en pièce. Quand le calcul tombe juste, elle est sûre : aucune marque (D277). Trouve la règle du signal de confiance, corrige-la, et écris un test Vitest qui échoue avant ta correction.
2. **M5 en sombre (D328d)**. Sous filtre (puces « neuf », « mouture », « à contrôler »), les rangées filtrées ont un fond ambre (102,88,55). Leur texte secondaire (154,138,126) donne un contraste de 2,1. Exemple : `apres-G4/390-18-g-brassage-sombre-puce-neuf-liste.png`.
   Dis d'abord si c'est l'éclair `.dp-p3c-garde` (1,6 s) ou un état qui dure.
   - S'il dure : chaque texte de ces rangées atteint 4,5:1 en sombre, par les jetons de `src/ui/depense/p3c.css`. Le clair ne change pas.
   - Si c'est l'éclair : la mesure du banc (`mesurerG`) attend la fin des animations. Corrige le script.
3. **M11 (D334)**. Le cas `g-remplir` ne trouve plus de puce « à remplir » : seule « 6 à contrôler » paraît. Sa mise en place touche « ⇄ Choisir un autre article » sur un nettoyant, sans choisir.
   Dis pourquoi, par le code du lot g.
   - Si c'est voulu : pose le cas autrement dans le script de banc, par une ligne à champ inconnu.
   - Si c'est un défaut : corrige-le.
   Ensuite, D334 doit pouvoir se mesurer : « 1 à remplir » ouvre la rangée ; le champ vide est marqué rouge, nommé, et le focus y est.
4. **D354 dans l'app** (02.11) : « on voit toujours un changement de relecture alors que en théorie on a tout accepté ? ».
   Après « ↻ Tout valider » (D313, D316), ou après l'acceptation d'un changement un à un, la rangée ne garde ni bleu ni ancienne valeur barrée.
   Lis le code. Si la marque reste, corrige-la, avec un test.

5. **« Regrouper en une dépense »** (D357, 02.11), sur `apres-G4/390-18-…` : « Toujours trop accessible, visible, et est-ce réversible ? ».
   Le retour existe depuis le lot g : « ↶ Rétablir » jusqu'à « Confirmer » (D332, M9 OK). Ne le casse pas.
   Lecture étroite : le bouton quitte la rangée de « + Ajouter une ligne », où il a le même cadre et le même poids. Il devient un lien discret, au bout de la ligne « Détail … » :
   - texte secondaire, sans cadre, 12 px ;
   - contraste 4,5:1 au moins dans les deux thèmes ;
   - cible de 24 px au moins.
   Test de composant : il échoue sur 60a8c25f, où le bouton est dans la même rangée que « Ajouter une ligne », avec un cadre.
6. **« Montant inégale ???? »** (D358, 02.11), sur « Détail » et ses deux montants, un centime d'écart, en jaune. L'écart d'un centime est l'arrondi suisse à 5 centimes : `confiance.ts:259` le classe `repris`, D270 ajoute la ligne « Arrondi à 5 centimes » à l'enregistrement. L'écran ne le dit pas.
   Correction du pilote (2e plainte après D261b, L13 : changer de genre) : l'arrondi devient sa propre ligne neutre à la fin des lignes, celle que D270 enregistre ; le détail égale le total, rien n'est signalé. Repli si un parcours casse : l'étiquette neutre « arrondi −0,01 ».
   Tout autre écart reste signalé comme aujourd'hui. Test : rouge sur 60a8c25f, vert après. Exemples neutres, pas ses montants.

## Hors périmètre
- Le plateau de la ligne ouverte : il sera refait après son choix (D345).
- Les menus déroulants (D350) : ils sont à relever, pas à changer.
- doc6 « Même achat » et la pastille TVA de doc14.
- Ne touche ni à `deploy-hosting-qr` (le critique y lit), ni à `source4-portable-bundle-manifest-01.json`, ni à `.codex/`, ni à `functions/.env`, ni à `firebase.json`.
- Aucun Gemini, aucun banc Chrome : le pilote rejoue le banc après toi.

## Contrôles (jusqu'au vert, 3 essais par point)
- `npm test -- <tes fichiers de test>` : rouge sur 60a8c25f, vert après. Garde les deux sorties dans `voies/g7-reste/`.
- `npm test -- tests/unit/depense` : aucun échec neuf.
- `npx tsc --noEmit -p tsconfig.app.json` (ou le tsconfig du projet) : 0 erreur.
- Build, manifeste vérifié avant et après :
  - `md5sum source4-portable-bundle-manifest-01.json`, qui doit commencer par 21dd75b3 ;
  - `npm run build`.
- `git status --short` : rien hors de « Possède » (MISSION.md, ligne g7-reste).

## Rendre
`voies/g7-reste/RESULTAT.md`.
- Ligne 1 : `OK — M1 <corrigé|…>, M5 <durable|éclair>, M11 <voulu|défaut>, D354 <déjà juste|corrigé>, D357 <fait>, D358 <fait>` ou `ECHEC — <raison>`.
- Puis, par point :
  - la cause, avec le fichier et la ligne ;
  - la correction ;
  - le test, rouge puis vert ;
  - les fichiers touchés.
- Lignes `LEÇON PROPOSÉE` et `CONNAISSANCE` si tu en as.
