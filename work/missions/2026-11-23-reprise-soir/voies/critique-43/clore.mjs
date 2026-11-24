import { ouvrir } from './outil.mjs';
const { fermer } = await ouvrir(); await fermer(); console.log('onglet fermé, navigateur gardé'); process.exit(0);
