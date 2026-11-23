# M2 — Carnet en ligne : transitions d'état, valeurs limites, classes d'équivalence (ISTQB)

Date : 23.11. Testeur : agent M2 (Opus). App https://brasserie-l-affinee.web.app/, paquet index-zpcbYIem.js (tour 12, lu
avant chaque série ; voir CA12-M2-8). Chrome de débogage 9222 (`connectOverCDP`, Playwright de port-carnet), MA page seule
(window.name « M2-carnet »), 390×844, toucher CDP `Input.dispatchTouchEvent`, service worker contourné sauf pour le test
hors ligne. Page fermée à la fin (page.close), aucun browser.close(). Banc : scripts e01–e35 du bloc-notes de session
(non commités). 92 captures dans ce dossier ; chaque constat cite une capture regardée.

## Bilan

19 défauts : B 0, G 7, m 9, d 3 (`defauts.jsonl`). Couverture des transitions 0-switch : 27 sur 33 (82 %) ; limites : 26
cas sur 26 prévus ; états : 4 sur 4. IA : 12 appels de rangement (gemini-3.8-flash, aiTask « fast »), environ 0,03 CHF
estimés (ia-journal.jsonl) ; les lectures de page (modèle « lecture ») ne sont pas de l'IA.

Graves : prix « 12,345.67 » corrompu en 12,34 (1) ; trois prix pour un projet, le choix ne monte pas au plan (2) ; le carnet
dit « Dans À venir » quand son plan est réalisé ou archivé (3) ; prix rogné « 2 763.6 » à 390 (4) ; vrai lien brouwland jamais
lu (5) ; retour arrière qui sort de l'app (7) ; le service worker sert encore le tour 11 (8).

## Données

Créées : carnets « ZZ TEST — M2 — pompe de transfert inox » (renommé « … 🍺💧 … ») et « ZZ TEST — M2 — long … », « ZZ TEST
— M2 — annule moi » (annulé aussitôt), leur plan d'À venir. Tout retiré par l'app ; absence vérifiée après rechargement
(Carnet, À venir, Réalisés, Archives, Calendrier). « Réalisé, sans achat » et « Archiver » joués sur le plan ZZ seulement ;
« Noter l'achat » jamais touché (écrirait une dépense). Avis du pilote (notes rangées dans les vrais carnets) : 3 de mes
envois sont partis du champ général (pompe, annule moi, texte long) ; chacun a créé son propre carnet ZZ. J'ai ouvert les
19 vrais carnets et cherché mes marques (M2, pompe de transfert, isobare, brouwland, Wikipédia, emoji…) : **aucun touché**.
Seule lecture d'un vrai carnet : Chambre froide (lien ggmgastro copié, Comparer ouvert puis retour) ; rien n'y a été écrit.

## 1. Diagramme d'états

Le carnet a deux axes : son statut (Idée → À comparer → Choisi, tiré du contenu) et sa sortie, le plan d'À venir (étapes
Idée · À étudier · Devis · Prêt à acheter · Acheté · En service, puis Réalisé ou Archivé). « Chiffré » = un prix posé
(pastille du carnet ou prix du plan) ; « placé » = plan d'À venir ; « acheté » = Réalisé.

```
            texte (champ)                         lien lu (≥1 article lu)          Choisir (pourquoi proposé)
   (rien) ───────────────► IDÉE ──────────────────────────────► À COMPARER ─────────────────────────► CHOISI
     ▲  Annuler (bandeau)   │ dater (1 mois…) / pastille prix (chiffré)   │ lien non lu : reste IDÉE (KO 5)
     └──────────────────────┤                                             │
                            │ Au calendrier / Placer (idempotent)         │
                            ▼                                             ▼
                     PLAN À VENIR ◄──── Reprendre ──── RÉALISÉ (Marquer réalisé → « Réalisé, sans achat »)
                      │   ▲  │  ▲                         carnet dit encore « Dans À venir » (KO 3)
                      │   │  │  └── Reprendre ──── ARCHIVÉ (Archiver → « Oui, archiver ») (KO 3)
                      │   │  └ prix modifié : le carnet ne suit pas (KO 2)
                      │   └ Annuler (bandeau « achat prévu posé ») : non joué
                      ▼
         « Garder le plan sans ce carnet » (détaché) ──► SUPPRIMER le carnet ──► SUPPRIMÉ ──Annuler──► rétabli
                                                       (interdit tant qu'un plan le retient : bouton désactivé)
         plan orphelin « du carnet … · supprimé » ──► Supprimer ce projet (« Oui, supprimer »)
```

