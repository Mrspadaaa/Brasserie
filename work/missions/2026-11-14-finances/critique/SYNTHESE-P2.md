OK — passe 2 : 5 montrables (s2bp2, s1bp2, s2ap2, s3bp2, s3cp2), aucun REJET ; la passe a progressé (22 défauts v0 sur 22 corrigés à l'image)

# Critique passe 2 — filtre « du … au … » dans Opérations v6a (14.11)

Juge : Opus (Fable interdit). J'ai ouvert en entier les 20 images et la référence `ref/v6a/v6a-page.png`.
Les montants ont été vérifiés pour la plage (toutes les opérations du 9 nov. ; loyer de 400,00 à payer le 25 nov. ; retard de 60,00 de déc. 2025).
Pour 1er–15 nov. et 3–17 nov., on attend Fixes 68,00, payé 325,40 (68 + 186,80 + 42 + 28,60), à payer 0,00 et dépensé 296,80 (le matériel est à part, comme dans v6a), avec 5 opérations.
Pour le mois entier, on attend 6 opérations. Les cinq variantes donnent ces montants.
Les calendriers sont justes : le 1er nov. 2026 tombe un dimanche, les 3 et 17 nov. un mardi, le 25 un mercredi.
Les glissements de 15 j sont justes : 17 → 31 oct. et 19 oct. → 2 nov. La plage à cheval du 15 oct. au 10 nov. fait 27 j.
Au repos, v6a est reprise telle quelle dans les cinq variantes : « ✓ Payé » 24 px, « + pièce » sous le montant, la pastille en retard et la rangée du bas complète.

## Tableau

| id | verdict | défauts v0 | défauts restants (neufs, numérotés) | correctif |
|---|---|---|---|---|
| **s2bp2** calendrier en feuille | **montrable** | 3/3 corrigés. Les ‹ › restent dans la pilule de plage (`-apres`). La feuille a un pied chiffré (à payer 0,00, dépensé 296,80, loyer hors plage 400,00). La pilule est bleu clair : « ✓ Payé » reste le plus foncé. | 1. Les ‹ › de la pilule de plage font 28 px, comme dans v6a (doute, non bloquant). 2. La feuille cache encore les piles pendant le choix ; le pied compense. 3. Le raccourci « mois passé » mène à octobre, dont l'état sans données n'est pas montré (doute). | 1. Donner aux ‹ › une zone de toucher de 44 px (::after), sans changer leur dessin. 3. Dans une plage sans données, écrire « octobre : aucune opération saisie » (inconnu ≠ 0). |
| **s1bp2** pilule étirée | **montrable** | 5/5 corrigés. On lit « 1er — 15 nov. ». Les bornes font 32 px. La ligne « hors plage » est sous Charges fixes, avec 400,00 en gris. La bulle « du … au : touche une date » s'affiche (`-geste`). La ligne 2 donne « 15 j · 5 opérations ». La bulle « lâcher : ‹ 17 → 31 oct. » est juste (`-appui`). | 1. En plage, la pastille « en retard » descend à la ligne 2 et le bandeau grandit de 34 px (écart déclaré). 2. Au repos, le signe |↔| reste un picto composé de 14 px. Doute seulement : ma règle d'étalonnage me défend de juger un picto composé « pas parlant ». 3. Le × est un rond isolé d'environ 26 px, sans zone de 44 px visible. 4. La plage à cheval « 15 oct. — 10 nov. » est annoncée mais pas dessinée. | 3. Donner au × une zone de toucher de 44 px. 4. Ajouter une image à cheval, montrée au brasseur avec la variante. |
| **s2ap2** frise à poignées | **montrable** | 4/4 corrigés. La frise est repliée au repos. Les poignées sont rondes, avec un halo et la bulle « 1er → 15 nov. ». La plage à cheval est montrée, avec « du 15 au 31 oct. · aucune opération saisie » (inconnu ≠ 0, juste). Le point de la vente est descendu sur l'axe. | 1. Au repos, l'icône de 14 px après « novembre » (une mini-frise avec ses poignées) est floue et ne se reconnaît pas en 3 s. C'est un doute, pour la même raison d'étalonnage que le |↔| de s1bp2. 2. Une fois dépliée, la frise ajoute environ 95 px au bandeau, et la liste descend d'autant à 390. 3. La barre du 9 (325,40) ne montre que le violet et l'or ; on ne voit pas le cyan ni le bleu (doute, à zoomer). | 1. Remplacer l'icône par un calendrier standard, ou l'agrandir à 18 px avec un trait plus épais. 2. Après « Voir », replier la frise en une piste de 24 px qu'un toucher redéplie. 3. Empiler les quatre couleurs sur la barre du 9, avec au moins 3 px par couleur. |
| **s3bp2** phrase aux dates touchables | **montrable** | 5/5 corrigés. Le repos ne montre que la puce « du _ au _ » (la phrase est retirée). La ligne « hors plage » est là. Un seul retour, « × novembre », et les ‹ › font glisser la plage. Les deux bornes ont le même style. Le 9 porte une barrette aux couleurs des catégories. | 1. `-ouvert` : le popover n'a pas de voile, et un bout du montant de la rangée Brassage dépasse à droite, sous le pied (y ≈ 1065). 2. `-ouvert` : deux paires de ‹ › sont visibles à la fois (pilule et calendrier) (doute). 3. La ligne « hors plage » prend deux lignes, alors qu'elle en prend une dans s2bp2 et s1bp2. 4. « 1er » n'est pas en exposant, alors qu'il l'est dans s1bp2 et s2bp2 (détail). | 1. Ajouter un voile léger comme dans la loupe de s3cp2, ou faire déborder le popover jusqu'au bord. 3. Mettre la puce « hors plage » sur la même ligne que le loyer (comme s2bp2). |
| **s3cp2** la loupe comprend une période | **montrable** | 5/5 corrigés. La puce est réduite à une icône de 32 px, et la rangée tient. Le calendrier est montré, et c'est le chemin principal. On lit « 5 opérations · loyer du 25 hors plage ». La loupe sert de raccourci, avec un champ « ou tapez ». La liste d'exemples se déplie au toucher (« exemples ⌄ »). | 1. `-calendrier` : le pied ne donne que « mar. 3 → mar. 17 nov. · 15 j », sans à payer, dépensé ni hors plage. L'effet n'apparaît qu'après « Poser », alors que s2bp2 et s3bp2 l'annoncent avant. 2. `-calendrier` : sans voile, la rangée Brassage est coupée à mi-hauteur sous le popover (y ≈ 1060), et la demi-ligne se lit mal. 3. `-apres` : le hors plage est dit deux fois (sous la pilule et dans la liste). 4. Le repos est devenu celui de s2bp2 : seule la loupe distingue désormais la variante (convergence, non bloquant). | 1. Ajouter au pied « à payer 0,00 · dépensé 296,80 · loyer du 25 hors plage 400,00 », comme dans s2bp2. 2. Ajouter un voile, ou faire finir le popover sur une limite de rangée. 3. Garder la ligne de la liste ; dans le bandeau, ne garder que « 5 opérations ». 4. Proposer la fusion s2bp2 + loupe (chemin bis). |

## Classement des 5

1. **s2bp2** : un calendrier à plage standard, un repos égal à v6a plus une icône, l'effet chiffré avant « Voir », les ‹ › gardés et une ligne « hors plage » d'une seule ligne. C'est la plus propre.
2. **s1bp2** : le réglage se fait sur place, sans rien qui couvre l'écran ; ses flèches glissent la plage, et la bulle d'appui annonce la plage d'arrivée. En plage, la pastille en retard descend d'une ligne, et la plage à cheval n'est pas dessinée.
3. **s2ap2** : on voit quand l'argent bouge, et c'est la seule variante qui dessine la plage à cheval avec « aucune opération saisie ». Dépliée, la frise est lourde ; l'icône du repos est peu lisible.
4. **s3bp2** : la phrase se lit bien et l'aperçu est juste. La puce de texte s'ajoute au repos, la ligne « hors plage » prend deux lignes, et le popover n'a pas de voile.
5. **s3cp2** : tout est corrigé, mais elle est devenue s2bp2 avec la loupe en plus, et son calendrier n'annonce pas l'effet. La loupe est une bonne greffe pour s2bp2.

## Phrases prédites du brasseur
- s2bp2 : « Là oui : je touche le calendrier, 1 puis 15, je vois ce que ça donne, et mes flèches restent. »
- s1bp2 : « Bien, je reste sur la même ligne, et les flèches avancent de 15 jours. »
- s2ap2 : « J'aime voir les jours où l'argent bouge, mais déplié, ça prend de la place. »
- s3bp2 : « Ça se lit comme une phrase, c'est clair. »
- s3cp2 : « Comme l'autre calendrier, avec la recherche en plus : pratique si je tape vite. »

## Retouches communes
- Une zone de toucher de 44 px pour chaque ‹ › et chaque × (s1bp2, s2bp2, s3cp2).
- Une image de la plage à cheval pour s1bp2, s2bp2 et s3bp2 (seule s2ap2 la montre).
- Fusion proposée : s2bp2 + la loupe de s3cp2 (chemin bis) + la bulle d'appui de s1bp2 sur ‹ ›.

LEÇON PROPOSÉE : aucune
