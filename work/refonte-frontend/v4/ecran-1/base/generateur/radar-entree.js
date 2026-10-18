// Entrée esbuild du radar unique : d3-shape et d3-scale (géométrie), motion (balayage à ressort).
// Mêmes paquets que l'app (motion en dépendance directe, d3-shape et d3-scale par recharts).
import { lineRadial, curveLinearClosed } from 'd3-shape';
import { scaleLinear } from 'd3-scale';
import { animate } from 'motion';
window.D3 = { lineRadial, curveLinearClosed, scaleLinear };
window.MO = { animate };
