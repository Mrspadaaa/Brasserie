# Dossier liens-modeles — sa décision du 24.11 (D449)

Ses mots : « Je pense que escaler devrait utiliser neon plutôt que hydrogen, et hydrogen est dans le workflow automatique du flash lite ne trouve pas toutes les informations »

## Aujourd'hui (functions/src/lienIA.ts:131-160, lireLien.ts:316-320, models.ts:34)
- Cascade : données publiées (schema.org, microdata) → HTML → IA si `iaUtile` (prix absent ou douteux, ou moins de 4 mesures techniques) : Flash-Lite (gemini-3.5-flash-lite, réflexion minimale), puis Hydrogen (INVOICE_STRONG_MODEL = gemini-4-hydrogen) SEULEMENT si le prix manque, est retiré par la garde ou contredit le prix publié. L'IA ne remplace jamais un champ trouvé ; un désaccord devient une étape « douteux » ; une panne ne s'escalade pas.
- Bouton « Escalader » (`escalade: true`) : directement Hydrogen, même page complète.
- Page bloquée : url_context Flash-Lite (copie de Google) — hors de cette voie.

## Voulu
- Escalader → gemini-4-neon. Tarif mesuré au banc des outils (work/missions/2026-11-23-carnet-en-ligne/banc-liens/outils/gemini/bench.mjs) : 3,00 USD / 15,00 USD par million de jetons (entrée / sortie), réflexion LOW. Neon était lent (10,7 s) au banc des outils : acceptable pour un bouton qu'il touche lui-même ; l'étape « en cours » doit le dire.
- Automatique : Flash-Lite, puis Hydrogen dès qu'un champ de la fiche reste vide après Flash-Lite (« ne trouve pas toutes les informations ») : prix, nom, caractéristiques sous le seuil, devise/frais si la page en parle. La photo ne vient pas de l'IA : ne pas escalader pour elle seule. Ne jamais remplacer un champ déjà trouvé ; 0 invention reste la règle dure.

## Banc
- scripts/banc-liens.ts : `--ia seche|reel`, `--budget`, `--lot`, `--secret functions/.secret.local`, cache des réponses (rejouer = gratuit). Dernière mesure (63 liens, ia-9) : prix 54/56, photo 56/59, caractéristiques 44/48, 0 invention.
- Budget IA de la soirée : ≈ 2,8 CHF restants sur 5 (estimé) ; cette voie 0,30 CHF au plus, réservé avant chaque envoi.
