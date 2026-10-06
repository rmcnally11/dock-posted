import { MAX_PHOTO_BYTES } from "./price-report";

const MAX_EDGE = 1600;

function looksLikePhoto(file: File): boolean {
  const type = file.type.toLowerCase();
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/heic" ||
    type === "image/heif"
  ) {
    return true;
  }
  return /\.(jpe?g|png|heic|heif)$/i.test(file.name);
}

async function fileToImage(file: File): Promise<HTMLImageElement | null> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("decode"));
      image.src = url;
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality));
}

/** Shrink a pump photo in the browser. Keeps a heic the browser cannot draw if it is already small enough. */
export async function prepareReportPhoto(file: File): Promise<{ file: File } | { error: string }> {
  if (!looksLikePhoto(file)) return { error: "Use a jpg, png, or heic." };

  const image = await fileToImage(file);
  if (!image) {
    if (file.size > MAX_PHOTO_BYTES) return { error: "That photo is too big. Try a smaller one." };
    return { file };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { error: "Could not read that photo." };
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let blob = await canvasBlob(canvas, quality);
  while (blob && blob.size > MAX_PHOTO_BYTES && quality > 0.4) {
    quality -= 0.12;
    blob = await canvasBlob(canvas, quality);
  }
  if (!blob || blob.size > MAX_PHOTO_BYTES) return { error: "That photo is too big. Try a smaller one." };

  const base = file.name.replace(/\.(png|jpe?g|heic|heif)$/i, "") || "pump";
  return { file: new File([blob], `${base}.jpg`, { type: "image/jpeg" }) };
}
