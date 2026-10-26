# Couverture — Freestyle Hops (c3f, #180)

Relevé du 26.10.2026. Source : `https://www.freestylehops.com`. Sortie : `src/data/hopSources/freestylehops.json` (19 fiches, 15,8 ko).

## Hôtes et requêtes
| Hôte | Réponse | Requêtes |
|---|---|---|
| www.freestylehops.com | 200 partout ; aucun 401, 403, 429 ni défi | 22 sur 80 permises |

Détail des 22 requêtes (journal : `journal-requetes.json`, une ligne par requête avec l'heure) :
- `/robots.txt` : 1. `User-agent: *` : `Allow: /`, `Content-Signal: search=yes, ai-train=no, use=reference`. ClaudeBot, Claude-Web et anthropic-ai y sont interdits nommément ; l'agent utilisé est celui du script (`LAffinee-Hop-Reference-Audit/1.0`), couvert par `*`, et par l'autorisation déclarée de l'utilisateur (26.10).
- `/sitemap.xml` et son sous-plan : 2.
- Les 19 pages `/hop-varieties/<x>/` : 19. Cadence mesurée : au moins 2,1 s entre deux requêtes, une seule à la fois.
- Aucune page de `/hops/` (boutique, des centaines de lots), ni `/documents-2/`, ni `/hops/search` : hors du périmètre de la voie (« seulement les pages de variétés »).
- Aucun PDF : aucune page variété n'en lie un. Aucune lecture d'image.

## Ce que les pages publient
Chaque page variété porte seulement un texte d'arôme et d'usage (1 à 5 paragraphes). **Aucun nombre d'analyse** : ni α, ni β, ni cohumulone, ni huile, ni composé d'huile. Les seuls nombres sont des valeurs de produit sur quelques pages (mélanges et extrait).

## Variétés
19 pages : 10 rattachées au catalogue, 9 sans correspondance, toutes gardées.

| Fiche | Nature | varietyId |
|---|---|---|
| Nelson Sauvin (« Freestyle Nelson Sauvin ») | variété | beermaverick-nelson-sauvin |
| Motueka | variété | beermaverick-motueka |
| Riwaka | variété | beermaverick-riwaka |
| Nectaron (« Nectaron® by Freestyle ») | variété | beermaverick-nectaron |
| NZ Cascade | variété | beermaverick-cascade |
| Rakau | variété | beermaverick-rakau |
| Southern Cross | variété | beermaverick-southern-cross |
| Waimea | variété | beermaverick-waimea |
| Pacifica | variété | beermaverick-pacifica |
| Wakatu | variété | beermaverick-wakatu |
| Peacharine® | variété (sélection du programme de Freestyle) | null (absente du catalogue) |
| Kohia Nelson™ | mélange (Nelson Sauvin, Rakau, fruit de la passion) | null |
| Limequat™ | mélange (page `maui-nelson-2`) | null |
| Mega Motueka | mélange (Motueka + Phantasm) | null |
| Super Sauvin | mélange (Nelson Sauvin + Phantasm) | null |
| Tropical Fusion™ | mélange (Riwaka, Southern Cross, Motueka) | null |
| Maui Nelson™ | produit (houblon infusé de fruit, liquide) | null |
| SubZero Hop Kief® | produit (extrait cryogénique) | null |
| The Singles Collection | coffret (Nelson Sauvin, Riwaka, Waimea, Rakau) | null |

Nelson Sauvin, Motueka, Riwaka et Nectaron : présents, avec des mots d'arôme et des stades de récolte, sans aucun nombre.

## Champ par champ (nombre de fiches sur 19)
| Champ | Fiches | Remarque |
|---|---|---|
| α, β, cohumulone, colupulone, huile totale | 0 | non publiés sur ces pages |
| **linalol** | 0 valeur ; cité sans nombre sur Mega Motueka (`composesCites`) | « lot au plus fort mélange de précurseurs de 3SH, de linalol et de géraniol » : qualitatif |
| **géraniol** | 0 valeur ; cité sans nombre sur Mega Motueka | idem |
| **farnésène**, **β-pinène**, **sélinène** | 0 | jamais nommés |
| myrcène, humulène, caryophyllène, xanthohumol | 0 | |
| thiols (liste de noms) | 2 | Mega Motueka : 3SH ; Super Sauvin : 3SH, 3S4MP, 3SO (précurseurs liés, sans concentration) |
| descripteurs d'arôme (mots courts) | 15 | repérés dans le texte par un vocabulaire fermé |
| accords (variétés citées avec « pairs well ») | 5 | Nelson Sauvin, Rakau, Southern Cross, Waimea, Peacharine |
| composition (mélanges, coffret) | 5 | |
| stades de récolte (early / mid / late) | 7 | |
| lots du coffret (variété, récolte, 3 mots) | 1 | The Singles Collection : liste de mots courts publiée telle quelle |
| sucres (brix, g/kg) | 1 | Kohia Nelson : 0,45 brix ; 4,5 g de sucres totaux par kg de granulés |
| dosage whirlpool recommandé | 2 | Mega Motueka, Super Sauvin : « à partir de 4 g/L » (min 4, sans max) |
| éthanol, volumes de bouteille | 1 | SubZero Hop Kief : ~24 % en poids ; 275 mL, dont ~260 mL utiles |

## Doutes
- **Peu de matière pour le catalogue.** Ces pages ajoutent des mots d'arôme et des accords par variété, pas un seul nombre d'analyse. Pour le linalol, le géraniol, le farnésène : rien de plus que ce que publient déjà les autres sources.
- **Descripteurs : extraction par mots.** Ils sont repérés par un vocabulaire fermé dans le texte, sans les mots niés (« none of the pine notes ») ni les phrases d'accord. Ce n'est pas la liste que Freestyle publierait ; seul le coffret donne des listes de mots explicites. À trier avant fusion. « Nectaron » ne rend que « tropical » : son texte est très court.
- **Accords** : « SOX » (Waimea) est gardé tel que publié, non résolu.
- **Terpènes alcools** : la page Southern Cross dit « huge quantities of terpene alcohols » : qualitatif, non recopié.
- **Les fiches d'analyse (α, huile, terpènes) de Freestyle** sont sans doute sur `/documents-2/` ou dans les pages produit `/hops/…` : jamais lues, hors périmètre. Voir la décision dans RESULTAT.md.
- La page `maui-nelson-2` est en fait Limequat (titre de la page) ; `maui-nelson` est le liquide infusé.
- L'autorisation du fournisseur est déclarée par l'utilisateur ; l'agent ne l'a pas vérifiée.
