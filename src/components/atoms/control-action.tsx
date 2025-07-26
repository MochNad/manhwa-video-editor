"use client";

import * as React from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCrop } from "@/hooks/useCrop";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function ControlAction() {
  const [showConfirmClear, setShowConfirmClear] = React.useState(false);
  const { clearAll, inputs, outputs, process } = useCrop();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleClearAll = () => {
    setShowConfirmClear(true);
  };

  const confirmClearAll = () => {
    clearAll();
    setShowConfirmClear(false);
  };

  const hasData =
    inputs.length > 0 || outputs.length > 0 || process.image !== null;

  if (!hasData) return null;

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-center gap-3 z-50">
      <Button
        size="icon"
        onClick={handleClearAll}
        className="rounded-full"
        variant="destructive"
      >
        <Trash className="h-5 w-5" />
      </Button>

      {/* Clear Confirmation Dialog/Drawer */}
      {isDesktop ? (
        <Dialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Semua</DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Trash className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      Ya?
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                size="icon"
                variant="destructive"
                onClick={confirmClearAll}
                className="w-full rounded-full"
              >
                <Trash className="w-5 h-5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showConfirmClear} onOpenChange={setShowConfirmClear}>
          <DrawerContent>
            <DrawerHeader className="text-center">
              <DrawerTitle>Hapus Semua</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Trash className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                    Ya?
                    </span>
                </div>
              </div>
              <Button
                size="icon"
                variant="destructive"
                onClick={confirmClearAll}
                className="w-full rounded-full"
              >
                <Trash className="w-5 h-5" />
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
