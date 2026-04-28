"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProductImagesAction } from "@/app/admin/actions";
import { ImageIcon, X, Loader2, Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  initialImages: string[];
  frameType?: string;
}

export default function EditProductImages({ productId, initialImages, frameType = "misc" }: Props) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const featuredRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const featuredImage = images[0] ?? null;
  const galleryImages = images.slice(1);

  const handleFeaturedSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    // Replace featured (index 0)
    setPendingFiles((p) => [file, ...p.filter((_, i) => i !== 0)]);
    const url = URL.createObjectURL(file);
    setPendingPreviews((p) => [url, ...p.filter((_, i) => i !== 0)]);
  };

  const handleGallerySelect = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setPendingFiles((p) => [...p, ...arr]);
    setPendingPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeExisting = (idx: number) => {
    setImages((p) => p.filter((_, i) => i !== idx));
  };

  const removePending = (idx: number) => {
    setPendingFiles((p) => p.filter((_, i) => i !== idx));
    setPendingPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const newUrls: string[] = [];
      const ts = Date.now();

      for (const file of pendingFiles) {
        const ext = file.name.split(".").pop();
        const path = `products/${frameType}/edit-${ts}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "31536000" });
        if (error) throw new Error(error.message);
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }

      const finalUrls = [...images, ...newUrls];
      await updateProductImagesAction(productId, finalUrls);

      setImages(finalUrls);
      setPendingFiles([]);
      setPendingPreviews([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = pendingFiles.length > 0 || images.length !== initialImages.length;

  return (
    <div className="space-y-5">
      {/* Featured image */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-2.5">Featured Image <span className="font-normal text-zinc-400">(shown on product cards)</span></p>
        <div className="flex gap-4 items-start">
          {featuredImage || pendingPreviews[0] ? (
            <div className="relative flex-none w-40 h-52 rounded-xl overflow-hidden border border-zinc-200 shadow-sm group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreviews[0] ?? featuredImage!}
                alt=""
                className={cn("w-full h-full object-cover", pendingPreviews[0] && "opacity-70")}
              />
              {pendingPreviews[0] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full">Pending upload</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => pendingPreviews[0] ? removePending(0) : removeExisting(0)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-50 text-zinc-700 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => featuredRef.current?.click()}
                className="absolute bottom-0 inset-x-0 text-[10px] text-white/80 hover:text-white bg-black/40 py-2 text-center opacity-0 group-hover:opacity-100 transition-all"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => featuredRef.current?.click()}
              className="flex-none w-40 h-52 rounded-xl border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
              <ImageIcon className="w-7 h-7 text-zinc-300" />
              <span className="text-xs text-zinc-400">Upload featured</span>
            </button>
          )}
          <input ref={featuredRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFeaturedSelect(e.target.files)} />

          <div className="space-y-2 pt-1 text-xs text-zinc-500">
            <p className="font-medium text-zinc-700">Recommended</p>
            <p>3:4 ratio (e.g. 900×1200 px)</p>
            <p>JPG or WebP, under 5 MB</p>
          </div>
        </div>
      </div>

      {/* Gallery images */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-2.5">Gallery Images <span className="font-normal text-zinc-400">(product page slideshow)</span></p>
        <div className="flex flex-wrap gap-2">
          {/* Existing gallery (skip index 0 = featured) */}
          {galleryImages.map((url, i) => (
            <div key={url} className="relative flex-none w-20 h-28 rounded-lg overflow-hidden border border-zinc-200 group shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(i + 1)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/90 hover:bg-red-50 text-zinc-700 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* Pending gallery (skip index 0 if it's a featured replacement) */}
          {pendingPreviews.slice(pendingFiles[0] && !featuredImage ? 1 : (pendingPreviews[0] && !featuredImage ? 0 : 0)).map((src, i) => {
            const actualIdx = i + (pendingPreviews.length > pendingFiles.length - galleryImages.length ? 1 : 0);
            return (
              <div key={i} className="relative flex-none w-20 h-28 rounded-lg overflow-hidden border-2 border-dashed border-indigo-300 bg-indigo-50/40 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover opacity-70" />
                <button
                  type="button"
                  onClick={() => removePending(actualIdx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center shadow-sm"
                >
                  <X className="w-2.5 h-2.5 text-red-500" />
                </button>
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                  <span className="text-[8px] bg-indigo-600 text-white px-1 py-0.5 rounded">New</span>
                </div>
              </div>
            );
          })}

          <label className="flex-none w-20 h-28 rounded-lg border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
            <Plus className="w-4 h-4 text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Add</span>
            <input ref={galleryRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleGallerySelect(e.target.files)} />
          </label>
        </div>
      </div>

      {/* Save */}
      {hasChanges && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-60"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            : <><Upload className="w-3.5 h-3.5" /> Save Images</>
          }
        </button>
      )}
      {saved && <p className="text-xs text-emerald-600 font-medium">✓ Images saved</p>}
      {!hasChanges && images.length === 0 && (
        <p className="text-xs text-zinc-400">No images uploaded yet.</p>
      )}
    </div>
  );
}