## 2. Couverture des transitions (0-switch)

| # | Transition | Joué | Verdict | Capture |
|---|---|---|---|---|
| 1 | (rien) → Idée par le champ | oui | OK ; 2 états à la fois (11) | 04, 05-envoi-*, 06 |
| 2 | (rien) → Idée → Annuler du bandeau | oui | OK, absent à 0,8 s et 16 s | 49, 50, 51 |
| 3 | Idée : dater (1 mois) | oui | OK « vers déc. » | 09 |
| 4 | Idée : chiffrer (pastille 500 CHF) | oui | OK « 500 CHF estimé » | 11 |
| 5 | Idée → À venir (Au calendrier) | oui | OK −500, 21 déc. | 12 |
| 6 | Au calendrier une 2e fois | oui | OK, pas de doublon | 15, 16 |
| 7 | À venir → Annuler du bandeau « achat prévu posé » | non | bandeau parti avant le geste | — |
| 8 | Plan : prix changé (450) | oui | KO, carnet à 500 (2) | 22, 23 |
| 9 | Idée → À comparer (lien ggmgastro lu) | oui | OK ; prix rogné (4) | 27-* |
| 10 | Idée → À comparer (lien brouwland) | oui | KO, jamais lu (5) | 25-*, 26 |
| 11 | À comparer → Choisi, pourquoi vide | oui | OK, pourquoi proposé « En stock. » | 29, 30 |
| 12 | Choisi → Placer | oui | KO, plan à 450, « À chercher » (2) | 34, 37 |
| 13 | À venir → Réalisé (« Réalisé, sans achat ») | oui | OK dans Stocks ; carnet KO (3) | 38, 39, 40, 42 |
| 14 | Réalisé → Reprendre ce projet | oui | OK (À venir 14, Réalisés 0) | 45 |
| 15 | À venir → Archivé (« Oui, archiver ») | oui | OK dans Stocks ; carnet KO (3) | 76, 78, 79 |
| 16 | Archivé → Reprendre | oui | OK « repris » | 80, 81 |
| 17 | À venir → détaché (« Garder le plan sans ce carnet ») | oui | OK « ni dans À venir, ni en commande » | 82 |
| 18 | Carnet sans lien → Supprimé | oui | OK | 83, 84 |
| 19 | Supprimé → Annuler | oui | OK, carnet revenu (Choisi 2) | 85 |
| 20 | Supprimé définitif, plan orphelin → supprimé | oui | OK « du carnet … · supprimé » | 86, 87, 88 |
| 21 | Renommer (emoji) | oui | OK ; plan non suivi (16) | 72, 73 |
| 22 | Comparer → retour arrière | oui | KO, sort de l'app (7) | 91, 92 |
| I1 | Envoi vide ou espaces | essayé | refusé : pas de bouton Ajouter | 48 |
| I2 | Choisir un article non lu | essayé | refusé : pas de Choisir | 68 |
| I3 | Supprimer un carnet retenu par un plan (réalisé) | essayé | refusé : bouton désactivé ; libellé faux (3) | 43, 44 |
| I4 | Prix négatif, > 250 000, non nombre | essayé | refusé avec message | 20-*, 21-* |
| I5 | Titre vide | essayé | refusé sans mot (17) | 69, 70 |
| I6 | Doublon de plan (Au calendrier ×2) | essayé | refusé (un seul plan) | 16 |

Non jouées (6) : Annuler du bandeau « achat prévu posé » ; Noter l'achat (écrit une dépense) ; Noter un devis ; Prêt à
acheter direct ; Revoir le choix (un seul article lu) ; Écarter. Paires 1-switch jouées : création → Annuler ; Réalisé →
Reprendre → Archivé → Reprendre ; détacher → Supprimer → Annuler → Supprimer.

