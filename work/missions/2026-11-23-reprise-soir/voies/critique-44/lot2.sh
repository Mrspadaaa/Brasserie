cd "$(dirname "$0")"
j() { timeout 290 node jouer.mjs "$@" 2>&1 | grep -v "^    at" | grep -v "boutons\|champs\|tiers \[" | cut -c1-500; }
j A6 "Pour moi" 0 '{"nom":"Pour moi","montant":"2,50","dx":-20,"revient":"Mois","duree":"6 mois","mois":true,"case":"Sans justificatif"}'
j A7 Autre 0 '{"nom":"Autre sortie","montant":"1","dx":-30,"compte":"Autre"}'
j R1 Vente 0 '{"nom":"Vente","montant":"4,80","aPayer":true,"sens":"in","dx":60,"case":"Sans justificatif","mois":true}'
j R2 Apport 0 '{"nom":"Apport","montant":"5","dx":-20,"revient":"Mois","duree":"6 mois","case":"Sans justificatif","mois":true,"compte":"Espèces"}'
j R3 Autre 1 '{"nom":"Autre entrée","montant":"1,10","dx":-10,"compte":"TWINT","mois":true}'
echo LOT2 FINI
