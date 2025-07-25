import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
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
import { Save, Wand2, Crop, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { useCrop } from "@/hooks/useCrop";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function ProcessPanel() {
  const { process, setProcessCrop, addOutput, outputs } = useCrop();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(5 / 4);
  const [outputName, setOutputName] = useState("[ - ]");
  const [showPreview, setShowPreview] = useState(false);
  const [fromPosition, setFromPosition] = useState("");
  const [toPosition, setToPosition] = useState("");
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  // Reset crop when image changes
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setOutputName("[ - ]");
    setCroppedImageUrl(null);
  }, [process.image?.id]);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropComplete = useCallback(
    (
      croppedArea: { x: number; y: number; width: number; height: number },
      croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    ) => {
      setProcessCrop(croppedAreaPixels);
    },
    [setProcessCrop]
  );

  // Create cropped image when crop coordinates change
  const createCroppedImage = useCallback(async () => {
    if (!process.image || !process.cropCoordinates) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();

    return new Promise<string>((resolve) => {
      img.onload = () => {
        const { x, y, width, height } = process.cropCoordinates!;
        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, x, y, width, height, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/png", 1.0);
        setCroppedImageUrl(dataUrl);
        resolve(dataUrl);
      };

      img.src = process.image!.src;
    });
  }, [process.image, process.cropCoordinates]);

  useEffect(() => {
    if (process.cropCoordinates) {
      createCroppedImage();
    }
  }, [createCroppedImage, process.cropCoordinates]);

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
  }, [fromPosition, toPosition]);

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

  const handleSave = async () => {
    if (process.image && process.cropCoordinates && outputName !== "[ - ]") {
      // Create the cropped image
      const croppedImageDataUrl = await createCroppedImage();

      if (!croppedImageDataUrl) return;

      // Create a blob for download
      const response = await fetch(croppedImageDataUrl);
      const blob = await response.blob();

      // Use the displayName format that includes the index
      const finalOutputName = `[${outputs.length + 1}]${outputName}`;

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
    }
  };

  const displayName = `[${outputs.length + 1}]${outputName}`;

  const handleFromPositionChange = (value: string) => {
    setFromPosition(value);
    // Reset toPosition when fromPosition changes to avoid invalid combinations
    setToPosition("");
  };

  const handleToPositionChange = (value: string) => {
    setToPosition(value);
  };

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
          <div className="container relative flex flex-1 w-full max-w-xs mx-auto rounded overflow-hidden">
            <Cropper
              image={process.image.src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
              objectFit="cover"
            />
          </div>

          <div className="p-3 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={aspect === 5 / 4 ? "default" : "secondary"}
                onClick={() => setAspect(5 / 4)}
                className="rounded-full"
              >
                <RectangleHorizontal className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant={aspect === 4 / 5 ? "default" : "secondary"}
                onClick={() => setAspect(4 / 5)}
                className="rounded-full"
              >
                <RectangleVertical className="w-5 h-5" />
              </Button>
            </div>

            <span className="text-sm text-muted-foreground">{displayName}</span>

            <div className="flex items-center gap-2">
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
                variant="secondary"
                onClick={handleSave}
                disabled={!process.cropCoordinates || outputName === "[ - ]"}
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
          <DialogContent className="max-w-lg">
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
