# Avis — regard Premiers principes (opus, 42 k jetons, 7 outils)

J1 — D'accord : téléphone, par moments volés. Le geste qui revient le plus souvent est de noter un manque dès qu'il y pense, sur place. Il consulte le plan moins souvent qu'il ne note. — SOURCE — « pas beaucoup de temps à consacrer à ça » ; « il me manque encore beaucoup de choses ».

J2 — Je corrige : le recap pose deux questions (payer, finir), ce qui fait deux outils (L10). Facteur libre proposé : l'ordre, guidé par « ce qui débloque le brassage ». L'argent et les heures restent sur la ligne de contexte. — CONSEIL — L10.

J3 — Oui, avec un fait de plus : aucune donnée n'existe, ni chantier saisi, ni peut-être le solde de départ. Une prédiction sur zéro entrée ne prédit rien. Il faut donc saisir d'abord. — SOURCE — DEPART.md ; `forecast.ts:152` (`cashCents` peut être `null`).

J4 — Je corrige : en 10 s, il voit ses manques, le suivant et ce qui le bloque. Le reste à payer apparaît dès qu'un prix existe. La date de fin reste « à estimer » tant qu'une durée manque. Ajouter un manque : un titre seul. — CONSEIL — aucun chiffre inventé.

J5 — D'accord pour étendre plutôt que doubler. Un piège, à vérifier : un site vitrine enregistré en `source: 'equipment'` fausserait « Évolution de la brasserie » et les Prévisions. Il faut une nature (matériel ou travail) avant d'étendre. — MESURE — DEPART.md ; CLAUDE.md « finir ou brancher ».

J6 — D'accord. J'ajoute un risque : une frise ou une date de fin vide de données serait la nouvelle « partie maron », une zone qui ne représente rien. — SOURCE — D259.

J7 — D'accord : la saisie gagne. J'ajoute que tout chantier sans montant ni date sort déjà des Prévisions (« Projet à compléter »). « Quand pourrai-je payer » ne voit donc que les chantiers chiffrés, et l'écran doit le dire. — SOURCE — `forecast.ts:91`.

J8 — D'accord. Son propre mot pour l'ensemble est « ce qui me manque » ; « Rénovation » vient aussi de lui. Les deux peuvent servir d'axe de variantes. — GOÛT — SPEC 01.11.

J9 — D'accord, et il manque aussi la cause du blocage. Un chantier attend souvent autre chose qu'un autre chantier : un artisan, un devis, une livraison, l'argent. Rien de cela n'est modélisé. — SOURCE — DEPART.md.

J10 — Une ligne « Ensuite » en tête : le prochain chantier et sa cause de blocage. Puis la liste, avec une pastille d'état. Francs et heures sont à un toucher tant qu'ils restent « à estimer ». Le recap chiffré n'apparaît que lorsque les données existent. — GOÛT — ses mots du 18.10.

J11 — D'accord. J'ajoute trois cas : tout « à estimer » (le cas réel du premier jour), le solde de caisse inconnu, et un chantier qui attend un artisan. — CONSEIL — `forecast.ts:152`.

J12 — D'accord. Le ROI reste hors périmètre, mais pas l'idée de « débloque la production » : une rénovation coûte tant que la brasserie ne brasse pas. — CONSEIL.

J13 — Ce sont des goûts : à montrer en variantes, pas à trancher. Mon regard : la frise (c) dépend de dates qu'il n'a pas. J'ajouterais une approche (e) : la ligne « Ensuite » dans le Bord, avec la liste complète à un toucher. — GOÛT — l'Agenda du Bord existe.

J14 — D'accord sur les points 1, 3, 4, 5 et 6. Le point 2 est un pari : il finance peut-être avec une enveloppe fixe (épargne, prêt) plutôt qu'avec le solde projeté, qui peut être inconnu. Les deux doivent apparaître comme axe de variantes. — GOÛT — `forecast.ts:152` ; « pas non plus un gros budget ».

J15 — Je confirme, et c'est le cœur de mon regard : la vraie question est « comment ses cinq manques entrent-ils dans l'app cette semaine ? ». Le plan et la prédiction viennent ensuite, nourris par cette saisie. — CONSEIL.

J16 — D'accord : ajouter une nature, des heures, un blocage et des étapes touche `financialPlans`. Cela demande son ACCORD, après son choix de maquette. Les maquettes ne touchent rien. — ACCORD.

J17 — Paris classés, du plus lourd au plus léger : 1. Il saisira des heures et des prix ; si c'est faux, la prédiction reste vide. 2. L'ordre est libre ; s'il est imposé par les dépendances, le facteur libre est l'argent. 3. Il paie avec la caisse, pas avec une enveloppe. 4. L'emplacement de l'écran. — CONSEIL — L10 ; L20.

J18 — La saison : le 01.11, l'armoire extérieure et le revêtement des sols sont sensibles au froid (connaissance générale, aucun texte de lui). La rénovation est une phase : l'outil doit redevenir les Projets de matériel une fois les travaux finis. — CONSEIL.

LEÇON PROPOSÉE : un outil de prédiction se cadre sur ses entrées réelles. Avant de le cadrer, compter ce qui est saisi : ici aucun chantier, et un solde de départ peut-être `null`. Si l'entrée manque, le premier outil est sa saisie ; la prédiction vient ensuite (L10, L20).
