"use client";

/**
 * Sons dos instrumentos do boi, sintetizados no navegador (Web Audio): nada
 * de arquivo de áudio para baixar. É uma ideia do timbre (estalo da matraca,
 * grave da zabumba, sopro do sax), não gravação de grupo de verdade.
 */

let contexto: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  contexto ??= new Ctor();
  if (contexto.state === "suspended") void contexto.resume();
  return contexto;
}

function ruido(c: AudioContext, t: number, dur: number, freq: number, ganho: number, tipo: BiquadFilterType = "bandpass") {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const dados = buf.getChannelData(0);
  for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
  const fonte = c.createBufferSource();
  fonte.buffer = buf;
  const filtro = c.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = freq;
  filtro.Q.value = 1.2;
  const g = c.createGain();
  g.gain.setValueAtTime(ganho, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  fonte.connect(filtro).connect(g).connect(c.destination);
  fonte.start(t);
  fonte.stop(t + dur);
}

function tom(c: AudioContext, t: number, freq: number, dur: number, ganho: number, tipo: OscillatorType = "sine", cai = freq) {
  const o = c.createOscillator();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, cai), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(ganho, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  let saida: AudioNode = o;
  if (tipo === "sawtooth") {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1400;
    o.connect(f);
    saida = f;
  }
  saida.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const BATIDA: Record<string, (c: AudioContext, t: number, forte?: boolean) => void> = {
  matraca: (c, t, forte) => ruido(c, t, 0.035, 2600, forte ? 0.9 : 0.5),
  pandeirao: (c, t) => {
    ruido(c, t, 0.14, 700, 0.6);
    tom(c, t, 110, 0.18, 0.5, "sine", 70);
  },
  zabumba: (c, t, forte) => {
    tom(c, t, 85, 0.45, forte ? 1 : 0.7, "sine", 45);
    ruido(c, t, 0.05, 400, 0.3, "lowpass");
  },
  sax: (c, t) => tom(c, t, 330, 0.3, 0.25, "sawtooth"),
  banjo: (c, t) => tom(c, t, 523, 0.22, 0.3, "triangle", 500),
  "pandeiro-mao": (c, t, forte) => {
    ruido(c, t, 0.07, 1900, forte ? 0.8 : 0.45);
    tom(c, t, 220, 0.07, 0.25, "triangle", 180);
  },
};

/** Uma batida do instrumento (ao tocar na carta). */
export function tocarInstrumento(id: string) {
  const c = ac();
  if (!c) return;
  BATIDA[id]?.(c, c.currentTime + 0.01, true);
}

/** O toque do sotaque, uns 3 segundos. */
export function tocarSotaque(toque: "matraca" | "zabumba" | "orquestra" | "costa") {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + 0.05;
  const b = 0.25; // colcheia a ~120 bpm
  for (let i = 0; i < 12; i++) {
    const t = t0 + i * b;
    if (toque === "matraca") {
      BATIDA.matraca(c, t, i % 2 === 0);
      BATIDA.matraca(c, t + b / 2, false);
      if (i % 2 === 0) BATIDA.pandeirao(c, t);
    } else if (toque === "zabumba") {
      if ([0, 3, 4, 6, 8, 11].includes(i)) BATIDA.zabumba(c, t, i % 4 === 0);
      if (i % 2 === 1) ruido(c, t, 0.05, 3000, 0.25);
    } else if (toque === "orquestra") {
      const melodia = [392, 440, 494, 523, 494, 440, 392, 330, 349, 392, 440, 392];
      tom(c, t, melodia[i], b * 0.9, 0.2, "sawtooth");
      if (i % 2 === 0) tom(c, t, melodia[i] / 2, 0.2, 0.25, "triangle", melodia[i] / 2.05);
      if (i % 4 === 0) BATIDA.zabumba(c, t, false);
    } else {
      if ([0, 2, 3, 5, 6, 8, 10, 11].includes(i)) BATIDA["pandeiro-mao"](c, t, i % 4 === 0);
      if (i % 3 === 0) BATIDA["pandeiro-mao"](c, t + b / 2, false);
    }
  }
}
