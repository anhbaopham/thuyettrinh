import { useState, useCallback } from "react";
import {
  uploadToCloudinary,
  type UploadResult,
} from "../../lib/uploadToCloudinary";

export type UploadStatus =
  | "idle"
  | "signing"
  | "uploading"
  | "success"
  | "error";

export interface UploadState {
  status: UploadStatus;
  progress: number;
  result: UploadResult | null;
  error: string | null;
}

const initialState: UploadState = {
  status: "idle",
  progress: 0,
  result: null,
  error: null,
};

export function useImageUpload() {
  const [state, setState] = useState<UploadState>(initialState);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setState({ status: "signing", progress: 0, result: null, error: null });

      try {
        setState((s) => ({ ...s, status: "uploading" }));
        const result = await uploadToCloudinary(file, (pct) =>
          setState((s) => ({ ...s, progress: pct })),
        );
        setState({ status: "success", progress: 100, result, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload thất bại";
        setState({
          status: "error",
          progress: 0,
          result: null,
          error: message,
        });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, upload, reset };
}
