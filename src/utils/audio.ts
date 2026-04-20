let globalAudioContext: AudioContext | null = null;
let globalGainNode: GainNode | null = null;

export function playSound(type: 'correct' | 'incorrect' | 'solution') {
  if (typeof window === 'undefined') return;
  
  // Disable audio during Playwright tests to prevent headless thread starvation/timeouts
  if (navigator.webdriver || localStorage.getItem('test-mode') === 'true' || process.env.NEXT_PUBLIC_TEST_MODE === 'true') return;

  try {
    if (!globalAudioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      globalAudioContext = new AudioCtx();
      globalGainNode = globalAudioContext.createGain();
      globalGainNode.connect(globalAudioContext.destination);
    }
    
    // In some browsers, AudioContext starts suspended and must be resumed after user gesture
    if (globalAudioContext.state === 'suspended') {
      globalAudioContext.resume();
    }

    const ctx = globalAudioContext;
    const gainNode = globalGainNode!;

    const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      oscGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + duration * 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
      
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    if (type === 'correct') {
      // Ascending chime
      playTone(523.25, 'sine', 0, 0.2, 0.3); // C5
      playTone(659.25, 'sine', 0.1, 0.2, 0.3); // E5
      playTone(783.99, 'sine', 0.2, 0.4, 0.3); // G5
    } else if (type === 'incorrect') {
      // Low dual-tone buzzer
      playTone(150, 'sawtooth', 0, 0.3, 0.2);
      playTone(100, 'square', 0, 0.3, 0.2);
    } else if (type === 'solution') {
      // Neutral / informational chime
      playTone(440, 'triangle', 0, 0.15, 0.2); // A4
      playTone(440, 'triangle', 0.15, 0.3, 0.2); // A4 again
    }
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}
