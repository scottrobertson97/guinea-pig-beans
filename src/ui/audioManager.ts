import { UI_SOUND_EVENT, type UiSoundDetail, type UiSoundId } from "./events";

const SFX_MUTED_KEY = "gpb-sfx-muted";
const MASTER_GAIN = 0.028;
const BURST_WINDOW_MS = 850;
const BURST_LIMIT = 7;

type AudioContextConstructor = typeof AudioContext;
type WebAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

export class AudioManager {
  private context: AudioContext | null = null;
  private muted = false;
  private failed = false;
  private lastSpecificSoundAt = 0;
  private lastPlayed = new Map<UiSoundId, number>();
  private lastGroupPlayed = new Map<string, number>();
  private recentSounds: number[] = [];
  private readonly toggle: HTMLButtonElement | null;
  private readonly handleUiSound = (event: Event): void => {
    const sound = (event as CustomEvent<UiSoundDetail>).detail?.sound;
    if (!sound) return;
    if (sound !== "button") this.lastSpecificSoundAt = performance.now();
    void this.play(sound);
  };
  private readonly handleFirstGesture = (): void => {
    void this.unlock();
  };
  private readonly handleDocumentClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button");
    if (!(button instanceof HTMLButtonElement) || button.disabled || button.id === "sound-toggle") return;
    if (performance.now() - this.lastSpecificSoundAt < 90) return;
    void this.play("button");
  };

  constructor() {
    this.toggle = document.getElementById("sound-toggle") as HTMLButtonElement | null;
    this.muted = readMutedSetting();
    this.updateToggle();

    this.toggle?.addEventListener("click", () => {
      this.muted = !this.muted;
      writeMutedSetting(this.muted);
      this.updateToggle();
      if (!this.muted) void this.play("button", true);
    });

    document.addEventListener("pointerdown", this.handleFirstGesture, { once: true });
    document.addEventListener("keydown", this.handleFirstGesture, { once: true });
    document.addEventListener("click", this.handleDocumentClick);
    window.addEventListener(UI_SOUND_EVENT, this.handleUiSound);
  }

  private async unlock(): Promise<void> {
    if (this.failed || this.context?.state === "running") return;

    try {
      if (!this.context) {
        const AudioCtor = (window as WebAudioWindow).AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
        if (!AudioCtor) {
          this.failed = true;
          return;
        }
        this.context = new AudioCtor();
      }
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
    } catch {
      this.failed = true;
    }
  }

  private async play(sound: UiSoundId, bypassCooldown = false): Promise<void> {
    if (this.muted || this.failed) return;

    const now = performance.now();
    const cooldown = getCooldown(sound);
    if (!bypassCooldown && now - (this.lastPlayed.get(sound) ?? 0) < cooldown) return;
    if (!bypassCooldown && !this.canPlayGroup(sound, now)) return;
    if (!bypassCooldown && !this.canPlayBurst(now)) return;
    this.lastPlayed.set(sound, now);
    this.lastGroupPlayed.set(getSoundGroup(sound), now);

    await this.unlock();
    if (!this.context || this.context.state !== "running") return;

    const time = this.context.currentTime;
    try {
      if (sound === "rareClean") {
        this.playToneSequence([720, 940, 1180], time, 0.055, "triangle", 0.92);
      } else if (sound === "purchase") {
        this.playToneSequence([420, 620, 830], time, 0.07, "sine", 1);
      } else if (sound === "ability") {
        this.playTone(520, time, 0.08, "triangle", 0.85, 780);
        this.playTone(880, time + 0.055, 0.09, "sine", 0.7);
      } else if (sound === "event") {
        this.playTone(360, time, 0.08, "sine", 0.78, 520);
      } else if (sound === "modalOpen") {
        this.playTone(430, time, 0.075, "sine", 0.6, 620);
      } else if (sound === "modalClose") {
        this.playTone(520, time, 0.07, "sine", 0.5, 340);
      } else if (sound === "pig") {
        this.playTone(760, time, 0.06, "square", 0.34, 920);
      } else if (sound === "clean") {
        this.playTone(660, time, 0.055, "triangle", 0.7, 840);
      } else {
        this.playTone(520, time, 0.045, "sine", 0.42, 610);
      }
    } catch {
      this.failed = true;
    }
  }

  private playToneSequence(
    frequencies: number[],
    startTime: number,
    step: number,
    type: OscillatorType,
    gainScale: number,
  ): void {
    frequencies.forEach((frequency, index) => {
      this.playTone(frequency, startTime + index * step, step + 0.035, type, gainScale * (1 - index * 0.1));
    });
  }

  private playTone(
    frequency: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    gainScale: number,
    endFrequency?: number,
  ): void {
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    if (endFrequency) {
      oscillator.frequency.linearRampToValueAtTime(endFrequency, startTime + duration);
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(MASTER_GAIN * gainScale, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  private updateToggle(): void {
    if (!this.toggle) return;
    this.toggle.textContent = this.muted ? "Muted" : "SFX";
    this.toggle.setAttribute("aria-pressed", String(this.muted));
    this.toggle.setAttribute("aria-label", this.muted ? "Unmute sound effects" : "Mute sound effects");
  }

  private canPlayGroup(sound: UiSoundId, now: number): boolean {
    const group = getSoundGroup(sound);
    const cooldown = getGroupCooldown(group);
    return now - (this.lastGroupPlayed.get(group) ?? 0) >= cooldown;
  }

  private canPlayBurst(now: number): boolean {
    this.recentSounds = this.recentSounds.filter((playedAt) => now - playedAt < BURST_WINDOW_MS);
    if (this.recentSounds.length >= BURST_LIMIT) return false;
    this.recentSounds.push(now);
    return true;
  }
}

function getCooldown(sound: UiSoundId): number {
  if (sound === "button") return 95;
  if (sound === "pig") return 220;
  if (sound === "clean" || sound === "rareClean") return 70;
  if (sound === "modalOpen" || sound === "modalClose") return 150;
  return 115;
}

function getSoundGroup(sound: UiSoundId): string {
  if (sound === "clean" || sound === "rareClean") return "cleanup";
  if (sound === "modalOpen" || sound === "modalClose" || sound === "button") return "ui";
  return sound;
}

function getGroupCooldown(group: string): number {
  if (group === "cleanup") return 62;
  if (group === "ui") return 80;
  if (group === "pig") return 220;
  return 90;
}

function readMutedSetting(): boolean {
  try {
    return localStorage.getItem(SFX_MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeMutedSetting(muted: boolean): void {
  try {
    localStorage.setItem(SFX_MUTED_KEY, String(muted));
  } catch {
    // Local storage can be unavailable in private or restricted contexts.
  }
}

export function clearAudioPersistence(): void {
  try {
    localStorage.removeItem(SFX_MUTED_KEY);
  } catch {
    // Local storage can be unavailable in private or restricted contexts.
  }
}
