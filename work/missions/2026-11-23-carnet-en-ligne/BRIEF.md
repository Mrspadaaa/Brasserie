# Épreuve du Carnet sur la vraie app — brief commun (23.11)

Ses mots : « Tu fera le même batch de test avec le carnet. » ; « 5chf de crédit alloué pour des test sur la vrai app » ;
méthode améliorée acceptée le 23.11 (« Oui et sur le calendrier … »). Même batterie que le Calendrier
(work/missions/2026-11-23-calendrier-en-ligne/ : BRIEF, M1–M5, LISTE, contre-epreuve), avec ces règles :

## Où
- App : https://brasserie-l-affinee.web.app/ — tour 12 (paquet assets/index-zpcbYIem.js). Entrée : Brassins › Atelier
  › Carnet (et Stocks › Matériel › À venir, Calendrier « Au calendrier »).
- Navigateur : UNIQUEMENT son Chrome de débogage, port 9222 (connecté) : `chromium.connectOverCDP('http://127.0.0.1:9222')`
  (Playwright, dans le worktree port-carnet : e2e/outils/doigt.ts pour le vrai tactile) ; TA page, émulation téléphone
  390×844 (puis 390×660, 844×340 là où utile), toucher activé. JAMAIS browser.close() ni fermer Chrome ou un autre onglet :
  à la fin page.close() de TA page puis disconnect. Pas de Claude in Chrome.
- Bon paquet d'abord : avant chaque série, lis le paquet chargé ; si ce n'est pas index-zpcbYIem.js, recharge sans cache ;
  sinon arrête et signale.

## Données et IA
- Seulement « ZZ TEST — <méthode> — … », retirées à la fin (disparition vérifiée). Jamais toucher une vraie chose ; un
  geste qui en déplace une : Annuler aussitôt, et le signaler. Jamais « Confirmer » un vrai document, ni mot de passe, ni
  paiement.
- Vraies pièces (L28) : vrais liens de fournisseurs (pages produits publiques, par ex. ceux déjà présents dans ses carnets,
  copiés dans un carnet ZZ TEST) — pas de liens inventés.
- Gemini réel (5 CHF pour TOUTE l'épreuve, toutes méthodes) : chaque geste qui appelle l'IA (lecture d'un lien, note rangée
  par l'IA, aide) s'écrit dans `ia-journal.jsonl` de ce dossier : {heure, methode, geste, modele si connu, estimation CHF}.
  Budget par méthode : 1 CHF ; au-delà, plus d'appel IA.

## Juger (L12, D343, D344)
- Chaque constat : une capture QUE TU AS REGARDÉE, sauvée dans `<methode>/`. Mesures DOM en appui seulement.
- « combien et quels problèmes ? » après chaque geste. Références : ses lignes CARNET-* et PC-* de
  work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md, ses mots Carnet dans SPEC-BRASSEUR.md, ses choix
  (work/refonte-frontend/v4/choix/ecrans.json, missions 2026-11-16 à 2026-11-22 *carnet*), GESTE-DATE-PARTOUT.
- Registre : work/missions/BUGS.md a déjà des lignes Carnet (CRU-*, PC-*, etc.) : rejoue les ouvertes de ton périmètre
  et dis OK/KO/non reproduit.

## Rapport
- `<methode>/RAPPORT.md` (méthode, couverture jouée/pas jouée, défauts) + `<methode>/defauts.jsonl`, une ligne par défaut :
  {"id":"CA12-<M>-n","gravite":"B|G|m|d","ecran","geste","attendu","observe","capture","regle","source"}.
- Pas de code, pas de commit de code, pas de déploiement ; commite seulement ton dossier `<methode>/` (et ia-journal.jsonl)
  par chemins, dans le worktree Brasserie (`git add -f`), message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».
- Retour en une ligne : « <méthode> : n défauts (B x, G y), couverture z %, IA w CHF — <chemin> ».
