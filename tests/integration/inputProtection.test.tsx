import React, { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Textarea, type InputElement } from '../../src/ui/Input';
import { NumberInput } from '../../src/ui/NumberInput';
import { NumericField } from '../../src/ui/NumericField';
import { MoneyField } from '../../src/ui/MoneyField';
import { QuantityStepper } from '../../src/ui/QuantityStepper';
import { FormNav } from '../../src/ui/FormNav';
import { Combobox } from '../../src/ui/Combobox';
import { CommandPalette } from '../../src/ui/CommandPalette';

let coarse = true;
beforeEach(() => {
  coarse = true;
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: query.includes('pointer: coarse') && coarse, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('native mobile entry without the Chrome manual filling accessory', () => {
  it.each(['text', 'search', 'tel', 'email', 'url'] as const)('protects %s from the first render while preserving its keyboard', type => {
    render(<label>Champ<Input type={type} autoFocus autoComplete="on" defaultValue="" /></label>);
    const field = screen.getByLabelText('Champ');
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveAttribute('rows', '1');
    expect(field).toHaveAttribute('inputmode', type);
    expect(field).toHaveAttribute('autocomplete', 'off');
    expect(field).toHaveAttribute('aria-multiline', 'false');
    expect(field).not.toHaveFocus();
    expect(document.querySelector('input')).toBeNull();
  });

  it('keeps native labels, refs, selection, required validation and submitted values', async () => {
    const ref = createRef<InputElement>();
    render(<form><label htmlFor="sample">Nom de recette</label><Input id="sample" ref={ref} name="recipe" required defaultValue="" aria-describedby="sample-help" /><p id="sample-help">Nom libre</p></form>);
    const field = screen.getByRole('textbox', { name: 'Nom de recette' });
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription('Nom libre');
    await userEvent.click(screen.getByText('Nom de recette'));
    expect(field).toHaveFocus();
    await userEvent.type(field, 'Été 2026');
    ref.current!.select();
    expect(ref.current!.selectionStart).toBe(0);
    expect(ref.current!.selectionEnd).toBe(8);
    expect(field).toBeValid();
    expect(new FormData(field.closest('form')!).get('recipe')).toBe('Été 2026');
  });

  it('rejects invalid email and updates validity when its value is corrected externally', () => {
    const { rerender } = render(<Input aria-label="Email" type="email" value="incorrect" onChange={() => {}} />);
    const field = screen.getByRole('textbox');
    expect(field).toBeInvalid();
    rerender(<Input aria-label="Email" type="email" value="contact@restaurant.ch" onChange={() => {}} />);
    expect(field).toBeValid();
    fireEvent.change(field, { target: { value: 'sans-arobase' } });
    expect(field).toBeInvalid();
  });

  it('keeps URL and pattern checks on touch devices', () => {
    render(<><Input type="url" aria-label="Source" defaultValue="wrong" /><Input aria-label="Code" pattern="[A-Z]{3}" defaultValue="abc" /></>);
    const url = screen.getByRole('textbox', { name: 'Source' }), code = screen.getByRole('textbox', { name: 'Code' });
    expect(url).toBeInvalid(); expect(code).toBeInvalid();
    fireEvent.change(url, { target: { value: 'https://example.org' } });
    fireEvent.change(code, { target: { value: 'ABC' } });
    expect(url).toBeValid(); expect(code).toBeValid();
  });

  it('keeps pasted single-line text on one line and preserves selection', () => {
    const change = vi.fn();
    render(<Input aria-label="Nom" onChange={e => change(e.target.value)} />);
    const field = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'Pale\nAle\n2026', selectionStart: 8, selectionEnd: 8 } });
    expect(change).toHaveBeenCalledWith('PaleAle2026');
    expect(field.value).toBe('PaleAle2026');
    expect(field.selectionStart).toBe(7);
  });

  it('keeps multiline notes, line breaks and length limits', async () => {
    render(<Textarea aria-label="Notes" name="notes" maxLength={8} />);
    const field = screen.getByRole('textbox');
    await userEvent.type(field, 'A{Enter}B123456789');
    expect(field).toHaveValue('A\nB12345');
    expect(field).not.toHaveAttribute('data-single-line');
    expect(field).toHaveAttribute('autocomplete', 'off');
  });

  it('keeps disabled and readonly editors out of modification', async () => {
    render(<><Input aria-label="Verrouillé" readOnly defaultValue="Mesure" /><Input aria-label="Inactif" disabled defaultValue="Notes" /></>);
    const field = screen.getByRole('textbox', { name: 'Verrouillé' });
    await userEvent.type(field, 'Autre');
    expect(field).toHaveValue('Mesure');
    expect(screen.getByRole('textbox', { name: 'Inactif' })).toBeDisabled();
  });

  it('keeps native desktop inputs and their focus behavior', () => {
    coarse = false;
    render(<Input type="email" aria-label="Email" autoFocus defaultValue="incorrect" />);
    const field = screen.getByRole('textbox');
    expect(field.tagName).toBe('INPUT');
    expect(field).toHaveFocus();
    expect((field as HTMLInputElement).validity.typeMismatch).toBe(true);
    expect(field).toHaveAttribute('autocomplete', 'off');
  });
});

