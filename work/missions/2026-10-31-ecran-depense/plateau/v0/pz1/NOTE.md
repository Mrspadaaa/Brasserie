# pz1 — p3c-3, le rouge sur le champ (froide)

**Chaleur** : froide. Le plateau de son choix p3c-3, repris tel qu'il l'a vu (`choix-v3c/img/p3c-3-geste-plateau.png`), affiné sur les
13 problèmes de sa capture, sans changer de forme.

**L'idée en une phrase** : le même plateau sous la rangée, mais chaque chose n'est dite qu'une fois, et le signal de D277 est posé sur le
champ même (l'unité rouge et en focus, l'article proposé en jaune pointillé, la quantité corrigée en bleu) ; les gestes rares tiennent sur
une seule rangée discrète en bas du plateau (extrait, corbeille), plus de « plus ».

## Baseline cochée (p3c-3)
- [x] la ligne « imprimé « … » · référence » (plus « TVA R ») : une fois, en 12 px ; le nom français reste sur la rangée (choix B du nom)
- [x] quantité, unité, × prix = montant sur une ligne ; l'unité est **un seul** contrôle (pilule « g ⌄ » ; rouge « unité ? » quand elle manque)
- [x] « ✓ au centime »
- [x] le segment Ingrédient · Service · Matériel ; le type fin (« Nettoyage ⌄ ») à côté quand c'est Service ou Matériel
- [x] la ligne article « article « … » · relié ⇄ Retirer » ; pour (b) : « article « Citra · récolte 2024 · α 13,1 » ⇄ » + raison + Relier · Citra bis · Nouvel article
- [ ] la mouture « Rattacher » : hors des six cas (aucune mouture dans la liste du brief) ; la forme de la ligne est gardée pour quand il y en a
- [x] le plateau dans la rangée, sous elle, dans la liste groupée (bande teintée, filet de famille), pied « Catégorie | Papier » + « Confirmer »
- [x] B du nom, d-lue (3 en bleu, 2 barré, « à la 3e lecture »), D277 (sûr = rien ; repris = jaune pointillé ; inconnu = rouge, sur le champ, focus)
- Récap du haut : celui de p3c-3, abrégé (les tuiles TVA/Payé ne sont pas montrées : hors du sujet du plateau).

## Les six cas
a Maris Otter (relié, rien ne clignote) · b Citra (proposé par l'IA, jaune, sa raison « même variété, autre α : 13,1 au stock, 12,5 lu », trois
sorties, jamais de doublon silencieux) · c Détartrant (Matériel · Nettoyage, « article · aucun », « Mettre au stock » à sa main) · d Lactose
(« unité ? » rouge en focus, le choix g kg Stk L sachet dessous, cadre rouge) · e Safale US-05 (3 en bleu, « 1re lecture : 2 », le champ bleu) ·
f Détartrant, « extrait de la page » ouvert, « Supprimer la ligne » en rouge au bout de la rangée des gestes rares.

## Honnêteté
Le prix de Safale US-05 (4,50) n'est pas dans le brief : repris de la ligne Windsor de sa facture 372765 pour que 3 × 4,50 = 13,50 soit vrai.
Les codes article (HO0012, ZU0031) sont des codes de fixture. Rien n'est créé au stock sans son geste (Relier / bis / Nouvel article sont des boutons).

## Contrôles (joués une fois, 02.11)
- `controle-panel.mjs pz1-b pz2-b pz3-b pz4-b` → remplissage médian 0,60, ressemblance 0,89, 0 double → **PANEL OK**
- `controle-commun.mjs plateau/v0 pz1 pz2 pz3 pz4 --page=etat.html --profil=sans-houblons --sans-lignes` → mots OK, couleurs OK, survol OK,
  blocs OK, contraste OK, standard OK, parlant OK, brutes OK → **COMMUN OK** (au-style, fiche, trait, légende sautés : profil sans houblons)
- `mots-premier-ecran.mjs` sans `--sans-lignes` : pz1 **166 mots** (la liste de facture compte ; D238 la sort du compte)
- `controle-contraste.mjs … --profil=sans-houblons` (clair) : pz1 pire « ✓ au centime » 4,92:1 → **CONTRASTE OK** ; en cave : capture ouverte
  (`pz1-b-cave.png`), l'outil ne prend pas `?theme=cave` (à mesurer en passe 2)
- `verifier-page.mjs etat.html --min-images 0` → **PAGE OK** (390 px, sans erreur)

## Boosters UX (boosters-ux)
- `unite` — choisir ; pilule-menu à la place du segment + champ (défaut 4) ; rouge et focus quand elle manque (défaut 11)
- `sortie-article` — choisir ; trois boutons nommés, la proposition en jaune avec sa raison (défaut 7, 8)
- `rares` — déclencher ; une rangée de 24 px, extrait et corbeille (défaut 9)
- B2 : un seul `primary` dans le plateau (Relier) ; B3 : 6 rangées, tient entre la rangée et le pied à 844 ; B13 : cibles 24 à 32 px.
