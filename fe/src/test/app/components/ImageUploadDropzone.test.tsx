import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageUploadDropzone } from "../../../app/components/ImageUploadDropzone";

describe("ImageUploadDropzone", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens the file picker when the dropzone is clicked", () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");

    render(
      <ImageUploadDropzone
        inputLabel="Upload images"
        title="Click to upload or drag and drop"
        onFilesSelected={() => undefined}
      />,
    );

    fireEvent.click(screen.getByTestId("image-upload-dropzone"));

    expect(clickSpy).toHaveBeenCalled();
  });

  it("passes dropped image files to the selection handler", () => {
    const onFilesSelected = vi.fn();
    const file = new File(["image"], "issue.jpg", { type: "image/jpeg" });

    render(
      <ImageUploadDropzone
        inputLabel="Upload images"
        title="Click to upload or drag and drop"
        onFilesSelected={onFilesSelected}
        multiple
      />,
    );

    fireEvent.drop(screen.getByTestId("image-upload-dropzone"), {
      dataTransfer: {
        files: [file],
      },
    });

    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });
});
