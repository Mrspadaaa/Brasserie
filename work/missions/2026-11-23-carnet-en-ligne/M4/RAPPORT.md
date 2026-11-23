# M4 — Carnet en ligne : vrai tactile, heuristiques de Nielsen et mise en page (tour 12)

Date : 23.11.2026, https://brasserie-l-affinee.web.app/, paquet `assets/index-zpcbYIem.js` (vérifié avant chaque série).
Agent Opus. Défauts : `defauts.jsonl` (29 lignes : **B 1, G 8, m 10, d 10**).

## Méthode
- Son Chrome de débogage (port 9222), `chromium.connectOverCDP` (Playwright de port-carnet). MA page dans sa propre
  fenêtre (`Target.createTarget newWindow`), fermée à la fin par `page.close()`, puis déconnexion. Aucun autre onglet touché.
- Émulation : 390×844, 390×660, 844×340, `mobile`, toucher (5 points), UA Android. Gestes par CDP
  `Input.dispatchTouchEvent` (pas de souris) : toucher, appui long 700–800 ms, glisser lent (700–800 ms), glisser
  horizontal, défilement inertiel (coup de 100 ms puis lever), doigt qui tremble (±1 px toutes les 16 ms).
- Clavier virtuel : la prod n'a pas `?keyboard=`. Script d'init qui remplace `window.visualViewport` (hauteur =
  innerHeight − clavier) et pose un voile gris de la hauteur du clavier : l'app réagit par `useKeyboardInset` comme sur
  téléphone. Clavier de 300 px (390×844), 280 px (390×660), 150 px (844×340).
- Mesures DOM (en appui) : rognage par Range sur chaque élément porteur de texte, hors `.sr-only` (ellipsis,
  overflow, line-clamp) ; chevauchement des boîtes de texte ; texte recouvert (elementFromPoint) ; cibles < 24 px ;
  barres fixes du bas (trou) ; police < 14 px. Les textes coupés par un ancêtre qui défile sont exclus.
- Chaque défaut a une capture que j'ai ouverte. Zone sûre basse : `Emulation.setSafeAreaInsetsOverride` (48 px), un essai.

## Données et IA
- Créé : « ZZ TEST — M4 — banc de rinçage des bouteilles » (carnet), sa note, son plan d'achat (Au calendrier).
  Retirés : plan supprimé dans Stocks › Matériel › À venir, puis carnet supprimé ; après rechargement, 0 occurrence
  dans la liste Atelier, Stocks › Carnets et À venir ; dans le cache local, seules restent 2 lignes du journal d'audit.
- Vraies choses : Chambre froide ouverte, articles lus, Comparer lu ; rien choisi, ni veille du prix, ni Au calendrier.
  **À signaler** : « Critère : 2,6 m³ · de votre phrase » est apparu sur le vrai carnet Chambre froide, rangé par
  l'IA depuis « ZZ TEST — M3 — cellule de garde 2,6 m3 » (CA12-M4-23). Ce n'est pas mon geste. Je n'y ai pas touché ;
  le pilote doit le retirer.
- Mon 1er envoi, « ZZ TEST — M4 — idée chambre froide », a ouvert Chambre froide. La phrase reste introuvable
  (CA12-M4-24). Je ne l'ai pas rejoué, pour ne rien verser dans un vrai carnet.
- IA : 2 aiTask vus (création, note), 1 possible (1er envoi) ; ≈ 0,015 CHF au plus, dans `ia-journal.jsonl`.
- Chrome partagé : M1–M3 travaillaient en même temps (carnets ZZ M1–M3 visibles dans mes captures et références).

## Couverture (≈ 70 %)
| Volet | Joué | Pas joué |
|---|---|---|
| Liste (Atelier › Carnet, Stocks › Matériel › Carnets) | filtres Idée/Choisi, recherche, défilement inertiel, appui long sur carte, toucher, Anciennes notes, + Actions rapides | Photo, Dicter (sélecteurs natifs) |
| Carnet ouvert | Articles, tableau, Quand (glisser, toucher, toucher tremblant), Prix estimé, Au calendrier, menu …, Renommer (Annuler), note, Voir, Supprimer | Coller un lien (lireLien), Choisir, Veille du prix (données réelles), Renommer validé |
| Article, Comparer | ouverture, défilement, balayage horizontal, retour | toucher sur « ? » du prix, « Classé par » |
| Date au doigt (GESTE-DATE-PARTOUT) | fiche du Calendrier : toucher et glisser la pastille, glisser la barre de l'achat dans la frise (S8 → S9) | Annuler après le glisser |
| Clavier | champ de liste 390×844, Renommer et note 390×660, champ en paysage | vrai clavier Android |
| Tailles | 11 écrans × 3 tailles en références | hors ligne, IA lente ou en échec |

## Les 10 heuristiques de Nielsen
1. **Visibilité de l'état** : Choisi actif ne dit rien (15) ; recherche filtrée sans le dire (16) ; date et prix du
   carnet différents d'À venir et du Calendrier (4) ; note changée en critère (22) ; 1er envoi sans retour (24).
