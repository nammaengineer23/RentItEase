# RentItEase Remotion Renderer

Self-hosted 9:16 property reel renderer used by the NestJS backend.

## Deploy

Deploy this directory as a separate service. Set an optional `REMOTION_RENDER_TOKEN` on both this service and the backend, and set the backend `REMOTION_RENDER_URL` to this service's public base URL.

The renderer exposes `GET /health` and authenticated `POST /render`. Rendered files are served temporarily from `/renders`; the backend immediately imports the completed MP4 into Firebase Storage.

No Creatomate API key or template ID is used by this renderer.
