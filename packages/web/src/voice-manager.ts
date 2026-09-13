interface ManagedVoice {
  requestId: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
  startedAt: number;
}

export class VoiceManager {
  private readonly voices = new Map<string, ManagedVoice>();

  constructor(private readonly limit: number, private readonly releaseSeconds = 0.02) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 128) throw new Error("voice limit must be an integer in [1,128]");
  }

  get activeCount(): number { return this.voices.size; }

  add(voice: ManagedVoice, now: number): void {
    this.stop(voice.requestId, now);
    while (this.voices.size >= this.limit) {
      const oldest = [...this.voices.values()].sort((a, b) => a.startedAt - b.startedAt)[0];
      if (!oldest) break;
      this.stop(oldest.requestId, now);
    }
    voice.source.onended = () => this.remove(voice.requestId);
    this.voices.set(voice.requestId, voice);
  }

  stop(requestId: string, now: number): boolean {
    const voice = this.voices.get(requestId);
    if (!voice) return false;
    this.voices.delete(requestId);
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.linearRampToValueAtTime(0, now + this.releaseSeconds);
      voice.source.stop(now + this.releaseSeconds);
    } catch {
      try { voice.source.stop(); } catch {}
    }
    return true;
  }

  stopAll(now: number): void {
    for (const id of [...this.voices.keys()]) this.stop(id, now);
  }

  private remove(requestId: string): void { this.voices.delete(requestId); }
}
