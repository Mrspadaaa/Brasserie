# Avis croisé : comment Suggérer classe les houblons au dry hop et à 60′

Il y a deux regards : le Brasseur (Fable) et le Contradicteur (Opus). Le pilote tranche. Le type de décision est « déléguée » : la
décision est réversible et touche une convention du moteur. Les listes produites seront montrées au brasseur, qui jugera en les
regardant.

## Question cadrée

Suggérer (`src/domain/hopIndex/v4/voies.ts`, `proposeVoies`) propose des ajouts de houblon pour une visée (plus d'agrumes, moins de
résineux…). Deux défauts sont mesurés le 26.10 (voie g1, `voies/g1-suggerer-moments/rapport.md`).

1. **Dry hop et chaud (arôme).** L'effet d'une famille citée ne dépend pas de la variété. Il dépend seulement du moment et de la
   dose : il y a une seule valeur pour les 233 houblons qui citent l'agrume. La liste se range donc par le nombre de familles
   citées, puis par la dérive d'IBU, puis **par ordre alphabétique**. Sur la 21C, « plus d'agrumes » au dry hop donne un premier
   groupe de 23 ex æquo : African Queen, Belma, Galaxy, Herald, Huell Melon… Sur le banc de 66 houblons, le premier groupe médian
   compte 53 houblons.
2. **60′.** Aucun ajout à 60′, aucune visée d'IBU. « Remplacer à IBU égal » propose des houblons d'arôme devant des amérisants :
   Monroe, 2,7 % d'α, en 96 g ; Aurum en 130 g.

Le brasseur a dit le 26.10 : « la suggestion doit être pour du 60' comme pour du dryhopping ».

### Décision A : la clé qui départage, au dry hop et à chaud
Elle s'ajoute après la distance à la visée, et ne change jamais la valeur des barres affichées. Options connues :
- **A1, proposition de g1, en cascade** :
  1. la fiche marque-t-elle la famille ?
  2. la famille est-elle le premier descripteur ?
  3. quelle part des fiches de sources la citent ?
  4. un signal d'huile par famille quand il existe, sinon l'huile totale : linalol ou géraniol pour l'agrume et le floral,
     myrcène pour le résineux, thiols pour le tropical.

  L'inconnu passe après le connu, jamais à 0. Mesure : 179 valeurs distinctes sur 233 pour l'agrume, au lieu d'une seule.
- **A2** : la part des fiches qui citent la famille, seule. Elle donne 17 valeurs distinctes.
- **A3** : mettre l'effet à l'échelle par variété. Cette option est écartée par g1, parce qu'elle change les barres : un « +34 »
  ne voudrait plus dire la même chose, et `pouvoir.ts` interdit une intensité de 0 à 100 présentée comme mesurée.
- **A4** : laisser l'IA reclasser les 20 premiers, sans clé dans le moteur. Mais ces 20 premiers vont de A à H par ordre
  alphabétique : l'essai ia1 l'a montré, l'IA ne retrouve pas ce qui n'est pas dans la fenêtre (MRR plafonné à 0,333).

Faits utiles :
- L'huile totale seule est un mauvais proxy : Altus est en tête de l'agrume **et** du résineux.
- Couverture des signaux : linalol 64 variétés sur 318, thiols 59, huile totale 301, mots des sources 302, radar Beer Maverick 181.

### Décision B : l'ordre à 60′ pour « plus d'amertume +n IBU »
Proposition de g1, dans cet ordre :
1. conflit de famille ;
2. dépassement de la bande d'IBU du style ;
3. usage : un amérisant ou un double usage passe avant un houblon d'arôme ;
4. α : moins de grammes ;
5. cohumulone ;
6. β.

La dose est exacte, calculée par `gramsForIbu`. Pour +10 IBU sur 20 L : de 4,5 g (Polaris, 20,5 % d'α) à 77,6 g (Teamaker,
1,2 %) ; aucune dose ne dépasse 5 g/L.

Le dépôt n'établit pas qu'une cohumulone basse ou un β haut rendent une amertume « meilleure » : ce sont des conventions de
brasseur. Couverture : α 318, usage 318, β 311, cohumulone 287. La même règle d'usage corrigerait « remplacer à IBU égal ».

## Contraintes
- Les barres de l'écran q2b, qu'il a choisi, ne changent pas.
- Hors ligne et sans serveur : le moteur tourne dans le navigateur, entre 1,4 et 6 ms.
- Honnêteté des données : l'inconnu n'est jamais un 0.
- Un facteur libre par écran ([[outils-houblons]]).

## Ce qu'on attend de toi (300 mots au plus)
1. Pour A : ton choix, avec la raison qui ferait le plus de tort si elle était fausse.
2. Pour B : garder, retirer ou réordonner chaque clé. Faut-il une cohumulone dans le rang, ou seulement en information à un
   toucher ?
3. Le piège que le pilote ne voit pas.

## Sources (ouvre-les seulement pour vérifier un point)
- `work/missions/2026-10-25-integration-houblons/voies/g1-suggerer-moments/rapport.md` (§ 1.2, § 1.4, § 2a)
- `cerveau/metier/descripteurs-hors-familles.md`, `cerveau/metier/substitution-moteur.md`, `cerveau/brasseur/penser-brasseur.md`
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` (pour le regard Brasseur)
