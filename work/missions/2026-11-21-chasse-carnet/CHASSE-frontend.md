# Chasse frontend — Stocks › Matériel › Carnets (préfixe CRF, 21.11)

Regard : expert frontend (skill senior-frontend). Version jugée : tag `en-ligne/2026-11-21-tour8` (5fb61c580), worktree temporaire, jonction
`node_modules`, `seedData.example.ts` copié en `seedData.ts` (copie temporaire seulement). Banc `?preview=carnets` (magasin mémoire, IA simulée,
fixture « ZZ TEST »), jamais Gemini. Chrome sans écran, puppeteer-core, 390×844 tactile (touchscreen.tap), CPU ×4 (CDP). Les temps sont pris sur
le **build de production** (`vite build` avec `scripts/parcours/vite.parcours.config.mjs`) ; le serveur de dev est 2 à 3 fois plus lent et n'est pas
la mesure. Aucune capture ouverte : mesures par le DOM et le code (dit à chaque ligne). Connu non recopié : CRP, CRB, CRU, CRW, CRN.

## Bilan : 11 défauts (1 bloquant, 6 gênants, 4 mineurs)

| id | grav. | geste | attendu | constaté (mesure) |
|---|---|---|---|---|
| CRF-1 | bloquant | Ouvrir un carnet, puis Comparer ; retour du téléphone | Le retour referme la vue (Comparer › carnet › liste), comme « Plus » (App.tsx 214-229, `pushState`). | `history.length` = 2 avant et après l'ouverture du carnet et de Comparer ; `goBack()` quitte le banc (`about:blank`). Code : aucun `pushState`/`popstate` dans `ui/carnets/` ; les vues (`carnet`, `article`, `comparer`, `choisir`, `renommer`) ne sont que l'état `vue` de CarnetsVue (`onRetour` → `setVue`, l. 1286-1359). Sur Android le geste retour sort de Stocks avec un brouillon tapé, perdu. À confirmer dans l'app complète (le banc n'a pas la pile de pages). |
| CRF-2 | gênant | `ia=echec` : envoyer « tester le débit du moteur avec le devis » | Après panne ou délai : un « Réessayer » qui repasse le message à l'IA, comme « Ranger maintenant » hors ligne. | À +1,2 s : « L'IA n'a pas répondu : rangé sur l'appareil, tel quel » + **Annuler** seul. `aReprendre` n'est rempli que pour `hors-ligne` (CarnetsVue.tsx 660) ; `echec` n'y entre pas. Le message reste brut, aucune reprise. Délai 45 s (`rangement.ts` 304) : non joué, lu au code. |
| CRF-3 | gênant | `ia=lent` : envoyer, toucher ✕ « Arrêter l'IA » à 0,8 s | Un état qui dit « IA arrêtée, rangé tel quel ». | Après ✕ : « ✓ Rangé ici, à l'instant · Annuler », texte identique à une réussite complète. Le brasseur ne sait pas si l'IA a travaillé. Le focus tombe sur `BODY` (le ✕ est démonté). |
| CRF-4 | gênant | Ouvrir un carnet, ouvrir Comparer, ✕ de l'IA (clavier ou lecteur d'écran) | Le focus va au titre de la nouvelle vue ; l'élément touché ne disparaît pas sous le focus. | `document.activeElement` = `BODY` après chacune des trois (3 mesures). Aucun `focus()` à l'ouverture d'une vue (CarnetsVue ne focalise que le champ, sur `setTimeout`) ; Tab repart du haut de page. |
| CRF-5 | gênant | Fiche d'un carnet › « Articles 6 » (feuille des cartes) au clavier | Focus dans la feuille, fond inerte. | `role="dialog" aria-modal="true"` (CarnetOuvert.tsx 838) mais `d.contains(document.activeElement)` = faux (le focus reste sur l'ouvreur), aucun `inert` sur le fond : Tab parcourt la page cachée derrière. Échap ferme et rend le focus à « Articles » : bien. |
| CRF-6 | gênant | N'importe quel « Rangé ici · Annuler » | Un Annuler qu'on a le temps d'atteindre (WCAG 2.2.1), ou qui reste jusqu'au prochain geste. | Le bandeau s'efface seul après **8 023 ms** (CarnetsVue.tsx 566, `setTimeout 8000`) ; c'est le seul chemin pour défaire un rangement IA. `role="status"`, durée non réglable. |
| CRF-7 | gênant | Cibles tactiles, 390 clair, CPU ×1 | ≥ 44 px (DESIGN.md Cibles). | « Articles 6 » 115×30, « Comparer » 96×30, « Retenir la hotte » 127×40, rangées du tableau 364×41 et 364×42, segment À venir / Carnets / Réalisés 116×28. (« 1 critère sans valeur » 221×20 et barre 40 px : CRU-12, CRU-10, non recopiés.) |
| CRF-8 | mineur | Pendant que l'IA range ou lit un lien (`ia=lent`) | Un signe de progression, puis un second signal si ça dure. | Lien : « lecture de la page… » + squelette tout le temps (+1,5 s à +8,5 s mesurés), aucune étape, aucun temps écoulé ; l'attente peut aller à 45 s sans changement de message (`rangement.ts` 304). |
| CRF-9 | mineur | Annuler pendant la lecture d'un lien, puis Annuler du bandeau | Deux actions, deux noms. | Même mot « Annuler » pour **arrêter** la lecture (✕ de CadreArrivee, `aria-label="Annuler"`, 44×44) et pour **défaire** le rangement (bandeau, 59×44) ; l'attente IA dit « Arrêter l'IA ». Trois libellés pour deux actions : ambigu au lecteur d'écran. |
| CRF-10 | mineur | Échec de l'IA : un même état, trois textes | Une source. | `rangement.ts` 38-40 (`AVIS.panne` : « votre message est gardé »), CarnetsVue.tsx 111 (« rangé sur l'appareil, tel quel ; rien n'est perdu », celui qui s'affiche), EtatIA.tsx 140 (« rangé sur place, rien n'est perdu »). Dérive assurée à la prochaine retouche. |
| CRF-11 | mineur | Retour au fil « ‹ Carnets » pendant l'IA, puis fin | Le bandeau dit où c'est rangé. | Dans la liste : « ✓ Rangé ici, à l'instant · Annuler » ; « ici » n'est plus un lieu (aucun nom de carnet). Le rangement est bien là à la réouverture (pas de perte : 1 occurrence, comme sans quitter). |

## Non joué ou non conclu (dit, pas un défaut)

- **Fermer pendant que l'IA range (démontage de l'onglet)** : lu au code, non joué. `CarnetsVue` n'a aucun nettoyage au démontage pour `rangement` (seuls `pliage` l. 523 et les écouteurs online/offline en ont) : l'appel continue jusqu'à 45 s, écrit via le magasin, puis `surEtat` fait `setState` sur un composant démonté. À la rentrée dans l'onglet, la nouvelle instance n'a plus ni « L'IA range… » ni « Rangé · Annuler » (état local) : le résultat arriverait muet. Le banc ne démonte pas l'onglet (« l'app ouvrirait l'onglet stocks ») : **à jouer dans l'app complète** avant d'en faire CRF-12.
- **Persistance au rechargement** : le banc est en magasin mémoire, un rechargement repart de la fixture ; à jouer sur émulateur (`carnetsStore.ts`, un document par carnet).
- **Hors ligne réel** (événements `online`/`offline`, « Ranger maintenant ») : banc `&hors-ligne=1` seulement : « Hors ligne : rangé sur l'appareil, tel quel » + Annuler vu à +0,2 s ; la reprise est lue au code (CarnetsVue.tsx 943-960).
- **Double saisie rapide** : Entrée ×3 sur un envoi : le garde `occupe` (rangement.ts 270-279) pose le verrou avant la première écriture ; pas de doublon visible, mais le compte exact n'a pas été isolé. Double toucher de « Choisir chez Inox Broye » : un seul choix, « À venir 1 » inchangé.
- **Clés** : clés par index seulement sur des listes calculées, sans état (Choisir 116 et 198, Comparer 85 et 334, FicheArticle 263) : sans effet ; `Bandeau key={retour.id}` remonte volontairement le bandeau. Aucun effet qui réécrit détecté dans les `useEffect` lus.

