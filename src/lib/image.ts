function drawJpeg(bitmap: ImageBitmap, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function readFrame(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { resizeWidth: 1024, resizeQuality: "high" } as ImageBitmapOptions);
  } catch {
    bitmap = await createImageBitmap(file);
  }
  const shot = drawJpeg(bitmap, 720, 0.78);
  const vision = drawJpeg(bitmap, 768, 0.84);
  bitmap.close();
  return { shot, vision };
}

export async function compressImage(file: File, maxEdge = 720, quality = 0.72) {
  const { shot, vision } = await readFrame(file);
  return maxEdge <= 360 ? vision : shot;
}