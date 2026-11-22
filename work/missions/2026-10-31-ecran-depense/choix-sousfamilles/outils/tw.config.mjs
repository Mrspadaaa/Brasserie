// La configuration Tailwind de l'app, telle quelle, lue sur les seules maquettes de cette page (mêmes classes, même rendu que l'écran servi).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../../../../../tailwind.config.js';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const motif = path.join(ICI, '..', 'maquettes', '*.html').split(String.fromCharCode(92)).join('/');
export default { ...base, content: [motif] };
