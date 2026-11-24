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
pause: 2026-11-24T10:54:05.594Z

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
- [ ] C52 : c52-tests (R12..R15) puis c52-fix, tour 53, test en ligne
- [attente] C50-5 : la phrase du compromis vient de sa maquette g01-8 ; à lui montrer en mini maquettes s'il faut dire gain et perte
- [ ] virgule-transversale : corriger controle-virgule.mjs (7 faux positifs : stock, atelier, WaterRadar), décision du pilote : corriger le contrôle
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
- [x] Tags en-ligne tour27..44 retirés de GitHub (24.11, son accord)
- [attente] Q-4 du Calendrier : vitesse du défilement au bord, sur son téléphone
- [x] PR ouverte : https://github.com/Mrspadaaa/Brasserie/pull/204 (branche claude/reprise-soir-24-11, sans captures de l app réelle) ; à remettre à jour après chaque lot