## 3. Valeurs limites et classes (Prix estimé TTC du plan ; le carnet n'a que 5 pastilles 100–5 000 CHF)

| Classe | Saisi | Résultat | Verdict |
|---|---|---|---|
| zéro | 0 | 0, budget 0,00 | OK |
| négatif | -5, −5 | refusé, « une valeur négative n'existe pas ici » | OK (TE-35 corrigé) |
| juste sous / sur / après le plafond | 250000 · 250000,01 · 250001 | accepté · refusé · refusé « au plus 250000 » | OK |
| très grand | 999999999999 | refusé | OK |
| plus petit pas | 0,01 · 0,005 | accepté · refusé « au plus 2 décimales » | OK |
| virgule, point | 1 234,50 · 1234.5 | 1 234,50 | OK |
| milliers anglais | 12,345.67 | champ 12,34, message faux | KO (1) |
| milliers suisses | 12'345.50 · 12’345,50 | 12 345,50 · refusé | OK · KO (10) |
| non nombre | abc, 🍺, 5e3 | refusé « ce n'est pas un nombre » | OK |
| vide | (rien) | « À estimer » | OK |
| texte long (champ) | 1 427 car. | titre tronqué sur 3 lignes, une note « à acheter » | OK |
| emoji seuls | 🍺🔥💧 | note | OK |
| lien invalide | pompe-zz-test.invalid | « à relire », statut serveur « robots » | KO (6) |
| lien malformé | htp//pompe inox www | note « Htp//pompe inox www » | OK |
| lien sans prix | Wikipédia Pompe centrifuge | note « conseil », URL brute | KO (15) |
| page lourde | Wikipédia Bière | lue (< 1 s serveur), note titrée | OK |
| vrai lien fournisseur | ggmgastro · brouwland | lu, 2 763,65 CHF · jamais lu | OK · KO (5) |

## 4. États

- Vide : recherche « zzzqqq-m2-rien » → « Aucun carnet ne correspond. » (47). OK.
- Chargement : « ✻ lecture de la page… », « ✻ L'IA range… » (25-*, 53-*) ; KO 11 et 12.
- Erreur : lien non lu ou inexistant, aucune raison dite (5, 6). Une panne du serveur aiTask n'a pas été provoquée.
- Hors ligne (Network.emulateNetworkConditions sur ma page) : bandeau « Hors ligne : rangé sur l'appareil, tel quel »
  puis « rangé sur place, rien n'est perdu » ; la note reste ; rechargement hors ligne avec service worker : l'app revient
  (index-zpcbYIem.js) et la note est là ; sans service worker : ERR_INTERNET_DISCONNECTED (attendu) ; de retour en ligne,
  la note reste « note », jamais re-rangée par l'IA (61–66). OK, sauf PCN-144 ci-dessous.
- Rechargement en cours de saisie : KO 9 ; ordinaire : KO 8.

## 5. Registre BUGS.md (lignes ouvertes de mon périmètre)

- PCN-7 (« L'IA range… » tourne, phrase brute collée) : non reproduit, rangement fini en 3 à 8 s.
- PCN-8 (lien après : sans prix, CHF absent) : OK pour ggmgastro (prix, caractéristiques, vendeur) ; KO pour brouwland (5).
- PCN-181 (vendeur rempli de raisonnement ou d'URL) : non reproduit (« ggmgastro.com »).
- PCN-144 / PCN-113 (hors ligne : rien ne dit que l'IA range au retour) : toujours vrai (note brute après retour).
- TE-35 (prix −5 devient 0 sans message) : OK, message clair.
- T10-M2-1 (rechargement ordinaire sert l'ancien paquet) : KO (8).
- PCN-44, PCN-50 (chiffres de l'IA) : non joués.

## 6. Pas fait

390×660 et 844×340 ; Photo et Dicter ; panne aiTask ; actions du plan qui écrivent dans Finances (Noter l'achat, devis) ;
raison exacte du refus de brouwland (réponse de lecture non captée).
