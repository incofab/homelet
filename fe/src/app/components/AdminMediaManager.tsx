import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from './Button';
import { apiDelete, apiPost } from '../lib/api';
import type { Media } from '../lib/models';
import { ImageUploadDropzone } from "./ImageUploadDropzone";

interface AdminMediaManagerProps {
  title: string;
  emptyLabel: string;
  items: Media[];
  uploadPath: string;
  deletePath: (mediaId: number) => string;
  onChanged: () => Promise<void>;
}

export function AdminMediaManager({
  title,
  emptyLabel,
  items,
  uploadPath,
  deletePath,
  onChanged,
}: AdminMediaManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("collection", "images");
        await apiPost(uploadPath, formData);
      }
      await onChanged();
    } catch (uploadError) {
      setError((uploadError as Error).message || "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: number) => {
    const confirmed = window.confirm(
      JSON.stringify(
        {
          action: 'delete_image',
          title,
          media_id: mediaId,
          message: 'This image will be permanently removed.',
        },
        null,
        2,
      ),
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(mediaId);
    setError(null);

    try {
      await apiDelete(deletePath(mediaId));
      await onChanged();
    } catch (deleteError) {
      setError((deleteError as Error).message || 'Unable to delete image.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Upload more images or remove outdated ones.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ImageUploadDropzone
        inputLabel={`${title} upload`}
        title={uploading ? "Uploading images..." : "Click to upload or drag and drop"}
        helperText="PNG, JPG, or WEBP up to 10MB each"
        buttonLabel="Add Image"
        multiple
        disabled={uploading}
        onFilesSelected={handleUpload}
      />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div key={item.id} className="border border-border rounded-lg overflow-hidden">
              <img
                src={item.url}
                alt={`${title} ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              <div className="p-3 flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground truncate">
                  Image #{index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void handleDelete(item.id);
                  }}
                  disabled={deletingId === item.id}
                >
                  <Trash2 size={16} className="mr-2" />
                  {deletingId === item.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
