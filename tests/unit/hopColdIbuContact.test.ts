import { describe, expect, it } from 'vitest';
import { assessQualifiedColdHopContact, bindColdHopProgramContact, assertColdHopContactAssessmentCurrent,
  compareQualifiedColdHopContacts, type AssessQualifiedColdHopContactInput, type HopColdBeerContext } from '../../src/domain/hopDecision/coldIbuContact';
import { getColdHopBuCalibration, interpolateColdHopBuReference } from '../../src/domain/hopDecision/coldIbuReference';
import { previewHopProgramChanges, applyHopProgramProposal, restoreHopProgramDraft } from '../../src/domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import { makeHopAdviceJourneyFixture, adviceAssignment } from '../fixtures/hopAdviceJourney';

function fixture(): AssessQualifiedColdHopContactInput {
  const material: HopDecisionMaterial = { id:'fixture-cold-material', name:'Matière synthétique de comparaison', form:'cone', availableGrams:1000 };
  const program: HopDecisionProgram = { id:'fixture-cold-program',revision:5,stage:'conditioning',volumeL:20,wortGravity:null,
    additions:[{id:'future-contact',materialId:material.id,grams:58.6,use:'postFermentation',status:'planned',contactHours:24,temperatureC:14,dayOffset:8}] };
  const context: HopColdBeerContext = { volumeBasis:'beerAtContact',abvPct:4.75,filteredBeforeContact:true,yeastStatus:'removedBeforeContact',contactMode:'static',
    materialPreparation:'Préparation décrite par la fixture, non authentifiée comme celle de la publication.', beerDescription:'Bière synthétique distincte de la source.',
    initialBitterness:{value:50,unit:'BU',origin:'reported',method:null,source:null,timing:'beforeSelectedContact',includesContactIds:[]} };
  return {program,context,qualificationInput:{variants:[adviceAssignment(material)]},contact:bindColdHopProgramContact({program,contactId:'fixture-contact',
    additionIds:['future-contact'],grouping:{kind:'singleHomogeneousContact',origin:'scenarioAssumption',reason:'Un seul traitement explicitement choisi pour la comparaison synthétique.'}})};
}
function bindAgain(input: AssessQualifiedColdHopContactInput, ids = input.program.additions.map(row => row.id), contactId = input.contact.contactId) {
  return {...input,contact:bindColdHopProgramContact({program:input.program,contactId,additionIds:ids,grouping:input.contact.grouping})};
}

