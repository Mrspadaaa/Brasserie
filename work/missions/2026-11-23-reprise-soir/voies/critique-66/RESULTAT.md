OK — 8 problèmes, 5 bloquants

RESULTAT critique-66 : 8 problèmes (B 5, m 3, D 0) — corrigés rejoués 7/10 (C65-1, C65-2, C65-3, C65-7, C65-8, C64-1, C64-2 tenus ; C65-4, C65-5, C65-6 rouverts) — carnet identique oui — BUGS OK

Version : index-Rj9Pjhxu.js (curl ?nocache, onglet mis à jour par `maj.mjs`, `maj.log`). DOSSIER prime sur VOIE (qui citait SSQ_J86L).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2309 bugs, 528 ouverts, 202 sources).
Couvert : clair, 390 × 844, deviceScaleFactor 2, au toucher (CDP), Chrome de débug 9222, mon onglet seul ; fin : page.close() puis disconnect. Non couvert : 1280, sombre (DOSSIER), Calendrier (hors DOSSIER).

## À savoir d'abord (pilote)
- **Relevé avant / après identique** (avant.json, apres.json) : Synthèse, caisse, départ, Opérations, Mon mois, HABITUELS, à dépenser −463 (S53), cadre, période et localStorage, les 16 barres (même texte ; seuls « J82 → J83 » et « 24 → 25 nov. » ont bougé : minuit passé), puces Tous 37, Chambre froide (texte et 3 documents 837/9373/947), Houblons citra.
  - Documents changés : 12, tous à moi (3 carnets ZZ c66 et leurs messages, supprimés). Le carnet collier a été refusé une 1re fois par ma garde (placeholder vide), supprimé au 2e passage (`supp-carnet2.log`) ; puces revenues à Tous 37.
- **Coût IA : 0,046 CHF**, 7 lignes au journal (2 créations, 4 lectures de lien, 1 rangement). Collier (plafond simulé), joint et message Y (IA refusée) : aucun appel payant.
- **C66-1 m'a fait perdre un article ZZ** (MotlerHops) : je l'ai remis par son lien (lienQ4, 0,01 CHF).
- Lignes C65 : pas à moi (OWNS) ; verdicts ci-dessous, à reporter par le pilote. Non touchées : C61, C59-6, C59-8, LE-1, BD-1, PX (rien de neuf vu contre elles ; guet vide sur la vue R).
- Pas touché : « Choisir », « Déplacer vers » (la liste propose aussi ses carnets, dont Chambre froide), « Déplacer vers Houblons citra ? » (proposé après le lien MotlerHops, non touché).

