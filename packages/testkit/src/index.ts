export class FakeAudioParam {
  value = 1;
  readonly events: Array<{ kind: string; value: number; time: number }> = [];
  setValueAtTime(value: number, time: number): this { this.value = value; this.events.push({ kind: "set", value, time }); return this; }
  linearRampToValueAtTime(value: number, time: number): this { this.value = value; this.events.push({ kind: "ramp", value, time }); return this; }
  cancelScheduledValues(_time: number): this { return this; }
}

export class FakeGainNode {
  gain = new FakeAudioParam();
  connect(_destination: unknown): unknown { return _destination; }
  disconnect(): void {}
}

export class FakeBufferSourceNode {
  buffer: AudioBuffer | null = null;
  playbackRate = new FakeAudioParam();
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  readonly stopCalls: Array<number | undefined> = [];
  connect(_destination: unknown): unknown { return _destination; }
  disconnect(): void {}
  start(_when?: number): void { this.started = true; }
  stop(when?: number): void { this.stopped = true; this.stopCalls.push(when); }
}

export class FakeAudioContext {
  currentTime = 1;
  state: AudioContextState = "suspended";
  destination = {} as AudioDestinationNode;
  readonly sources: FakeBufferSourceNode[] = [];
  readonly gains: FakeGainNode[] = [];
  createBufferSource(): AudioBufferSourceNode {
    const node = new FakeBufferSourceNode();
    this.sources.push(node);
    return node as unknown as AudioBufferSourceNode;
  }
  createGain(): GainNode {
    const node = new FakeGainNode();
    this.gains.push(node);
    return node as unknown as GainNode;
  }
  async resume(): Promise<void> { this.state = "running"; }
  async close(): Promise<void> { this.state = "closed"; }
}

export function fakeAudioBuffer(): AudioBuffer {
  return { duration: 1 } as AudioBuffer;
}
