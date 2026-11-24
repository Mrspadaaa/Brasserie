# Dossier virgule

- Voie rouges (voies/rouges/RESULTAT.md § Virgule, lignes 13-30, 49) : 29 violations au départ ; 22 vraies retirées ; 7 restent, toutes des faux positifs du contrôle sur une écriture correcte : src/domain/stock/murAutres.ts « {NB} kg » (NB = constante d'espace insécable) ; src/ui/atelier/EssaiPrix.tsx « chf » (nombre déjà passé par split('.') puis joint par « , » dans un gabarit) ; src/ui/water/WaterRadar.tsx « kppm » (const x = Math.round(…) suivi).
- Option retenue par le pilote : (a) corriger le contrôle (ignorer une constante d'espace NB, reconnaître split('.') + ',' dans un gabarit, suivre const x = Math.round(…)). Ne pas poser de « virgule-ok » dans src/.
