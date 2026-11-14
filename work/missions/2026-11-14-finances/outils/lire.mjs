// node lire.mjs <fichier> <texte> <JETON> : imprime JETON OK si le fichier contient le texte.
import { readFileSync, existsSync } from 'node:fs';
const [f, t, j] = process.argv.slice(2);
console.log(existsSync(f) && readFileSync(f, 'utf8').includes(t) ? j + ' OK' : j + ' ECHEC');
