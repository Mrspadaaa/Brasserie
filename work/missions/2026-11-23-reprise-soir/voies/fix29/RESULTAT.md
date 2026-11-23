OK — T29-1 à T29-12, T28-16, CALP-5 corrigés et testés ; preuve en ligne due au pilote (T29-4 : feuille sur place non faite)

Fichiers (OWNS élargi, nécessaire) : src/ui/calendrier/{useDonneesCalendrier.ts, cadre/etat.ts, entete/{Fenetre,BandeSemaines,EnTete}.tsx, entete/entete.css, frise/{Marque,Rangee}.tsx, frise/usePointeur.ts}, src/components/tabs/CalendrierTab.tsx (1 ligne : période passée au hook), src/components/periode/periode.ts (finHorizonPlage), src/components/tabs/DashboardTab.tsx (Bord › Agenda), tests/unit/calendrierFix29.test.ts, calendrierFix29Marque.test.tsx, tests/unit/calendrierCadre.test.ts inchangé.

| Constat | Fait | Test |
|---|---|---|
| T29-1 | l'horizon du modèle couvre la période de l'app (passé jusqu'au lundi de du, avenir jusqu'à au ; 10 ans au plus, la butée du passé existante reste dite) | calendrierFix29 « T29-1 » (rouge puis vert) |
| T29-2 | « › » sur plage : borne = horizon du Calendrier (5 ans), plus 52 sem. : ne recule plus ; la frise suit grâce à T29-1 | « T29-2 » |
| T29-3, T28-16 | appui long sur une petite marque : menu, plus de 6 semaines (l'échelle ne change plus sous le doigt ; la pose se relit dans la même géométrie) | calendrierFix29Marque (rouge puis vert) |
| T29-4 | Bord › Agenda : ligne = div ; case seule coche ; le nom est un bouton qui ouvre l'agenda (Atelier) | aucun test de rendu (DashboardTab sans banc) : à prouver en ligne |
| T29-5, CALP-5 | bulle « lâcher ici » : places au-dessus/au-dessous de la barre permises hors de la piste, dans le cadre de la frise | « T29-5 et CALP-5 » |
| T29-6 | défilement au bord plafonné à 3 colonnes/s (2,5 s : 7 sem. au plus, au lieu de ~20) | « T29-6 » ; la pose « dans le cadre visible » à prouver en ligne |
| T29-7, T29-8 | l'année du bord gauche se nomme (si elle n'écarte aucune autre année) ; janvier dit son année à un nom par mois quand elle tient | « T29-7 et T29-8 » |
| T29-9 | rangée « vide » quand rien dans le cadre seul (`rangeeVide`) | « T29-9 » |
| T29-10 | semaines : années dès plus de 52 colonnes (« S48 2026–S47 2030 ») | « T29-10 » |
| T29-11 | « ‹ auj. » est un bouton, action `aujourdhui` du réducteur | « T29-11 » |
| T29-12 | « 2 ans ½ », « 4 ans », « 5 ans » dès 2 ans ; mois en dessous | « T29-12 » |

Critères : tests calendrier* + proprietes + calPasse + geste : 26 fichiers, 380 tests verts (sortie dans tests.log) ; `npx tsc --noEmit -p .` : seulement les 2 erreurs connues (seedData, pwa-register). etat-coherent (e2e Playwright) NON rejoué : pas de serveur ici ; à rejouer par le pilote.
Environnement : fast-check (déclaré au package.json) manquait dans node_modules ; copié depuis npm pack dans node_modules/fast-check et pure-rand (sans toucher package*.json).

Doutes et limites :
- T29-3 : lu comme « le zoom au toucher = appui long d'une petite marque ». Si la cause en ligne est autre (pointeur périmé du pincement), le contrôle en ligne le dira. « À 3 mois, un glisser de 72 px reste sans effet » : non reproduit ici, non corrigé.
- T29-6 : seule la vitesse est corrigée ; la pose hors cadre au lâcher n'est pas reproduite ici.
- onSixSemaines (E27) reste câblé mais n'est plus appelé (code mort à retirer plus tard) ; e2e/carnet/lot-10 mentionne l'ancien comportement dans un commentaire.
- periode.ts : seules les plages de dates glissent jusqu'à 5 ans ; mois/trimestre/année gardent 52 sem.

DÉCISION À PRENDRE : T29-4, « le nom ouvre la chose sur place » : j'ai fait ouvrir l'agenda (Atelier). Ouvrir la feuille de la ligne exige que navigateToCreativeLab (App.tsx) porte l'id de l'item et que CreativeLabTab ouvre son éditeur ; hors Possède. Recommandation : le pilote l'ouvre en lot séparé.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
