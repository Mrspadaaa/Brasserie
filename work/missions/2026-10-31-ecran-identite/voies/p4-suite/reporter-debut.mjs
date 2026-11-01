// Reporter de sonde : écrit, de façon synchrone, chaque fichier qui démarre et chaque fichier qui finit.
// Après un FATAL, les fichiers « début » sans « fin » sont ceux qui tournaient.
import { appendFileSync } from 'node:fs';

const JOURNAL = new URL('./debuts.log', import.meta.url);
const ecrire = (ligne) => appendFileSync(JOURNAL, `${new Date().toISOString().slice(11, 19)} ${ligne}\n`);

export default class ReporterDebut {
  onTestModuleStart(module) {
    ecrire(`DEBUT ${module.moduleId ?? module.relativeModuleId ?? module.project?.name}`);
  }
  onTestModuleEnd(module) {
    ecrire(`FIN   ${module.moduleId ?? module.relativeModuleId}`);
  }
}
