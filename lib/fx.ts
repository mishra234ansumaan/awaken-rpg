let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

function tone(
  freq: number,
  duration = 0.08,
  type: OscillatorType = "square",
  gain = 0.04,
  ramp = true
) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});

  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  const now = ac.currentTime;
  if (ramp) {
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  }
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playSound(
  name:
    | "type"
    | "boot"
    | "accept"
    | "strike"
    | "hit"
    | "kill"
    | "levelup"
    | "coin"
    | "error"
    | "click"
    | "portal"
) {
  try {
    switch (name) {
      case "type":
        tone(660 + Math.random() * 80, 0.03, "square", 0.02);
        break;
      case "boot":
        tone(220, 0.12, "sawtooth", 0.03);
        setTimeout(() => tone(330, 0.12, "sawtooth", 0.03), 100);
        setTimeout(() => tone(440, 0.18, "square", 0.035), 220);
        break;
      case "accept":
        tone(523, 0.1, "square", 0.04);
        setTimeout(() => tone(659, 0.1, "square", 0.04), 90);
        setTimeout(() => tone(784, 0.18, "square", 0.045), 180);
        break;
      case "strike":
        tone(140, 0.06, "sawtooth", 0.05);
        setTimeout(() => tone(90, 0.1, "square", 0.04), 40);
        break;
      case "hit":
        tone(180, 0.05, "square", 0.045);
        setTimeout(() => tone(120, 0.08, "triangle", 0.03), 50);
        break;
      case "kill":
        tone(400, 0.08, "square", 0.04);
        setTimeout(() => tone(600, 0.08, "square", 0.04), 80);
        setTimeout(() => tone(800, 0.16, "square", 0.05), 160);
        break;
      case "levelup":
        [523, 659, 784, 1046].forEach((f, i) =>
          setTimeout(() => tone(f, 0.14, "square", 0.045), i * 110)
        );
        break;
      case "coin":
        tone(880, 0.06, "square", 0.035);
        setTimeout(() => tone(1174, 0.1, "square", 0.03), 70);
        break;
      case "error":
        tone(160, 0.2, "sawtooth", 0.04);
        break;
      case "click":
        tone(420, 0.04, "square", 0.025);
        break;
      case "portal":
        tone(200, 0.3, "sawtooth", 0.03);
        setTimeout(() => tone(300, 0.3, "sawtooth", 0.03), 150);
        setTimeout(() => tone(500, 0.4, "square", 0.035), 300);
        break;
      default:
        break;
    }
  } catch {
    // audio optional — never crash demo
  }
}