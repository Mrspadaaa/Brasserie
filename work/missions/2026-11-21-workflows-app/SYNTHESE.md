# Synthèse des workflows de toute l'app (21.11)

Sources : `ANALYSE-produire`, `-acheter`, `-vendre`, `-projets`, `-principes` et leurs `BUGS-*.md`. Règles R1 à R10 (`REGLES.md`), filtre `GAIN.md`.
Page de choix : `choix-workflows.html` (4 choix, en fil de fer gris).

Ses mots, qui cadrent tout : « des vrais gain et pas juste des gimmick » ; « pas prend ces exemples à la lettre, mais bien généralisé pour
chaque cas » ; « on modélise des actions, workflow… mais pas le visuel » ; « l'app dans sa totalité vu que tout est lié ».

**Bilan : 11 bugs qui cassent une chaîne, 8 propositions candidates (5 tranchent seules, 3 demandent 4 choix), 19 gimmicks écartés,
5 propositions non établies.**

Chiffres : **mesuré** (banc Chrome 390 tactile, CPU ×1 et ×4, fixture ZZ TEST), **compté** (gestes relevés sur capture ou au code),
**estimé** (ni joué ni compté). Aucune fréquence n'est mesurée : l'usage réel n'est pas relevé. Toutes sont estimées d'après ses données
(16 idées et 19 étapes de Planning au Carnet, 14 brassins par an, ventes de fûts aux pros) et ses mots.

## 1. Bugs qui cassent une chaîne (corrigés d'office, sans choix)

Une correction prudente et réversible, au passage de l'écran (gel du 20.11), dans l'ordre de gravité.

| # | Constats | Chaîne cassée | Correction (règle) |
|---|---|---|---|
| B1 | WFR-1 | Recette neuve → brassin : « Enregistrer et préparer » refuse, ≈ 6 gestes de repli (compté) | fige le matériel et ouvre Brasser : 1 geste, −80 % (R1) |
| B2 | WFR-9 | Feuille Brasser « Écran indisponible » dès qu'une levure a un nom (mesuré) | la feuille lit la levure nommée |
| B3 | WFR-11 | Calendrier « Impossible de charger cet écran » sans brassin démarré (mesuré) | l'écran s'ouvre sur tout état du seed |
| B4 | WFR-3, WFR-4 | Récap « Enregistrable », puis lancement refusé (malt du stock entré à 0 kg) | le récap lit le même contrôle que le lancement ; chaque blocage ouvre son étape (R4) |
| B5 | WFV-2, WFV-14, WFA-15, WFA-12, WFA-13 | **Le réel ne solde pas le prévu** : vente des 2 fûts et plan « La Cigogne +280 » comptés deux fois ; « Facturer » sur le plan ouvre Finances sans caisse ; facture 421,57 à côté de « Commande de malt −420 » ; pompe « réalisée » sort 450 CHF de la caisse sans dépense | une règle pour tous : un réel (vente, facture) solde son prévu, proposé avec défaut oui et Annuler ; un prévu ne quitte la caisse que soldé par un réel, sinon il reste « à payer » (R1) |
| B6 | WFV-1 | Vendre 2 fûts : ils restent « plein en cave » ; 18 gestes avec la livraison refaite (mesuré) | la vente livre les fûts du brassin, plus anciens d'abord, listés et modifiables dans le panier : 8 gestes, −56 % (R1 : la suite incertaine se propose) |
| B7 | WFP-7, WFP-6 | Un projet du Carnet ne se date pas (aucun geste, joué) ; une idée notée au Calendrier n'y apparaît pas | corrigé par K2 ci-dessous |
| B8 | WFP-3, WFP-4 | Barre lâchée en S46 dessinée en S47 ; la période change seule après un glisser | la barre va où le doigt la lâche ; la période ne bouge que par lui (R9) |
| B9 | WFP-2 | Glisser sur la courbe lit « S31 · 2 août » en vue S47–S52 | la lecture reste dans la fenêtre visible (R4) |
| B10 | WFP-1 | La loupe ne trouve pas la Hotte, visible au Calendrier | la recherche lit les choses du Calendrier |
| B11 | WFV-5, WFV-3 | Pale Ale et NEIPA en vente invisibles dans Brassins ; la vente du jour absente de la rangée Ventes | une bière en vente se montre quelle que soit la période ; la vente devient une chose de sa rangée |

