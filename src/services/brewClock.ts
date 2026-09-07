let anchor: { server: number; wall: number; mono: number } | undefined;
export function setBrewClock(serverNow: number, roundTripMs = 0) {
  anchor = {
    server: serverNow + Math.min(roundTripMs, 2000) / 2,
    wall: Date.now(),
    mono: performance.now()
  };
}
export function brewNow() {
  if (!anchor) return Date.now();
  const mono = performance.now() - anchor.mono,
    wall = Date.now() - anchor.wall;
  // performance.now avoids changes to the phone clock. Wall time helps on platforms
  // where monotonic time pauses during device sleep; visibility refreshes server time.
  return anchor.server + (Math.abs(wall - mono) < 2000 ? Math.max(wall, mono) : mono);
}
