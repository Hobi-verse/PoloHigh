import { useId, useState } from "react";

const VideoUploader = ({ video, onChange, maxSizeMB = 50 }) => {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const sizeLimit = maxSizeMB * 1024 * 1024;

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Please choose a valid video file.");
      return;
    }

    if (file.size > sizeLimit) {
      setError(`Video must be under ${maxSizeMB}MB.`);
      return;
    }

    setError("");
    const preview = URL.createObjectURL(file);
    onChange?.({
      id: crypto.randomUUID(),
      file,
      preview,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  const handleInput = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
      event.target.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearVideo = () => {
    if (video?.preview) {
      URL.revokeObjectURL(video.preview);
    }
    onChange?.(null);
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
  };

  return (
    <div className="space-y-4">
      {!video ? (
        <div
          className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
            dragActive
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/40"
          } cursor-pointer`}
          onClick={() => document.getElementById(inputId)?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragActive(false);
          }}
          onDrop={handleDrop}
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m0-4l-4.553-2.276A1 1 0 009 8.382v7.236a1 1 0 001.447.894L15 14m0-4v4M5 18h6a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-700">
            Drag video here or click to upload
          </p>
          <p className="mt-1 text-sm text-slate-500">
            MP4, WebM, MOV up to {maxSizeMB}MB.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-video bg-slate-100">
            <video
              src={video.preview}
              className="h-full w-full object-cover"
              controls
            />
            <button
              type="button"
              onClick={clearVideo}
              className="absolute right-3 top-3 rounded-full bg-red-500 p-2 text-white shadow-lg transition hover:bg-red-600"
              aria-label="Remove video"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-slate-800">{video.name}</p>
              <p className="text-slate-500">{formatSize(video.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearVideo}
              className="text-sm font-medium text-red-600 transition hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <input
        id={inputId}
        type="file"
        accept="video/*"
        hidden
        onChange={handleInput}
      />

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-slate-500">
          Recommended to keep videos short for faster load times.
        </p>
      )}
    </div>
  );
};

export default VideoUploader;
