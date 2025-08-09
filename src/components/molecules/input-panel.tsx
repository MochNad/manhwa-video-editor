import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
import { useCrop } from "@/hooks/useCrop";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Upload, Check, Trash2 } from "lucide-react"; // tambahkan Trash2
import Image from "next/image";
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DropZone } from "@/components/atoms/drop-zone";

function InputPanelContent() {
  const { inputs, setProcessImage, process, addInput, removeInput } = useCrop(); // tambahkan removeInput
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showUpload, setShowUpload] = useState(false);

  const handleImageClick = (image: {
    id: string;
    src: string;
    name: string;
    file: File;
  }) => {
    // Toggle aktif/nonaktif saat gambar diklik
    if (process.image?.id === image.id) {
      setProcessImage(null);
    } else {
      setProcessImage(image);
    }
  };

  const handleUploadClick = () => {
    setShowUpload(true);
  };

  const handleFileDrop = (files: File[]) => {
    files.forEach((file) => {
      const imageData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        src: URL.createObjectURL(file),
        name: file.name,
        file: file,
      };
      addInput(imageData);
    });
    setShowUpload(false);
  };

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-medium text-foreground">
          Masuk ({inputs.length})
        </h3>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleUploadClick}
          className="rounded-full"
        >
          <Upload className="w-5 h-5" />
        </Button>
      </div>
      {inputs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 min-h-0">
          <div className="rounded-full bg-muted/50 p-4">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">
              Tidak ada gambar yang dimasukkan
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Klik unggah untuk memasukkan gambar.
            </p>
          </div>
          <div className="px-3 py-1 bg-muted/30 rounded border border-dashed border-muted-foreground/30">
            <p className="text-xs text-muted-foreground">PNG, JPG, JPEG</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 w-full h-full min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {inputs
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((image) => (
                <div
                  key={image.id}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`relative w-full aspect-[4/3] border-2 rounded overflow-hidden bg-muted transition-all ${
                      process.image?.id === image.id
                        ? "border-primary ring-2 ring-primary/50 shadow-lg"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => handleImageClick(image)}
                    style={{ cursor: "pointer" }}
                  >
                    <Image
                      src={image.src}
                      alt={image.name}
                      width={200}
                      height={100}
                      className={`w-full h-full object-cover transition-all ${
                        process.image?.id === image.id
                          ? "opacity-70 scale-95"
                          : "hover:opacity-80 hover:blur-[1px]"
                      }`}
                    />

                    {/* Enhanced active indicator */}
                    {process.image?.id === image.id && (
                      <>
                        {/* Stronger overlay for active image */}
                        <div className="absolute inset-0 bg-primary/20" />

                        {/* Enhanced check indicator */}
                        <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                          <Check className="w-5 h-5 text-primary-foreground stroke-[3]" />
                        </div>

                        {/* Active badge */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg">
                          Aktif
                        </div>
                      </>
                    )}

                    {/* Overlay trash button on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <div className="absolute inset-0 bg-background/20 backdrop-blur-[0.5px]" />
                      {/* Sembunyikan tombol hapus jika gambar aktif */}
                      {process.image?.id !== image.id && (
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeInput(image.id);
                          }}
                          className="rounded-full relative z-10"
                          style={{ cursor: "pointer" }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Image info */}
                  <div className="w-full text-center space-y-1">
                    <Badge
                      variant={
                        process.image?.id === image.id ? "default" : "secondary"
                      }
                      className="text-xs px-2 py-0.5 rounded-full"
                    >
                      {image.name}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      )}

      {/* Upload Dialog/Drawer */}
      {isDesktop ? (
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unggah Gambar</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <DropZone onDrop={handleFileDrop} accept=".jpg,.png,.jpeg" />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showUpload} onOpenChange={setShowUpload}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Unggah Gambar</DrawerTitle>
            </DrawerHeader>
            <div className="relative p-4">
              <DropZone onDrop={handleFileDrop} accept=".jpg,.png,.jpeg" />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

export default function InputPanel() {
  return (
    <DndProvider backend={HTML5Backend}>
      <InputPanelContent />
    </DndProvider>
  );
}