**Corrections sans proposition** (ne cassent pas de chaîne ; à faire au passage de l'écran) :
- lenteur : WFP-9, WFA-14 (OK à 984 ms, identique à ×1 et ×4 : attente fixe probable), WFA-16, WFV-16, WFR-8. Profiler avant de corriger (L20) ;
- la feuille « avant → après » colle sur tous les onglets et demande OK (WFA-14, WFV-10) : elle s'efface seule (R9). L'annonce des effets
  (WFX-14) devient la condition de chaque suite R1, pas une proposition ;
- cibles sous 44 px : WFP-11, WFV-8 (TWINT et Espèces, geste obligatoire), WFV-12, WFV-13 ;
- ordre et champs (R5) : WFX-3, WFX-13, WFX-16, WFR-6, WFR-7 ;
- textes et données affichées : WFA-2 (NaN), WFA-6 à WFA-10, WFV-7, WFV-9, WFV-11, WFV-15, WFP-10, WFP-12.

## 2. Propositions candidates (filtre GAIN rejoué), classées par gain réel × fréquence

Rang : une erreur de caisse ou de stock rendue impossible, sur une chaîne hebdomadaire, passe avant des gestes gagnés sur une chaîne mensuelle.
Chacune porte la condition R1 : chaque suite posée seule est dite, avec Annuler.

| Rang | Proposition (règle) | Fusionne | Avant → après | Fréquence (estimée) | Gain | Coût honnête | Décision |
|---|---|---|---|---|---|---|---|
| K3 | **Un brassin planifié pose ses suites** : coût estimé dans la caisse, ses manques dans Courses (R1, R4, R8) | G2, G4, PX-6, P4 projets ; WFA-1, WFA-5, WFP-8, WFX-10 | coût : « coût à venir », Budget › et prix tapés ≥ 3 (estimé) → 0 ; Courses : 3 gestes, 1,5 s / 2,8 s (mesuré), liste « rien cette semaine » → 2 | chaque brassin ; Courses chaque semaine | 2 oublis impossibles (caisse projetée fausse, croire n'avoir rien à commander) ; ressaisie des prix supprimée ; Courses −33 % | une ligne « estimé » dans la caisse ; l'horizon de Courses va jusqu'au prochain brassin | **seule** : le prix du stock existe (R2 : marqué « estimé »), la facture le remplace (B5) |
| K5 | **La quantité se donne d'un geste sur la tuile** (R3, R4) | P4 vendre | 6 × 33 cl : 10 gestes, 7,3 s (mesuré) → 5 ; 24 bouteilles : 28 → 5 | chaque vente au comptoir ou au marché, chaque semaine | −50 % ; −82 % à 24 | un geste sur la tuile ; le toucher simple garde +1 | **choix A** : le geste |
| K4 | **Une seule caisse** : Bord, Finances, Calendrier lisent un calcul, le Bord montre le point le plus bas à venir (R4) | G3 ; WFA-3, WFV-4 | 3 chiffres différents pour une même situation (mesuré : 421,57 · 421,57 à payer · −570) ; lire le solde : 1 geste, 1,5 s → 0, au Bord | chaque décision d'achat, chaque semaine | dépenser en se croyant au positif devient impossible | un calcul partagé ; en retire deux | **seule**, par ses mots : « je suis en négatif et on le voit même pas » |
| K6 | **Le reste à vendre se lit sans calcul** (R6, R1) | P3 vendre ; WFV-6 | impossible (V6 jouée : aucun écran) → 1 à 2 gestes | chaque vente et chaque commande promise | promettre une bière déjà vendue devient impossible | le reste est dérivé des ventes, jamais stocké à part | **choix B** : où le lire |
| K1 | **Une intention se saisit en ordres de grandeur** : date en horizons, prix estimé (R2, R7) | PX-1, P2 projets, P2 et P3 produire ; WFX-1, WFP-5 | recette : ≈ 7 gestes au jour près ou rien (compté, C6) ; idée à 3 mois : 3 gestes dans un carrousel qui part de janvier, 6 mois ≈ 5 (compté) → 1 toucher | chaque idée, projet, recette, brassin lointain : plusieurs fois par mois | −67 à −85 % ; date passée par mégarde impossible | un composant partagé, tiré des trois amorces (Remplir un fût, rythme d'Étalonner, puces de semaine) ; retire le carrousel de 60 puces | liste des horizons tranchée par ses mots ; **choix C** (quand l'horizon devient un jour), **choix D** (d'où vient le prix) |
| K8 | **Ce que l'app sait ne se retape pas** (R8, R1) : α du lot en stock, litres, coût et densité du brassin au prix, styles déjà brassés en tête | PX-3, PX-5, P5 produire ; WFX-6, WFX-15, WFR-2 | α : 3 gestes par houblon, 9 pour 3 (compté) → 0 ; prix : 7 renvois (compté) → 1 curseur ; style : ≈ 60 entrées défilées (estimé) → 1 | chaque recette, chaque nouvelle bière : mensuel | ressaisies supprimées ; prix sans coût impossible | valeurs posées, modifiables ; la quantité de malt reste à la mission moins-de-gestes | **seule** : l'α du lot d'abord (PORTRAIT § 3) |
| K2 | **Une chose née ailleurs avec une date arrive au Calendrier, et on la suit** (R1) : projet, idée, recette | P1 projets, P1 et P2 produire ; WFP-6, WFP-7, WFX-2, WFR-5 | projet : impossible (joué) ; recette : retour au Bord, 3 gestes pour la retrouver (compté) → 0, bascule au Calendrier centrée sur la chose | chaque projet, idée, recette : mensuel | oubli de la bière de saison impossible ; −100 % sur la recherche | « Au calendrier » sur la fiche ; horizon optionnel au 1er écran et à l'aperçu de l'assistant | **seule**, par ses mots (l. 2444, 2450) |
| K7 | **Mettre un lot en fûts en une feuille** (R1, R8) | PX-2 ; WFX-4 | ≈ 8 gestes, aller-retour par la fiche (compté) → 3 | chaque brassin mis en fût : mensuel | −60 % ; lot faux improbable (seuls les lots en garde proposés) | une ligne « 4 à laver · marquer propres » dans la feuille | **seule** |

Origine de chaque proposition des analyses : P1 produire → B1 ; P3 → K8 et B4 ; P4 → B4 ; P5 → K8. G2, G4 → K3 ; G3 → K4 ; G5 retiré.
P1 vendre → B6 ; P2 → B5 ; P3 → K6 ; P4 → K5 ; P5 non établie. P1 projets → K2 et B7 ; P2, P3 → K1 ; P4 → K3. PX-1 → K1 ; PX-2 → K7 ;
PX-3, PX-5 → K8 ; PX-4 → condition de R1 ; PX-6 → K3.

## 3. Les quatre choix (page `choix-workflows.html`)

| Choix | Proposition | Options | Ce que ses mots tranchent déjà |
|---|---|---|---|
| A | K5 quantité | A1 glisser sur la tuile · A2 appui long 6 · 12 · 24 · A3 pas de 6 | rien : geste à choisir |
| B | K6 reste à vendre | B1 carte du brassin · B2 rayon « Bière » des Stocks · B3 tuile de la caisse seulement | « type épicerie, ça c'est du grand art » n'impose pas le lieu |
| C | K1 date | C1 au glisser · C2 quand le jour compte (Brasser) · C3 l'app relance 4 semaines avant | la liste : « aujourd'hui, dans 1 mois, dans 3 mois… 6m 1 ans » ; recette : 1er écran et aperçu |
| D | K1 prix | D1 ordre de grandeur · D2 dernier achat semblable · D3 fourchette | « estimer directement un prix » : l'IA est écartée (ci-dessous) |

Écarté des choix : « après Au calendrier, basculer ou rester » (CADRAGE § 6). Il l'a dit le 21.11 : « ça nous transférer sur le
calendrier pour que on puisse le déplacer facilement ». Ce ne se redemande pas (L24) : K2 tranche.

## 4. Gimmicks écartés

1. Vue « toute ta chaîne » : refusée (pa3, pe2, pe5) ; R1 est un mécanisme, pas un écran.
2. Bouton « ajouter au calendrier » pour une vente : elle y entre déjà ; le manque est le bug B11.
3. Horizons pour une vente : une vente a un jour exact (R2).
4. Sélecteur au jour près dans la recette : il l'a refusé (« date Picker ultra précis vraiment pas terribles »).
5. Prix estimé par l'IA (achat, caisse, projet) : prix déjà au stock ou au tarif, sinon un chiffre inventé et facturé.
6. Envoyer la commande par e-mail : geste externe et irréversible ; « Copier » suffit.
7. Scanner un code-barres à la réception : la facture porte déjà les lignes.
8. Animation du stock ou confirmation festive : aucun geste ni aucune erreur en moins.
9. « Mon mois » plus visible : le retour existe déjà (+27,00 en direct).
10. « Garder les 3 lignes » de la facture (ex-G5) : 1 geste sur 9, −11 % (mesuré).
11. Encaisser une facture plus court (V5) : 4 gestes (mesuré), rien de sûr à retirer hors du OK (correction R9).
12. Cacher une rangée par balayage : 1 geste aujourd'hui.
13. Recherche vocale : aucune chaîne mesurée ne s'en sert.
14. Réordonner les rangées au doigt : « Trier les rangées » existe au menu.
15. Étalonner au curseur (WFX-5) : −50 %, mais mensuel au mieux.
16. Échéances posées sur la rangée Papiers (WFX-12) : chaîne trimestrielle ou annuelle.
17. Achat de matériel repris d'un projet (WFX-3) : moins d'un par mois (estimé).
18. Annonce des effets comme proposition à part (PX-4) : 0 geste en moins ; c'est la condition de R1.
19. Intention au Calendrier en barre floue ou en pastille : axe de dessin, pas de workflow.

**Non établies** (écartées jusqu'à leur jeu, pas sur le fond) : G1 « Commander chez <fournisseur> » (chaîne B jamais jouée) ; P5 vendre,
le fût revient depuis le client (chemin du carnet non joué) ; « Livrer un fût prépare sa vente » (sens inverse de B6, non mesuré) ;
« lâcher au passé = brassé ce jour-là ? » (fréquence inconnue) ; vue client « ce qu'il a, ce qu'il prend » (WFX-7, aucune chaîne).

## 5. Critique (au portrait du brasseur, captures ouvertes à 390 et 1280 px)

Question ouverte : combien et quels problèmes ? Quatre, aucun bloquant.
1. Les vignettes « aujourd'hui » font 72 px au téléphone : illisibles, elles servent de repère et s'ouvrent en grand au toucher.
2. À 390 px, trois colonnes de 115 px coupent certaines lignes (« 24 bt : 5 » passe à la ligne). Le côte à côte est gardé : il compare d'un regard.
3. Le choix D n'a pas de gain mesuré (« aucun encore », dit tel quel) : la chaîne du prix n'a jamais été jouée. Il reste parce qu'il l'a demandé.
4. C3 ajoute une ligne au Bord : c'est le seul ajout visible de la page ; il ne passe que par l'oubli rendu impossible (GAIN, point 4).

Corrigé avant rendu : une étape = un geste (« + › Vente » comptait pour deux) ; légende « case grise = un geste, pointillé = plus tard » ;
chaque section porte « Gain mesuré : avant → après ». Écarté de la page comme gimmick : l'estimation par IA (D), la barre floue
ou la pastille d'intention (dessin, pas workflow), le choix « basculer ou rester » (déjà répondu, L24).

Lecture prédite en 3 s : quatre lettres, trois colonnes, un gros chiffre par option. Phrase prédite : « A1 clairement, B2 l'épicerie, C… pas mal mais D je sais pas ».

## 6. Vérification

`node scripts/agents/verifier-page.mjs work/missions/2026-11-21-workflows-app/choix-workflows.html --page-lot --captures work/missions/2026-11-21-workflows-app/choix-workflows-captures/cw`
→ **PAGE OK (4 images chargées, lisible à 390 et 1280 px, sans erreur)**. Captures ouvertes : `choix-workflows-captures/cw-haut.png`,
`cw-page.png`, `cw-ordinateur.png`. Aucun code de l'app touché.

## 7. Passe 2 (21.11) : « Mais ça semble un peu maigre ?? »

Sources : `ANALYSE-passe2.md`, `BUGS-passe2.md` (WF2-1 à 9). Choix reçus : **A2** (appui long 6 · 12 · 24), **B1** (reste sur la carte du
brassin), **C1** (horizons au glisser), **D2** (prix = dernier achat semblable). Treize chaînes jouées en plus ; filtre élargi aux chaînes
rares (gain sur la durée ou le risque) ; son classement Moins de gestes mesuré et fusionné.

**Bugs qui cassent une chaîne, ajoutés** : B12 = WF2-1 (compagnon tombé au 1er pas : jour de brassage coupé) ; B13 = WF2-8 (coût du brassin
non chiffré alors que le stock a ses prix : marge impossible) ; B14 = WF2-5 (hors ligne : écran non chargé, aucun précache ; à confirmer
en production). Lenteurs WF2-3, WF2-4 : à profiler seules.

| Rang | Candidate | Origine | Avant → après | Fréquence | Décision |
|---|---|---|---|---|---|
| 1 | K3 + N6 : le brassin pose ses suites, son coût chiffré au prix du stock et sa marge lisible | K3, N6, K8 (prix) | « ? CHF/L » en 4 gestes (joué) → coût estimé posé seul | chaque brassin ; caisse hebdo | seule (D2 donne le prix) |
| 2 | K5 quantité à l'appui long | passe 1 | 10 → 5 gestes | hebdo | A2 choisi |
| 3 | K4 une seule caisse | passe 1 | 3 chiffres → 1 | hebdo | seule |
| 4 | K6 reste à vendre | passe 1 | impossible → 1 regard | chaque vente | B1 choisi |
| 5 | N1 : l'ingrédient proposé se pose juste d'un toucher (houblon, malt, levure, sels ; α du lot) | v03 (son rang 1), v02, v04, v05, v06, K8 | ≈ 34 → ≈ 14 par recette (estimé) | chaque recette | seule ; K8 y entre |
| 6 | N5 : le relevé de densité part de la prévision du jour | neuve | 12 → ≈ 4 (avant joué) | hebdo en fermentation | seule ; forme à dessiner |
| 7 | K1 horizons et prix estimé | passe 1 | 3 à 7 → 1 | plusieurs fois par mois | C1, D2 choisis |
| 8 | K2 + v14 : la chose datée arrive au Calendrier ; le brassin posé propose sa suite | K2, v14 | impossible → 0 ; ≈ 4 + 1 par étape → 1 | mensuel | seule ; sa vue gardée |
| 9 | K7 + v10 : mettre en fûts propose les fûts qui tiennent le volume, lavage compris | K7, v10 | 6 pour 2 fûts (joué) → 3 | chaque brassin | seule |
| 10 | N4 : les fûts reviennent depuis le client | v11, P5 vendre (repêchée) | 3 par fût → 3 pour tous | mensuel | seule |
| 11 | N3 : rebrasser relie au stock, dose à l'α du lot | v07 | 12 → 2 (compté 20.11) | mensuel | seule |
| 12 | N2 : le jour J pose ce qu'il sait | v09 | 4 + ≈ 3 par densité → 3 | chaque brassin | après B12 |
| 13 | N7 : l'inventaire confirme d'un toucher ce qui est juste | neuve, chaîne rare | ≈ 38 → ≈ 20 (compté) | annuel | seule ; forme à dessiner |

Restent écartées : v01, v04 (hors la quantité), v08, v12, v13, et les 19 gimmicks sauf P5 vendre (repêchée en N4). Non joué : `REPRISE-passe2.md`.
