import { useEffect, useRef, useState } from 'react';

export type FaceCaptureResult = {
  image_data_url: string;
  descriptor: number[];
  face_score: number;
  antispoof_score: number;
  liveness_score: number;
};

type HumanInstance = InstanceType<(typeof import('@vladmandic/human'))['Human']>;

let humanRuntime: Promise<HumanInstance> | null = null;

function loadHumanRuntime(): Promise<HumanInstance> {
  if (humanRuntime) return humanRuntime;

  humanRuntime = import('@vladmandic/human').then(async ({ Human }) => {
    const human = new Human({
      backend: 'webgl',
      modelBasePath: '/models/human',
      cacheSensitivity: 0,
      filter: { enabled: true, equalization: true },
      face: {
        enabled: true,
        detector: { enabled: true, rotation: true, return: true, maxDetected: 2 },
        mesh: { enabled: true },
        description: { enabled: true },
        antispoof: { enabled: true },
        liveness: { enabled: true },
        iris: { enabled: false },
        emotion: { enabled: false },
      },
      body: { enabled: false },
      hand: { enabled: false },
      object: { enabled: false },
      gesture: { enabled: false },
    });
    await human.load();
    await human.warmup();
    return human;
  }).catch((error) => {
    humanRuntime = null;
    throw error;
  });

  return humanRuntime;
}

function wait(milliseconds: number) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

export function FaceCaptureModal({
  open,
  title,
  instruction,
  confirmLabel,
  onCancel,
  onCaptured,
}: {
  open: boolean;
  title: string;
  instruction: string;
  confirmLabel: string;
  onCancel: () => void;
  onCaptured: (result: FaceCaptureResult) => void | Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const humanRef = useRef<HumanInstance | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'scanning' | 'saving'>('starting');
  const [error, setError] = useState('');

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    if (!open) return undefined;
    let active = true;

    async function start() {
      setStatus('starting');
      setError('');
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Kamera hanya tersedia melalui HTTPS pada browser yang mendukung akses kamera.');
        }

        const [human, stream] = await Promise.all([
          loadHumanRuntime(),
          navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 720 },
            },
          }),
        ]);
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        humanRef.current = human;
        streamRef.current = stream;
        if (!videoRef.current) throw new Error('Preview kamera belum siap.');
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('ready');
      } catch (reason) {
        stopCamera();
        setError(reason instanceof Error ? reason.message : 'Kamera tidak dapat dibuka.');
      }
    }

    void start();
    return () => {
      active = false;
      stopCamera();
    };
  }, [open]);

  if (!open) return null;

  async function capture() {
    const human = humanRef.current;
    const video = videoRef.current;
    if (!human || !video || video.readyState < 2) {
      setError('Kamera atau model wajah belum siap.');
      return;
    }

    setStatus('scanning');
    setError('');
    try {
      const samples: Array<{
        descriptor: number[];
        faceScore: number;
        real: number;
        live: number;
        size: number;
      }> = [];

      for (let index = 0; index < 3; index += 1) {
        const result = await human.detect(video);
        if (result.face.length !== 1) {
          throw new Error(result.face.length === 0
            ? 'Wajah belum terdeteksi. Hadapkan wajah ke kamera dan pastikan cahaya cukup.'
            : 'Terdeteksi lebih dari satu wajah. Pastikan hanya satu orang di depan kamera.');
        }
        const face = result.face[0];
        const descriptor = Array.from(face.embedding ?? []);
        samples.push({
          descriptor,
          faceScore: face.faceScore ?? face.boxScore ?? 0,
          real: face.real ?? 0,
          live: face.live ?? 0,
          size: Math.min(face.box?.[2] ?? 0, face.box?.[3] ?? 0),
        });
        if (index < 2) await wait(180);
      }

      const best = samples.sort((left, right) => (
        (right.faceScore + right.real + right.live) - (left.faceScore + left.real + left.live)
      ))[0];
      const averageReal = samples.reduce((sum, sample) => sum + sample.real, 0) / samples.length;
      const averageLive = samples.reduce((sum, sample) => sum + sample.live, 0) / samples.length;
      if (best.descriptor.length < 512) throw new Error('Descriptor wajah belum terbentuk. Coba pindai kembali.');
      if (best.faceScore < 0.6) throw new Error('Kualitas deteksi wajah terlalu rendah. Perbaiki pencahayaan.');
      if (best.size < 150) throw new Error('Wajah terlalu jauh dari kamera. Dekatkan wajah ke panduan.');
      if (averageReal < 0.5 || averageLive < 0.5) {
        throw new Error('Pemeriksaan liveness belum lolos. Gunakan wajah langsung, bukan foto atau layar.');
      }

      const canvas = document.createElement('canvas');
      const targetWidth = 480;
      canvas.width = targetWidth;
      canvas.height = Math.max(360, Math.round((video.videoHeight / video.videoWidth) * targetWidth));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Foto wajah tidak dapat diproses.');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      setStatus('saving');
      await onCaptured({
        image_data_url: canvas.toDataURL('image/jpeg', 0.82),
        descriptor: best.descriptor,
        face_score: best.faceScore,
        antispoof_score: averageReal,
        liveness_score: averageLive,
      });
      stopCamera();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pemindaian wajah gagal.');
      setStatus('ready');
    }
  }

  const busy = status === 'starting' || status === 'scanning' || status === 'saving';

  return (
    <div className="att-face-modal" role="dialog" aria-modal="true" aria-labelledby="face-capture-title">
      <div className="att-face-card">
        <div className="att-face-heading">
          <div>
            <p className="att-face-eyebrow">Verifikasi wajah berbasis kamera</p>
            <h2 id="face-capture-title">{title}</h2>
          </div>
          <button type="button" className="att-face-close" onClick={onCancel} disabled={status === 'saving'} aria-label="Tutup kamera">×</button>
        </div>

        <div className="att-face-preview">
          <video ref={videoRef} playsInline muted autoPlay aria-label="Preview kamera depan" />
          <div className="att-face-oval" aria-hidden="true" />
          {status === 'starting' && <div className="att-face-loading">Memuat kamera dan model wajah…</div>}
        </div>

        <p className="att-face-instruction">{instruction}</p>
        <div className="att-face-checks" aria-label="Pemeriksaan keamanan wajah">
          <span>✓ Satu wajah</span>
          <span>✓ Liveness</span>
          <span>✓ Anti-spoof</span>
          <span>✓ Descriptor 1024 titik</span>
        </div>
        {error && <div className="att-face-error" role="alert">{error}</div>}

        <div className="att-face-actions">
          <button type="button" className="att-btn att-btn-secondary" onClick={onCancel} disabled={status === 'saving'}>Batal</button>
          <button type="button" className="att-btn att-btn-primary" onClick={() => void capture()} disabled={busy}>
            {status === 'starting' ? 'Menyiapkan…' : status === 'scanning' ? 'Memverifikasi…' : status === 'saving' ? 'Menyimpan…' : confirmLabel}
          </button>
        </div>
        <p className="att-face-disclaimer">Sistem ini memakai kamera RGB dan bukan sensor Face ID/infra merah perangkat. Hasil kecocokan tetap dicatat untuk audit.</p>
      </div>
    </div>
  );
}
