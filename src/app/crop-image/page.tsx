"use client";

import { useState, useRef, useEffect } from "react";
import InputPanel from "@/components/molecules/input-panel";
import OutputPanel from "@/components/molecules/output-panel";
import ProcessPanel from "@/components/molecules/process-panel";
import { useCrop } from "@/hooks/useCrop";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ControlAction } from "@/components/atoms/control-action";

const MAX_TITLE_LENGTH = 10;

export default function CropImage() {
  const { title: globalTitle, setTitle } = useCrop();
  const [localTitle, setLocalTitle] = useState(globalTitle || "chapter");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevTitleRef = useRef(localTitle);

  // Sync local title with global title
  useEffect(() => {
    if (globalTitle) {
      setLocalTitle(globalTitle);
    }
  }, [globalTitle]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleInputBlur = () => {
    if (localTitle.trim() === "") {
      setLocalTitle(prevTitleRef.current);
    } else {
      setTitle(localTitle);
    }
    setEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      if (localTitle.trim() === "") {
        setLocalTitle(prevTitleRef.current);
      } else {
        setTitle(localTitle);
      }
      setEditing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= MAX_TITLE_LENGTH) {
      setLocalTitle(e.target.value);
    }
  };

  const handleTitleClick = () => {
    prevTitleRef.current = localTitle;
    setEditing(true);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <nav className="flex items-center justify-center px-4 py-2 relative">
        <div className="flex flex-col items-center">
          <div className="flex items-center relative">
            {editing ? (
              <input
                ref={inputRef}
                className="text-base font-medium tracking-wide outline-none border-none bg-transparent text-center w-32"
                value={localTitle}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_TITLE_LENGTH}
              />
            ) : (
              <span
                className="text-base font-medium tracking-wide select-text cursor-pointer outline-none border-none bg-transparent"
                tabIndex={0}
                onClick={handleTitleClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditing(true);
                }}
                title={localTitle}
              >
                {localTitle}
              </span>
            )}
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="flex-1">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70} minSize={50} maxSize={80}>
            <ProcessPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50} minSize={40} maxSize={60}>
                <InputPanel />
              </ResizablePanel>
              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={40} maxSize={60}>
                <OutputPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <ControlAction />
    </div>
  );
}