## Corrigés rejoués (en ligne index-Rj9Pjhxu.js)
- **C65-1 tenu** : marmite ZZ ouverte, « Joint torique 20 mm : en racheter deux, l'ancien est fendu », IA réelle. L'IA rend carnetId = le carnet joint ; les deux notes (« Joint torique 20 mm, 2 pièces » à acheter, « L'ancien joint est fendu ») restent dans la marmite ; joint inchangé ; aucune carte « Rattacher » (0, au plus une) (X-fin, X-vise, message.log).
- **C65-2 tenu** : même marmite, IA refusée, « Collier de serrage 25 mm… » : rien dans le collier, aucun critère ailleurs (Y-fin, messageY.log). Reste : la phrase devient un critère de la marmite (n° 8).
- **C65-3 tenu** : tableau, ligne Brau « 13,6 · ? · ? », plus rien qui se chevauche (P-retire, R-carnet).
- **C65-4 rouvert** → n° 7. **C65-5 rouvert** → n° 3. **C65-6 rouvert** → n° 6.
- **C65-7 tenu** : Comparer, Origine « États-Unis » ×3.
- **C65-8 tenu** : lecture neuve Brau, Caractéristiques Alpha, Arômes, Origine en français (P-F1-2) ; reste « Ernte » chez hopfenmarkt (n° 6).
- **C64-1 tenu** : hopfenmarkt « 100 g · 67,00 CHF/kg · TTC · port 4,90 CHF ». **C64-2 tenu** : Brau « 0,1044 CHF/g · 80,00 CHF/kg dès 1 kg », Offre 80 CHF (mais n° 2).
- **Port D451, côte à côte avec maquettes2/v01** : cartes (gros CHF/kg, α, dispo, « 1 kg 62,20 »), toucher le prix → « Conditionnement de … · le choix fait le prix », glisser → Déplacer / Retirer, fiche MotlerHops (α en gros, arômes en couleur, « je prends », TVA d'import), barres « Prix au kilo, rendu », « Selon la quantité », « Compromis » : présents et fidèles. Écarts : n° 1, 2, 3, 5.

## Combien et quels problèmes ? 8
1. **B — C66-1** — Feuille Articles, carte glissée, Retirer : le bandeau « Article retiré · Annuler » est derrière la feuille. Toucher Annuler ferme la feuille sans rien remettre ; le bandeau expire, l'article est perdu (P-retire, P-annule, P-annule2). Geste sans effet.
   - Le brasseur : « J'ai fait Annuler, il est où mon houblon ? »
2. **B — C66-2** — Brau (vendu au gramme, 80,00 CHF/kg dès 1 kg) : « ? CHF/kg » sur la carte, au tableau et dans « Selon la quantité » à 1 kg ; la fiche n'a que 5 kg et 20 kg. Comparer et l'Offre disent 80. Sa maquette : au gramme, 1 kg 80,00, 5 kg, 20 kg (P-art-0, P-cond-2, P-F1-0, R-carnet). Valeur fausse, élément de maquette absent.
   - « Il est écrit 80 le kilo, pourquoi un point d'interrogation ? »
3. **B — C66-3 (C65-5 rouvert)** — Classement contradictoire : Hopfenmarkt 62 CHF/kg 1er, MotlerHops ≈40 2e (cartes, tableau, colonnes, « Choisir · Hopfenmarkt, 1 kg ») ; dans le même Comparer, les barres mettent MotlerHops 1er et le compromis dit « MotlerHops, 22 CHF de moins au kilo » (R-cmp-0, R-cmp-2). Valeur fausse.
   - « 40 c'est moins que 62, pourquoi il me fait choisir le 62 ? »
4. **B — C66-4** — Fiche hopfenmarkt, « je prends » coché 1 kg à 62,20 : le bloc Offre dit en gros « 6,70 CHF » (sachet de 100 g), et « Choisir · Hopfenmarkt, 1 kg » annonce « Part dans À venir : … 6,70 CHF » (P-F0-0, P-F0-2 ; non touché). Valeur fausse qui partirait dans ses finances.
   - « Un kilo à 6,70 ? »
5. **B — C66-5** — Comparer à 3 : égaux non repliés (Origine « États-Unis » ×3), seul le prix est coché (ni α ni récolte), ligne « Conditionnement g 100 / 50 / ? » (R-cmp-0, R-cmp-1, R-cmp-2). Sa maquette : lignes qui diffèrent d'abord, « identiques » replié, le meilleur coché par ligne. Élément de maquette absent.
   - « Ça c'est pas ce que j'ai choisi. »
6. **m — C66-6 (C65-6 rouvert)** — Fiche hopfenmarkt : « Année de récolte », « Récolte » et « Ernte » 2025 (trois fois, une en allemand) ; « Alpha » et « Acides alpha » ; « Bêta » et « Acides bêta » (P-F0-2).
   - « Pourquoi tout deux fois, et en allemand ? »
7. **m — C66-7 (C65-4 rouvert)** — Carte lue MotlerHops : « ≈3 CHF » et dessous « 50 g · 73,80 CHF/kg » (= 3,69, soit ≈4) (Q1-t12, Q1-fin).
   - « 3 ou 4 balles ? »
8. **m — C66-8** — Message tapé sans IA dans la marmite ouverte : il y reste, mais devient un critère « Ce qui compte » replié sous « 1 critère sans valeur à comparer » ; Notes reste à 2 (Y-fin, Y-critere).
   - « J'ai noté d'acheter des colliers, c'est passé où ? »

Bloquants : 5 (n° 1 geste sans effet ; n° 2, 3, 4 valeurs fausses ; n° 2 et 5 éléments de sa maquette absents).

### Doutes (non comptés)
1. C65-1 : aucune carte « Rattacher à … ? » alors que l'IA visait le joint ; « au plus une » est tenu, mais le brasseur ne sait pas qu'un autre carnet existe.
2. Pastille « Lu · CITRA® (US) 7✓ 10 s » posée sur le contenu de Comparer et du carnet (R-cmp-0, R-carnet), déjà vue au tour 65.
3. Comparer à 3 vendeurs : la 3e colonne (Brau) sort de l'écran à 390, se lit en défilant.
4. Fiche hopfenmarkt sans arômes (« Non publié par le vendeur : Arômes ») : honnête, mais la fiche n'a pas les pastilles de couleur de sa maquette.

## Table (captures 390 ouvertes : X-fin, X-vise, Y-fin, Y-critere, P-carnet, P-art-0, P-cond-2, P-glisse, P-vers, P-retire, P-annule, P-F0-0, P-F0-2, P-F1-0, P-cmp-0, R-carnet, R-F1-0, R-cmp-0, R-cmp-1, R-cmp-2 ; maquette v01-articles, v01-fiche, v01-comparer)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| X-fin, X-vise | clair | 390 | message dans la marmite ouverte, IA réelle | 0 | 0 |
| Y-fin, Y-critere | clair | 390 | message dans la marmite ouverte, IA refusée | 1 (n° 8) | 0 |
| P-carnet, R-carnet | clair | 390 | carnet pellets : tableau, Selon la quantité, Arômes | 2 (n° 2, 3) | 2 |
| P-art-0, P-cond-2, P-glisse, P-vers | clair | 390 | feuille Articles : cartes, conditionnements, glisser, Déplacer | (n° 2, 3 déjà comptés) | — |
| P-retire, P-annule | clair | 390 | Retirer puis Annuler | 1 (n° 1) | 1 |
| P-F0-0, P-F0-2 | clair | 390 | fiche hopfenmarkt | 2 (n° 4, 6) | 1 |
| P-F1-0, R-F1-0, Q1-t12 | clair | 390 | fiches Brau et MotlerHops, carte lue | 1 (n° 7) | 0 |
| P-cmp-0, R-cmp-0..2 | clair | 390 | Comparer à 2 et 3 vendeurs | 1 (n° 5) | 1 |

## Au fil (journal)
- lot0 : maj vers Rj9Pjhxu, relevé avant. lot2 : 4 carnets ZZ c66, 3 liens Citra, messages X (IA) et Y (IA refusée). port P : vue du port, Retirer → perte (n° 1). lot3 : MotlerHops remis, vue R sans retrait. lot7 : suppression des 4 carnets (collier au 2e passage), relevé après, onglet fermé.

LEÇON PROPOSÉE : un script qui joue Retirer puis Annuler doit chercher Annuler au-dessus de la feuille encore ouverte et vérifier le compte d'articles après ; s'il touche un Annuler masqué, il perd la donnée. Sur un carnet ZZ, prévoir de quoi remettre l'article (son lien).
