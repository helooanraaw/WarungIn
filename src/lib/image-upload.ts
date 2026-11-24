/**
 * Utilitas kompresi foto di sisi browser (tanpa beban server & 100% jalan di Vercel maupun Lokal).
 * Mengubah ukuran gambar secara proporsional lalu menyimpannya sebagai WebP/JPEG ringan.
 */
export async function compressImageFile(
  file: File,
  options: {
    maxWidth: number;
    maxHeight: number;
    quality?: number;
  }
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Pilih file gambar berformat JPG, PNG, atau WebP.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Ukuran file asli terlalu besar (maksimal 8 MB).");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("File gambar tidak dapat dibuka."));
    el.src = dataUrl;
  });

  let { width, height } = img;
  const ratio = Math.min(
    1,
    options.maxWidth / Math.max(1, width),
    options.maxHeight / Math.max(1, height)
  );

  width = Math.max(1, Math.round(width * ratio));
  height = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung pemrosesan gambar.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const quality = options.quality ?? 0.8;
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) {
    return webp;
  }
  return canvas.toDataURL("image/jpeg", quality);
}
