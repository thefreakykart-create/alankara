"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Camera, Upload, Download } from "lucide-react";

interface TryOnWallModalProps {
  productName: string;
  activeImage: string;
  onClose: () => void;
}

export default function TryOnWallModal({
  productName,
  activeImage,
  onClose,
}: TryOnWallModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"choice" | "camera" | "upload">("choice");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [framePos, setFramePos] = useState({ x: 50, y: 30 }); // percent
  const [frameScale, setFrameScale] = useState(25); // percent of container width
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraError, setCameraError] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // Start camera
  useEffect(() => {
    if (mode !== "camera") return;
    let stream: MediaStream;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => setCameraError(true));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setMode("upload");
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
    setFramePos((prev) => ({
      x: Math.max(5, Math.min(95, prev.x + dx)),
      y: Math.max(5, Math.min(95, prev.y + dy)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    setFramePos({
      x: Math.max(5, Math.min(95, ((touch.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(5, Math.min(95, ((touch.clientY - rect.top) / rect.height) * 100)),
    });
  };

  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setScreenshot(canvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <p className="text-xs text-white/50 tracking-[0.2em] uppercase">Try On My Wall</p>
          <p className="text-sm text-white font-medium">{productName}</p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">

        {/* Choice screen */}
        {mode === "choice" && (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
            <p className="text-white/60 text-sm text-center max-w-xs">
              See how this art looks on your wall before buying
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => setMode("camera")}
                className="flex items-center gap-3 w-full px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-all text-sm tracking-wide"
              >
                <Camera className="w-5 h-5" />
                Use My Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 w-full px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-all text-sm tracking-wide"
              >
                <Upload className="w-5 h-5" />
                Upload a Photo of My Wall
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </div>
        )}

        {/* Camera mode */}
        {mode === "camera" && (
          <div
            className="relative w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
          >
            {cameraError ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-white/60 text-sm text-center px-6">
                <Camera className="w-10 h-10" />
                <p>Camera access denied or not supported.</p>
                <button
                  onClick={() => { setMode("choice"); setCameraError(false); }}
                  className="text-white underline"
                >
                  Upload a photo instead
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Draggable frame overlay */}
                <div
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${framePos.x}%`,
                    top: `${framePos.y}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${frameScale}%`,
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    setDragStart({ x: touch.clientX, y: touch.clientY });
                  }}
                >
                  <Image
                    src={activeImage}
                    alt={productName}
                    width={400}
                    height={533}
                    className="w-full h-auto shadow-2xl border-2 border-white/20 select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
                <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-dark/60 px-3 py-1.5 rounded-full">
                  Drag to reposition
                </p>
              </>
            )}
          </div>
        )}

        {/* Upload mode */}
        {mode === "upload" && uploadedImage && (
          <div
            className="relative w-full h-full overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
          >
            {/* Wall photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImage}
              alt="Your wall"
              className="w-full h-full object-contain"
            />

            {/* Draggable frame */}
            {!screenshot && (
              <div
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: `${framePos.x}%`,
                  top: `${framePos.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${frameScale}%`,
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  setDragStart({ x: touch.clientX, y: touch.clientY });
                }}
              >
                <Image
                  src={activeImage}
                  alt={productName}
                  width={400}
                  height={533}
                  className="w-full h-auto shadow-2xl border-2 border-white/20 select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            {screenshot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={screenshot} alt="Screenshot" className="absolute inset-0 w-full h-full object-contain" />
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {(mode === "camera" || mode === "upload") && !screenshot && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-dark">
          {/* Size slider */}
          <div className="flex items-center gap-3 flex-1 max-w-[180px]">
            <span className="text-xs text-white/40">S</span>
            <input
              type="range"
              min={10}
              max={60}
              value={frameScale}
              onChange={(e) => setFrameScale(Number(e.target.value))}
              className="flex-1 accent-terracotta"
            />
            <span className="text-xs text-white/40">L</span>
          </div>

          {/* Screenshot */}
          {mode === "upload" && (
            <button
              onClick={takeScreenshot}
              className="flex items-center gap-2 px-4 py-2 bg-terracotta text-white text-xs tracking-wider uppercase rounded-sm"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      )}

      {/* Screenshot download */}
      {screenshot && (
        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-dark border-t border-white/10">
          <a
            href={screenshot}
            download={`${productName}-on-my-wall.png`}
            className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white text-xs tracking-wider uppercase rounded-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
          <button
            onClick={() => setScreenshot(null)}
            className="text-white/50 hover:text-white text-xs tracking-wider uppercase"
          >
            Try Again
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
