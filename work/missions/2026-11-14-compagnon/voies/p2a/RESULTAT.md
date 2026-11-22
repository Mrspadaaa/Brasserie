OK — p2a relancée : 2 valeurs fausses et 7 mineurs du verdict P2 corrigés, clair et cave

Construction : `node outils/fabrique.mjs` puis `node outils/capture.mjs p2a` (depuis `voies/p2a/outils`, avec un `..` pour capture : `cd outils && node capture.mjs p2a`) ; cadre seul : `node outils/vue.mjs <clair|cave> <cadre…>` (vers os.tmpdir()).

Fichiers écrits (tous sous voies/p2a) : `outils/fabrique.mjs`, `outils/style.css`, `p2a/etat.html`, `p2a/p2a-clair.png`, `p2a/p2a-cave.png`, `p2a/NOTE.md`, `RESULTAT.md`.

Verdict P2, défaut par défaut :
1. conversations : « Brassin 30 · Blonde de garde » (le 31 reste la NEIPA partout).
2. plafond : graduation réduite à 5 CHF et 50 CHF aux extrémités ; « 20 CHF » posé au-dessus du bouton, à (20 − 5) / 45 = 33,3 % ; l'ancien 15 reste marqué à 22,2 %.
3. reponse : titre en `text-wrap: balance` et « dry&nbsp;hop » insécable → « Herbacé : écourte le / contact du dry hop. ».
4. reponse : colonne du libellé à 128 px, sans retour : « Contact Mosaic J+9 » tient sur une ligne. La température n'est plus une barre : une échelle graduée de 15 à 20 °C, 19 en rond pointillé, 17 en rond plein, flèche de l'un à l'autre (libellé « Temp. dry hop »).
5. Espaces : « Et la garde à froid ? » (un seul nœud, et la garde n'est plus à 18 °C, le doute levé) ; « rappel dans 30 min » enveloppé dans un span (le `gap` du bouton ne s'ajoute plus) ; « 2,10/15 CHF » et « 15,00/15 CHF » sans espace ; « 2,10 sur 15 CHF » (limites) sans double espace. Plus aucun `M(x, '')` dans la source.
6. finances : « Approfondi conseillé pour cette vérification » passe au-dessus du segment, qui reprend toute la largeur ; « Approfondi » ne touche plus son bord.
7. finances : « 4 sur 4 » et « 2026 » en sans, plus en mono.
8. bureau : journal complet J+1 → J+8 (pression, Citra 85 g, Galaxy 43 g, DF 1,012 à J+7, dégustation) ; le vide sous le journal disparaît.
9. conversations : « Supprimer » du menu en neutre (texte et corbeille gris) ; le rouge reste à la confirmation.

Données du pilote : accueil, attente, erreur, plafond, zéro et urgent à J+1 (36 h), sans DF 1,012 (fond : « Pression · monte doucement » ; frise : aujourd'hui J+1, Citra J+2 à venir ; pile de l'attente toute hachurée, « Citra J+2 · demain » ; tuile « Densité : je mesure quand ? » à la place de « DF 1,012 : la levure a fini ? ») ; reponse et bureau à J+8 ; fournisseurs à J+4 (fond : « Densité · à relever ») ; zéro montre la question 1 et sa réponse info (« Fermentation normale : laisse monter. », Auj. garde 19 °C, J+2 le Citra) ; le contrôle gardé est celui de densité J+4. « 1,012 » n'apparaît plus qu'aux cadres J+8 (5 occurrences : fonds de reponse, conversations, limites ; bureau).

Critères :
- G1 `node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/p2a p2a --complet` → `SERIE OK`.
- G2 `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/p2a/p2a/etat.html` → `PAGE OK (12 images chargées, 390 px, sans erreur)`.
- Capture : réseau = 0, texte < 12 px = 0, clair et cave.

Captures ouvertes : `work/missions/2026-11-14-compagnon/voies/p2a/p2a/p2a-clair.png`, `…/p2a-cave.png` (pleine page) ; cadres seuls ouverts : accueil, attente, reponse (clair et cave), plafond, finances, conversations, urgent, zero, bureau, limites (`%TEMP%/p2a-<cadre>-<thème>.png`).

Reste, sous le plafond de 120 px : environ 100 px sous « Je lis » (accueil), environ 90 px en bas de conversations.

Prédiction : « Le feu et l'échelle des degrés, je lis tout de suite ; et cette fois les numéros de brassin et le curseur disent vrai. »

DÉCISION À PRENDRE : inchangée. En cave, le primaire `ebc-straw` #F2C14E reste proche de l'ambre d'Attention #E3B55D (DESIGN.md) ; le niveau se lit par la forme (feu, bord, triangle, le mot).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : dans un conteneur flex à `gap`, un nombre enveloppé suivi de texte nu crée une espace visible en trop (« 18 °C  ? », « dans  30 min ») : envelopper tout le texte d'un bouton ou d'une puce dans un seul span.
