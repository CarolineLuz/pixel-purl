import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImagePicker } from "./ImagePicker";

const imageFile = new File(["x"], "cat.png", { type: "image/png" });

describe("ImagePicker", () => {
  it("shows 'No file chosen' before anything is picked", () => {
    render(<ImagePicker hasImage={false} onImageChange={() => {}} />);
    expect(screen.getByText("No file chosen")).toBeInTheDocument();
  });

  it("shows the picked filename and forwards the file", () => {
    const onImageChange = vi.fn();
    render(<ImagePicker hasImage={false} onImageChange={onImageChange} />);
    const input = document.getElementById("image") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [imageFile] } });
    expect(onImageChange).toHaveBeenCalledWith(imageFile);
    expect(screen.getByText("cat.png")).toBeInTheDocument();
  });

  it("hides the remove button until an image is loaded", () => {
    const { rerender } = render(<ImagePicker hasImage={false} onImageChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /remove image/i })).not.toBeInTheDocument();
    rerender(<ImagePicker hasImage onImageChange={() => {}} />);
    expect(screen.getByRole("button", { name: /remove image/i })).toBeInTheDocument();
  });

  it("removes the image, clears the name and resets the input", () => {
    const onImageChange = vi.fn();
    render(<ImagePicker hasImage onImageChange={onImageChange} />);
    const input = document.getElementById("image") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [imageFile] } });
    onImageChange.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /remove image/i }));
    expect(onImageChange).toHaveBeenCalledWith(null);
    expect(screen.getByText("No file chosen")).toBeInTheDocument();
    expect(input.value).toBe("");
  });
});
