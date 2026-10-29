let audio = null;

/** Two short beeps for a new order. Silent where Web Audio is missing or blocked. */
export function playNewOrderSound() {
  try {
    const Ctx = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    [0, 0.25].forEach((offset) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, audio.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + offset + 0.2);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + offset);
      osc.stop(audio.currentTime + offset + 0.2);
    });
  } catch {
    // Browsers block sound until the page has been tapped; the toast still shows
  }
}
