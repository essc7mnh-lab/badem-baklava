// مكتبة تفاعلية لتوليد المؤثرات الصوتية الملكية (Micro-Audio) متوافقة مع الهواتف
class RoyalSound {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    // تفعيل الصوت أوتوماتيكياً مع أول تفاعل للمستخدم على الهاتف
    if (typeof window !== "undefined") {
      const unlockEvents = ["click", "touchstart", "keydown"];
      const unlockAudio = () => {
        if (this.isUnlocked) return;
        const ctx = this.getContext();
        if (ctx && ctx.state === "suspended") {
          ctx.resume().then(() => {
            this.isUnlocked = true;
            unlockEvents.forEach((event) => window.removeEventListener(event, unlockAudio));
          });
        } else if (ctx) {
          this.isUnlocked = true;
          unlockEvents.forEach((event) => window.removeEventListener(event, unlockAudio));
        }
      };

      unlockEvents.forEach((event) => {
        window.addEventListener(event, unlockAudio, { once: false, passive: true });
      });
    }
  }

  private getContext() {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    return this.audioCtx;
  }

  // صوت رنين ذهبي ناعم (عند الإضافة للسلة أو المفضلة)
  playSuccessChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  // صوت فتح علبة هدايا / بوكس فاخر (تم تحسينه ليعمل فوراً على الجوال)
  playBoxOpenSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }
}

export const royalSound = new RoyalSound();