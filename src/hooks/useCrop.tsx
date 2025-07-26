"use client";

import { useState, useEffect } from "react";
import {
  ImageData,
  CropCoordinates,
  ProcessData,
  OutputData,
} from "@/types/crop";

const state = {
  title: "chapter",
  inputs: [] as ImageData[],
  process: {
    image: null,
    cropCoordinates: null,
    currentIndex: null,
  } as ProcessData,
  outputs: [] as OutputData[],
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());
const update = (newState: Partial<typeof state>) => {
  Object.assign(state, newState);
  notify();
};

export function useCrop() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const downloadOutput = (output: OutputData) => {
    if (output.croppedBlob) {
      const url = URL.createObjectURL(output.croppedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${output.outputName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return {
    ...state,
    setTitle: (title: string) => update({ title }),
    addInput: (imageData: ImageData) =>
      update({ inputs: [...state.inputs, imageData] }),
    removeInput: (id: string) =>
      update({ inputs: state.inputs.filter((item) => item.id !== id) }),
    setProcessImage: (image: ImageData | null) => {
      if (!image) {
        update({
          process: {
            image: null,
            cropCoordinates: null,
            currentIndex: null,
          },
        });
        return;
      }
      const currentIndex =
        state.inputs.findIndex((item) => item.id === image.id) + 1;
      update({
        process: {
          ...state.process,
          image,
          currentIndex,
          cropCoordinates: null,
        },
      });
    },
    setProcessCrop: (cropCoordinates: CropCoordinates) =>
      update({ process: { ...state.process, cropCoordinates } }),
    addOutput: (outputData: Omit<OutputData, "processedAt">) => {
      update({
        outputs: [
          ...state.outputs,
          {
            ...outputData,
            processedAt: new Date(),
          },
        ],
      });
    },
    removeOutput: (id: string) =>
      update({ outputs: state.outputs.filter((item) => item.id !== id) }),
    downloadOutput,
    clearAll: () =>
      update({
        title: "",
        inputs: [],
        process: { image: null, cropCoordinates: null, currentIndex: null },
        outputs: [],
      }),
  };
}
