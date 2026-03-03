# Slice 11 — Optional: Property Photos via Cloudflare R2 + Metadata

## Goal (demo in 1–3 minutes)
Admin uploads a photo to R2; metadata stored in Postgres; property page displays photos via signed or proxied URLs.

## User story
As a visitor, I want to see property images; as an admin, I want controlled photo uploads.

## Screens (mockups)
- Property page photo section (if present in Frame 3 mockup); otherwise add a gallery section to property detail. Admin upload UI (minimal form).

## Frontend tasks
- Admin: upload UI for property photos (select property or from property context); choose file; upload via signed URL flow; on success persist metadata.
- Property detail page: fetch property_photos for property (public read); display images using signed or proxied URLs (no raw R2 credentials client-side).

## DB tasks
- property_photos table (Slice 04): id, property_id, r2_bucket, r2_key, content_type, bytes, width, height, uploaded_by, created_at; UQ(r2_bucket, r2_key).
- RLS: admin INSERT; public SELECT only for active properties (join through properties where status = 'active').

## Integration tasks
- Create signed upload URL (server-side): generate short-lived R2 presigned PUT URL; return to client; client uploads file to R2.
- After client confirms upload, server inserts property_photos row (property_id, r2_bucket, r2_key, content_type, bytes from client or head request).
- For display: generate signed GET URLs (or proxy through Next.js) for each photo; return URLs to frontend; no R2 credentials in browser.

## Data contracts
- Photo metadata: id, property_id, content_type, bytes, width?, height?; display URL is ephemeral signed or proxied URL.

## RLS/Constraints notes
- Only admin can insert property_photos. Public can read metadata and receive safe URLs for active properties only.

## Acceptance criteria checklist
- [ ] Only admin can upload photos (`PHOTO-02`, `TST-07`)
- [ ] Public can view photos on property page for active properties (`PHOTO-01`)
- [ ] No raw R2 credentials exposed client-side

## Test notes (manual smoke steps)
- As admin upload image for a property; reload property page and verify image renders. As anon verify same image visible. Confirm upload fails or is inaccessible for non-admin.

## Out of scope
- Client-side image processing (resize, crop).
- EXIF stripping.
- Bulk uploads.
