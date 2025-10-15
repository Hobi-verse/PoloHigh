import { useId, useState } from "react";

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB

const ImageUploader = ({
  images = [],
  onChange,
  maxImages = 6,
  primaryImageIndex = 0,
  onPrimaryChange,
}) => {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);

  const canAddMore = images.length < maxImages;

  const handleFiles = (fileList) => {
    const files = Array.from(fileList).filter(
      (file) => file.type.startsWith("image/") && file.size <= FILE_SIZE_LIMIT
    );

    if (!files.length) {
      return;
    }

    const available = Math.max(0, maxImages - images.length);
    const selected = files.slice(0, available);

    Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) =>
              resolve({
                id: crypto.randomUUID(),
                file,
                preview: event.target?.result ?? "",
                name: file.name,
                size: file.size,
                type: file.type,
              });
            reader.readAsDataURL(file);
          })
      )
    ).then((parsed) => {
      if (parsed.length) {
        onChange?.([...images, ...parsed]);
      }
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer?.files?.length) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    const next = images.filter((_, currentIndex) => currentIndex !== index);
    onChange?.(next);

    if (primaryImageIndex === index) {
      onPrimaryChange?.(0);
    } else if (primaryImageIndex > index) {
      onPrimaryChange?.(primaryImageIndex - 1);
    }
  };

  const setPrimary = (index) => {
    onPrimaryChange?.(index);
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragActive
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/40"
        } ${canAddMore ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
        onClick={() =>
          canAddMore ? document.getElementById(inputId)?.click() : undefined
        }
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (canAddMore) setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
        }}
        onDrop={canAddMore ? handleDrop : undefined}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v14m7-7H5"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-700">
          {canAddMore
            ? "Drag images here or click to upload"
            : "Image limit reached"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          PNG, JPG or WebP up to 5MB. You can upload {maxImages} images.
        </p>
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) {
            handleFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />

      {images.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                primaryImageIndex === index
                  ? "border-emerald-500"
                  : "border-slate-200"
              }`}
            >
              <img
                src={image.preview}
                alt={image.name ?? `Product image ${index + 1}`}
                className="h-36 w-full object-cover"
              />

              {primaryImageIndex === index ? (
                <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow">
                  Primary
                </span>
              ) : null}

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                {primaryImageIndex !== index ? (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
                  >
                    Set primary
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white shadow hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-500">
        {images.length} / {maxImages} images uploaded
      </p>
    </div>
  );
};

export default ImageUploader;
