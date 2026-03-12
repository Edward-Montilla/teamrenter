type PropertyPhotoRow = {
  r2_bucket: string;
  r2_key: string;
};

function joinEncodedPath(bucket: string, key: string): string {
  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return [encodeURIComponent(bucket), encodedKey].filter(Boolean).join("/");
}

export function getPropertyPhotoDisplayUrl(
  photo: PropertyPhotoRow,
): string | null {
  const baseUrl =
    process.env.PROPERTY_PHOTO_BASE_URL ??
    process.env.NEXT_PUBLIC_PROPERTY_PHOTO_BASE_URL ??
    null;

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, "")}/${joinEncodedPath(
    photo.r2_bucket,
    photo.r2_key,
  )}`;
}
