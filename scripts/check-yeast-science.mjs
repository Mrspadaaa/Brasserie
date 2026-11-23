import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({absWorkingDir:root,entryPoints:['tests/scientific/yeastSecondPass.ts'],bundle:true,platform:'node',format:'esm',write:false,metafile:true,logLevel:'silent'});
const forbidden=Object.keys(result.metafile.inputs).filter(p=>/(?:node_modules\/(?:firebase|@firebase)|src\/services\/|functions\/src\/(?:ai|firebase)\.)/.test(p.replaceAll('\\','/')));
if(forbidden.length)throw Error('Remote dependency in yeast benchmark: '+forbidden.join(', '));
const {runYeastSecondPass}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const report=runYeastSecondPass();process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;
