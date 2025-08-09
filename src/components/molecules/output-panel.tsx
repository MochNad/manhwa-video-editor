import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Image as ImageIcon } from "lucide-react";
import { useCrop } from "@/hooks/useCrop";
import JSZip from "jszip";
import Image from "next/image"; // tambahkan import Image

export default function OutputPanel({}: object = {}) {
  const { outputs, removeOutput, downloadOutput, title: cropTitle } = useCrop();

  const handleDownloadAll = async () => {
    if (outputs.length === 0) return;

    const zip = new JSZip();

    for (const output of outputs) {
      if (output.croppedBlob) {
        zip.file(`${output.outputName}.png`, output.croppedBlob);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cropTitle}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-medium text-foreground">
          Keluar ({outputs.length})
        </h3>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleDownloadAll}
          className="rounded-full"
          disabled={outputs.length === 0}
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>
      {outputs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 min-h-0">
          <div className="rounded-full bg-muted/50 p-4">
            <Download className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground">
              Tidak ada gambar yang dikeluarkan
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Klik simpan untuk mengeluarkan gambar.
            </p>
          </div>
          <div className="px-3 py-1 bg-muted/30 rounded border border-dashed border-muted-foreground/30">
            <p className="text-xs text-muted-foreground">UNDUH / HAPUS</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 w-full h-full min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
            {outputs
              .sort((a, b) => {
                // Custom sorting for pattern like [1], [2][T-B], [1][B-T]
                const parseOutputName = (name: string) => {
                  // Match pattern: [number][optional-animation]
                  const match = name.match(/^\[(\d+)\](.*)$/);
                  if (match) {
                    const index = parseInt(match[1], 10);
                    const animation = match[2] || ""; // empty string if no animation
                    return { index, animation };
                  }
                  return { index: 0, animation: name };
                };

                const a_parsed = parseOutputName(a.outputName);
                const b_parsed = parseOutputName(b.outputName);

                // First sort by numeric index
                if (a_parsed.index !== b_parsed.index) {
                  return a_parsed.index - b_parsed.index;
                }

                // If same index, sort by animation suffix alphabetically
                return a_parsed.animation.localeCompare(b_parsed.animation);
              })
              .map((output) => (
                <div
                  key={`${output.id}-${outputs.length}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="relative w-full aspect-[4/3] border rounded overflow-hidden">
                    {output.croppedImageUrl ? (
                      <Image
                        src={output.croppedImageUrl}
                        alt={output.outputName}
                        width={200}
                        height={100}
                        className="w-full h-full object-cover transition-all group-hover:blur-[1px]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Overlay buttons */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {/* Transparent overlay when hovering */}
                      <div className="absolute inset-0 bg-background/20 backdrop-blur-[0.5px]" />

                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => downloadOutput(output)}
                        className="rounded-full relative z-10"
                        style={{ cursor: "pointer" }}
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeOutput(output.id)}
                        className="rounded-full relative z-10"
                        style={{ cursor: "pointer" }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 rounded-full"
                  >
                    {output.outputName}
                  </Badge>
                  <div className="w-full text-center space-y-1"></div>
                </div>
              ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}