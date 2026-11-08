import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useImageUpload } from "./useImageUpload";

interface Props {
  onUploaded?: (url: string, publicId: string) => void;
}

export function ImageUploader({ onUploaded }: Props) {
  const { status, progress, result, error, upload, reset } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Chỉ hỗ trợ ảnh hoặc video.");
      return;
    }
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }
    const uploaded = await upload(file);
    if (uploaded) {
      onUploaded?.(uploaded.secureUrl, uploaded.publicId);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={styles.wrapper}>
      {status === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            ...styles.dropzone,
            borderColor: isDragging ? "#3182ce" : "#cbd5e0",
            background: isDragging ? "#ebf8ff" : "#f7fafc",
          }}
        >
          <Upload size={32} color="#3182ce" />
          <p style={styles.dropTitle}>
            Kéo thả file vào đây hoặc click để chọn
          </p>
          <p style={styles.dropHint}>
            Ảnh (JPG/PNG/WebP/GIF) hoặc video, tối đa 10MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </div>
      )}

      {(status === "signing" || status === "uploading") && (
        <div style={styles.progressBox}>
          {previewUrl ? (
            <img src={previewUrl} alt="preview" style={styles.preview} />
          ) : (
            <div style={styles.previewPlaceholder}>
              <ImageIcon size={32} color="#a0aec0" />
            </div>
          )}
          <div style={styles.progressInfo}>
            <p style={styles.progressLabel}>
              {status === "signing"
                ? "Đang lấy chữ ký..."
                : `Đang tải lên ${progress}%`}
            </p>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${status === "signing" ? 5 : progress}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {status === "success" && result && (
        <div style={styles.successBox}>
          <img src={result.secureUrl} alt="uploaded" style={styles.preview} />
          <div style={styles.successInfo}>
            <div style={styles.successHeader}>
              <CheckCircle size={18} color="#38a169" />
              <span style={styles.successTitle}>Upload thành công!</span>
            </div>
            <p style={styles.meta}>
              <strong>Public ID:</strong>{" "}
              <code style={styles.code}>{result.publicId}</code>
            </p>
            <p style={styles.meta}>
              <strong>Kích thước:</strong> {(result.bytes / 1024).toFixed(0)} KB
              {result.width &&
                result.height &&
                ` · ${result.width}×${result.height}`}
            </p>
            <a
              href={result.secureUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Mở ảnh trong tab mới →
            </a>
            <button onClick={handleReset} style={styles.resetBtn}>
              <X size={14} /> Upload file khác
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={styles.errorBox}>
          <div style={styles.errorHeader}>
            <AlertCircle size={18} color="#e53e3e" />
            <span style={styles.errorTitle}>Upload thất bại</span>
          </div>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={handleReset} style={styles.resetBtn}>
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { width: "100%" } as const,
  dropzone: {
    border: "2px dashed",
    borderRadius: "12px",
    padding: "2.5rem 1.5rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  } as const,
  dropTitle: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "#2d3748",
  } as const,
  dropHint: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#718096",
  } as const,
  progressBox: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    padding: "1rem",
    background: "#f7fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  } as const,
  preview: {
    width: 96,
    height: 96,
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  } as const,
  previewPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: "8px",
    background: "#edf2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as const,
  progressInfo: { flex: 1, minWidth: 0 } as const,
  progressLabel: {
    margin: "0 0 0.5rem",
    fontSize: "0.9rem",
    color: "#4a5568",
    fontWeight: 500,
  } as const,
  progressBarBg: {
    height: 8,
    background: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  } as const,
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3182ce, #4299e1)",
    borderRadius: 4,
    transition: "width 0.2s",
  } as const,
  successBox: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    background: "#f0fff4",
    border: "1px solid #c6f6d5",
    borderRadius: "12px",
    alignItems: "flex-start",
  } as const,
  successInfo: { flex: 1, minWidth: 0 } as const,
  successHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginBottom: "0.5rem",
  } as const,
  successTitle: {
    fontWeight: 600,
    color: "#2f855a",
    fontSize: "0.95rem",
  } as const,
  meta: {
    margin: "0.25rem 0",
    fontSize: "0.82rem",
    color: "#4a5568",
    wordBreak: "break-all",
  } as const,
  code: {
    background: "#edf2f7",
    padding: "0.1rem 0.35rem",
    borderRadius: 4,
    fontSize: "0.78rem",
    fontFamily: "monospace",
  } as const,
  link: {
    display: "inline-block",
    marginTop: "0.5rem",
    color: "#3182ce",
    fontSize: "0.85rem",
    textDecoration: "underline",
  } as const,
  resetBtn: {
    marginTop: "0.75rem",
    padding: "0.4rem 0.75rem",
    fontSize: "0.82rem",
    background: "white",
    color: "#4a5568",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  } as const,
  errorBox: {
    padding: "1rem",
    background: "#fff5f5",
    border: "1px solid #fed7d7",
    borderRadius: "12px",
  } as const,
  errorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginBottom: "0.5rem",
  } as const,
  errorTitle: {
    fontWeight: 600,
    color: "#c53030",
    fontSize: "0.95rem",
  } as const,
  errorMessage: {
    margin: "0 0 0.5rem",
    fontSize: "0.85rem",
    color: "#742a2a",
  } as const,
};
