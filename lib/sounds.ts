// Helper to play a sound using a generator function
export const playSound = (context: AudioContext, soundGenerator: (time: number) => void) => {
    // Resume audio context if it's suspended (required by modern browsers)
    if (context.state === 'suspended') {
        context.resume();
    }
    soundGenerator(context.currentTime);
};

// A more detailed mining sound with layers for impact, metal, and rock crunch.
export const createMineSound = (context: AudioContext) => (time: number) => {
    // 1. Metallic "ping"
    const ping = context.createOscillator();
    const pingGain = context.createGain();
    ping.connect(pingGain);
    pingGain.connect(context.destination);
    
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(1200, time);
    pingGain.gain.setValueAtTime(0.2, time);
    pingGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    // 2. Low-end "thud"
    const thud = context.createOscillator();
    const thudGain = context.createGain();
    thud.connect(thudGain);
    thudGain.connect(context.destination);

    thud.type = 'square';
    thud.frequency.setValueAtTime(150, time);
    thudGain.gain.setValueAtTime(0.2, time);
    thudGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    // 3. Rock "crunch" (filtered noise)
    const bufferSize = context.sampleRate * 0.1; // 0.1 seconds of noise
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    const noiseGain = context.createGain();
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(context.destination);
    
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    // Start and Stop
    ping.start(time);
    ping.stop(time + 0.2);
    thud.start(time);
    thud.stop(time + 0.1);
    noise.start(time);
};

// A heavy "clank" with a ringing anvil resonance.
export const createForgeSound = (context: AudioContext) => (time: number) => {
    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.3, time);
    masterGain.connect(context.destination);

    // Initial sharp impact
    const impact = context.createOscillator();
    impact.type = 'sawtooth';
    impact.frequency.setValueAtTime(300, time);
    impact.detune.setValueAtTime(10, time);
    const impactGain = context.createGain();
    impactGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    impact.connect(impactGain);
    impactGain.connect(masterGain);

    // Ringing resonance (multiple oscillators)
    const freqs = [550, 825, 1105];
    freqs.forEach((freq, i) => {
        const ring = context.createOscillator();
        ring.type = 'sine';
        ring.frequency.setValueAtTime(freq, time);
        ring.detune.setValueAtTime((Math.random() - 0.5) * 20, time);
        const ringGain = context.createGain();
        ringGain.gain.setValueAtTime(0.5 / (i + 1), time);
        ringGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
        ring.connect(ringGain);
        ringGain.connect(masterGain);
        ring.start(time);
        ring.stop(time + 0.8);
    });

    impact.start(time);
    impact.stop(time + 0.1);
};


// A "cha-ching" sound with an initial bright sparkle.
export const createSellSound = (context: AudioContext) => (time: number) => {
    // Sparkle
    const sparkle = context.createOscillator();
    const sparkleGain = context.createGain();
    sparkle.connect(sparkleGain);
    sparkleGain.connect(context.destination);
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(4000, time);
    sparkleGain.gain.setValueAtTime(0.15, time);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    sparkle.start(time);
    sparkle.stop(time + 0.05);
    
    // First tone
    const osc1 = context.createOscillator();
    const gain1 = context.createGain();
    osc1.connect(gain1);
    gain1.connect(context.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, time);
    gain1.gain.setValueAtTime(0.2, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    // Second, higher tone
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();
    osc2.connect(gain2);
    gain2.connect(context.destination);
    osc2.type = 'sine';
    const secondToneTime = time + 0.1;
    osc2.frequency.setValueAtTime(1600, secondToneTime);
    gain2.gain.setValueAtTime(0.2, secondToneTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, secondToneTime + 0.15);

    osc1.start(time);
    osc1.stop(time + 0.2);
    osc2.start(secondToneTime);
    osc2.stop(secondToneTime + 0.2);
};

// A triumphant, ascending arpeggio with a delay/echo effect.
export const createUpgradeSound = (context: AudioContext) => (time: number) => {
    const masterGain = context.createGain();
    
    // Echo effect
    const delay = context.createDelay(0.5);
    delay.delayTime.setValueAtTime(0.15, time);
    const feedback = context.createGain();
    feedback.gain.setValueAtTime(0.3, time);
    
    masterGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    
    masterGain.connect(context.destination);
    delay.connect(context.destination);
    
    const osc = context.createOscillator();
    const oscGain = context.createGain();
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    
    osc.type = 'triangle';
    oscGain.gain.setValueAtTime(0, time);
    
    const notes = [440, 550, 660, 880]; // A major arpeggio
    notes.forEach((freq, i) => {
        const noteTime = time + i * 0.1;
        osc.frequency.setValueAtTime(freq, noteTime);
        oscGain.gain.setTargetAtTime(0.25, noteTime, 0.01);
        oscGain.gain.setTargetAtTime(0, noteTime + 0.05, 0.02);
    });

    osc.start(time);
    osc.stop(time + 0.5);
};

// A soft, rustling sound for bagging items.
export const createBaggingSound = (context: AudioContext) => (time: number) => {
    const bufferSize = context.sampleRate * 0.2; // 0.2 seconds of noise
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = context.createGain();
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(context.destination);
    
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.2, time + 0.05);
    noiseGain.gain.linearRampToValueAtTime(0, time + 0.2);

    noise.start(time);
    noise.stop(time + 0.2);
};

// A sharp, metallic "clink" sound for a tin can.
export const createCanningSound = (context: AudioContext) => (time: number) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, time);
    osc.frequency.exponentialRampToValueAtTime(1800, time + 0.1);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.start(time);
    osc.stop(time + 0.2);
};
