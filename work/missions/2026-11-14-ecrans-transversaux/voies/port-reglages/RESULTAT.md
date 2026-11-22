OK — Réglages d3p2 portés (4 vues) ; retouches du 15.11 faites : ordre Fiscalité, IBAN, pastilles, cuve, Accès, Sauvegardes.

Worktree : `C:/Users/mrspa/AppData/Local/Temp/transversaux-port` (branche `claude/ecrans-transversaux`).

## Fichiers écrits (worktree)
- `src/components/SettingsModal.tsx` : enregistrement, gardes IBAN et installation, `ouvertSur`, noms de boutons inchangés.
- `src/components/reglages/regles.ts`, `Vues.tsx`, `reglages.css` (classes `rg-`, jetons de l'app, clair et cave par `data-theme`).
- `tests/unit/reglagesBilan.test.ts`, `tests/unit/reglagesBrasserieBornes.test.ts`.

## Retouches du 15.11 (une ligne par demande)
1. Fiscalité : ordre de d3p2 : TVA, Impôt sur la bière (trois cases Plato), Factures par virement. Trois blocs nommés ; en une colonne, ils se suivent dans cet ordre. Deux colonnes seulement si le corps de la feuille dépasse 700 px (requête de conteneur : la feuille fait 520 px de large à 1280, la media query de 900 px écrasait la colonne de droite).
2. IBAN : une ligne « CH44 0076 … 4920 1 › » (début, …, fin), chiffres de contrôle surlignés, mesuré : champ et miroir ont la même boîte (x 133,2 / largeur 241,8 à 390 ; 449,6 / 248 à 1280). Au toucher le miroir se retire et le champ entier se tape. Erreur : une ligne « Clé de contrôle fausse · 21 caractères » + bouton « Corriger » (met le champ au premier plan). Le paragraphe rouge n'est plus visible ; son texte entier reste dans la ligne pour les lecteurs d'écran (`rg-sr`), car `bDiversIbanConfig` lit l'alerte. Quand l'IBAN vient de la configuration de l'app (pas enregistré), la ligne IBAN le dit en sous-titre : « valeur de l'app ».
3. Pastilles « à saisir / à confirmer » : en police de texte. Cause trouvée : `font:600 13px inherit` est invalide en CSS (inherit ne se met pas dans le raccourci), donc la déclaration tombait et le mono du champ s'appliquait. 19 déclarations corrigées (`var(--rg-sans)`), ce qui remet aussi onglets, légendes et titres de section en police de texte.
4. « Identité de la brasserie » : fonction intacte (nom, UID, adresse), maintenant un repli fermé tout en bas de Fiscalité, sous la ligne IBAN et son erreur, donc après tout ce que montre d3p2. Raison : ces champs servent aux factures, comme l'IBAN. Mesuré : ne déplace rien au-dessus.
5. Brasserie : les repères du schéma de cuve (45 L, 35 utile, 35,8 L, perte) sont rangés de haut en bas et écartés d'au moins 12 px, avec un petit trait vers leur niveau. « 35,8 L » ne chevauche plus « 35 utile » ni « 45 L ».
6. Accès : « non connecté » en ton neutre (anneau gris, texte `--rg-t1`) ; seul « connecté » prend le vert.
7. Sauvegardes : lignes plates à filet, comme d3p2. Les panneaux `BackupPanel` et `DriveStoragePanel` ne sont pas touchés (hors périmètre) : habillage par CSS de la feuille. Boutons secondaires sans cadre (ligne, icône à droite ou ›), titres de section en petites capitales, ordre de d3p2 (Garder une copie, Restaurer, Justificatifs sur Drive, Cet appareil) par `display:contents` et `order`, le bouton plein « Préparer ma sauvegarde » gardé. Le titre fourre-tout « Garder une copie · Restaurer · Justificatifs » est retiré. « Cet appareil » : titre + ligne, plus de repli.
8. Correction trouvée en route : la ligne « Tes N derniers brassins : X % » (Voir / Appliquer) ne s'affichait jamais : le filtre cherchait le paramètre `'fermenterYield'` (inexistant, masqué par `as never`) au lieu de `'efficiencyPct'`. Corrigé ; non vue sur capture (le jeu `?dev-local` n'a pas trois brassins éligibles).

