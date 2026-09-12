import { describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/aiClient',()=>({AiClient:{run:vi.fn()}}));
import { GeminiScannerService } from '../../src/services/geminiScanner';

describe('Normalisation du résultat visuel avant la saisie',()=>{
  it('conserve la correction et ses champs sans modifier les chiffres ni les ambiguïtés source',()=>{
    const result=GeminiScannerService.normalizeResult({vendor:' Brasserie test ',date:'2026-09-09',currency:'EUR',amountTTC:51.25,tvaAmount:null,items:[{name:'Joint de pompe',kind:'maintenance',quantity:null,unit:'',amountTTC:51.25,ambiguity:'Quantité illisible'}],review:{status:'corrected',readers:3,correctedFields:['amountTTC','items[0].kind'],findings:[' À confirmer ','À confirmer',null]},issues:[' TVA absente ','TVA absente']});
    expect(result).toMatchObject({date:'09.09.2026',currency:'EUR',amountTTC:51.25,tvaAmount:null,items:[{kind:'maintenance',quantity:null,ambiguity:'Quantité illisible'}],review:{status:'corrected',readers:3,correctedFields:['amountTTC','items[0].kind'],findings:['À confirmer']},issues:['TVA absente']});
  });
  it('ne présente pas une réponse inconnue comme une lecture vérifiée',()=>{
    const result=GeminiScannerService.normalizeResult({review:{status:'perfect',readers:200,findings:{},correctedFields:[false,'']},items:[]});
    expect(result.review).toEqual({status:'unavailable',findings:[],correctedFields:[]});
    expect(result.amountTTC).toBeNull();
    expect(result.items).toEqual([]);
    expect(GeminiScannerService.normalizeResult({}).review).toBeUndefined();
  });
});
