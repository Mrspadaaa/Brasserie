import { Input, Textarea } from '../ui/Input';
import React, { useState, useEffect } from 'react';
import { parseDecimal } from '../ui/numericInput';
import { NumberInput } from '../ui/NumberInput';
import { TextInput } from '../ui/TextInput';
import { X, Save, Plus, Trash2, Activity, Beer } from 'lucide-react';
import { Batch, BatchStatus } from '../types';
import { StorageService } from '../services/storage';
import { BrewingMath } from '../services/brewingMath';

interface EditBatchModalProps {
  isOpen: boolean;
  batch: Batch | null;
  onClose: () => void;
  onSave: (updated: Batch) => void;
}

export const EditBatchModal: React.FC<EditBatchModalProps> = ({
  isOpen,
  batch,
  onClose,
  onSave
}) => {
  if (!isOpen || !batch) return null;

  const [name, setName] = useState(batch.name);
  const [style, setStyle] = useState(batch.style);
  const [volumeL, setVolumeL] = useState<number>(batch.volumeL);
  const [brewDate, setBrewDate] = useState(batch.brewDate || '');
  const [status, setStatus] = useState<BatchStatus>(batch.status);
  const [og, setOg] = useState(batch.og || '');
  const [fg, setFg] = useState(batch.fg || '');
  const [bottlingDate, setBottlingDate] = useState(batch.bottlingDate || '');
  
  // Gravity log entries
  const [gravityLog, setGravityLog] = useState<NonNullable<Batch['gravityLog']>>(
    batch.gravityLog || []
  );
  const [newLogDate, setNewLogDate] = useState(new Date().toLocaleDateString('fr-CH'));
  const [newLogSg, setNewLogSg] = useState('');
  const [newLogTemp, setNewLogTemp] = useState('19');
  const [newLogNotes, setNewLogNotes] = useState('');

  // 3-Phase Notes
  const [notesCreation, setNotesCreation] = useState(batch.notesCreation || '');
  const [notesBrewDay, setNotesBrewDay] = useState(batch.notesBrewDay || '');
  const [notesTasting, setNotesTasting] = useState(batch.notesTasting || '');

  useEffect(() => {
    setName(batch.name);
    setStyle(batch.style);
    setVolumeL(batch.volumeL);
    setBrewDate(batch.brewDate || '');
    setStatus(batch.status);
    setOg(batch.og || '');
    setFg(batch.fg || '');
    setBottlingDate(batch.bottlingDate || '');
    setGravityLog(batch.gravityLog || []);
    setNotesCreation(batch.notesCreation || '');
    setNotesBrewDay(batch.notesBrewDay || '');
    setNotesTasting(batch.notesTasting || '');
  }, [batch]);

  const ogNum = parseFloat(og);
  const fgNum = parseFloat(fg);
  const calculatedABV = (ogNum > 1 && fgNum > 1 && ogNum > fgNum)
    ? BrewingMath.calculateABV(ogNum, fgNum)
    : batch.abv;

  const handleAddGravityReading = () => {
    const sgVal = parseFloat(newLogSg);
    if (!sgVal || sgVal < 0.9 || sgVal > 1.2) {
      alert('Veuillez entrer une densité valide (ex: 1.025)');
      return;
    }
    const updated = [
      ...gravityLog,
      {
        date: newLogDate,
        sg: sgVal,
        // La virgule du clavier francais doit etre lue comme un separateur.
        tempC: parseDecimal(newLogTemp) ?? 19,
        notes: newLogNotes
      }
    ];
    setGravityLog(updated);
    // If lower than previous, update FG
    setFg(sgVal.toFixed(3));
    setNewLogSg('');
    setNewLogNotes('');
  };

  const handleRemoveGravityReading = (idx: number) => {
    setGravityLog(gravityLog.filter((_, i) => i !== idx));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Batch = {
      ...batch,
      name,
      style,
      volumeL,
      brewDate,
      status,
      og,
      fg,
      abv: calculatedABV ? `${calculatedABV}%` : batch.abv,
      bottlingDate,
      gravityLog,
      notesCreation: notesCreation.trim() || undefined,
      notesBrewDay: notesBrewDay.trim() || undefined,
      notesTasting: notesTasting.trim() || undefined
    };
    StorageService.updateBatch(updated);
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-cave-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-cave-900 border border-cave-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cave-800 bg-cave-900/60">
          <div className="flex items-center space-x-2">
            <Beer className="w-5 h-5 text-ebc-straw" />
            <div>
              <span className="text-footnote text-ebc-straw font-bold uppercase tracking-wider font-mono">
                {batch.id}
              </span>
              <h3 className="font-bold text-base text-cave-50">Modifier le brassin</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} autoComplete="off" className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Name & Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Nom de la bière</label>
              <TextInput
                name="batch_beer_label"
                required
                value={name}
                onChange={setName}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium"
              />
            </div>
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Style de bière</label>
              <TextInput
                name="batch_beer_style"
                required
                value={style}
                onChange={setStyle}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium"
              />
            </div>
          </div>

          {/* Volume & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Volume en Litres</label>
              <NumberInput
                value={volumeL}
                onValue={(v) => setVolumeL(v)}
                integer
                pad
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-bold"
              />
            </div>
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Statut du lot</label>
              <select
                name="batch_status_select"
                autoComplete="off"
                data-form-type="other"
                value={status}
                onChange={(e) => setStatus(e.target.value as BatchStatus)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-bold text-ebc-straw"
              >
                <option value="planifie">Planifié</option>
                                <option value="fermentation">Fermentation active</option>
                <option value="garde">Garde à froid / Cold crash</option>
                <option value="conditionne">Conditionné (mis en bouteille / en fût)</option>
                <option value="termine">Terminé / Vendu</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          {/* Dates & Gravity */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Date brassage</label>
              <Input
                name="batch_brew_date"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={brewDate}
                onChange={(e) => setBrewDate(e.target.value)}
                placeholder="01.05.2026"
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-cave-50 text-center font-mono"
              />
            </div>
            <div>
              <label className="text-cave-200 font-semibold block mb-1">OG (Densité Init.)</label>
              <Input
                name="batch_og_density"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={og}
                onChange={(e) => setOg(e.target.value)}
                placeholder="1.062"
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-ebc-straw font-bold text-center font-mono"
              />
            </div>
            <div>
              <label className="text-cave-200 font-semibold block mb-1">FG (Actuelle/Fin)</label>
              <Input
                name="batch_fg_density"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                placeholder="1.018"
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-hop font-bold text-center font-mono"
              />
            </div>
          </div>

          {/* Computed ABV indicator */}
          <div className="p-3 bg-cave-950/70 border border-cave-800 rounded-2xl flex justify-between items-center text-sm">
            <span className="text-cave-400">Taux d'alcool calculé :</span>
            <span className="text-sm font-extrabold text-hop">
              {calculatedABV ? `${calculatedABV}% vol.` : 'En cours de mesure'}
            </span>
          </div>

          {/* Follow-up Gravity Readings (Suivi fermentation) */}
          <div className="space-y-2 pt-2 border-t border-cave-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cave-200 flex items-center">
                <Activity className="w-3.5 h-3.5 text-ebc-straw mr-1" /> Relevés de Densité & Température
              </span>
              <span className="text-footnote text-cave-400">{gravityLog.length} relevé(s)</span>
            </div>

            {/* List of past readings */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {gravityLog.map((log, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-cave-850/40 rounded-xl border border-cave-800 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-cave-400 font-mono">{log.date}</span>
                    <span className="font-bold text-ebc-straw font-mono">{log.sg.toFixed(3)}</span>
                    <span className="text-cave-200">{log.tempC}°C</span>
                    {log.notes && <span className="text-cave-400 italic">({log.notes})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGravityReading(idx)}
                    className="text-cave-400 hover:text-alert p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new reading row */}
            <div className="p-2.5 bg-cave-950/60 rounded-2xl border border-cave-800 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  name="batch_log_date"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="Date"
                  value={newLogDate}
                  onChange={(e) => setNewLogDate(e.target.value)}
                  className="bg-cave-850 border border-cave-700 rounded-lg p-1.5 text-cave-50 text-center font-mono text-sm"
                />
                <Input
                  name="batch_log_sg"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="Densité (ex: 1.025)"
                  value={newLogSg}
                  onChange={(e) => setNewLogSg(e.target.value)}
                  className="bg-cave-850 border border-cave-700 rounded-lg p-1.5 text-ebc-gold text-center font-mono text-sm font-bold"
                />
                <Input
                  name="batch_log_temp"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="Temp °C"
                  value={newLogTemp}
                  onChange={(e) => setNewLogTemp(e.target.value)}
                  className="bg-cave-850 border border-cave-700 rounded-lg p-1.5 text-cave-50 text-center font-mono text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Input
                  name="batch_log_notes"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="Remarque (ex: fin de krausen, ajout houblon...)"
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  className="flex-1 bg-cave-850 border border-cave-700 rounded-lg px-2 py-1 text-cave-50 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddGravityReading}
                  className="px-3 py-1 bg-ebc-straw hover:bg-ebc-gold text-cave-950 font-bold rounded-lg transition flex items-center shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Brewer's Notes in 3 Phases */}
          <div className="space-y-2 p-3 bg-cave-950/60 rounded-2xl border border-cave-800 text-sm">
            <span className="font-bold text-cave-200 block">Carnet de Notes du Brasseur :</span>
            
            <div>
              <label className="text-footnote text-ebc-straw font-bold block mb-0.5">💡 1. Avant / Création :</label>
              <Textarea
                rows={2}
                name="batch_notes_creation"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={notesCreation}
                onChange={(e) => setNotesCreation(e.target.value)}
                placeholder="Inspirations, recette, arômes visés..."
                className="w-full bg-cave-900 border border-cave-700 rounded-xl p-2 text-cave-200 text-sm"
              />
            </div>

            <div>
              <label className="text-footnote text-alert font-bold block mb-0.5">🔥 2. Pendant / Jour J :</label>
              <Textarea
                rows={2}
                name="batch_notes_brewday"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={notesBrewDay}
                onChange={(e) => setNotesBrewDay(e.target.value)}
                placeholder="Empattage, odeur whirlpool, filtration, températures..."
                className="w-full bg-cave-900 border border-cave-700 rounded-xl p-2 text-cave-200 text-sm"
              />
            </div>

            <div>
              <label className="text-footnote text-hop font-bold block mb-0.5">🍺 3. Après / Fermentation & Dégustation :</label>
              <Textarea
                rows={2}
                name="batch_notes_tasting"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={notesTasting}
                onChange={(e) => setNotesTasting(e.target.value)}
                placeholder="Garde froide, carbonatation, tenue de mousse, ressenti en bouche..."
                className="w-full bg-cave-900 border border-cave-700 rounded-xl p-2 text-cave-200 text-sm"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-1"
            >
              <Save className="w-4 h-4 mr-1" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
