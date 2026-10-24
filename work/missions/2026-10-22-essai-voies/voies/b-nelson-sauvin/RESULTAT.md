OK — note descripteurs-hors-familles : cause de Nelson Sauvin « ordinaire », trois corrections chiffrées

Voie b-nelson-sauvin, mission 2026-10-22-essai-voies. Aucun code modifié.

## Fichiers écrits
- `cerveau/metier/descripteurs-hors-familles.md` (note du cerveau, corps de 35 lignes sur 50)
- `work/missions/2026-10-22-essai-voies/voies/b-nelson-sauvin/ANNEXE.md` (tableaux mot par mot, catalogue, essais des corrections, profil simulé, profil V5.5, six scripts recopiés)
- ce fichier
Les scripts jetables (vite-node, moteur réel du prototype) sont restés dans le dossier temporaire de la session. Rien d'autre n'a été écrit dans le dépôt.

## Critères (essai 1 sur 3 chacun)
- G1 : `node scripts/agents/systeme.mjs note cerveau/metier/descripteurs-hors-familles.md --exiger "Constat,Cause,Preuves,Options" --contient "Nelson Sauvin,Motueka,Citra,Saaz,Galaxy,correspondance-familles.json,pack-fiches.json"` → `NOTE OK`
- G2 : `node scripts/agents/systeme.mjs cerveau --voie --min-notes 3 --min-lecons 12 --fichiers cerveau/metier/descripteurs-hors-familles.md` → `CERVEAU OK (28 notes, 20 leçons)` (avertissement seulement : la note n'est pas encore dans la carte d'INDEX.md, qui appartient au pilote)
- G3 : `node scripts/agents/systeme.mjs note work/missions/2026-10-22-essai-voies/voies/b-nelson-sauvin/ANNEXE.md --contient "Nelson Sauvin,Motueka,sans famille"` → `NOTE OK`

## Ce qui est établi (détail : la note et ANNEXE.md)
- Nelson Sauvin : 12 mots, 2 rattachés, 10 sans famille (83 %), rang 1 sur 180 houblons de 6 mots ou plus (catalogue : 22 %). Ses 9 vrais descripteurs (vin blanc, groseille à maquereau, raisin, sauvignon blanc, fruité) ne sont rattachés à rien ; les 2 familles montrées (Agrumes 1/2, Épicé 1/2) viennent seulement de la ligne « Familles déclarées » de Hopsteiner.
- Cause en quatre maillons : lexique fermé (`hops.ts:10`, `hopExtrapolationCore.ts:49-59`, `hopExtrapolationBootstrap.json` axes[].terms) ; orphelins écrits en petit hors de tout dessin (`hops.ts:81`, `fiches.ts:54`, `l8g/noyau.mjs:324,382`) ; ligne catégorie qui reste seule ; force répartie sur les seules familles reconnues (`profil-simule.ts:283`) : Nelson Sauvin 4 g/L en dry hop = Agrumes +14,3 et Épicé +14,2, contre Tropicaux +38,8 et Agrumes +35,2 pour Citra.
- Motueka : 9 mots sur 12 rattachés, Agrumes cité par les deux fiches (« marqué », barre deux fois plus haute que toute barre de Nelson Sauvin). Le niveau compte des fiches, pas une intensité ; Motueka est fidèle à ses sources, c'est Nelson Sauvin qui est sous-décrit.
- Captures ouvertes en image : `l8g-fiche-390.png` (Nelson Sauvin), `l5f-fiche-390.png` et `l5f-etat-b-390.png` (Motueka, grille) ; elles montrent exactement les sorties du moteur mesurées.

## Doutes et limites
- Le brief range `correspondance-familles.json` parmi les fichiers du « rattachement des mots aux 12 familles » : ce n'est pas le cas. Il porte composé→famille, poids de forme (1 / 0,5 / 0) et λ = 0,5. La table des mots est dans `src/data/hopExtrapolationBootstrap.json` (axes[].terms). La note le dit et cite les deux fichiers.
- Mesures faites sur `prototypes/houblons-v4/data/proto-data.json` (318 variétés), pas sur la base vivante de l'app.
- « Saaz » = Saaz (CZ) (`beermaverick-saaz-cz`), seule des trois Saaz avec fiche Hopsteiner ; Saaz n'a pas de composés au dépôt, donc pas de profil simulé.
- Le fruit de la passion, cité dans le brief pour Nelson Sauvin, n'est dans aucune fiche de Nelson Sauvin du dépôt ; seuls vin blanc, groseille, raisin, sauvignon blanc le sont (et « tropical » dans deux fiches communautaires non lues). Je ne l'ai pas inventé.
- Option C : seules les parts de forme sont calculées ; les points des 12 familles ne le sont pas (le moteur n'est pas modifié). Les efforts (1 h, ½ à 1 jour, 2 à 3 h) sont des estimations, pas des mesures.
- La liste de mots génériques de l'option B (fruité, noble, mild, sweet…) est une liste d'essai, pas une décision.
- Aucune interface produite : pas de capture nouvelle à valider. Pas de navigateur lancé.
- `git status` montre des changements d'autres voies ou du pilote (CLAUDE.md, docs/agents/, autres notes du cerveau) : pas les miens.

DÉCISION À PRENDRE : quelle correction retenir pour que Nelson Sauvin paraisse ce qu'il est ?
- A, rattacher gooseberry et « groseille à maquereau » aux Petits fruits (table du prototype, environ 1 h) : Nelson Sauvin gagne Petits fruits 2/2, part d'Épicé 50 → 25 %, 7 houblons changent de niveau ; ne règle pas vin blanc, raisin, sauvignon blanc.
- B, montrer la part « autres » plafonnée (barre neutre ni hachurée ni colorée, concepts dédoublonnés, mots génériques écartés ; ½ à 1 jour) : Nelson Sauvin 4 concepts, Motueka 1, Citra 1, Saaz 0, Galaxy 2.
- C, partager la force avec « autres » (`profil-simule.ts:283`, 2 à 3 h plus régénération du lot 21) : corrige « Épicé = Agrumes » mais n'a de sens qu'avec B.
- Ma recommandation : A puis B, C seulement une fois B vue sur la fiche du lot 22. Au brasseur : gooseberry = Petits fruits ? liste de mots génériques, seuil et plafond de « autres ». Au conseil ou au pilote : C, convention du moteur.

CONNAISSANCE : le niveau d'une famille (cité, marqué) vient du nombre de fiches qui la citent, jamais d'une intensité ; la table mot→famille vit dans `hopExtrapolationBootstrap.json`, pas dans `correspondance-familles.json` ; le profil simulé répartit la force sur les seules familles reconnues, donc un houblon dont les mots sortent du lexique est concentré sur peu de familles, pas affaibli ; la classe Hopsteiner « Thiol impact » (Nelson Sauvin forte) existe au dépôt mais n'est lue que par `yeast.ts:84`. Tout est dans la note `descripteurs-hors-familles`, à ajouter à la carte d'INDEX.md sous metier/.

LEÇON PROPOSÉE : compléter L14 par un contrôle chiffré, car « vérifier 3 à 5 houblons de référence » n'a rien fait échouer. Contrôle à écrire : pour chaque houblon de référence, part de mots sans famille (Nelson Sauvin 83 %, Hallertau Blanc 67 %, Motueka 25 %, Citra 11 %) ; échec au-delà de 50 % si une part « autres » n'est pas visible ; témoin négatif : la version l5f rejetée. Rôles : auteur, relecteur.
