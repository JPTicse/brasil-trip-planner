"use client";

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

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa" className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onUploaded(null);
            }}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
            title="Quitar imagen"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-zinc-400 transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:opacity-50"
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
      )}
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
