import { Pen } from "lucide-react";

export default function GenerateNarration() {
  return (
    <div className="min-h-screen h-full w-full flex-1 flex flex-col items-center justify-center text-center space-y-2">
      <div className="rounded-full bg-muted/50 p-4">
        <Pen className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">Halaman Pembuatan Narasi</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Dalam pengembangan 🍜.
        </p>
      </div>
      <div className="px-3 py-1 bg-muted/30 rounded border border-dashed border-muted-foreground/30">
        <p className="text-xs text-muted-foreground">/generate-narration</p>
      </div>
    </div>
  );
}