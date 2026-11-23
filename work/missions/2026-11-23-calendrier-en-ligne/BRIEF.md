# Épreuve du Calendrier sur la vraie app — brief commun

Ses mots (après la maintenance) : « continue les test sur la vrai app, focus pour le moment uniquement le calandrier,
focus 1: la frise de temps il y a beaucoup de problème, focus numéro 2 le calendrier global » ; « il faut que le
calendrier soit super éprouvé » ; « les agents doivent faire les vrai de vrai test avec les vrai bonne methodes de
testing !!! » ; « plusieurs différents types de méthode de testing tant que tout est couvert ».

## Où
- App en ligne : https://brasserie-l-affinee.web.app/ (tour 10, commit 8ec6706db). Sa session est déjà ouverte dans
  son Chrome. Outils : Claude in Chrome (`mcp__claude-in-chrome__*`), chargés en UN appel ToolSearch
  (tabs_context_mcp, tabs_create_mcp, navigate, computer, read_page, find, resize_window, javascript_tool,
  read_console_messages, tabs_close_mcp).
- Ta propre fenêtre d'onglet : `tabs_context_mcp` puis `tabs_create_mcp` ; travaille UNIQUEMENT dans ton onglet ; si une
  capture montre une autre page (un autre agent travaille dans le même Chrome), re-sélectionne ton onglet et rejoue.

## Interdits absolus
- JAMAIS fermer Chrome, ni une fenêtre, ni un onglet qui n'est pas le tien ; JAMAIS `taskkill`, `Stop-Process` ou
  équivalent sur chrome.exe ; à la fin, ferme seulement TON onglet.
- Taille unique pour tous les agents : `resize_window` 390 × 844 (téléphone, son Android). Ne change jamais la taille
  (d'autres agents partagent la fenêtre). Un seul thème (clair).
- Données réelles : lecture et gestes sans écriture, SAUF données créées par toi nommées « ZZ TEST — <méthode> — … »,
  que tu supprimes à la fin (vérifie qu'elles ont disparu). Ne modifie, ne déplace, ne supprime JAMAIS une chose
  existante du brasseur ; si un geste déplace une vraie chose par accident : Annuler aussitôt, et le signaler.
  Jamais « Confirmer » un vrai document, jamais de mot de passe, jamais de paiement.
- Pas de code modifié, pas de commit, pas de déploiement : tu testes et tu écris ton rapport.

## Comment juger (L12, D343, D344)
- Chaque constat repose sur une capture QUE TU AS REGARDÉE (screenshot ou zoom). Un rapport sans capture ouverte est
  refusé. Mesures DOM (javascript_tool, read_page) en appui, jamais seules.
- Question ouverte après chaque geste : « combien et quels problèmes ? ».
- Référence de ce qu'il a choisi : frise B (`work/missions/2026-11-20-frise/` dans ce dépôt, frise-interactive.html si
  présent), fiche v02 (D412), règles : CAL-PERIODE-APP-FIXE (« Cette période là reste fixe, le reste peut être
  mobile »), CAL-RETOUR-PASSE, CAL-ECHELLE-COHERENTE, CAL-FRISE-ETIQUETTES, CAL-AN-390, CAL-FICHE-FRISE,
  GESTE-DATE-PARTOUT (lignes dans `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`), ses captures
  `work/missions/2026-11-21-calendrier-entete/34 à 38`.
- Note : les correctifs de frise f9cd2cf84 (fenêtre d'une semaine en jours, année du cadre) sont dans main mais PAS
  en ligne : si tu vois « S47 – S52 2026 » après un recul d'un an, note-le comme « connu, corrigé non déployé ».

## Rapport
- Fichier : `work/missions/2026-11-23-calendrier-en-ligne/<methode>.md` : méthode appliquée (référence), couverture
  (ce qui a été joué / pas joué, pourquoi), puis la liste numérotée des défauts : id `T10-<M>-n`, gravité B (bloquant)
  / G (grave) / m / d, écran, geste exact pour reproduire, attendu, observé, chemin de la capture (sauvegarde-les avec
  `save_to_disk` et note le chemin), et si c'est une régression d'une règle ci-dessus.
- Pas de suppositions : « non reproduit » se dit, avec les essais faits.
- Retour final en une ligne : « <méthode> : n défauts (B x, G y), couverture z % — <chemin> ».
