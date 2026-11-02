# Brief commun : la vue détail d'une ligne (le plateau), mini maquettes v0 (02.11, soir)

**La question du lot** : une ligne de facture ouverte au téléphone. En un coup d'œil, est-elle juste ? En un geste au pouce, il règle ce
qui manque : l'article du stock, l'unité, la nature. Rien d'autre à l'écran.

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- 02.11, sur sa capture `C:/Users/mrspa/.claude/uploads/16fc09ec-4e69-48a9-9744-5912b6ef6552/0da2b97e-image.jpg` (DURGOL EXPRESS ouvert,
  « plus » ouvert) : « Cette vue là de détails doit être refait, fait moi des mini maquettes pour résoudre les problèmes, rendre le
  workflow, process plus simple, sur téléphone notamment. Mapping peut utiliser l'ai su besoin » (« su » : « si »).
- « J'ai un champs à remplir, je sais même pas lequel ???? » ; « C'est même pas mis au c'est ingrédient, service ou matériel » ;
  « le filtre d'erreur rouge […] jamais sur l'item en question ??? La partie la plus importante n'est jamais montré ??? ».
- 31.10 : « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit ».
- D277 : « sûr ou quasiment sûr, rien. / Pas sûr mais repris, flag jaune. / […] ne sait pas, flag rouge, je dois remplir ».

## Ce qui ne va pas sur sa capture (le pilote, « combien et quels problèmes », 13)
1. Le bandeau collé « Nettoyage » mange la rangée du dessus. 2. Le nom est dit quatre fois : la rangée, sa version barrée, « imprimé »,
« Libellé de la facture ». 3. La phrase « unité Stk déduite · 1 × 9,5 = 9,50 : des pièces · à contrôler » est longue et technique.
4. L'unité a deux contrôles, le segment « Stk g kg » et le champ « Stk ». 5. Les champs montrent « 9,5 » au lieu de « 9,50 ».
6. Le segment dit Ingrédient pour un détartrant. 7. L'article est dit trois fois : « article « ? » · à choisir », « Chercher dans le
stock », la pastille « article ? ». 8. « plus » rouvre l'ancien formulaire : libellé, « Type d'achat » (en double du segment), extrait,
« Réception en stock », « Mettre en stock : oui », « Ajouter à un article existant ». Ce dernier contredit « à choisir ». 9. La corbeille
est perdue dans « plus ». 10. Le plateau fait plus d'un écran ; « Confirmer » est en bas, alors que le détail continue. 11. Le rouge
(article à choisir) est sur le nom, pas sur le champ à remplir. 12. Le nom barré (« DIRGOL ») ne dit pas si c'est une correction ou une
traduction. 13. Le pied porte en plus une puce « ⓵ Payé le ».

## Obligatoire, et rien d'autre
1. **La baseline : son choix p3c-3**, une base à enrichir et non un plafond (L07). Image : `choix-v3c/img/p3c-3-geste-plateau.png` ; sa
   maquette jouable : `choix-v3c/` (ouvre `index.html`, puis la maquette p3c-3). Ce qu'elle a fixé :
   - la ligne « imprimé « … » · référence » ;
   - quantité, unité, × prix = montant sur une ligne ;
   - « ✓ au centime » ;
   - le segment Ingrédient · Service · Matériel ;
   - la ligne article « article « … » · relié ⇄ Retirer » ;
   - la mouture « Rattacher » ;
   - le plateau dans la rangée, sous elle, dans la liste groupée (bande teintée, filet de famille), et le pied « Catégorie | Papier » +
     « Confirmer ».
   Ses choix voisins restent : B du nom (`choix-nom/img/b-depense.png` : le nom français sur la rangée ; l'imprimé au plateau et à la fiche),
   d-lue (`choix-lenteur/img/d-lue.png` : une valeur corrigée par la 3e lecture, en bleu, l'ancienne barrée), D277 (sûr = rien, repris =
   jaune pointillé, inconnu = rouge, sur le champ même). Coche chaque point dans ta NOTE, ou dis lequel tu quittes et pourquoi.
2. **Les six cas, dans chaque variante**, ouverts tour à tour dans une vraie liste groupée (rangées voisines, bande, pied) :
   - (a) un malt relié, sûr : « Maris Otter » 6 Kg × 2,30 = 13,80, relié à l'article du stock « Maris Otter » ;
   - (b) un houblon absent du stock. Le stock a « Citra · récolte 2024 · α 13,1 », et la ligne dit « Citra 12.5% » 100 g × 0,098 = 9,80.
     Le mapping peut passer par l'IA : elle propose de relier à l'article existant, ou un article « bis » (même produit, autre donnée), ou un
     nouvel article dont elle remplit la fiche. Jamais un doublon silencieux, jamais un écrasement ;
   - (c) un nettoyant hors stock, sûr : « Détartrant express 1 L » 1 × 9,50 = 9,50, Matériel, aucun stock ;
   - (d) une unité illisible : « Lactose » 1 ? × 6,20. L'unité est à remplir, en rouge, sur le champ, nommée ; le focus y va ;
   - (e) une valeur corrigée par la 3e lecture : « Safale US-05 », quantité 2 devenue 3 (d-lue) ;
   - (f) les gestes rares : supprimer la ligne, voir l'extrait du document, le type d'achat fin (Emballages, Nettoyage, Entretien…). Où
     sont-ils, et sans encombrer ?
3. **Le téléphone d'abord** : 390 × 844, au pouce. Chaque plateau tient entre la rangée et le pied, sans défiler. Cibles d'au moins 24 px,
   sans chevauchement. Texte d'au moins 12 px, contraste d'au moins 4,5. Aucun `type="number"` ([[saisie-mobile]]). Puis 1280, en un coup
   d'œil.
4. **Honnêteté** : une proposition de l'IA se dit proposition (repris, jaune), avec sa raison en mots courts (« même variété, autre
   récolte »). Rien n'est créé au stock sans son geste ou sa confirmation. Aucun chiffre inventé. Un appel d'IA coûte quelques centimes ;
   s'il est fait à la demande, le geste le dit.
5. **Les deux thèmes**, clair et sombre (`data-theme='cave'`), avec les jetons de `src/theme/themes.css`.
6. **Interdits techniques** : page statique, aucune requête réseau, préfixe de classes par variante (L26). Aucune donnée personnelle.

## Indicatif
- Les skills `boosters-ux`, `impeccable`, `ui-design-system` avant de dessiner ; `.claude/rules/affinee-frontend.md`, DESIGN.md,
  `docs/ui-compacte.md`, `cerveau/brasseur/pas-de-cockpit.md`, `cerveau/brasseur/glossaire.md`.
- Le code d'aujourd'hui : `src/ui/finance/ExpenseSheet.tsx` (plateau vers la ligne 900), `src/ui/depense/Ligne.tsx`. Lecture seule.
- Les contrôles du lot, joués une fois, leurs sorties recopiées dans la NOTE : `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs
  <etat.html> --profil=sans-houblons`, `mots-premier-ecran.mjs`, `controle-contraste.mjs`, `node scripts/agents/verifier-page.mjs <etat.html>`.

## Rendre, par variante (`plateau/v0/<id>/`)
`etat.html` (les six cas, chacun dans son état ouvert, et un état au repos), une `NOTE.md` courte (chaleur, l'idée en une phrase, la
baseline cochée, les sorties des contrôles), des captures à 390 de chaque cas ouvert, en clair, plus un cas en sombre, et une à 1280.
Ouvre chaque capture avant de rendre (L12).
