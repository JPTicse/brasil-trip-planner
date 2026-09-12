"use client";

import { CachedImage } from "@/components/cached-image";
import { useRef, useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ImageUpload({
  imageUrl,
  onUploaded,
  activityId,
}: {
  imageUrl?: string | null;
  onUploaded: (url: string | null) => void;
  activityId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);

  useEffect(() => {
    setPreview(imageUrl ?? null);
  }, [imageUrl]);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);

    try {
      // Generar nombre único
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `activities/${fileName}`;

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.storage
        .from("activity-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("activity-images")
        .getPublicUrl(filePath);

      const url = urlData.publicUrl;
      setPreview(url);
      onUploaded(url);
    } catch (e) {
      console.error("Error al subir imagen:", e);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onUploaded(null);
  };

  if (preview) {
    return (
      <div className="space-y-2">
        <div className="relative h-32 w-full overflow-hidden rounded-xl">
          <CachedImage src={preview} alt="Vista previa" className="object-cover" sizes="400px" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reemplazar
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Eliminar
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-zinc-400 transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-500 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20"
      >
        {uploading ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs">Subiendo...</span>
          </>
        ) : (
          <>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-medium">Subir imagen</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
