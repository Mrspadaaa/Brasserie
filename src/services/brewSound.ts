/** Sonnerie de cuverie : alternance de deux notes, arrêt immédiat, pas de superposition. */
export const BREW_ALARM_SECONDS = 30;
export const BREW_ALARM_GAIN = 0.48;
export const BREW_ALARM_VIBRATION = [700, 150, 700, 150, 1000, 300, 700, 150, 700, 150, 1000];

export function scheduleBrewAlarm(ctx: BaseAudioContext, seconds = BREW_ALARM_SECONDS): () => void {
  const duration = Math.min(BREW_ALARM_SECONDS, Math.max(0.5, seconds));
  const start = ctx.currentTime + 0.015;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  gain.gain.setValueAtTime(0, ctx.currentTime);
  for (let i = 0; i * 0.65 + 0.5 <= duration; i += 1) {
    const at = start + i * 0.65;
    osc.frequency.setValueAtTime(i % 2 ? 1175 : 880, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(BREW_ALARM_GAIN, at + 0.018);
    gain.gain.setValueAtTime(BREW_ALARM_GAIN, at + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.48);
  }
  gain.gain.setValueAtTime(0, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  osc.start(start);
  osc.stop(start + duration);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      osc.stop();
    } catch {
      /* Le contexte peut avoir été fermé par le navigateur. */
    }
  };
}
