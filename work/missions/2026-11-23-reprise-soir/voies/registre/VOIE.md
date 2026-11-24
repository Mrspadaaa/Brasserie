# Voie registre — revérifier un à un BL-4..BL-15, GH-1..GH-4, CALP-1..CALP-14

Lis : ../../COMMUN.md ; en-tête de work/missions/BUGS.md (format des colonnes et des états) ; les lignes visées ; work/missions/2026-11-23-ETAT-DES-TACHES.md.
En ligne : tour 26 = tag en-ligne/2026-11-23-tour26 (b44b191d3), https://brasserie-l-affinee.web.app (déjà connecté dans le Chrome 9222).

## Méthode, pour chaque ligne
1. Le correctif cité est-il en ligne ? `git merge-base --is-ancestor <commit> en-ligne/2026-11-23-tour26`.
2. Preuve du comportement : BL/GH par le banc (work/missions/2026-11-23-carnet-en-ligne/banc-liens/, résultats du 23.11 ; `npx tsx scripts/banc-liens.ts`
   sans IA si besoin) et par le rapport de contre-épreuve tour26/RAPPORT.md ; CALP par la vraie app EN LECTURE SEULE (Calendrier à 390 : reculer,
   menu de période, poignées, sections, renvois — rien d'enregistré) et, pour un geste qui écrit (glisser une barre, modifier un événement :
   CALP-2, CALP-7), par l'app locale `?dev-local` (cerveau/agents/verification-locale.md) ou `node scripts/parcours/calendrier.mjs`.
3. Mettre à jour SEULEMENT la colonne d'état de la ligne et sa preuve (commit, capture, date 23.11) : « corrigé (vérifié en ligne tour 26 …) »,
   « ouvert — présent … », ou « non vérifiable … (pourquoi) ». Ne rien supprimer ; aucune autre ligne touchée (d'autres voies peuvent écrire
   ailleurs dans le fichier : relis-le juste avant chaque Edit, ne le réécris jamais en entier).
4. Après : le contrôle du registre (cherche le script qui affiche « BUGS OK » dans scripts/) → OK.

## Critères
- Les 30 lignes ont un état daté du 23.11 et une preuve ; tableau récapitulatif dans RESULTAT.md (id, avant, après, preuve).
- Captures 390 des CALP vus en ligne, ouvertes. Aucun appel Gemini. Aucune écriture en ligne.

OWNS : lignes citées de work/missions/BUGS.md ; ton dossier de voie. maxTurns 100.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : après chaque étape finie, une ligne (fait, preuve, commit).
- Tests : sortie écrite dans un fichier, jamais dans le contexte : `npx vitest run <fichiers> --reporter=dot > voies/registre/tests.log 2>&1; tail -5 voies/registre/tests.log`.
