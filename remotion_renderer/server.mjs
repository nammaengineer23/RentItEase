import express from 'express';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(here, 'renders');
await mkdir(outputDir, {recursive: true});

const app = express();
app.set('trust proxy', true);
app.use(express.json({limit: '2mb'}));
app.use('/renders', express.static(outputDir, {maxAge: '10m'}));

const secret = process.env.REMOTION_RENDER_TOKEN?.trim();
const authorize = (req, res, next) => {
  if (!secret) return next();
  if (req.get('authorization') !== `Bearer ${secret}`) {
    return res.status(401).json({error: 'Unauthorized renderer request.'});
  }
  next();
};

let bundlePromise;
const getBundle = () => {
  bundlePromise ??= bundle({
    entryPoint: path.join(here, 'src', 'index.jsx'),
    webpackOverride: (config) => config,
  });
  return bundlePromise;
};

app.get('/health', (_req, res) => res.json({ok: true, renderer: 'remotion'}));

app.post('/render', authorize, async (req, res) => {
  try {
    const inputProps = req.body?.inputProps || {};
    if (!Array.isArray(inputProps.imageUrls) || inputProps.imageUrls.length === 0) {
      return res.status(400).json({error: 'At least one property image is required.'});
    }

    const serveUrl = await getBundle();
    const composition = await selectComposition({
      serveUrl,
      id: req.body?.composition || 'RentItEasePropertyReel',
      inputProps,
    });
    const renderId = randomUUID();
    const outputLocation = path.join(outputDir, `${renderId}.mp4`);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps,
    });

    const configuredBase = process.env.PUBLIC_RENDER_BASE_URL?.replace(/\/$/, '');
    const base = configuredBase || `${req.protocol}://${req.get('host')}`;
    res.json({
      renderId,
      videoUrl: `${base}/renders/${renderId}.mp4`,
      durationSeconds: composition.durationInFrames / composition.fps,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  process.stdout.write(`RentItEase Remotion renderer listening on ${port}\n`);
});
