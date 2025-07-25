"use client";

import * as React from "react";
import { Menu, Home, Pen, Crop, Subtitles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ControlPage() {
  const [isOpen, setIsOpen] = React.useState(true);

  const toggleControl = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed top-8 left-8 flex flex-col items-center gap-3 z-50">
      <Button
        size="icon"
        onClick={toggleControl}
        className={`rounded-full transition-all duration-500 ease-in-out ${
          isOpen ? "rotate-45" : "rotate-0"
        }`}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-col gap-3">
        <div
          className={`transition-all duration-100 ${
            isOpen
              ? "opacity-100 translate-y-0 delay-100"
              : "opacity-0 -translate-y-8 pointer-events-none"
          }`}
        >
          <Link href="/">
            <Button size="icon" variant="secondary" className="rounded-full">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div
          className={`transition-all duration-150 ${
            isOpen
              ? "opacity-100 translate-y-0 delay-150"
              : "opacity-0 -translate-y-8 pointer-events-none"
          }`}
        >
          <Link href="/generate-narration">
            <Button size="icon" variant="secondary" className="rounded-full">
              <Pen className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div
          className={`transition-all duration-200 ${
            isOpen
              ? "opacity-100 translate-y-0 delay-200"
              : "opacity-0 -translate-y-8 pointer-events-none"
          }`}
        >
          <Link href="/crop-image">
            <Button size="icon" variant="secondary" className="rounded-full">
              <Crop className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div
          className={`transition-all duration-250 ${
            isOpen
              ? "opacity-100 translate-y-0 delay-250"
              : "opacity-0 -translate-y-8 pointer-events-none"
          }`}
        >
          <Link href="/sync-subtitle">
            <Button size="icon" variant="secondary" className="rounded-full">
              <Subtitles className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div
          className={`transition-all duration-300 ${
            isOpen
              ? "opacity-100 translate-y-0 delay-300"
              : "opacity-0 -translate-y-8 pointer-events-none"
          }`}
        >
          <Link href="/render-video">
            <Button size="icon" variant="secondary" className="rounded-full">
              <Video className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
