# File continue — le pilote ne s'arrête pas tant qu'une ligne « - [ ] » reste

Brasserie, 24.11 : « créé un mécanisme qui ne te fais pas arrêté ». Lu par `.claude/hooks/continuer.mjs` (Stop) :
tant que `actif: oui` et une ligne ouverte, la fin de tour est refusée et la tâche suivante rendue.
- `- [ ]` ouverte ; `- [x]` prouvée (en ligne pour l'écran) ; `- [attente] … — ce qu'il faut` : geste irréversible ou externe
  (push, PR, règles Firestore, données réelles, Gemini au-delà du budget), groupé pour le récapitulatif final.
- Jamais de question bloquante : décider selon [[autonomie-decisions]] (prudent, réversible) et journaliser.
- `pause: <ISO>` : arrêt permis jusqu'à cette heure (travail en arrière-plan) ; vide sinon.
- `session: libre` : la prochaine session principale l'adopte ; `libre-apres <id>` après un hand_off_to_session.
- Garde-fou : trois arrêts d'affilée sans changement de ce fichier laissent passer l'arrêt.

actif: oui
session: f97e7359-a046-4072-af48-f44ecac2f73e
pause: 2026-11-25T07:53:47.026Z

## File (dans l'ordre ; détails : work/missions/2026-11-23-ETAT-DES-TACHES.md)
- [x] Mécanisme continuer : hook branché, témoins (bloque, laisse passer), commit
- [x] Voie ecr6 (4fdf9a535) : E44-1 (dates d'une récurrente à payer = Calendrier), E44-2 (retrait annonce le remboursement lié), E44-3 (pas de « N° de facture » sur un apport), bandeau d'erreur serveur en français (firestoreRepo.ts)
- [x] Tour 45 en ligne (index-Ba6_cMq7.js) : 3 problèmes, 0 B ; E44 vérifiés
- [x] Carnet : ses choix portés, en ligne tour 46 ; test critique-46 : 6 problèmes (1 B), domaine 10/10
- [x] Tour 47 : test critique-47, 6 problèmes (0 B), E45 vérifiés, E47-1..5 versés
- [x] Tour 48 en ligne (index-DJIfW4-y.js, carnet-c46)
- [x] Tour 49 : critique-49, 3 problèmes (0 B), 7/9 corrigés confirmés
- [x] Tour 51 : critique-51, 2 problèmes (0 B), C46-5 vérifié en ligne
- [x] Tour 52 : critique-52, 5 problèmes (0 B), corrigés 9/10
- [x] Tour 53 : critique-53, 6 problèmes (0 B), corrigés 4/4
- [x] Tour 54 : critique-54, 5 problèmes (0 B), corrigés 4/5
- [x] Tour 55 : critique-55, 4 problèmes (0 B), corrigés 4/4
- [x] Tour 56 : critique-56, 6 problèmes (0 B), corrigés 4/4
- [x] Tour 58 : critique-58, 6 problèmes (1 B), corrigés 8/9
- [x] Tour 59 : critique-59, 10 problèmes (3 B : C59-1 Relire range les articles d un autre carnet, C59-4 critère 50 L ne classe pas, C59-6 Citra 0,10 1er), corrigés 9/9
- [x] Tour 61 : critique-61, 7 problèmes (2 B), corrigés 12/14 ; changement de « Houblons citra » à 18:17Z = son Relire de 19:17 (sa capture)
- [x] Tour 64 : critique-64, 9 problèmes (3 B : C64-1 prix 100 g lu comme 50 g, C64-2 palier 1 kg Brau, C64-8 message ZZ rangé dans son vrai carnet), corrigés 11/13
- [x] C64 : URGENT C64-8 (MESSAGE-RESTE-DANS-SON-CARNET : un message tapé dans un carnet ouvert n y est jamais déplacé seul), puis C64-1, C64-2 (prix par conditionnement et paliers), C61-5, m ; tests puis correctif — corrigé (c64Regles 28/28, c54 aligné), tour 65 en ligne index-BTs27oam.js, aiTask redéployé
- [x] critique-65 : 8 problèmes (3 B) ; C64-1, C64-2, C61-5 tenus ; C64-8 NE TIENT PAS en ligne (C65-1 chemin IA, C65-2 chemin local)
- [x] C65-1/C65-2 : C65 corrigé en ligne (critique-66, tour 66 : message gardé dans la marmite, voisin identique, IA refusée : rien ailleurs)
- [x] C66 : 5 B du port greffe-p2 (Annuler caché, Brau ? CHF/kg, classement contradictoire, Choisir au mauvais prix, Comparer hors v01) + m ; c66-tests 712e34956, c66-fix c97a3a4f3 (40/40 ; R54 Choisir et R51 dans la voie liste) ; tour 67 après liste, critique-67
- [attente] Note parasite « Fûts déplacés dans la chambre froide en attendant. » dans son carnet Chambre froide (20:29Z, tour 64, autre session) : à retirer avec son accord
- [attente] Message de test « ZZ TEST — c69 mémo : le sol époxy… » rangé dans son carnet « Sol — matières premières + outils » (critique-69) ; Supprimer sans effet (C69-2) : à retirer avec son accord, après le correctif C69-2
- [x] Banc comparatif du rangement (D453) : tenues à part lite 5/8, 3.8 Flash 7/8, Hydrogen 6/8 ; 0,456 CHF ; 3.8 Flash gardé (b40a337d8)
- [x] Libellés « Sans catégorie » et sous-catégories Brasserie : validés (D452, 25.11)
- [x] Port D451 (en ligne tour 67, suite des correctifs par tours 68 à 73) : domaine PRÊT 402d1a8a9 (passe-plat 81072809e à mettre en ligne seul après critique-65) → ia PRÊT a3e99e4c7 ∥ greffe-p2 PRÊT 38aff7806 (branchée 700dee88d) → tour 66 en ligne (Rj9Pjhxu) → probleme PRÊT d85f80ca5 ∥ afaire PRÊT b433ee3c7 → liste PRÊT 235d39b30 → tour 67 en ligne index-BVBC77LE.js, critique-67 : 12 problèmes (6 B), écarts 7 ; c67-tests/c67-fix, onglets PRÊT fbe6fb8f8, c67-tests 8ac7e49a9, c67-fix en cours ; critique-67b : 9 problèmes (7 B : C67B-1..9, Choisir 1 kg, À venir daté février, Choisir déborde, photo seule, mémo sol, usage neuf ouvert en idée) → voie c67b après c67-fix ; ménage ZZ c67b fait (carnet identique oui) ; c67-fix e2ca73967 ; tour 68 en ligne index-BRxcNYiQ.js + aiTask ; c67b-tests 24e310786, c67b-fix ce2aa8b64 (tour 69 après le relevé c68) ; critique-68 : 13 problèmes (4 B), C67 tenus 2/12 (tests sur IA simulée) → c68-releve fait e580109a6 (6 vraies réponses, 4 écarts : l app ignore titre court et carnet cible) → c68-tests 9ecd19793 (27/56 rouges) → c68-fix 1b01bd495 (56/56, Réalisés compte les résolus) → tour 69 en ligne index-l6sx_rVf.js + aiTask → critique-69 : 13 problèmes (2 B : C69-1 vapeur créée en idée avant rattachement, C69-2 Supprimer une note sans effet), corrigés tenus 13/22 → c69-tests ff363aa64 (29/39) → c69-fix fait (39/39, porte 2010 verts) → tour 70 en ligne index-CdpI-ft5.js → critique-70 : 10 problèmes (2 B : C70-1 Choisir 1 kg depuis Comparer, C70-3 vapeur rangée idée) ; carnet identique oui → c70-tests 888b7c223 ∥ c70-ia 83a0aae71 (cause : carnet du même sujet → IA ne rend ni genre ni chemin ; champ sujet obligatoire ajouté ; banc tenues non mesuré, budget) → c70-fix b0fb6cd35 (32/32, porte 2053 verts) → tour 71 en ligne index-Cwy7X3NS.js + aiTask → critique-71 : 8 problèmes (1 B : C71-1 À faire « Fin du mois » fourre-tout), rangement IA juste 5/6 en ligne, corrigés tenus 6/10, carnet identique oui → c71-tests c433260d1 (30/40) → c71-fix 645b55c71 (40/40) → tour 72 en ligne index-E9xIEuvt.js → critique-72 : 6 problèmes (1 B : C72-1 coût min..somme), corrigés tenus 7/8, carnet identique oui → c72-tests 43b10ddd5 (34/57) → c72-fix 16657af52 (57/57) → tour 73 en ligne index-L94x-z-O.js → critique-73 ∥ cal-73 en cours → critique-71 mesure en ligne ; relevé IA à compléter (Citra, phrases neuves, malt, électricien) ; r54 fait 5d275fc10 (au tour 68) → probleme ∥ afaire → liste → en ligne → onglets (work/missions/2026-11-24-port-d451/PLAN.md)
- [x] (accord 24.11, retirée par l'app : 3 → 2 notes, vérifié après rechargement, voies/retrait-note) Sa note « Achat prévu fin du mois. » ajoutée par erreur dans son carnet « Achat brasserie : moulin à malt + bac etc. » par la voie exemples : à retirer avec son accord ; voie exemples ARRÊTÉE
- [x] (porté, D451) (D451 mode nuit : porter si le critique juge qu une base + greffes répond à tous les besoins, sinon écrire le manque ; après tour 65) Carnet compact passe 2 : page publiée https://claude.ai/artifact/Yb51q1gSCTXwZ6QrFZBgtj (6 versions, 11 écrans dont mémo, problème, récolte, idée ; part 77 à 82 %) ; attend son classement — VERDICT : base v01 p3 + greffes v01 p2, v05 p3, v03 p3 (D451/VERDICT.md) ; plan en cours work/missions/2026-11-24-port-d451
- [x] (porté, D451) (D451, avec la passe 2, même critique) Carnet = suivi d un problème (passe 3) : page publiée https://claude.ai/artifact/LxdEwZq4AxtxL3LVFeSKEX (6 versions × 10 écrans, épreuve sur 4 cas tenus à part) ; attend son classement ; exemples ZZ TEST en création
- [x] Prix des houblons (prix-houblon2 c303d2223 : quantité, CHF/kg, accord D450, Escalader sur manque, en-tête CHF) en ligne tour 63 (index-DBJpkM3g.js) + aiTask ; décision pilote : lecture A (markdown entier + Flash-Lite) principale, url_context (B : 2 prix faux sur 13) réservé aux pages bloquées
- [ ] URGENT (sa plainte 25.11) CARNET-SES-DONNEES-EXISTANTES : reel-73 (ses 32 carnets en lecture, tous les écrans) en cours, puis tests/correctif avec c74 ; fil ancien en vrac (rangé par analyse locale, IA d un toucher)
- [ ] Ménage : retirer les carnets « ZZ TEST — … » laissés par la voie exemples du 24.11 (nos données de test, pas les siennes), plans compris, relevé de ses carnets avant/après ; après reel-73
- [ ] URGENT (sa plainte 25.11) CARNET-LISTE-COMPACTE : liste trop peu compacte (≥ 70 %, ≥ 7 lignes à 390) et en-têtes repliables avec un filtre + R91 priorité par menu ⋯ (pas de glisser) + R92 CHAMP-CARNET-REPLIE (mini champ, photo et micro toujours actifs) ; tests de R92 et des constats reel-73 dans une voie c74b-tests ; c74-tests en cours, puis c74-fix, tour 74
- [ ] NOTE-EXPLOITEE + LIEN-PAS-PRODUIT : synthèse faite (note/SYNTHESE.md, N1..N5) ; note-tests 2826603b7 (30/40) ; note-fix après banc-modeles (même fichier carnetIA.ts) ; affichage et poids sur le rang : axe des mini maquettes
- [ ] LIEN-PAS-PRODUIT (ses mots 24.11) : un lien d information (frais d envoi, conditions, guide) n est pas un article ; l IA le range comme information et le rattache au vendeur ou aux articles (frais d envoi → prix rendu) ; avec la synthèse NOTE-EXPLOITEE
- [x] Écriture à l ouverture d un carnet (LE-1) : cause reprendreLectures (lecture de lien gardée rejouée seule), corrigé 6f2d66fb9, en ligne tour 60 (index-DfTdaO8-.js) ; à vérifier en ligne par le prochain critique
- [ ] (la tâche planifiée a tourné 23:00–23:49 sans rien produire : à relancer en session, Calendrier d abord, après le tour 73) Dès 23 h (24.11, sa demande) : rounds de test d écran sur TOUTE la vraie app (tâche planifiée « nuit-tests-app », dossier work/missions/2026-11-24-nuit-tests/) ; ne pas déployer pendant un round
- [x] virgule-transversale : contrôle corrigé (0f16a7166), VIRGULE OK, témoins OK
- [x] Tour 50 : critique-50, 9 problèmes (1 B), corrigés 8/8, son carnet intact
- [x] Test de son carnet chambre froide (critique-48) : 6 problèmes (0 B), carnet intact
- [x] Lecture des liens D449 : code 40c6766a5, banc 21/24 (prix 54/56, caract 41/48, 0 invention), en ligne tour 47
- [ ] Carnet : CA13-1..11, FIX13-1, FIX13-2, BL-13, BL-14, revérifier en ligne et corriger
- [ ] Carnet : lecture d'une photo par l'IA (L-24), une vraie pièce, coût réservé et journalisé
- [ ] Calendrier : CALP-6, CALP-13, bandeau « Enregistrement sur le serveur… » qui reste, « −1 663 » sous ±, bouton de durée en retard
- [ ] Calendrier : lenteur mesurée en ligne ; preuves du tour 22 (jour exact à 3 sem., Ventes, vente → fiche)
- [ ] Écrans en thème sombre et à 1280 : passe du critique sur Carnet, Calendrier, écritures
- [ ] Méthode : test de propriété instable (graine fixée), mise à jour de l'app plus rapide au 1er chargement
- [ ] Méthode : CI GitHub Actions (fichier prêt, commit local), tests des règles Firestore, web-vitals, Stryker
- [ ] REPRISE-GENERALE du 22.11 : Eau (alerte à 660), Matériel (equipment/undefined), Stock et Autres stocks, Ma levure, Malts/sucres

## En attente de lui
- [x] Plafond IA Google relevé par lui (24.11)
- [x] Tags en-ligne tour27..44 retirés de GitHub (24.11, son accord)
- [x] Tour 57 : critique-57, 2 problèmes (0 B), POI-1 et Q4-1 vérifiés

- [x] PR ouverte : https://github.com/Mrspadaaa/Brasserie/pull/204 (branche claude/reprise-soir-24-11, sans captures de l app réelle) ; à remettre à jour après chaque lot
