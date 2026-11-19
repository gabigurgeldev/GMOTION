import {spawn} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

export type DecodedAudio = {
  samples: Float32Array;
  sampleRate: number;
};

/**
 * Decodifica qualquer áudio (mp3/wav/m4a...) para PCM float32 mono via
 * ffmpeg-static, direto pelo stdout — sem arquivo temporário, sem lib nativa.
 * Só roda offline (CLI/build), nunca no caminho de render.
 */
export const decodeToMonoPcm = (
  filePath: string,
  sampleRate = 44100,
): Promise<DecodedAudio> => {
  if (!ffmpegPath) {
    return Promise.reject(new Error('ffmpeg-static não encontrou binário para esta plataforma.'));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath as string, [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', filePath,
      '-ac', '1',
      '-ar', String(sampleRate),
      '-f', 'f32le',
      '-acodec', 'pcm_f32le',
      'pipe:1',
    ]);

    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg saiu com código ${code}: ${Buffer.concat(errors).toString()}`));
        return;
      }
      const buffer = Buffer.concat(chunks);
      const usableBytes = buffer.byteLength - (buffer.byteLength % 4);
      const samples = new Float32Array(usableBytes / 4);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = buffer.readFloatLE(i * 4);
      }
      resolve({samples, sampleRate});
    });
  });
};
