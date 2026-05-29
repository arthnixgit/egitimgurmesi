# Production Media Handling

Date: 2026-05-20

## What Is Implemented

- `MediaAsset` is now a first-class database record for uploaded files and external/cloud media URLs.
- Admin media library is available at `/medya`.
- Local file uploads are written to `MEDIA_STORAGE_DIR` and served publicly through `/v1/media/assets/:id/file`.
- External video URLs can be registered without uploading the video file.
- Google Drive, YouTube, Vimeo, direct `.mp4/.webm/.ogg/.mov`, and generic embed/player URLs are normalized for playback.
- Product intro videos can normalize cloud URLs directly inside the product editor.
- Homepage showcase uploads now use the media library instead of storing base64 data URLs inside CMS JSON.
- Academic staff groups now support persisted intro video fields.

## Environment

Required media settings:

```env
MEDIA_STORAGE_DIR=../../storage/media
MEDIA_PUBLIC_BASE_URL=http://localhost:4000/v1
MEDIA_MAX_UPLOAD_BYTES=52428800
```

Production/staging guidance:

- `MEDIA_STORAGE_DIR` must point to a persistent disk/volume, not an ephemeral container directory.
- `MEDIA_PUBLIC_BASE_URL` must be reachable by visitors and should include the API prefix, for example `https://api.example.com/v1`.
- `MEDIA_MAX_UPLOAD_BYTES` is currently `50 MB`; larger lesson videos should use cloud streamer/embed URLs instead of direct API upload.

## Admin Workflow

1. Open Admin Panel -> `Medya Kütüphanesi`.
2. Use `Dosya Yükle` for images, PDFs, branding assets, and small media.
3. Use `Cloud Video / Harici URL` for Google Drive, YouTube, Vimeo, or cloud streamer videos.
4. Copy `Kullanılacak URL` or `Embed URL` into content fields when needed.
5. For product cards, paste the cloud URL in `Tanıtım Videosu` and click `Google Drive / Cloud URL Normalize Et`.

## Google Drive Video Rules

- The Drive file must be shared so visitors can view it.
- Supported examples:
  - `https://drive.google.com/file/d/<file-id>/view?...`
  - `https://drive.google.com/open?id=<file-id>`
- The system converts those into:
  - `https://drive.google.com/file/d/<file-id>/preview`
- No Google account credentials or API keys are required for this mode. Security exposure is limited to the visibility setting of the shared Drive file itself.

## Before Go-Live

- Confirm final `MEDIA_PUBLIC_BASE_URL` after domain/proxy architecture is decided.
- Confirm persistent storage volume backup policy.
- Decide whether production uploads stay on the server volume or move to object storage/CDN such as Cloudflare R2/S3.
- Add malware scanning if visitors or non-admin users are ever allowed to upload files.
- Keep large paid course videos on a real video platform/cloud streamer, not the API upload endpoint.
- Verify uploaded media survives container rebuild/redeploy.