describe('référence BU froide liée à un contact explicite de programme', () => {
  it('relie58,6g/20L à20,2BU de référence et3,2 de contraste, sans compléter une bière cible', () => {
    const input = fixture(), original = structuredClone(input), result = assessQualifiedColdHopContact(input);
    expect(result.programBinding.totalMassGrams).toBe(58.6);
    expect(result.programBinding.doseGL).toBeCloseTo(2.93,12);
    expect(result.referenceResult.valueBU).toBeCloseTo(20.2,12);
    expect(result.referenceResult.contrastToControlBU).toBeCloseTo(3.2,12);
    expect(result.referenceResult.calibrationSnapshot.conditions.beer.preparedBaseBU).toBe(19.8);
    expect(result.referenceResult.controlBU).toBe(17);
    expect(result.targetAssessment).toMatchObject({status:'transferNotEstablished',valueBU:null,initialBitterness:{value:50,origin:'reported'}});
    expect(result.inputSnapshot).toEqual({program:input.program,contact:input.contact,qualificationInput:input.qualificationInput,context:input.context});
    expect(input).toEqual(original);
  });

  it('préserve X01 inconnu et permet de consulter la référence sans programme inventé', () => {
    const x01 = makeHopAdviceJourneyFixture(), original = structuredClone(x01);
    const contact = bindColdHopProgramContact({program:x01.program!,contactId:'x01-explicit-planned-contact',additionIds:['planned-follow-up-hop'],
      grouping:{kind:'singleHomogeneousContact',origin:'userDeclaration',reason:'Ligne future explicitement isolée du contact déjà effectué.'}});
    const result = assessQualifiedColdHopContact({program:x01.program!,contact,qualificationInput:x01.qualificationInput});
    expect(result.programBinding).toMatchObject({totalMassGrams:null,volumeL:null,doseGL:null,missingMassAdditionIds:['planned-follow-up-hop']});
    expect(result.referenceResult).toMatchObject({status:'doseUnknown',valueBU:null,contrastToControlBU:null});
    expect(result.referenceResult.calibrationSnapshot.points).toHaveLength(5);
    expect(result.targetAssessment.valueBU).toBeNull();
    expect(result.inputSnapshot.program.additions[0]).toEqual(x01.program!.additions[0]);
    expect(x01).toEqual(original);
    const planning = makeHopAdviceJourneyFixture('planning');
    expect(interpolateColdHopBuReference({dose:{value:null,unit:'g/hL'}}).valueBU).toBeNull();
    expect(planning.program).toBeNull();
  });

  it('est invariant pour une partition administrative et un ordre permuté du même contact', () => {
    const input = fixture(), first = assessQualifiedColdHopContact(input);
    const split = structuredClone(input), row = input.program.additions[0];
    split.program.additions = [{...row,id:'portion-a',grams:29.3},{...row,id:'portion-b',grams:29.3}];
    const second = assessQualifiedColdHopContact(bindAgain(split));
    split.program.additions.reverse();
    const reversed = assessQualifiedColdHopContact(bindAgain(split));
    expect(second.referenceResult).toEqual(first.referenceResult);
    expect(reversed.referenceResult).toEqual(first.referenceResult);
    expect(second.programBinding.selectedAdditions).toHaveLength(2);
  });

  it('F01-R01 : une partition décimale exacte à la borne conserve26BU et tout vrai dépassement reste hors domaine', () => {
    const input=fixture(), row=input.program.additions[0];
    input.program.additions[0].grams=320;
    const whole=assessQualifiedColdHopContact(bindAgain(input));
    for(const parts of [[5.49,281.72,32.79],[5.49,285.66,28.85],[5.49,289.6,24.91]]) {
      const divided=structuredClone(input);
      divided.program.additions=parts.map((grams,index)=>({...row,id:`part-${index}`,grams}));
      const original=structuredClone(divided.program);
      for(const reverse of [false,true]) {
        if(reverse) divided.program.additions.reverse();
        const result=assessQualifiedColdHopContact(bindAgain(divided));
        expect(result.referenceResult).toEqual(whole.referenceResult);
        expect(result.programBinding.totalMassGrams).toBe(320);
        expect(result.referenceResult).toMatchObject({status:'publishedObservation',valueBU:26,doseExactGPerHL:{numerator:'1600',denominator:'1'}});
      }
      expect(divided.program.additions.map(row=>row.grams).sort()).toEqual(original.additions.map(row=>row.grams).sort());
    }
    for(const value of [1600+2**-42,1600.01,1700]) expect(interpolateColdHopBuReference({dose:{value,unit:'g/hL'}})).toMatchObject({status:'outOfDomain',valueBU:null});
    // Even a genuine excess smaller than one display ULP must not be accepted.
    const tiny=structuredClone(input);
    tiny.program.additions=[{...row,id:'full',grams:320},{...row,id:'extra',grams:1e-20}];
    const tooMuch=assessQualifiedColdHopContact(bindAgain(tiny));
    expect(tooMuch.referenceResult).toMatchObject({status:'outOfDomain',valueBU:null});
    expect(tooMuch.programBinding.selectedAdditions.map(row=>row.grams).sort()).toEqual([1e-20,320].sort());
  });

  it('ne fusionne ni ajouts séquentiels ni traitements, matières ou états différents', () => {
    for (const property of ['dayOffset','contactHours','materialId','status'] as const) {
      const input = fixture(), row = input.program.additions[0];
      input.program.additions = [{...row,id:'part-a',grams:29.3},{...row,id:'part-b',grams:29.3}];
      if(property==='dayOffset') input.program.additions[1].dayOffset=9;
      if(property==='contactHours') input.program.additions[1].contactHours=48;
      if(property==='materialId') input.program.additions[1].materialId='another-lot';
      if(property==='status') input.program.additions[1].status='performed';
      const result=assessQualifiedColdHopContact(bindAgain(input));
      expect(result.programBinding.status).toBe('unsupportedCompositeContact');
      expect(result.programBinding.compositeReasons.length).toBeGreaterThan(0);
      expect(result.referenceResult.valueBU).toBeNull();
      expect(result.targetAssessment.valueBU).toBeNull();
    }
  });

  it('garde un scénario de référence disponible avec une forme ou une durée différente, sans transfert implicite', () => {
    const input=fixture(); input.qualificationInput.variants[0].material.form='pelletT90'; input.program.additions[0].contactHours=48;
    const result=assessQualifiedColdHopContact(bindAgain(input));
    expect(result.referenceResult.valueBU).toBeCloseTo(20.2,12);
    expect(result.domainComparisons.filter(row=>row.status==='different').map(row=>row.property)).toEqual(expect.arrayContaining(['materialForm','durationHours']));
    expect(result.targetAssessment).toMatchObject({status:'conditionsDiffer',valueBU:null});
    expect(result.inputSnapshot.program.additions[0].contactHours).toBe(48);
  });

  it('les moyennes de température ne deviennent pas une loi thermique', () => {
    const input=fixture(), baseline=assessQualifiedColdHopContact(input);
    input.program.additions[0].temperatureC=30;
    const result=assessQualifiedColdHopContact(bindAgain(input));
    expect(result.referenceResult).toEqual(baseline.referenceResult);
    expect(result.domainComparisons.find(row=>row.property==='reportedMeanTemperatures')?.status).toBe('different');
    expect(result.targetAssessment.valueBU).toBeNull();
  });

  it('stock, libellé et données alpha ne modifient pas une coordonnée dose/BU de référence', () => {
    const input=fixture(), baseline=assessQualifiedColdHopContact(input);
    input.qualificationInput.variants[0].material.availableGrams=0;
    input.qualificationInput.variants[0].material.name='Autre nom commercial, mêmes faits de contact';
    const result=assessQualifiedColdHopContact(input);
    expect(result.referenceResult).toEqual(baseline.referenceResult);
    expect(result.programBinding.materials[0].availableGrams).toBe(0);
    expect(input.qualificationInput.variants[0].material).not.toHaveProperty('declaredAnalysis');
  });

  it('repère programme, groupe et calibration modifiés sans réécrire l’ancien résultat', () => {
    const input=fixture(), result=assessQualifiedColdHopContact(input), original=structuredClone(result);
    expect(()=>assertColdHopContactAssessmentCurrent(result,input)).not.toThrow();
    const changed=structuredClone(input); changed.program.additions[0].contactHours=48;
    expect(()=>assessQualifiedColdHopContact(changed)).toThrow(/programme lié a changé/i);
    expect(()=>assertColdHopContactAssessmentCurrent(result,bindAgain(changed))).toThrow(/changés/);
    expect(()=>assertColdHopContactAssessmentCurrent(result,bindAgain(input,undefined,'different-contact'))).toThrow(/changés/);
    const calibration=getColdHopBuCalibration(); calibration.version='synthetic-local-calibration-v2'; calibration.points[1].valueBU=20;
    expect(()=>assertColdHopContactAssessmentCurrent(result,{...input,calibration})).toThrow(/changés/);
    expect(()=>compareQualifiedColdHopContacts({before:input,after:{...input,calibration}})).toThrow(/même calibration/);
    expect(result).toEqual(original);
  });

  it('ne rajoute aucun contraste à une base qui inclut déjà le contact ni à une base modèle', () => {
    const input=fixture(); input.context!.initialBitterness={value:49,unit:'BU',origin:'measured',method:'Méthode de fixture déclarée',source:null,
      timing:'afterSelectedContact',includesContactIds:[input.contact.contactId]};
    const result=assessQualifiedColdHopContact(input);
    expect(result.targetAssessment.valueBU).toBeNull();
    expect(result.targetAssessment.reasons.join(' ')).toMatch(/seconde fois/);
    input.context!.initialBitterness!.origin='modelEstimate';
    expect(assessQualifiedColdHopContact(input).targetAssessment.initialBitterness!.origin).toBe('modelEstimate');
    expect(assessQualifiedColdHopContact(input).targetAssessment.valueBU).toBeNull();
    (input.context!.initialBitterness as {unit:string}).unit='mg/L';
    expect(()=>assessQualifiedColdHopContact(input)).toThrow(/quantité BU/);
  });

  it('refuse les replis sur volume invalide, ligne étrangère, mélange chaud/froid et dose hors courbe', () => {
    const invalid=fixture(); invalid.program.volumeL=0;
    expect(()=>bindAgain(invalid)).toThrow();
    const missing=fixture();
    expect(()=>bindAgain(missing,['missing-row'])).toThrow(/ligne/);
    const hot=fixture(); hot.program.additions[0].use='boil';
    expect(assessQualifiedColdHopContact(bindAgain(hot)).programBinding.status).toBe('unsupportedCompositeContact');
    const excess=fixture(); excess.program.additions[0].grams=340;
    const over=assessQualifiedColdHopContact(bindAgain(excess));
    expect(over.referenceResult).toMatchObject({status:'outOfDomain',valueBU:null});
    expect(over.programBinding.doseGL).toBe(17);
  });

  it('compare retrait et retour par les vrais gestes locaux en préservant le passé et le contrôle unique', () => {
    const input=fixture(), performed={...input.program.additions[0],id:'past-contact',grams:4,status:'performed' as const};
    input.program.additions.unshift(performed);
    const before=bindAgain(input,['future-contact']);
    const materials=input.qualificationInput.variants.map(row=>row.material);
    const proposal=previewHopProgramChanges(before.program,[{kind:'remove',additionId:'future-contact'}],materials);
    const applied=applyHopProgramProposal(before.program,proposal,materials);
    const after=bindAgain({...before,program:applied.after},[]);
    const compared=compareQualifiedColdHopContacts({before,after});
    expect(compared.after.referenceResult).toMatchObject({valueBU:17,contrastToControlBU:0});
    expect(compared.referenceDifferenceBU).toBeCloseTo(-3.2,12);
    expect(compared.targetDifferenceBU).toBeNull();
    expect(compared.after.inputSnapshot.program.additions).toEqual([performed]);
    const returned=restoreHopProgramDraft(applied.after,applied,materials);
    const restored=assessQualifiedColdHopContact(bindAgain({...before,program:returned.program},['future-contact']));
    expect(restored.referenceResult).toEqual(compared.before.referenceResult);
    expect(restored.inputSnapshot.program.additions).toEqual(before.program.additions);
    expect(input.qualificationInput.variants[0].material.availableGrams).toBe(1000);
  });
});
