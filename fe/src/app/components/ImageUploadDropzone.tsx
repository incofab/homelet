import { Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

interface ImageUploadDropzoneProps {
  accept?: string;
  buttonLabel?: string;
  disabled?: boolean;
  helperText?: string;
  inputLabel: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void | Promise<void>;
  selectedFiles?: File[];
  title: string;
}

export function ImageUploadDropzone({
  accept = "image/png,image/jpeg,image/webp",
  buttonLabel = "Choose images",
  disabled = false,
  helperText = "PNG, JPG, or WEBP up to 10MB each",
  inputLabel,
  multiple = false,
  onFilesSelected,
  selectedFiles = [],
  title,
}: ImageUploadDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | File[] | null) => {
    if (disabled || !files) {
      return;
    }

    const nextFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (nextFiles.length === 0) {
      return;
    }

    void onFilesSelected(nextFiles);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        aria-label={inputLabel}
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={buttonLabel}
        aria-disabled={disabled}
        data-testid="image-upload-dropzone"
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          disabled
            ? "cursor-not-allowed border-border/70 opacity-60"
            : isDragging
              ? "cursor-pointer border-primary bg-primary/5"
              : "cursor-pointer border-border hover:border-primary"
        }`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            event.dataTransfer.dropEffect = "copy";
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
          }
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <Upload size={40} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
        <p className="mt-4 text-sm text-primary">{buttonLabel}</p>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
          <p className="text-sm text-foreground">
            {selectedFiles.length} image{selectedFiles.length === 1 ? "" : "s"} selected
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedFiles.map((file) => file.name).join(", ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
