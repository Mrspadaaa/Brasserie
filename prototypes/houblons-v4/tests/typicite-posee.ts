// D120 (t2) : la typicité du style (Beer Analytics) est le défaut de proposeVoies, mais sa table arrive à part dans l'app (`chargerTypicite`). Un test qui éprouve l'ordre de Suggérer
// avec le défaut importe ce module : la table est posée à l'import, comme l'app l'a à l'ouverture de l'étape. Chaque fichier de test a ses propres modules : rien ne fuit vers les autres.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { poserTypicite, type TableTypicite } from '../../../src/domain/hopIndex/v4/typicite';

poserTypicite(JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json'), 'utf8')) as TableTypicite);