## Mesures sans défaut (390, CPU ×4, build de production)

| geste | temps | tâches longues (≥ 50 ms) | CLS |
|---|---|---|---|
| chargement du banc | — | 63, 124, 179 ms | 0,004 |
| ouvrir Ventilation (6 articles) | ≈ 120 ms mur | 77 ms | 0 |
| ouvrir Comparer | ≈ 190 ms mur | 147 ms | 0 |
| frapper 46 caractères | 3,4 s pour 1,84 s de délai | 60 à 101 ms par touche (INP ≈ 100 ms) | 0 |
| envoyer une note (IA lente) | — | 250 à 426 ms (écriture locale) | 0,038 à 0,045 (le bandeau « L'IA range… » s'insère) |
| coller un lien et envoyer | cadre « Arrive ici » à la frappe ; lecture +1,5 s, rangé +8,5 s (IA lente) | 250 ms | — |

En dev, la frappe coûte 110 à 185 ms par touche (rendu complet de CarnetsVue à chaque touche) : ce n'est pas la version livrée, mais le seuil de 200 ms est proche si la fiche grossit. À surveiller : 426 ms à l'envoi (analyse locale + écriture) sous CPU ×4.

Scripts de mesure : `m1.mjs` à `m8.mjs` dans le dossier temporaire de la session (hors dépôt).
