"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";

type DropZoneProps = {
  onDrop: (files: File[]) => void;
  accept?: string; // contoh: ".jpg,.png,.jpeg"
};

export function DropZone({ onDrop, accept }: DropZoneProps) {
  const dropRef = React.useRef<HTMLDivElement>(null);

  // Fungsi untuk filter file sesuai ekstensi
  const filterFiles = (files: File[]) => {
    if (!accept) return files;
    const acceptList = accept
      .split(",")
      .map((ext) => ext.trim().toLowerCase())
      .filter(Boolean);
    return files.filter((file) => {
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
      return acceptList.includes(fileExt);
    });
  };

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: [NativeTypes.FILE],
    drop: (item: { files: File[] }) => {
      if (item.files && item.files.length > 0) {
        const filtered = filterFiles(item.files);
        if (filtered.length > 0) {
          onDrop(filtered);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = canDrop && isOver;

  // Gabungkan ref drop dan dropRef
  React.useEffect(() => {
    if (dropRef.current) {
      drop(dropRef.current);
    }
  }, [drop]);

  return (
    <div
      ref={dropRef}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${
          isActive
            ? "border-blue-500 bg-blue-50"
            : canDrop
            ? "border-gray-400 bg-gray-50"
            : "border-gray-300"
        }
      `}
    >
      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p className="text-lg mb-2">
        {isActive ? "Letakkan file di sini!" : "Seret dan jatuhkan file di sini"}
      </p>
      <p className="text-sm text-gray-500">atau klik untuk memilih file</p>
      <input
        type="file"
        multiple
        accept={accept}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => {
          let files = Array.from(e.target.files || []);
          files = filterFiles(files);
          if (files.length > 0) {
            onDrop(files);
          }
        }}
      />
    </div>
  );
}
