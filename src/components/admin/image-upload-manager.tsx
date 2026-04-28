"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, ImageIcon, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  mode: "featured" | "gallery";
  initialUrls?: string[];
  onSave: (urls: string[]) => Promise<void>;
  folder?: string;
}

export default function ImageUploadManager({
  mode,
  initialUrls = [],
  onSave,
  folder = "products/misc",
}: Props) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [previews, setPreviews] = useState<{ url: string; isNew: boolean }[]>(
    initialUrls.map((u) => ({ url: u, isNew: false }))
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFeatured = mode === "featured";
  const limit = isFeatured ? 1 : 20;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, limit - previews.length - pendingPreviews.length);
    setPendingFiles((p) => [...p, ...arr]);
    setPendingPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removePending = (i: number) => {
    setPendingFiles((p) => p.filter((_, idx) => idx !== i));
    setPendingPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const removeExisting = (i: number) => {
    setPreviews((p) => p.filter((_, idx) => idx !== i));
    setUrls((u) => u.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const newUrls: string[] = [];

      if (pendingFiles.length > 0) {
        setUploading(true);
        for (const file of pendingFiles) {
          const ext = file.name.split(".").pop();
          const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage
            .from("product-images")
            .upload(path, file, { cacheControl: "31536000" });
          if (error) throw new Error(error.message);
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
          newUrls.push(urlData.publicUrl);
        }
        setUploading(false);
      }

      const finalUrls = [...urls, ...newUrls];
      await onSave(finalUrls);

      setUrls(finalUrls);
      setPreviews(finalUrls.map((u) => ({ url: u, isNew: false })));
      setPendingFiles([]);
      setPendingPreviews([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const hasChanges = pendingFiles.length > 0 || urls.length !== initialUrls.length;
  const totalCount = previews.length + pendingPreviews.length;

  return (
    <div className="space-y-3">
      {/* Existing images */}
      {previews.length > 0 && (
        <div className={cn("flex gap-2 flex-wrap", isFeatured && "block")}>
          {isFeatured ? (
            <div className="relative w-48 h-60 rounded-lg overflow-hidden border border-zinc-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[0].url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(0)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-50 text-zinc-700 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 rounded text-[10px] text-white">
                Featured
              </div>
            </div>
          ) : (
            previews.map((p, i) => (
              <div key={i} className="relative w-20 h-24 rounded-lg overflow-hidden border border-zinc-200 group flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExisting(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-white/90 hover:bg-red-50 text-zinc-700 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
                {i === 0 && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/40 rounded text-[9px] text-white leading-none">
                    Cover
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending (not yet uploaded) */}
      {pendingPreviews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {pendingPreviews.map((src, i) => (
            <div key={i} className="relative flex-none">
              <div className={cn(
                "rounded-lg overflow-hidden border-2 border-dashed border-indigo-300 bg-indigo-50/40",
                isFeatured ? "w-48 h-60" : "w-20 h-24"
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover opacity-70" />
              </div>
              <button
                type="button"
                onClick={() => removePending(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
              >
                <X className="w-2.5 h-2.5" />
              </button>
              <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">Pending</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {(isFeatured ? totalCount === 0 : totalCount < limit) && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors cursor-pointer",
            isFeatured ? "w-48 h-60" : "w-20 h-24"
          )}
        >
          <ImageIcon className="w-5 h-5 text-zinc-400" />
          <span className="text-[11px] text-zinc-400 text-center px-2">
            {isFeatured ? "Upload featured image" : "Add images"}
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple={!isFeatured}
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>
      )}

      {/* Save button */}
      {hasChanges && (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
            ) : saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            ) : (
              <><Upload className="w-3.5 h-3.5" /> Save Images</>
            )}
          </button>
          {pendingFiles.length > 0 && (
            <span className="text-xs text-zinc-500">{pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} to upload</span>
          )}
        </div>
      )}

      {saved && (
        <p className="text-xs text-emerald-600 font-medium">✓ Images saved</p>
      )}
    </div>
  );
}