2. **Correspondance avec le monde réel** : « 1.845 mm » (9) ; « Tôle d&#039;acier » (6) ; photos du vendeur bloquées,
   picto générique (10).
3. **Contrôle et liberté** : en paysage, les touchers tombent dans le champ (1) ; Voir n'amène pas à l'élément (17) ;
   suppression bloquée par le plan, détour par À venir (21) ; pas de suivant dans l'article (18).
4. **Cohérence et standards** : la rangée Quand change trois fois de forme (3) ; pastille de date d'allure touchable
   inerte (19) ; « Supprimer l'idée » / « Supprimer le carnet » (21) ; mono pour du texte (7, 8).
5. **Prévention des erreurs** : une phrase rangée dans un carnet existant sans confirmation (23) ; plan orphelin
   proposé (« Garder le plan sans ce carnet ») (21).
6. **Reconnaître plutôt que se souvenir** : titres coupés à une ligne (12) ; choix Quand invisible après coup (3).
7. **Souplesse et efficacité** : le clavier se ferme après chaque Ajouter (26) ; balayage sans effet (18).
8. **Esthétique et minimalisme** : « Dans À venir depuis le … · Voir » répété (13) ; Comparer, 1re valeur à y 520 (11) ;
   « votre phrase en titre » redit (27) ; bande vide de 12 px en bas (25).
9. **Aider à reconnaître et corriger les erreurs** : Supprimer grisé avec une seule sortie qui garde le plan (21) ;
   saisie disparue sans message (24).
10. **Aide et documentation** : rien. La ligne « Le champ en bas range tout ici… » suffit sur un carnet vide.

## Mise en page (3 tailles)
- **390×844** : rognés : titres de la liste (12), « Aujourd'hu » sous Au calendrier (2), « Exécutio. » et « avec g… »
  (7), noms de Comparer sur 3 lignes (11), « Chercher un carnel » (14), titre de la fiche du Calendrier (29).
  Chevauchement : puces Quand sous le libellé (2). Aucune cible < 24 px.
- **390×660** : mêmes rognages. Clavier de 280 px : le champ de Renommer, le bouton et Annuler restent au-dessus ; la
  note ajoutée reste visible au-dessus du champ (CARNET-CLAV : OK). Le pied ne passe pas sous le clavier.
- **844×340** : défaut principal (1). Le champ passe sous la barre et la liste se réduit à une bande. Avec le clavier
  simulé, le champ remonte bien au-dessus. Cible de 19 px dans À venir (28).
- **Trou en bas (sa capture 08)** : non reproduit. Il reste 12 px vides (16 px dans Stocks). Avec une zone sûre de
  48 px émulée, c'est l'inverse : la barre recouvre le champ (25). La cause probable est la réserve
  `padding-bottom: calc(--main-navigation-height + .75rem)`, qui ignore la zone sûre. **Hypothèse non vérifiée sur
  téléphone.**

## Registre rejoué (BUGS.md)
| Ligne | Verdict |
|---|---|
| CRP-1, CRU-2 (prix absent) | KO → CA12-M4-5 |
| CRP-2 (entité) | KO à l'écran, articles stockés → 6 |
| CRU-1 (tableau 1091 px) | non reproduit : Comparer tient dans 342 px avec 2 articles |
| CRU-3 (création) | partie a OK (la fiche s'ouvre seule) ; partie b KO (note → critère, mise en page changée) → 22 |
| CRU-4 (tableau dans la carte) | KO → 7 |
| CRU-5 (Comparer, 1re valeur) | KO, 520 au lieu de 436 → 11 |
| CRU-8 (Quand sur une rangée) | KO en ligne → 2, 3 |
| CRU-11 (tailles de texte) | non mesuré en entier ; puces 12 px → 3 |
| CRU-12 (cible 20 px) | OK : aucune cible < 24 px à 390 |
| CRU-13 (ombre de bord) | non reproduit (pas de défilement horizontal à 2 articles) |
| CRU-NOTE-1 (IA lente, échec, hors ligne) | pas joué |
| T11-1 (montant au Calendrier) | KO → 4 |
| T11-7 (titre de fiche rogné) | KO → 29 |
| T11-18 (deux adresses) | toujours : Voir mène à Stocks › Matériel › À venir → 17 |

## Références pour la suite Playwright
`reference/` : 33 captures, 11 écrans × 3 tailles (DPR 1). Écrans : 01 liste, 02 fin de liste, 03 carnet à comparer,
04 article, 05 Comparer, 06 carnet idée (ZZ), 07 menu …, 08 champ avec clavier simulé, 09 Anciennes notes,
10 Stocks › Carnets, 11 Stocks › À venir.
Limites : ce sont des données vivantes (carnets ZZ de M1–M3 visibles, carnet ZZ M4 supprimé depuis). Elles
servent de référence visuelle, pas de base au pixel pour `toHaveScreenshot`. 09-anciennes-notes-844x340 vient de la
1re passe en paysage.

## Constats hors périmètre (Calendrier)
- Mesure seulement, pas visible à l'œil : les boîtes de « CHF à dépenser » et « S26 '27 » se recouvrent de 6 px dans
  l'en-tête (capture 27-au-calendrier).
