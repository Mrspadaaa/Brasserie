# Exigences communes des voies de correction (à relire dans chaque voie, L05)

- **Ses mots** (31.10) : « comme c'est de la facturation, c'est super important, ça doit être très fiable ! » ; « la partie business est
  pas 100% correcte. Les liens avec le stock et tout de font pas correctement, certain champs sont mal remplis » ; « Attention au
  mapping, on veut pas de retrouver avec plein de fiche du même produit ». La justesse passe avant la vitesse.
- **Aucun chiffre inventé** : une valeur non imprimée reste vide, ou elle est marquée « déduite » avec sa règle ; jamais présentée comme
  lue. Les montants sont des centimes entiers. Une valeur qu'il a tapée n'est jamais écrasée.
- **Gemini jamais appelé** : lectures simulées seulement. Vérité de sa facture : `work/missions/2026-10-31-ecran-depense/diagnostic/d1/verite-facture-372765.json` ;
  lecture simulée : `diagnostic/d1/lecture-simulee-372765.json`. Aucune donnée réelle, aucun Drive réel, aucun déploiement, aucun appel
  hors localhost.
- **Défaut d'abord en test** (L13) : chaque défaut visé devient un test qui échoue sur le code d'aujourd'hui, lancé avant la correction ;
  la sortie va dans RESULTAT.md sous « TEMOIN AVANT : ». Puis la correction, puis le même test vert.
- **Rien ne se perd** : les tests existants restent verts ; une dépense enregistrée avant la correction reste lisible et juste ; aucun
  champ n'est retiré d'un document Firestore (ajouts seulement, facultatifs).
- **Deux temps** : (1) `PLAN.md` dans ta voie, au format de `.claude/skills/voies/references/sans-memoire.md` § 2 (défauts visés, changements
  avec fichier et fonction, tests qui échouent d'abord, risques : données existantes, hors ligne, double clic, arrondis ; hors périmètre),
  puis tu t'arrêtes et rends `PLAN PRÊT — <n> défauts`. Deux relecteurs neufs le relisent. (2) Le pilote t'envoie la revue triée : tu codes.
- **Interdits partout** : `functions/.env` (ne pas le lire), `.codex/`, `source4-portable-bundle-manifest-01.json`, `work/refonte-frontend/v4/choix/`,
  `work/missions/2026-10-31-ecran-depense/brasseur/` (sa facture porte son nom et son adresse : rien n'en est copié ; aucune fixture ne
  contient son nom ni son adresse). Pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`, pas de `git stash`, aucun commit, aucun code
  écrit par heredoc ni par `node -e`, aucune installation.
- **L'écran n'est pas refait ici** : il sera choisi par le brasseur sur des variantes (entonnoir). Une voie ne change l'interface que là où
  sa consigne le dit ; elle rend les données dont l'écran aura besoin.
- **Rendre** : `RESULTAT.md` écrit section par section (ligne 1 : `OK — …` ou `ECHEC — …`), « TEMOIN AVANT : … », par défaut ce qui est
  fait et son test, les fichiers écrits, « Rien ne se perd : … », le hors périmètre, `LEÇON PROPOSÉE : …` ou `aucune`,
  `CONNAISSANCE : …` ou `aucune`. Réponse au pilote : une ligne.
