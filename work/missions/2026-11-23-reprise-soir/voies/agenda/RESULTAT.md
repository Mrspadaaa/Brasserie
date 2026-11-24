OK — Bord › Agenda : le nom ouvre la feuille de la ligne sur place, seule la case coche (T29-4)

PRÊT À METTRE EN LIGNE fd27f22e5

## Fichiers écrits
- src/components/tabs/DashboardTab.tsx : `LigneAgenda` exportée (case = coche « Fait » / « Refaire » ; nom = bouton `data-agenda-nom`, ouvre la feuille ; aucun `<label>`). Le Bord garde `useLiveSelection(creativeItems, 'id')` et monte `CreativeItemSheet` (la fiche d'édition de l'Atelier : titre, date, statut, notes, suppression confirmée). Fermer (Annuler, croix) ramène au Bord tel quel, sans navigation. « Gérer » et « Voir tout l'agenda » restent des renvois vers le Calendrier › Agenda.
- tests/unit/bordAgendaLigne.test.tsx : 4 tests (nom → feuille sans cocher ; case → coche sans ouvrir ; pas de `<label>` ; en retard avec sa date, « Refaire » si fait).
- App.tsx et CreativeLabTab.tsx : non touchés (inutile, la feuille est montée sur place).

## Critères
- Test rouge d'abord : 4 échecs (`LigneAgenda` absente). Puis vert : « Test Files 1 passed, Tests 4 passed » (tests.log).
- `npx tsc --noEmit -p .` : 2 erreurs, les 2 connues (seedData GanttTask, virtual:pwa-register) ; aucune neuve (tsc.log).
- Commit par chemins fd27f22e5 (2 fichiers).
- Essais : 1 par critère. Aucune capture (consigne : preuve en ligne par le pilote).

## Doutes et limites
- La feuille ouverte est celle de l'Atelier (CreativeItemSheet), pas la feuille du Calendrier (FeuilleAjout en mode « modifier », choix CALP-11). Elle exige le modèle complet du Calendrier (modele.choses, ctxAjout, semaines, écriture par `versModification`) : l'héberger dans le Bord revenait à y monter tout le Calendrier. Le côté visuel diffère donc de la feuille d'une fête au Calendrier.
- À vérifier en ligne par le pilote : ouverture de la feuille depuis le nom d'une fête (390 px), Annuler/croix ramène au Bord, la case seule coche, Enregistrer d'un titre ZZ TEST puis retrait.

DÉCISION À PRENDRE : la feuille du Bord doit-elle être celle du Calendrier (même rendu qu'au Calendrier) ? Option A (livrée) : CreativeItemSheet sur place, 0 navigation. Option B : prop `ouvrirFeuille: {id, at}` sur CalendrierTab (hors de mon OWNS) qui appelle `agendaOuvert(id)` existant, depuis un renvoi `ouvrirCalendrierSection('agenda')` ; la feuille du Calendrier s'ouvre alors dans le Calendrier (pas « sur place » du Bord), fermer y reste. Recommandation : A, plus fidèle à « sur place, fermer ramène au Bord » ; B seulement si le brasseur tient au même rendu de feuille.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
