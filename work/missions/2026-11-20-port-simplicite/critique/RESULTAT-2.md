(en cours — ligne 1 finale à la fin)

# Critique, passe 2 : test d'écran après corrections

Version : port-carnet, arbre non commité, non déployé. App réelle `npx vite --port 3151 --strictPort`, `?dev-local`, fixtures « ZZ TEST » en mémoire, lecture simulée (`depense=3`), aucun Gemini.
Bancs des voies rejoués sans réécriture : copies hors dépôt (scratchpad) où seuls le port et le dossier de sortie changent ; pour pe1 à 1280, le sélecteur `textarea[...]` devient `[...]` (le champ n'est pas un textarea à la souris). Captures : `critique/captures-2/{depense,pl2pe1,pb,mesure}/`.

## 1. Les 3 bloquants de la passe 1, rejoués au geste
- **pa1 TVA à deux taux : corrigé.** 390 cave, 1280 clair et cave : « Doute 4 sur 8 · TVA 8,1 % · Imprimé 1,95 · recalculé 0,84 · Garder 1,95 / Prendre 0,84 », puis « TVA 2,6 % ». 4,15 n'apparaît plus (`depense/3-tva-pc1280-clair.png`, `bilan.json`).
- **pa2 « Relier les N comme avant » : corrigé** pour le sens du bouton : plus de pastille « à relier », « 2 → Houblons de ton stock » et « Relier les 2 comme avant » parlent des mêmes 2 lignes (`depense/1-repos-t390-cave.png`). Reste un compte qui ne colle pas (problème 2 plus bas).

## 2 et 3. Corrigés vérifiés, angles morts comblés (au fil)
Dépense (banc v-corr-depense, 390 cave, 1280 clair et cave ; 390 clair : délai du vite à froid, déjà capturé par la voie) : `boutonsPleins` 1 partout ; pa1 TVA par taux ; Terminé ferme en un toucher (`apresTermine.feuille` false, toast « Achat enregistré. ») ; moutures groupées « 5 moutures · Zuschlag · Rattacher les 5 » ; « avec leur malt » plus en chasse fixe ; pastille « trouvé » lisible en clair (blanc sur vert) et en cave (texte sombre sur vert, lisible) ; « Lier à un besoin › » présent après délier. Ordre au repos conforme à pa1 : total, Pour, sûres, doute, Puis.
pe1 au geste (menu + › Écriture, à la main › Saisir sans justificatif › 86,50 › Enregistrer), 390 et 1280, clair et cave : l'onglet s'ouvre (Caisse 4 250,00 → 4 163,50, Dépenses nov. et Brassage nov. 0,00 → 86,50), Annuler retire l'écriture (`retirée` dans le stockage ×4), Bord repasse de 836,50 à 750,00. Seules les lignes qui bougent. Corrigé.
pl2 Réalisés (Stocks et Atelier, 4 formats) : « Fermenteur supplémentaire · payé · facture du 15.11 · 750 CHF ». Courbe : 70 px, titre « Hotte », étiquette hors de l'axe ; 12 et 11 corrigés. 10 : voir problème 4.
pb (banc v-corr-pb, 390 cave, qui manquait) : « À définir » choisi d'office, puces au premier plan, plus de ligne « cuve pleine », « Créer à 26,5 L » en 700 lisible sur l'or, pied visible (Créer 674-722, Garder 730-778 sur 844), carte « · 30 L » avec « matériel à régler », ↻ crée, la ligne « créé » est en bas, Annuler la retire. Corrigés 1 à 9.
