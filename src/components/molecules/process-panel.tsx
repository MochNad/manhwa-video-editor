import React, { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Wand2,
  Crop,
  RectangleHorizontal,
  RectangleVertical,
  Ratio,
  Merge,
} from "lucide-react";
import { useCrop } from "@/hooks/useCrop";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function ProcessPanel() {
  const { process, addOutput, outputs, setProcessCrop } = useCrop();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [aspect, setAspect] = useState(NaN);
  const [outputName, setOutputName] = useState("[ - ]");
  const [showPreview, setShowPreview] = useState(false);
  const [fromPosition, setFromPosition] = useState("");
  const [toPosition, setToPosition] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [usePreset, setUsePreset] = useState(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [customIndex, setCustomIndex] = useState<number | "">("");
  const [mergeMode, setMergeMode] = useState(false);
  const [autoMergeNext, setAutoMergeNext] = useState(false);
  const [mergePairCount, setMergePairCount] = useState(0);
  // Add state to track if coordinates have been saved and if they've changed
  const [lastSavedCoordinates, setLastSavedCoordinates] = useState<
    string | null
  >(null);
  const [coordinatesChanged, setCoordinatesChanged] = useState(false);
  const [cropperReady, setCropperReady] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Tambahkan ref untuk container

  // Track coordinate changes
  useEffect(() => {
    if (process.cropCoordinates) {
      const currentCoords = JSON.stringify(process.cropCoordinates);
      if (lastSavedCoordinates !== currentCoords) {
        setCoordinatesChanged(true);
      }
    }
  }, [process.cropCoordinates, lastSavedCoordinates]);

  // Reset tracking states when image changes
  useEffect(() => {
    setOutputName("[ - ]");
    setCroppedImageUrl(null);
    setLastSavedCoordinates(null);
    setCoordinatesChanged(false);
    setCropperReady(false);
  }, [process.image?.id]);

  const createCroppedImage = useCallback(async () => {
    if (!process.image) return;

    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas();
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png", 1.0);
    setCroppedImageUrl(dataUrl);
    return dataUrl;
  }, [process.image]);

  // Removed redundant useEffect - createCroppedImage is now called explicitly

  // Update output name when positions change
  useEffect(() => {
    if (fromPosition === "I" || fromPosition === "O") {
      // For zoom animations, only use fromPosition
      setOutputName(`[${fromPosition}]`);
    } else if (fromPosition && toPosition) {
      setOutputName(`[${fromPosition}-${toPosition}]`);
    } else if (fromPosition) {
      setOutputName(`[${fromPosition}-]`);
    } else {
      setOutputName("[ - ]");
    }
  }, [fromPosition, toPosition, aspect]);

  const getAnimationClass = useCallback(() => {
    if (fromPosition === "I") return "pan-I";
    if (fromPosition === "O") return "pan-O";
    if (!fromPosition || !toPosition) return "";
    return `pan-${fromPosition}-${toPosition}`;
  }, [fromPosition, toPosition]);

  // Preview logic
  const handlePreview = useCallback(async () => {
    if (process.cropCoordinates) {
      await createCroppedImage();
      setShowPreview(true);
    }
  }, [process.cropCoordinates, createCroppedImage]);

  // Fungsi untuk menentukan index output berikutnya
  const getNextIndex = () => {
    if (customIndex !== "" && !isNaN(Number(customIndex))) {
      return Number(customIndex);
    }
    // Cari index terbesar di outputs, lalu +1
    const maxIndex = outputs.reduce((max, o) => {
      const match = o.outputName?.match(/^\[(\d+)\]/);
      if (match) {
        const idx = parseInt(match[1], 10);
        return idx > max ? idx : max;
      }
      return max;
    }, 0);
    return maxIndex + 1;
  };

  // Update index custom jika outputName berubah manual
  useEffect(() => {
    if (customIndex === "" && outputs.length) {
      setCustomIndex(getNextIndex());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputs.length]);

  // Reset customIndex saat gambar baru atau outputs berubah (untuk trigger render ulang)
  useEffect(() => {
    setCustomIndex("");
  }, [process.image?.id, outputs.length]);

  // Gunakan index dari customIndex atau auto
  const displayIndex = getNextIndex();
  let displayName = `[${displayIndex}]${outputName}`;
  if (isNaN(aspect) && mergeMode) {
    displayName += "[MERGE]";
  }

  // Helper: count consecutive [MERGE] at the end
  const getConsecutiveMergeAtEnd = useCallback(() => {
    let count = 0;
    for (let i = outputs.length - 1; i >= 0; i--) {
      if (outputs[i].outputName?.includes("[MERGE]")) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [outputs]);

  // Detect if previous output is [MERGE] and auto-enable merge for next image (only for one pair)
  useEffect(() => {
    // If last output is [MERGE] and only one at the end, auto-enable merge for next image
    const consecutiveMerge = getConsecutiveMergeAtEnd();
    if (process.image?.id && outputs.length > 0) {
      const lastOutput = outputs[outputs.length - 1];
      const isPrevMerge = lastOutput.outputName?.includes("[MERGE]");
      if (isPrevMerge && consecutiveMerge === 1) {
        setMergeMode(true);
        setAutoMergeNext(true);
        setMergePairCount(1);
      } else {
        setMergeMode(false);
        setAutoMergeNext(false);
        setMergePairCount(0);
      }
    } else if (process.image?.id) {
      setMergeMode(false);
      setAutoMergeNext(false);
      setMergePairCount(0);
    }
  }, [process.image?.id, outputs, getConsecutiveMergeAtEnd]);

  // After saving, update mergePairCount to ensure only two images are auto-merged
  const handleSave = async () => {
    if (process.image && process.cropCoordinates) {
      // Check save conditions
      const hasValidAnimationName =
        outputName !== "[ - ]" && outputName.includes("-");
      const hasCoordinateChanges = coordinatesChanged;

      if (!hasValidAnimationName || !hasCoordinateChanges) return;

      // Create the cropped image
      const croppedImageDataUrl = await createCroppedImage();

      if (!croppedImageDataUrl) {
        console.error("Failed to create cropped image");
        return;
      }

      // Create a blob for download
      const response = await fetch(croppedImageDataUrl);
      const blob = await response.blob();

      // Use the displayName format that includes the index
      let finalOutputName = `[${displayIndex}]${outputName}`;
      if (isNaN(aspect) && mergeMode) {
        finalOutputName += "[MERGE]";
      }

      addOutput({
        id: Date.now().toString(),
        image: process.image,
        cropCoordinates: process.cropCoordinates,
        outputName: finalOutputName,
        croppedImageUrl: croppedImageDataUrl,
        croppedBlob: blob,
      });

      // If mergeMode is active, manage mergePairCount for auto merge
      if (isNaN(aspect) && mergeMode) {
        if (mergePairCount === 0) {
          // First [MERGE] in pair, enable auto for next image
          setMergePairCount(1);
          setAutoMergeNext(true);
        } else if (mergePairCount === 1) {
          // Second [MERGE] in pair, reset for subsequent images
          setMergePairCount(0);
          setAutoMergeNext(false);
        }
      } else {
        setMergePairCount(0);
        setAutoMergeNext(false);
      }

      // Update tracking states after successful save
      setLastSavedCoordinates(JSON.stringify(process.cropCoordinates));
      setCoordinatesChanged(false);

      setOutputName("[ - ]");
      setFromPosition("");
      setToPosition("");
      setSelectedPreset("");
      setUsePreset(false);
      setCustomIndex(""); // reset index ke auto
      setMergeMode(false);
    }
  };

  const handleFromPositionChange = (value: string) => {
    setFromPosition(value);
    // Reset toPosition when fromPosition changes to avoid invalid combinations
    setToPosition("");
    // Reset preset when manually changing position
    setSelectedPreset("");
  };

  const handleToPositionChange = (value: string) => {
    setToPosition(value);
    // Reset preset when manually changing position
    setSelectedPreset("");
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value) {
      // Handle zoom presets (I and O)
      if (value === "I" || value === "O") {
        setFromPosition(value);
        setToPosition("");
      } else {
        // Handle pan presets
        const [from, to] = value.split("-");
        setFromPosition(from);
        setToPosition(to);
      }
    }
  };

  const handleAspectChange = useCallback((newAspect: number) => {
    setAspect(newAspect);
    const cropper = cropperRef.current?.cropper;

    if (!cropper) return;

    if (!isNaN(newAspect)) {
      // Get current crop box data before changing aspect ratio
      const currentCropBoxData = cropper.getCropBoxData();

      // Set new aspect ratio
      cropper.setAspectRatio(newAspect);

      // Calculate center point of current crop box
      const centerX = currentCropBoxData.left + currentCropBoxData.width / 2;
      const centerY = currentCropBoxData.top + currentCropBoxData.height / 2;

      // Get new crop box data after aspect ratio change
      const newCropBoxData = cropper.getCropBoxData();

      // Calculate offset to maintain center position
      const offsetX =
        centerX - (newCropBoxData.left + newCropBoxData.width / 2);
      const offsetY =
        centerY - (newCropBoxData.top + newCropBoxData.height / 2);

      // Move crop box to maintain the same center position
      cropper.setCropBoxData({
        left: newCropBoxData.left + offsetX,
        top: newCropBoxData.top + offsetY,
        width: newCropBoxData.width,
        height: newCropBoxData.height,
      });

      // Zoom to the crop area instead of center
      const cropBoxCenter = {
        x: newCropBoxData.left + offsetX + newCropBoxData.width / 2,
        y: newCropBoxData.top + offsetY + newCropBoxData.height / 2,
      };

      cropper.zoomTo(1, cropBoxCenter);
    } else {
      // Reset to free aspect ratio
      cropper.setAspectRatio(NaN);
    }
  }, []);

  useEffect(() => {
    const cropper = cropperRef.current?.cropper;
    if (process.image && cropper && cropperReady) {
      // Set initial aspect ratio and crop box when component mounts
      handleAspectChange(aspect);
    }
  }, [process.image, aspect, handleAspectChange, cropperReady]);

  // Reset positions when aspect changes
  useEffect(() => {
    setFromPosition("");
    setToPosition("");
    // Reset coordinate tracking when aspect changes
    setLastSavedCoordinates(null);
    setCoordinatesChanged(false);
  }, [aspect]);

  // Reset positions when switching between preset and manual mode
  useEffect(() => {
    if (!usePreset) {
      setSelectedPreset("");
    } else {
      setFromPosition("");
      setToPosition("");
    }
  }, [usePreset]);

  // Handler saat crop selesai
  const handleCropEnd = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const data = cropper.getData(true);
      setProcessCrop({
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
      });
    }
  }, [setProcessCrop]);

  // Handler for custom index input change
  const handleIndexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setCustomIndex("");
    } else {
      const num = Number(value);
      if (!isNaN(num) && num > 0) {
        setCustomIndex(num);
      }
    }
  };

  // Merge button handler
  const handleMergeToggle = () => {
    // If autoMergeNext is true, do not allow disabling
    if (autoMergeNext) return;
    setMergeMode((prev) => !prev);
  };

  // ResizeObserver untuk membuat cropper responsif terhadap parent resize
  // Helper type for Cropper with resize/render
  type CropperWithResize = Cropper & {
    resize: () => void;
    render: () => void;
  };

  useEffect(() => {
    if (!containerRef.current || !cropperReady) return;
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    // Fungsi untuk trigger re-render pada cropper
    const handleResize = () => {
      try {
        (cropper as CropperWithResize).resize();
        (cropper as CropperWithResize).render(); // kadang perlu render ulang
      } catch (error) {
        // Ignore errors during resize
        console.debug("Cropper resize error:", error);
      }
    };

    // Buat observer
    const observer = new window.ResizeObserver(() => {
      handleResize();
    });
    observer.observe(containerRef.current);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [process.image?.id, cropperReady]);

  // Gabungkan return
  return (
    <>
      <style jsx>{`
        .pan-background {
          width: 100%;
          height: 100%;
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
          animation: none;
        }

        /* Zoom animations */
        .pan-I {
          animation: pan-I 2s linear infinite normal;
        }
        .pan-O {
          animation: pan-O 2s linear infinite normal;
        }

        /* Vertical animations */
        .pan-B-BM {
          animation: pan-B-BM 1.5s linear infinite normal;
        }
        .pan-B-C {
          animation: pan-B-C 2s linear infinite normal;
        }
        .pan-B-TM {
          animation: pan-B-TM 3s linear infinite normal;
        }
        .pan-B-T {
          animation: pan-B-T 4s linear infinite normal;
        }
        .pan-BM-B {
          animation: pan-BM-B 1.5s linear infinite normal;
        }
        .pan-BM-C {
          animation: pan-BM-C 1.5s linear infinite normal;
        }
        .pan-BM-TM {
          animation: pan-BM-TM 2s linear infinite normal;
        }
        .pan-BM-T {
          animation: pan-BM-T 3s linear infinite normal;
        }
        .pan-C-B {
          animation: pan-C-B 2s linear infinite normal;
        }
        .pan-C-BM {
          animation: pan-C-BM 1.5s linear infinite normal;
        }
        .pan-C-TM {
          animation: pan-C-TM 1.5s linear infinite normal;
        }
        .pan-C-T {
          animation: pan-C-T 2s linear infinite normal;
        }
        .pan-TM-T {
          animation: pan-TM-T 1.5s linear infinite normal;
        }
        .pan-TM-C {
          animation: pan-TM-C 1.5s linear infinite normal;
        }
        .pan-TM-BM {
          animation: pan-TM-BM 2s linear infinite normal;
        }
        .pan-TM-B {
          animation: pan-TM-B 3s linear infinite normal;
        }
        .pan-T-TM {
          animation: pan-T-TM 1.5s linear infinite normal;
        }
        .pan-T-C {
          animation: pan-T-C 2s linear infinite normal;
        }
        .pan-T-BM {
          animation: pan-T-BM 3s linear infinite normal;
        }
        .pan-T-B {
          animation: pan-T-B 4s linear infinite normal;
        }

        /* Horizontal animations with zoom */
        .pan-L-C {
          animation: pan-L-C 2s linear infinite normal;
        }
        .pan-L-R {
          animation: pan-L-R 4s linear infinite normal;
        }
        .pan-C-L {
          animation: pan-C-L 2s linear infinite normal;
        }
        .pan-C-R {
          animation: pan-C-R 2s linear infinite normal;
        }
        .pan-R-C {
          animation: pan-R-C 2s linear infinite normal;
        }
        .pan-R-L {
          animation: pan-R-L 4s linear infinite normal;
        }

        /* Zoom keyframes */
        @keyframes pan-I {
          0% {
            background-position: center center;
            background-size: 100%;
          }
          100% {
            background-position: center center;
            background-size: 120%;
          }
        }
        @keyframes pan-O {
          0% {
            background-position: center center;
            background-size: 120%;
          }
          100% {
            background-position: center center;
            background-size: 100%;
          }
        }

        /* Vertical keyframes */
        @keyframes pan-B-BM {
          0% {
            background-position: center bottom;
            background-size: cover;
          }
          100% {
            background-position: center 75%;
            background-size: cover;
          }
        }
        @keyframes pan-B-C {
          0% {
            background-position: center bottom;
            background-size: cover;
          }
          100% {
            background-position: center center;
            background-size: cover;
          }
        }
        @keyframes pan-B-TM {
          0% {
            background-position: center bottom;
            background-size: cover;
          }
          100% {
            background-position: center 25%;
            background-size: cover;
          }
        }
        @keyframes pan-B-T {
          0% {
            background-position: center bottom;
            background-size: cover;
          }
          100% {
            background-position: center top;
            background-size: cover;
          }
        }
        @keyframes pan-BM-B {
          0% {
            background-position: center 75%;
            background-size: cover;
          }
          100% {
            background-position: center bottom;
            background-size: cover;
          }
        }
        @keyframes pan-BM-C {
          0% {
            background-position: center 75%;
            background-size: cover;
          }
          100% {
            background-position: center center;
            background-size: cover;
          }
        }
        @keyframes pan-BM-TM {
          0% {
            background-position: center 75%;
            background-size: cover;
          }
          100% {
            background-position: center 25%;
            background-size: cover;
          }
        }
        @keyframes pan-BM-T {
          0% {
            background-position: center 75%;
            background-size: cover;
          }
          100% {
            background-position: center top;
            background-size: cover;
          }
        }
        @keyframes pan-C-B {
          0% {
            background-position: center center;
            background-size: cover;
          }
          100% {
            background-position: center bottom;
            background-size: cover;
          }
        }
        @keyframes pan-C-BM {
          0% {
            background-position: center center;
            background-size: cover;
          }
          100% {
            background-position: center 75%;
            background-size: cover;
          }
        }
        @keyframes pan-C-TM {
          0% {
            background-position: center center;
            background-size: cover;
          }
          100% {
            background-position: center 25%;
            background-size: cover;
          }
        }
        @keyframes pan-C-T {
          0% {
            background-position: center center;
            background-size: cover;
          }
          100% {
            background-position: center top;
            background-size: cover;
          }
        }
        @keyframes pan-TM-T {
          0% {
            background-position: center 25%;
            background-size: cover;
          }
          100% {
            background-position: center top;
            background-size: cover;
          }
        }
        @keyframes pan-TM-C {
          0% {
            background-position: center 25%;
            background-size: cover;
          }
          100% {
            background-position: center center;
            background-size: cover;
          }
        }
        @keyframes pan-TM-BM {
          0% {
            background-position: center 25%;
            background-size: cover;
          }
          100% {
            background-position: center 75%;
            background-size: cover;
          }
        }
        @keyframes pan-TM-B {
          0% {
            background-position: center 25%;
            background-size: cover;
          }
          100% {
            background-position: center bottom;
            background-size: cover;
          }
        }
        @keyframes pan-T-TM {
          0% {
            background-position: center top;
            background-size: cover;
          }
          100% {
            background-position: center 25%;
            background-size: cover;
          }
        }
        @keyframes pan-T-C {
          0% {
            background-position: center top;
            background-size: cover;
          }
          100% {
            background-position: center center;
            background-size: cover;
          }
        }
        @keyframes pan-T-BM {
          0% {
            background-position: center top;
            background-size: cover;
          }
          100% {
            background-position: center 75%;
            background-size: cover;
          }
        }
        @keyframes pan-T-B {
          0% {
            background-position: center top;
            background-size: cover;
          }
          100% {
            background-position: center bottom;
            background-size: cover;
          }
        }

        /* Horizontal keyframes with 120% zoom */
        @keyframes pan-L-C {
          0% {
            background-position: left center;
            background-size: 120%;
          }
          100% {
            background-position: center center;
            background-size: 120%;
          }
        }
        @keyframes pan-L-R {
          0% {
            background-position: left center;
            background-size: 120%;
          }
          100% {
            background-position: right center;
            background-size: 120%;
          }
        }
        @keyframes pan-C-L {
          0% {
            background-position: center center;
            background-size: 120%;
          }
          100% {
            background-position: left center;
            background-size: 120%;
          }
        }
        @keyframes pan-C-R {
          0% {
            background-position: center center;
            background-size: 120%;
          }
          100% {
            background-position: right center;
            background-size: 120%;
          }
        }
        @keyframes pan-R-C {
          0% {
            background-position: right center;
            background-size: 120%;
          }
          100% {
            background-position: center center;
            background-size: 120%;
          }
        }
        @keyframes pan-R-L {
          0% {
            background-position: right center;
            background-size: 120%;
          }
          100% {
            background-position: left center;
            background-size: 120%;
          }
        }
      `}</style>

      {!process.image ? (
        <div className="h-full w-full flex-1 flex flex-col items-center justify-center text-center space-y-2">
          <div className="rounded-full bg-muted/50 p-4">
            <Crop className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">
              Tidak ada gambar yang diproses
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Klik gambar untuk mulai potong.
            </p>
          </div>
          <div className="px-3 py-1 bg-muted/30 rounded border border-dashed border-muted-foreground/30">
            <p className="text-xs text-muted-foreground">POTONG & ANIMASI</p>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex flex-col items-center">
          <div
            className="relative flex h-full w-full rounded overflow-hidden container"
            ref={containerRef} // Tambahkan ref di sini
          >
            <Cropper
              src={process.image.src}
              style={{
                height: "100%",
                width: "100%",
              }}
              aspectRatio={aspect}
              viewMode={1}
              background={false}
              responsive={true}
              autoCropArea={1}
              checkOrientation={false}
              ref={cropperRef}
              dragMode="move"
              rotatable={false}
              highlight={false}
              toggleDragModeOnDblclick={false}
              ready={() => setCropperReady(true)}
              cropend={handleCropEnd}
              zoomOnWheel={true}
            />
          </div>

          <div className="p-3 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={isNaN(aspect) ? "default" : "secondary"}
                onClick={() => handleAspectChange(NaN)}
                className="rounded-full"
              >
                <Ratio className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant={aspect === 5 / 4 ? "default" : "secondary"}
                onClick={() => handleAspectChange(5 / 4)}
                className="rounded-full"
              >
                <RectangleHorizontal className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant={aspect === 4 / 5 ? "default" : "secondary"}
                onClick={() => handleAspectChange(4 / 5)}
                className="rounded-full"
              >
                <RectangleVertical className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {displayName}
              </span>
              <Button
                size="icon"
                variant="secondary"
                onClick={handlePreview}
                disabled={!process.cropCoordinates}
                className="rounded-full"
              >
                <Wand2 className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant={mergeMode ? "default" : "secondary"}
                onClick={handleMergeToggle}
                disabled={autoMergeNext || !isNaN(aspect)}
                className="rounded-full"
              >
                <Merge className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleSave}
                disabled={
                  !process.cropCoordinates ||
                  !coordinatesChanged ||
                  outputName === "[ - ]" ||
                  !outputName.includes("-")
                }
                className="rounded-full"
              >
                <Save className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog/Drawer */}
      {isDesktop ? (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pratinjau Animasi</DialogTitle>
              <DialogDescription>
                Lihat pratinjau animasi gambar yang sudah di-crop
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
              {croppedImageUrl && (
                <div
                  className="relative overflow-hidden rounded w-full"
                  style={{
                    aspectRatio: "16/9",
                    maxWidth: "100%",
                  }}
                >
                  <div
                    className={`pan-background ${getAnimationClass()}`}
                    style={{
                      backgroundImage: `url(${croppedImageUrl})`,
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      inset: 0,
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col w-full gap-4 px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    className="w-20 px-3 py-2 border rounded-md text-center text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
                    value={customIndex}
                    onChange={handleIndexInputChange}
                    placeholder={getNextIndex().toString()}
                  />
                </div>
                <div className="flex-1 flex items-center gap-2.5 pt-6">
                  <Checkbox
                    id="use-preset-dialog"
                    checked={usePreset}
                    onCheckedChange={(checked) =>
                      setUsePreset(checked === true)
                    }
                  />
                  <label
                    htmlFor="use-preset-dialog"
                    className="text-sm font-medium leading-none cursor-pointer select-none"
                  >
                    Gunakan Preset
                  </label>
                </div>
              </div>
              {usePreset ? (
                <Select
                  value={selectedPreset}
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Preset Animasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T-B">Atas → Bawah</SelectItem>
                    <SelectItem value="B-T">Bawah → Atas</SelectItem>
                    <SelectItem value="T-C">Atas → Tengah</SelectItem>
                    <SelectItem value="B-C">Bawah → Tengah</SelectItem>
                    <SelectItem value="T-TM">Atas → Atas Tengah</SelectItem>
                    <SelectItem value="T-BM">Atas → Bawah Tengah</SelectItem>
                    <SelectItem value="B-TM">Bawah → Atas Tengah</SelectItem>
                    <SelectItem value="B-BM">Bawah → Bawah Tengah</SelectItem>
                    <SelectItem value="TM-T">Atas Tengah → Atas</SelectItem>
                    <SelectItem value="TM-B">Atas Tengah → Bawah</SelectItem>
                    <SelectItem value="BM-T">Bawah Tengah → Atas</SelectItem>
                    <SelectItem value="BM-B">Bawah Tengah → Bawah</SelectItem>
                    <SelectItem value="L-R">Kiri → Kanan</SelectItem>
                    <SelectItem value="R-L">Kanan → Kiri</SelectItem>
                    <SelectItem value="I">Zoom Dalam</SelectItem>
                    <SelectItem value="O">Zoom Luar</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    value={fromPosition}
                    onValueChange={handleFromPositionChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Dari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T">Atas</SelectItem>
                      <SelectItem value="TM">Atas Tengah</SelectItem>
                      <SelectItem value="C">Tengah</SelectItem>
                      <SelectItem value="BM">Bawah Tengah</SelectItem>
                      <SelectItem value="B">Bawah</SelectItem>
                      <SelectItem value="L">Kiri</SelectItem>
                      <SelectItem value="R">Kanan</SelectItem>
                      <SelectItem value="I">Dalam</SelectItem>
                      <SelectItem value="O">Luar</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">→</span>
                  <Select
                    value={toPosition}
                    onValueChange={handleToPositionChange}
                    disabled={
                      !fromPosition ||
                      fromPosition === "I" ||
                      fromPosition === "O"
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Ke" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* From T */}
                      {fromPosition === "T" && (
                        <>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="B">Bawah</SelectItem>
                        </>
                      )}
                      {/* From TM */}
                      {fromPosition === "TM" && (
                        <>
                          <SelectItem value="T">Atas</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="B">Bawah</SelectItem>
                        </>
                      )}
                      {/* From BM */}
                      {fromPosition === "BM" && (
                        <>
                          <SelectItem value="B">Bawah</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="T">Atas</SelectItem>
                        </>
                      )}
                      {/* From B */}
                      {fromPosition === "B" && (
                        <>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="T">Atas</SelectItem>
                        </>
                      )}
                      {/* Horizontal movements */}
                      {(fromPosition === "L" || fromPosition === "R") && (
                        <>
                          <SelectItem value="C">Tengah</SelectItem>
                          {fromPosition === "L" && (
                            <SelectItem value="R">Kanan</SelectItem>
                          )}
                          {fromPosition === "R" && (
                            <SelectItem value="L">Kiri</SelectItem>
                          )}
                        </>
                      )}
                      {/* Center can go to any direction */}
                      {fromPosition === "C" && (
                        <>
                          <SelectItem value="T">Atas</SelectItem>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="B">Bawah</SelectItem>
                          <SelectItem value="L">Kiri</SelectItem>
                          <SelectItem value="R">Kanan</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showPreview} onOpenChange={setShowPreview}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Pratinjau Animasi</DrawerTitle>
              <DrawerDescription>
                Lihat pratinjau animasi gambar yang sudah di-crop
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex justify-center p-4 pb-4">
              {croppedImageUrl && (
                <div
                  className="relative overflow-hidden bg-black rounded w-full"
                  style={{
                    aspectRatio: "16/9",
                    maxWidth: "100%",
                  }}
                >
                  <div
                    className={`pan-background ${getAnimationClass()}`}
                    style={{
                      backgroundImage: `url(${croppedImageUrl})`,
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      inset: 0,
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col w-full gap-4 px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    className="w-20 px-3 py-2 border rounded-md text-center text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
                    value={customIndex}
                    onChange={handleIndexInputChange}
                    placeholder={getNextIndex().toString()}
                  />
                </div>
                <div className="flex-1 flex items-center gap-2.5 pt-6">
                  <Checkbox
                    id="use-preset-drawer"
                    checked={usePreset}
                    onCheckedChange={(checked) =>
                      setUsePreset(checked === true)
                    }
                  />
                  <label
                    htmlFor="use-preset-drawer"
                    className="text-sm font-medium leading-none cursor-pointer select-none"
                  >
                    Gunakan Preset
                  </label>
                </div>
              </div>
              {usePreset ? (
                <Select
                  value={selectedPreset}
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Preset Animasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T-B">Atas → Bawah</SelectItem>
                    <SelectItem value="B-T">Bawah → Atas</SelectItem>
                    <SelectItem value="T-C">Atas → Tengah</SelectItem>
                    <SelectItem value="B-C">Bawah → Tengah</SelectItem>
                    <SelectItem value="T-TM">Atas → Atas Tengah</SelectItem>
                    <SelectItem value="T-BM">Atas → Bawah Tengah</SelectItem>
                    <SelectItem value="B-TM">Bawah → Atas Tengah</SelectItem>
                    <SelectItem value="B-BM">Bawah → Bawah Tengah</SelectItem>
                    <SelectItem value="TM-T">Atas Tengah → Atas</SelectItem>
                    <SelectItem value="TM-B">Atas Tengah → Bawah</SelectItem>
                    <SelectItem value="BM-T">Bawah Tengah → Atas</SelectItem>
                    <SelectItem value="BM-B">Bawah Tengah → Bawah</SelectItem>
                    <SelectItem value="L-R">Kiri → Kanan</SelectItem>
                    <SelectItem value="R-L">Kanan → Kiri</SelectItem>
                    <SelectItem value="I">Zoom Dalam</SelectItem>
                    <SelectItem value="O">Zoom Luar</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    value={fromPosition}
                    onValueChange={handleFromPositionChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Dari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T">Atas</SelectItem>
                      <SelectItem value="TM">Atas Tengah</SelectItem>
                      <SelectItem value="C">Tengah</SelectItem>
                      <SelectItem value="BM">Bawah Tengah</SelectItem>
                      <SelectItem value="B">Bawah</SelectItem>
                      <SelectItem value="L">Kiri</SelectItem>
                      <SelectItem value="R">Kanan</SelectItem>
                      <SelectItem value="I">Dalam</SelectItem>
                      <SelectItem value="O">Luar</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-muted-foreground">→</span>

                  <Select
                    value={toPosition}
                    onValueChange={handleToPositionChange}
                    disabled={
                      !fromPosition ||
                      fromPosition === "I" ||
                      fromPosition === "O"
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Ke" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* From T */}
                      {fromPosition === "T" && (
                        <>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="B">Bawah</SelectItem>
                        </>
                      )}
                      {/* From TM */}
                      {fromPosition === "TM" && (
                        <>
                          <SelectItem value="T">Atas</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="B">Bawah</SelectItem>
                        </>
                      )}
                      {/* From BM */}
                      {fromPosition === "BM" && (
                        <>
                          <SelectItem value="B">Bawah</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="T">Atas</SelectItem>
                        </>
                      )}
                      {/* From B */}
                      {fromPosition === "B" && (
                        <>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="C">Tengah</SelectItem>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="T">Atas</SelectItem>
                        </>
                      )}

                      {/* Horizontal movements */}
                      {(fromPosition === "L" || fromPosition === "R") && (
                        <>
                          <SelectItem value="C">Tengah</SelectItem>
                          {fromPosition === "L" && (
                            <SelectItem value="R">Kanan</SelectItem>
                          )}
                          {fromPosition === "R" && (
                            <SelectItem value="L">Kiri</SelectItem>
                          )}
                        </>
                      )}

                      {fromPosition === "C" && (
                        <>
                          <SelectItem value="T">Atas</SelectItem>
                          <SelectItem value="TM">Atas Tengah</SelectItem>
                          <SelectItem value="BM">Bawah Tengah</SelectItem>
                          <SelectItem value="B">Bawah</SelectItem>
                          <SelectItem value="L">Kiri</SelectItem>
                          <SelectItem value="R">Kanan</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
