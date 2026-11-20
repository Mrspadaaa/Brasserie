# Captures g1 : relecture de l'exécutant (20.11, second passage)

Script : `voies/g1/capturer.mjs` corrigé (« + » flottant « Actions rapides », puis « Nouvelle écriture »). Passage 2 : 8 PNG régénérés, chacun ouvert (Read). Aucun appel Gemini.

Lignes par capture (feuille ouverte ; en-tête « N lignes » et rangée « Articles lus N » ; Sédation) :
- montant-deduit-390-clair : feuille ouverte oui ; en-tête « 4 lignes » et « Articles lus 4 », même N ; Sédation 0,00 en jaune et « montant déduit (somme = total) : à contrôler » lisible sous elle, oui.
- montant-deduit-390-cave : feuille ouverte oui ; « 4 lignes » et « Articles lus 4 », même N ; Sédation 0,00 en jaune et « montant déduit (somme = total) : à contrôler » lisible, oui.
- montant-deduit-1280-clair : feuille ouverte oui ; « 4 lignes » et « Articles lus 4 », même N ; Sédation 0,00 en jaune et « montant déduit (somme = total) : à contrôler » lisible, oui.
- montant-deduit-1280-cave : feuille ouverte oui ; « 4 lignes » et « Articles lus 4 », même N ; Sédation 0,00 en jaune et « montant déduit (somme = total) : à contrôler » lisible, oui.
- port-390-clair : feuille ouverte oui ; « 23 lignes » (dont port 8,50) et « Articles lus 23 », même N ; Sédation non concernée (état port).
- port-390-cave : feuille ouverte oui ; « 23 lignes » (dont port 8,50) et « Articles lus 23 », même N ; Sédation non concernée.
- port-1280-clair : feuille ouverte oui ; « 23 lignes » (dont port 8,50) et « Articles lus 23 », même N ; Sédation non concernée.
- port-1280-cave : feuille ouverte oui ; « 23 lignes » (dont port 8,50) et « Articles lus 23 », même N ; Sédation non concernée.

Essais : le premier passage a montré « Écran indisponible » (« Impossible de charger cet écran ») sur plusieurs captures ; le second passage, sans changement de code, a ouvert la feuille partout. Cause probable : premier chargement à froid de Vite. Relancé une fois : ouvert.

Douteux :
- Le texte lu par le script (« N lignes », « Articles lus ») reste « — » : le sélecteur regex ne voit pas ces libellés dans `innerText`. Les chiffres ci-dessus viennent des PNG, pas de la sortie du script.
- Le libellé « repris » du montant déduit n'est pas visible à 390 ni à 1280 : seule la phrase « montant déduit (somme = total) : à contrôler » l'est.
- Les 8 captures sont en local (`apercuDev`, état simulé), non déployées.