describe('numeric editors and keyboard navigation use the same protected entry', () => {
  it('preserves a decimal draft, empty optional values, corrections and integer bounds', () => {
    function Fields() {
      const [alpha, setAlpha] = useState<number | undefined>(6.5), [minutes, setMinutes] = useState(60);
      return <><NumberInput aria-label="Alpha" value={alpha} onValue={setAlpha} emptyValue={undefined} /><NumberInput aria-label="Minutes" value={minutes} onValue={setMinutes} integer min={0} max={90} /><output>{String(alpha)} / {minutes}</output></>;
    }
    render(<Fields />);
    const alpha = screen.getByRole('textbox', { name: 'Alpha' }), minutes = screen.getByRole('textbox', { name: 'Minutes' });
    expect(alpha.tagName).toBe('TEXTAREA'); expect(alpha).toHaveAttribute('inputmode', 'decimal');
    expect(minutes).toHaveAttribute('inputmode', 'numeric');
    fireEvent.change(alpha, { target: { value: '12,' } });
    expect(alpha).toHaveValue('12,');
    fireEvent.change(alpha, { target: { value: '12,75' } });
    expect(screen.getByRole('status')).toHaveTextContent('12.75 / 60');
    fireEvent.change(alpha, { target: { value: '' } }); fireEvent.blur(alpha);
    expect(alpha).toHaveValue(''); expect(screen.getByRole('status')).toHaveTextContent('undefined / 60');
    fireEvent.change(alpha, { target: { value: '6,5' } }); fireEvent.blur(alpha);
    fireEvent.change(minutes, { target: { value: '100,7' } }); fireEvent.blur(minutes);
    expect(minutes).toHaveValue('90'); expect(screen.getByRole('status')).toHaveTextContent('6.5 / 90');
  });

  it('protects money, labelled numbers and steppers without losing direct edits or +/-', () => {
    function Fields() {
      const [money, setMoney] = useState(12), [qty, setQty] = useState(25), [temp, setTemp] = useState(-2);
      return <><MoneyField label="Achat" valueTTC={money} onChange={setMoney} tvaRate={0} isTvaRegistered={false} /><QuantityStepper label="Houblon" value={qty} onChange={setQty} unit="g" customStep={5} compact /><NumericField label="Température" value={temp} onChange={setTemp} /><output>{money} / {qty} / {temp}</output></>;
    }
    render(<Fields />);
    for (const field of screen.getAllByRole('textbox')) expect(field.tagName).toBe('TEXTAREA');
    fireEvent.change(screen.getByRole('textbox', { name: 'Achat' }), { target: { value: '12,50' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Houblon' }), { target: { value: '35' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 5 g' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Température' }), { target: { value: '-3,5' } });
    expect(screen.getByRole('status')).toHaveTextContent('12.5 / 40 / -3.5');
  });

  it('navigates one-line editors and keeps Enter for notes and IME composition', () => {
    const submit = vi.fn();
    // jsdom has no layout; this enables FormNav's visible-field filter.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{ width: 100, height: 32 }] as unknown as DOMRectList);
    render(<FormNav onSubmit={submit}><Input aria-label="Premier" defaultValue="Texte" /><Input aria-label="Second" defaultValue="Valeur" /><Textarea aria-label="Notes" /></FormNav>);
    const first = screen.getByRole('textbox', { name: 'Premier' }), second = screen.getByRole('textbox', { name: 'Second' }), notes = screen.getByRole('textbox', { name: 'Notes' });
    first.focus(); fireEvent.keyDown(first, { key: 'Enter', isComposing: true }); expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Enter' }); expect(second).toHaveFocus();
    expect((second as HTMLTextAreaElement).selectionEnd).toBe(6);
    fireEvent.keyDown(second, { key: 'Enter', shiftKey: true }); expect(first).toHaveFocus();
    notes.focus(); expect(fireEvent.keyDown(notes, { key: 'Enter' })).toBe(true); expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(notes, { key: 'Enter', ctrlKey: true }); expect(submit).toHaveBeenCalledTimes(1);
  });

  it('keeps native form submission on Enter for a single-line editor', async () => {
    const submit = vi.fn(e => e.preventDefault());
    render(<form onSubmit={submit}><Input aria-label="Nom" required /><button type="submit">Enregistrer</button></form>);
    const field = screen.getByRole('textbox');
    await userEvent.type(field, 'Recette{Enter}');
    expect(field).toHaveValue('Recette'); expect(submit).toHaveBeenCalledTimes(1);
  });

  it('preserves catalogue suggestions, selecting with Enter and closing with Escape', () => {
    const change = vi.fn();
    render(<Combobox ariaLabel="Houblon" value="" onChange={change} options={[{ value: 'cascade', label: 'Cascade' }, { value: 'citra', label: 'Citra' }]} />);
    const field = screen.getByRole('combobox', { name: 'Houblon' });
    expect(field.tagName).toBe('TEXTAREA'); expect(field).toHaveAttribute('readonly');
    fireEvent.click(field); fireEvent.click(field); fireEvent.change(field, { target: { value: 'Casc' } });
    expect(screen.getByRole('option', { name: 'Cascade' })).toBeVisible();
    fireEvent.keyDown(field, { key: 'Enter' }); expect(change).toHaveBeenCalledWith('cascade');
    fireEvent.click(field); fireEvent.keyDown(field, { key: 'Escape' }); expect(field).toHaveAttribute('aria-expanded', 'false');
  });

  it('protects the third-party command palette and still selects a result with Enter', async () => {
    const select = vi.fn();
    render(<CommandPalette open onOpenChange={() => {}} groups={[{ heading: 'Recettes', items: [{ id: 'rec', label: 'Cascade', onSelect: select }] }]} />);
    const field = screen.getByRole('combobox');
    expect(field.tagName).toBe('TEXTAREA'); expect(field).not.toHaveFocus();
    await userEvent.type(field, 'Casc');
    expect(screen.getByRole('option', { name: 'Cascade' })).toBeVisible();
    await userEvent.keyboard('{Enter}'); expect(select).toHaveBeenCalledTimes(1);
    expect(field).toHaveValue('Casc');
  });
});