## Critères
- tsc : `tsc.txt` vide hors `functions/` (hors périmètre, antérieur).
- Tests : `tests.txt` : règles + settingsIban, bDiversIbanConfig, brewEquipment, caisseAdresses, backupPanel : verts (57). Un rouge : `dashboardNavigation` (« menuitem Vendre » introuvable) : vient du Header modifié par l'autre voie dans le même worktree, sans lien avec Réglages. `tests-tout.txt` : les trois fichiers unitaires liés (brewSystemInsights, reglagesBilan, reglagesBrasserieBornes) : 51 verts. La suite `tests/unit` entière a planté (`ERR_IPC_CHANNEL_CLOSED`, journal `tests-tout-interrompu.txt`) pendant que l'autre voie travaillait : non rejouée.
- Build : `npx vite build` vert (`built in 34,45 s`, `build.txt`) ; `npm run build` bute toujours sur `functions/` (antérieur). Verrou `build.lock` posé et retiré.
- Captures : 390 tactile DPR 2 et 1280, clair et cave, quatre onglets (32 fichiers `reglages-<onglet>-<largeur>-<thème>.png`), plus `fiscal-iban-faux`, `fiscal-identite`, `backup-bas` ; 4 planches `cote-a-cote-*-390.png` (app à gauche, d3p2 à droite ; Fiscalité avec une deuxième capture IBAN faux). Ouvertes : les 4 planches, fiscal 1280 clair et cave, fiscal IBAN faux 390 cave, sauvegardes 390 cave, accès 390 cave, brasserie 1280 cave. Pas d'erreur de page (une exécution a vu `MessageCircle is not defined`, venu du Header en cours de modification par l'autre voie ; disparu à la suivante).

## « Combien et quels problèmes ? » (après retouches)
1. Fiscalité : toggle « Assujettie » éteint dans l'app (donnée, pas de port) ; libellé « Brasserie assujettie à la TVA » gardé (d3p2 : « Assujettie à la TVA ») ; pas de chevrons › sur les lignes éditables en place (voulu : on tape dans la valeur).
2. Brasserie : « Mon installation » (9 réglages dépliables) occupe la place sous les lignes au lieu du résumé d3p2 (voulu, tous les champs gardent leur fonction) ; valeurs de données différentes.
3. Accès : pas d'« Écritures signées », de « Se déconnecter », ni d'arborescence chiffrée : manque (l'app ne les calcule pas).
4. Sauvegardes : pas de frise ni de « 12 jours sans copie », pas de lignes « Éléments sauvegardés » / « Originaux de justificatifs » : manque (date de copie non suivie ; panneaux hors périmètre). Les textes explicatifs des panneaux restent, en petit gris.
5. Fiscalité 390 : l'erreur IBAN est à la dernière ligne avant le pied ; il faut défiler pour la voir en haut de page (comme d3p2).
Total : 5 écarts, tous de donnée, de manque listé ou voulus ; aucun chevauchement ni cadre résiduel vu.

## manque (d3p2 le montre, l'app ne le calcule pas ; non affiché)
- Date de la dernière copie, frise des copies, « 12 jours sans copie », point de santé Sauvegardes (point « non suivi », hors comptes du bilan).
- « Écritures signées · Gaëtan » et bascule d'auteur ; « Se déconnecter » dans Accès (existe dans le menu de l'en-tête) ; arborescence Drive chiffrée ; « Éléments sauvegardés : N brassins · N écritures » en ligne.
- Durée d'ébullition : 1 h fixe dans le schéma ; la recette a la sienne.
- Écart de port : « Quel statut ? » et « Calcul et déclaration » se déplient sur place.

DÉCISION À PRENDRE : Sauvegardes 1:1 (Éléments sauvegardés, Originaux, Restaurer en ligne) demande de refaire `BackupPanel` et `DriveStoragePanel` (hors périmètre, tests liés). Recommandation : une voie de suite, avec l'écriture de la date de dernière copie.
CONNAISSANCE : en CSS, `font: <poids> <taille> inherit` est invalide ; la déclaration entière tombe sans erreur (cause des pastilles en mono).
LEÇON PROPOSÉE : aucune.
