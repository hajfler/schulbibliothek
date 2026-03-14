"use client";

import * as React from "react";
import { Camera, X, Scan } from "lucide-react";

interface ISBNScannerProps {
  onScan: (isbn: string) => void;
}

export function ISBNScanner({ onScan }: ISBNScannerProps) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number>(0);

  const startCamera = React.useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanFrame();
      }
    } catch {
      setError("Kamera konnte nicht gestartet werden. Bitte Kamerazugriff erlauben.");
    }
  }, []);

  const stopCamera = React.useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const scanFrame = React.useCallback(() => {
    if (!videoRef.current) return;

    // Use BarcodeDetector API if available (Chrome, Edge, Android)
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({
        formats: ["ean_13", "ean_8", "isbn"],
      });
      detector
        .detect(videoRef.current)
        .then((barcodes: Array<{ rawValue: string }>) => {
          if (barcodes.length > 0) {
            const isbn = barcodes[0].rawValue;
            stopCamera();
            setOpen(false);
            onScan(isbn);
            return;
          }
          animFrameRef.current = requestAnimationFrame(scanFrame);
        })
        .catch(() => {
          animFrameRef.current = requestAnimationFrame(scanFrame);
        });
    } else {
      // Fallback: show manual input note
      setError("Automatische Erkennung nicht verfügbar. Bitte ISBN manuell eingeben.");
      stopCamera();
    }
  }, [onScan, stopCamera]);

  const handleOpen = () => {
    setOpen(true);
  };

  React.useEffect(() => {
    if (open) {
      startCamera();
    }
    return () => {
      if (!open) stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-[14px] font-semibold rounded-xl transition-colors"
      >
        <Scan size={16} className="text-[#007AFF]" />
        Strichcode scannen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setOpen(false); stopCamera(); }}
          />
          <div className="relative z-10 bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-black">
              <div className="flex items-center gap-2 text-white">
                <Camera size={18} />
                <span className="text-[15px] font-semibold">ISBN scannen</span>
              </div>
              <button
                onClick={() => { setOpen(false); stopCamera(); }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video */}
            <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-28">
                  {/* Corner markers */}
                  {["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"].map((pos, i) => (
                    <div
                      key={i}
                      className={`absolute ${pos} w-8 h-8 border-[#007AFF]`}
                      style={{
                        borderWidth: "3px 0 0 3px",
                        ...(i === 1 && { borderWidth: "3px 3px 0 0" }),
                        ...(i === 2 && { borderWidth: "0 3px 3px 0" }),
                        ...(i === 3 && { borderWidth: "0 0 3px 3px" }),
                      }}
                    />
                  ))}
                  {/* Scan line animation */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-[#007AFF] opacity-80 animate-bounce" />
                </div>
              </div>

              {/* Dim overlay outside scan area */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-[calc(50%-56px)] bg-black/40" />
                <div className="absolute inset-x-0 bottom-0 h-[calc(50%-56px)] bg-black/40" />
              </div>
            </div>

            <div className="px-5 py-4 bg-black text-center">
              {error ? (
                <p className="text-[#FF3B30] text-[13px]">{error}</p>
              ) : (
                <p className="text-white/60 text-[13px]">
                  Halte den Strichcode in den Rahmen
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
