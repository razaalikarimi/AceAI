import { transcribeAudio } from './openai.service';

const CHUNK_INTERVAL_MS = 4000; // Transcribe every 4 seconds

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;

  async start({
    apiKey,
    language,
    onTranscript,
    onError,
    onVolumeChange,
  }: {
    apiKey: string;
    language: string;
    onTranscript: (text: string) => void;
    onError: (err: string) => void;
    onVolumeChange?: (volume: number) => void;
  }): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Set up volume analyser
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      if (onVolumeChange) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          onVolumeChange(avg / 255);
          if (this.mediaRecorder) requestAnimationFrame(checkVolume);
        };
        requestAnimationFrame(checkVolume);
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.start(1000); // collect data every 1s

      // Process and transcribe every CHUNK_INTERVAL_MS
      this.intervalId = setInterval(async () => {
        if (this.chunks.length === 0) return;
        const blob = new Blob([...this.chunks], { type: mimeType });
        this.chunks = []; // reset

        try {
          const text = await transcribeAudio(blob, { apiKey, language });
          if (text && text.length > 2) {
            onTranscript(text);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          onError(msg);
        }
      }, CHUNK_INTERVAL_MS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onError(`Microphone access failed: ${msg}`);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.chunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
