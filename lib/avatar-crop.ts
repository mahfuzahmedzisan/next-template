import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read that image."));
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Exports the circular crop as a square PNG. PNG is readable by PHP GD even
 * when that build has no WebP support; the API encodes the stored WebP.
 */
export async function cropToSquareImage(
  imageSrc: string,
  pixelCrop: Area,
  size = 512,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to crop this image.");
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  const png = await canvasToBlob(canvas, "image/png", 0.92);
  if (png) return png;

  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.92);
  if (jpeg) return jpeg;

  throw new Error("Unable to export this image.");
}
