function drawJpeg(bitmap: ImageBitmap, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return "";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function readFrame(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { resizeWidth: 512, resizeQuality: "low" } as ImageBitmapOptions);
  } catch {
    bitmap = await createImageBitmap(file);
  }
  const shot = drawJpeg(bitmap, 480, 0.62);
  const vision = drawJpeg(bitmap, 240, 0.4);
  bitmap.close();
  return { shot, vision };
}

export async function compressImage(file: File, maxEdge = 720, quality = 0.72) {
  const { shot, vision } = await readFrame(file);
  return maxEdge <= 360 ? vision : shot;
}
