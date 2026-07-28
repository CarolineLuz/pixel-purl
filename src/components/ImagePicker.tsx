import { useRef, useState, type ChangeEvent } from "react";
import { ACCEPTED_IMAGE_TYPES } from "../config/editor";
import { control, controlLabel } from "../styles/ui";

interface ImagePickerProps {
  hasImage: boolean;
  onImageChange: (file: File | null) => void;
}

/** File picker for the source image, with the chosen filename and a remove
 *  button. Owns only the presentational filename state; the decoded image lives
 *  in the editor. */
export function ImagePicker({ hasImage, onImageChange }: ImagePickerProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onImageChange(file);
  };

  const handleRemove = () => {
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
    onImageChange(null);
  };

  return (
    <div className={control}>
      <label htmlFor="image" className={controlLabel}>
        image for pattern
      </label>
      <input
        id="image"
        name="image"
        type="file"
        className="peer sr-only"
        accept={ACCEPTED_IMAGE_TYPES}
        ref={inputRef}
        onChange={handleFile}
      />
      <label
        htmlFor="image"
        className="inline-block w-fit cursor-pointer rounded-md border border-[rgb(216,210,210)] px-2.5 py-1 text-[0.85rem] transition-colors hover:border-brand hover:text-brand peer-focus-visible:border-brand"
      >
        Choose File
      </label>
      <span className="block max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.85rem]">
        {fileName ?? "No file chosen"}
      </span>
      {hasImage && (
        <button
          type="button"
          className="inline-block w-fit cursor-pointer rounded-md border border-[rgb(216,210,210)] bg-transparent px-2.5 py-1 text-[0.85rem] transition-colors hover:border-brand hover:text-brand focus-visible:border-brand focus-visible:text-brand"
          onClick={handleRemove}
        >
          Remove image
        </button>
      )}
    </div>
  );
}
