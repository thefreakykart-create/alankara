"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, Upload, Download, RotateCcw, ZoomIn, ZoomOut, Info } from "lucide-react";
import type { FrameSize } from "@/lib/types/product";
import { FRAME_SIZE_CM, FRAME_SIZE_LABELS } from "@/lib/types/product";
import { cn } from "@/lib/utils";

interface TryOnWallModalProps {
  productName: string;
  activeImage: string;
  activeSize: FrameSize | null;
  onClose: () => void;
}

interface FrameState {
  x: number;      // px from center of container
  y: number;
  scale: number;  // scale factor (1 = auto-sized from frame dimensions)
  rotation: number; // degrees
}

// Reference: average phone screen is ~15cm tall when held at arm's length
// We use this to approximate real-world scale
const SCREEN_REF_CM = 15;

export default function TryOnWallModal({
  productName,
  activeImage,
  activeSize,
  onClose,
}: TryOnWallModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number>(0);

  const [mode, setMode] = useState<"choice" | "camera" | "upload">("choice");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [webXRSupported, setWebXRSupported] = useState(false);

  // Frame state
  const [frame, setFrame] = useState<FrameState>({ x: 0, y: -60, scale: 1, rotation: 0 });

  // Gesture tracking refs (avoid re-renders during drag)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1, startAngle: 0, startRotation: 0 });

  // Compute frame display size from real-world dimensions
  const getFrameDisplaySize = useCallback(() => {
    const container = containerRef.current;
    if (!container || !activeSize) return { w: 200, h: 267 };
    const containerH = container.clientHeight;
    // pixels per cm: phone screen ~15cm tall
    const pxPerCm = containerH / SCREEN_REF_CM;
    const cm = FRAME_SIZE_CM[activeSize];
    return {
      w: cm.w * pxPerCm * frame.scale,
      h: cm.h * pxPerCm * frame.scale,
    };
  }, [activeSize, frame.scale]);

  // Check WebXR
  useEffect(() => {
    if ("xr" in navigator) {
      (navigator as unknown as { xr: { isSessionSupported: (s: string) => Promise<boolean> } })
        .xr.isSessionSupported("immersive-ar")
        .then((supported) => setWebXRSupported(supported))
        .catch(() => {});
    }
  }, []);

  // Preload frame image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = activeImage;
    img.onload = () => { frameImgRef.current = img; };
  }, [activeImage]);

  // Camera stream
  useEffect(() => {
    if (mode !== "camera") return;
    let stream: MediaStream;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access and try again."
            : "Camera not available on this device."
        );
      });

    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [mode]);

  // Canvas render loop (camera mode)
  useEffect(() => {
    if (mode !== "camera") return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !video.videoWidth) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Draw video
      const vAspect = video.videoWidth / video.videoHeight;
      const cAspect = canvas.width / canvas.height;
      let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
      if (vAspect > cAspect) {
        sw = video.videoHeight * cAspect;
        sx = (video.videoWidth - sw) / 2;
      } else {
        sh = video.videoWidth / cAspect;
        sy = (video.videoHeight - sh) / 2;
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      drawFrame(ctx, canvas.width, canvas.height);
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [mode, frame]); // eslint-disable-line react-hooks/exhaustive-deps

  const drawFrame = (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
    const img = frameImgRef.current;
    if (!img) return;
    const { w, h } = getFrameDisplaySize();
    const cx = cw / 2 + frame.x;
    const cy = ch / 2 + frame.y;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((frame.rotation * Math.PI) / 180);

    // Drop shadow
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  // Draw static frame on upload photo
  const drawUploadFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || mode !== "upload" || !uploadedImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const bg = new window.Image();
    bg.crossOrigin = "anonymous";
    bg.src = uploadedImage;
    bg.onload = () => {
      // Draw background (contain)
      const bAspect = bg.width / bg.height;
      const cAspect = canvas.width / canvas.height;
      let dx = 0, dy = 0, dw = canvas.width, dh = canvas.height;
      if (bAspect > cAspect) {
        dh = canvas.width / bAspect;
        dy = (canvas.height - dh) / 2;
      } else {
        dw = canvas.height * bAspect;
        dx = (canvas.width - dw) / 2;
      }
      ctx.drawImage(bg, dx, dy, dw, dh);
      drawFrame(ctx, canvas.width, canvas.height);
    };
  }, [mode, uploadedImage, frame]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === "upload") drawUploadFrame();
  }, [mode, uploadedImage, frame, drawUploadFrame]);

  // ── Gesture handlers ──

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const getPinchInfo = (e: React.TouchEvent) => {
    const t = e.touches;
    if (t.length < 2) return null;
    const dx = t[1].clientX - t[0].clientX;
    const dy = t[1].clientY - t[0].clientY;
    return {
      dist: Math.hypot(dx, dy),
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e && e.touches.length === 2) {
      const info = getPinchInfo(e);
      if (!info) return;
      pinchRef.current = {
        active: true,
        startDist: info.dist,
        startScale: frame.scale,
        startAngle: info.angle,
        startRotation: frame.rotation,
      };
      return;
    }
    const pos = getPos(e);
    dragRef.current = { active: true, startX: pos.x, startY: pos.y, originX: frame.x, originY: frame.y };
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    // Pinch
    if ("touches" in e && e.touches.length === 2 && pinchRef.current.active) {
      const info = getPinchInfo(e);
      if (!info) return;
      const scaleDelta = info.dist / pinchRef.current.startDist;
      const angleDelta = info.angle - pinchRef.current.startAngle;
      setFrame((prev) => ({
        ...prev,
        scale: Math.max(0.3, Math.min(4, pinchRef.current.startScale * scaleDelta)),
        rotation: pinchRef.current.startRotation + angleDelta,
      }));
      return;
    }
    // Drag
    if (!dragRef.current.active) return;
    const pos = getPos(e);
    setFrame((prev) => ({
      ...prev,
      x: dragRef.current.originX + (pos.x - dragRef.current.startX),
      y: dragRef.current.originY + (pos.y - dragRef.current.startY),
    }));
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
    pinchRef.current.active = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setFrame((prev) => ({
      ...prev,
      scale: Math.max(0.3, Math.min(4, prev.scale - e.deltaY * 0.001)),
    }));
  };

  // Upload handler
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setMode("upload");
      setShowGuide(true);
      setTimeout(() => setShowGuide(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Screenshot
  const takeScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // For camera mode the canvas is already composited
    if (mode === "upload") drawUploadFrame();
    setTimeout(() => {
      const data = canvas.toDataURL("image/jpeg", 0.92);
      setScreenshot(data);
    }, 100);
  };

  const resetFrame = () => {
    setFrame({ x: 0, y: -60, scale: 1, rotation: 0 });
  };

  const { w: fw, h: fh } = getFrameDisplaySize();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ touchAction: "none" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/80 backdrop-blur-sm z-10">
        <div>
          <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase">Try On My Wall</p>
          <p className="text-sm text-white font-medium truncate max-w-[200px]">{productName}</p>
          {activeSize && (
            <p className="text-[10px] text-white/40">{FRAME_SIZE_LABELS[activeSize]} · approx. real-world scale</p>
          )}
        </div>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 relative overflow-hidden">

        {/* Choice screen */}
        {mode === "choice" && (
          <div className="flex flex-col items-center justify-center h-full gap-5 px-8">
            {/* Preview of art */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage} alt={productName} className="w-28 h-auto rounded-sm shadow-lg mb-2 opacity-80" />
            <p className="text-white/50 text-sm text-center max-w-xs leading-relaxed">
              See exactly how this looks on your wall — at real size.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
              <button
                onClick={() => { setMode("camera"); setShowGuide(true); setTimeout(() => setShowGuide(false), 3500); }}
                className="flex items-center gap-3 w-full px-5 py-4 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-all text-sm"
              >
                <Camera className="w-5 h-5 text-terracotta" />
                <div className="text-left">
                  <p className="font-medium">Live Camera</p>
                  <p className="text-xs text-white/40">Point at your wall in real-time</p>
                </div>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 w-full px-5 py-4 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-all text-sm"
              >
                <Upload className="w-5 h-5 text-terracotta" />
                <div className="text-left">
                  <p className="font-medium">Upload Wall Photo</p>
                  <p className="text-xs text-white/40">Place frame on a photo of your room</p>
                </div>
              </button>
              {webXRSupported && (
                <p className="text-[10px] text-emerald/60 text-center tracking-wide">
                  ✦ WebXR AR available on your device
                </p>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        )}

        {/* Camera / Upload mode — canvas + overlays */}
        {(mode === "camera" || mode === "upload") && (
          <>
            {/* Hidden video (camera feeds canvas) */}
            {mode === "camera" && (
              <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            )}

            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 z-20">
                <Camera className="w-10 h-10 text-white/30" />
                <p className="text-white/60 text-sm text-center">{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 border border-white/20 text-white text-sm rounded-sm hover:bg-white/10"
                >
                  Upload a photo instead
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            )}

            {/* Canvas — composite layer */}
            {!cameraError && (
              <div
                ref={containerRef}
                className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
                onWheel={onWheel}
              >
                <canvas ref={canvasRef} className="w-full h-full" />

                {/* Upload mode: frame overlay as DOM element (for smooth drag before screenshot) */}
                {mode === "upload" && !screenshot && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${frame.x}px), calc(-50% + ${frame.y}px)) rotate(${frame.rotation}deg)`,
                      width: fw,
                      height: fh,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImage}
                      alt={productName}
                      className="w-full h-full object-cover select-none"
                      style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))" }}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Guide tip */}
            {showGuide && !cameraError && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white/80 text-xs px-4 py-2 rounded-full tracking-wide pointer-events-none">
                Drag to move · Pinch to resize · Two-finger twist to rotate
              </div>
            )}

            {/* Screenshot overlay */}
            {screenshot && (
              <div className="absolute inset-0 z-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshot} alt="Screenshot" className="w-full h-full object-contain bg-black" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom controls */}
      {(mode === "camera" || mode === "upload") && !screenshot && !cameraError && (
        <div className="bg-black/80 backdrop-blur-sm px-5 py-4 flex items-center justify-between gap-4 z-10">

          {/* Left: reset + guide */}
          <div className="flex items-center gap-3">
            <button onClick={resetFrame} className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGuide((g) => !g)}
              className={cn("w-9 h-9 flex items-center justify-center transition-colors", showGuide ? "text-terracotta" : "text-white/50 hover:text-white")}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Center: size slider */}
          <div className="flex items-center gap-2 flex-1 max-w-[160px]">
            <ZoomOut className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <input
              type="range" min={30} max={400}
              value={Math.round(frame.scale * 100)}
              onChange={(e) => setFrame((prev) => ({ ...prev, scale: Number(e.target.value) / 100 }))}
              className="flex-1 accent-terracotta h-1"
            />
            <ZoomIn className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          </div>

          {/* Right: capture */}
          <button
            onClick={takeScreenshot}
            className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white text-xs tracking-[0.1em] uppercase rounded-sm font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      )}

      {/* Post-screenshot actions */}
      {screenshot && (
        <div className="bg-black/90 px-5 py-4 flex items-center justify-center gap-4 z-30">
          <a
            href={screenshot}
            download={`${productName.replace(/\s+/g, "-")}-on-my-wall.jpg`}
            className="flex items-center gap-2 px-6 py-2.5 bg-terracotta text-white text-xs tracking-[0.12em] uppercase rounded-sm font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
          <button
            onClick={() => setScreenshot(null)}
            className="px-4 py-2.5 border border-white/20 text-white/70 text-xs tracking-wider uppercase rounded-sm hover:bg-white/10"
          >
            Try Again
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-white/40 text-xs tracking-wider uppercase hover:text-white"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
