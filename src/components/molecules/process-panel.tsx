import React, { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
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
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [customIndex, setCustomIndex] = useState<number | "">("");
  const cropperRef = useRef<ReactCropperElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Tambahkan ref untuk container

  // Reset crop when image changes & update cropper jika aspect berubah atau gambar baru
  useEffect(() => {
    setOutputName("[ - ]");
    setCroppedImageUrl(null);
    handleAspectChange(aspect);
  }, [process.image?.id, aspect]);

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

  useEffect(() => {
    if (process.cropCoordinates) {
      createCroppedImage();
    }
  }, [createCroppedImage, process.cropCoordinates]);

  // Update output name when positions change
  useEffect(() => {
    // Only update animation name if aspect ratio is set (not free ratio)
    if (!isNaN(aspect)) {
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
    } else {
      // For free ratio, just use empty brackets
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
  const handlePreview = useCallback(() => {
    if (process.cropCoordinates) {
      setShowPreview(true);
    }
  }, [process.cropCoordinates]);

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
  const displayName = isNaN(aspect)
    ? `[${displayIndex}]`
    : `[${displayIndex}]${outputName}`;

  const handleSave = async () => {
    if (process.image && process.cropCoordinates) {
      // Check save conditions based on aspect ratio
      const canSave = isNaN(aspect) || outputName !== "[ - ]";

      if (!canSave) return;

      // Create the cropped image
      const croppedImageDataUrl = await createCroppedImage();

      if (!croppedImageDataUrl) return;

      // Create a blob for download
      const response = await fetch(croppedImageDataUrl);
      const blob = await response.blob();

      // Use the displayName format that includes the index
      const finalOutputName = isNaN(aspect)
        ? `[${displayIndex}]`
        : `[${displayIndex}]${outputName}`;

      addOutput({
        id: Date.now().toString(),
        image: process.image,
        cropCoordinates: process.cropCoordinates,
        outputName: finalOutputName,
        croppedImageUrl: croppedImageDataUrl,
        croppedBlob: blob,
      });

      setOutputName("[ - ]");
      setFromPosition("");
      setToPosition("");
      setCustomIndex(""); // reset index ke auto
    }
  };

  const handleFromPositionChange = (value: string) => {
    setFromPosition(value);
    // Reset toPosition when fromPosition changes to avoid invalid combinations
    setToPosition("");
  };

  const handleToPositionChange = (value: string) => {
    setToPosition(value);
  };

  const handleAspectChange = (newAspect: number) => {
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
  };

  useEffect(() => {
    if (process.image) {
      // Set initial aspect ratio and crop box when component mounts
      handleAspectChange(aspect);
    }
  }, [process.image, aspect]);

  // Reset positions when aspect changes
  useEffect(() => {
    setFromPosition("");
    setToPosition("");
  }, [aspect]);

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

  // ResizeObserver untuk membuat cropper responsif terhadap parent resize
  // Helper type for Cropper with resize/render
  type CropperWithResize = Cropper & {
    resize: () => void;
    render: () => void;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    // Fungsi untuk trigger re-render pada cropper
    const handleResize = () => {
      (cropper as CropperWithResize).resize();
      (cropper as CropperWithResize).render(); // kadang perlu render ulang
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
  }, [process.image?.id]);

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
        .pan-B-C {
          animation: pan-B-C 2s linear infinite normal;
        }
        .pan-B-T {
          animation: pan-B-T 4s linear infinite normal;
        }
        .pan-C-T {
          animation: pan-C-T 2s linear infinite normal;
        }
        .pan-C-B {
          animation: pan-C-B 2s linear infinite normal;
        }
        .pan-T-C {
          animation: pan-T-C 2s linear infinite normal;
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
              {!isNaN(aspect) && (
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={!process.cropCoordinates}
                  className="rounded-full"
                >
                  <Wand2 className="w-5 h-5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="secondary"
                onClick={handleSave}
                disabled={
                  !process.cropCoordinates ||
                  (!isNaN(aspect) && outputName === "[ - ]")
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
            <div className="flex w-full items-center justify-center gap-4 px-4 pb-4">
              <input
                type="number"
                min={1}
                max={999}
                className="w-16 min-w-0 max-w-[80px] px-2 py-1 border rounded text-center text-sm bg-background"
                value={customIndex}
                onChange={handleIndexInputChange}
                placeholder={getNextIndex().toString()}
              />
              <Select
                value={fromPosition}
                onValueChange={handleFromPositionChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Dari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T">Atas</SelectItem>
                  <SelectItem value="C">Tengah</SelectItem>
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
                  !fromPosition || fromPosition === "I" || fromPosition === "O"
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Ke" />
                </SelectTrigger>
                <SelectContent>
                  {/* Vertical movements */}
                  {(fromPosition === "T" ||
                    fromPosition === "C" ||
                    fromPosition === "B") && (
                    <>
                      {fromPosition !== "T" && (
                        <SelectItem value="T">Atas</SelectItem>
                      )}
                      {fromPosition !== "C" && (
                        <SelectItem value="C">Tengah</SelectItem>
                      )}
                      {fromPosition !== "B" && (
                        <SelectItem value="B">Bawah</SelectItem>
                      )}
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
                  {/* Special case for C (center) - can go to any direction except same */}
                  {fromPosition === "C" && (
                    <>
                      <SelectItem value="T">Atas</SelectItem>
                      <SelectItem value="B">Bawah</SelectItem>
                      <SelectItem value="L">Kiri</SelectItem>
                      <SelectItem value="R">Kanan</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showPreview} onOpenChange={setShowPreview}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Pratinjau Animasi</DrawerTitle>
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
            <div className="flex w-full items-center justify-center gap-4 px-4">
              <input
                type="number"
                min={1}
                max={999}
                className="w-16 min-w-0 max-w-[80px] px-2 py-1 border rounded text-center text-sm bg-background"
                value={customIndex}
                onChange={handleIndexInputChange}
                placeholder={getNextIndex().toString()}
              />
              <Select
                value={fromPosition}
                onValueChange={handleFromPositionChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Dari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T">Atas</SelectItem>
                  <SelectItem value="C">Tengah</SelectItem>
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
                  !fromPosition || fromPosition === "I" || fromPosition === "O"
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Ke" />
                </SelectTrigger>
                <SelectContent>
                  {(fromPosition === "T" ||
                    fromPosition === "C" ||
                    fromPosition === "B") && (
                    <>
                      {fromPosition !== "T" && (
                        <SelectItem value="T">Atas</SelectItem>
                      )}
                      {fromPosition !== "C" && (
                        <SelectItem value="C">Tengah</SelectItem>
                      )}
                      {fromPosition !== "B" && (
                        <SelectItem value="B">Bawah</SelectItem>
                      )}
                    </>
                  )}

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
                      <SelectItem value="B">Bawah</SelectItem>
                      <SelectItem value="L">Kiri</SelectItem>
                      <SelectItem value="R">Kanan</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
