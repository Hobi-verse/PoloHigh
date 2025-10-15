import { useEffect, useMemo, useState } from "react";
import { createReview, updateReview } from "../../../api/reviews.js";
import { ApiError } from "../../../api/client.js";

const ratingOptions = [5, 4, 3, 2, 1];

const buildInitialForm = (review) => ({
  rating: review?.rating ?? 5,
  title: review?.title ?? "",
  comment: review?.comment ?? "",
  variantSize: review?.variant?.size ?? "",
  variantColor: review?.variant?.color ?? "",
});

const getApiErrorMessage = (error, fallbackMessage) => {
  if (error instanceof ApiError) {
    return (
      error.payload?.message ||
      error.payload?.error ||
      (Array.isArray(error.payload?.errors)
        ? error.payload.errors[0]?.message
        : null) ||
      fallbackMessage ||
      "Something went wrong"
    );
  }

  return error?.message || fallbackMessage || "Something went wrong";
};

const validateForm = (formValues) => {
  if (!ratingOptions.includes(formValues.rating)) {
    return "Please choose a rating between 1 and 5.";
  }

  if (!formValues.comment || formValues.comment.trim().length < 10) {
    return "Please share at least 10 characters about your experience.";
  }

  if (formValues.comment.length > 2000) {
    return "Your review can be up to 2000 characters.";
  }

  if (formValues.title && formValues.title.length > 200) {
    return "Review title must be 200 characters or less.";
  }

  return "";
};

const WriteReviewDialog = ({
  open,
  mode = "create",
  productId,
  productName,
  defaultOrderId,
  existingReview,
  onClose,
  onSuccess,
}) => {
  const [formValues, setFormValues] = useState(() =>
    buildInitialForm(existingReview)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormValues(buildInitialForm(existingReview));
      setError("");
      setSaving(false);
    }
  }, [open, existingReview]);

  const dialogTitle = useMemo(
    () => (mode === "edit" ? "Update your review" : "Write a review"),
    [mode]
  );

  const actionLabel = mode === "edit" ? "Save changes" : "Submit review";

  if (!open) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleRatingChange = (value) => {
    if (saving) {
      return;
    }
    setFormValues((current) => ({
      ...current,
      rating: value,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError = validateForm(formValues);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!productId) {
      setError("We couldn't identify this product right now.");
      return;
    }

    const payload = {
      rating: formValues.rating,
      title: formValues.title.trim(),
      comment: formValues.comment.trim(),
      images: [],
      variant: {
        size: formValues.variantSize.trim(),
        color: formValues.variantColor.trim(),
      },
    };

    if (!payload.variant.size) {
      delete payload.variant.size;
    }
    if (!payload.variant.color) {
      delete payload.variant.color;
    }
    if (!Object.keys(payload.variant).length) {
      delete payload.variant;
    }

    setSaving(true);
    setError("");

    try {
      let result;
      if (mode === "edit" && existingReview?.id) {
        result = await updateReview(existingReview.id, payload);
      } else {
        result = await createReview({
          ...payload,
          productId,
          orderId: defaultOrderId || undefined,
        });
      }

      setSaving(false);
      onSuccess?.(result);
      onClose?.();
    } catch (apiError) {
      setSaving(false);
      setError(
        getApiErrorMessage(
          apiError,
          mode === "edit"
            ? "We couldn't update your review just yet."
            : "We couldn't submit your review right now."
        )
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="write-review-title"
      onClick={handleOverlayClick}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0b2016] p-6 text-emerald-50 shadow-2xl"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
              Share your experience
            </p>
            <h2
              id="write-review-title"
              className="mt-2 text-2xl font-semibold text-white"
            >
              {dialogTitle}
            </h2>
            {productName ? (
              <p className="mt-1 text-sm text-emerald-200/70">{productName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="self-start rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/60">
              Rating
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ratingOptions.map((value) => {
                const active = formValues.rating >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRatingChange(value)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                      active
                        ? "border-emerald-300 bg-emerald-500/20 text-emerald-100"
                        : "border-white/10 bg-white/5 text-emerald-200/60"
                    }`}
                    aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-2 block text-emerald-100/80">Review title</span>
            <input
              type="text"
              name="title"
              value={formValues.title}
              onChange={handleChange}
              maxLength={200}
              placeholder="A quick headline for your review (optional)"
              className="w-full rounded-2xl border border-white/10 bg-[#07150f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/70"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-emerald-100/80">Tell us more</span>
            <textarea
              name="comment"
              value={formValues.comment}
              onChange={handleChange}
              rows={5}
              minLength={10}
              maxLength={2000}
              placeholder="How does it fit, feel, and hold up in everyday use?"
              className="w-full rounded-2xl border border-white/10 bg-[#07150f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/70"
              required
            />
            <span className="mt-2 block text-xs text-emerald-200/60">
              {formValues.comment.length} / 2000 characters
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-2 block text-emerald-100/80">Size</span>
              <input
                type="text"
                name="variantSize"
                value={formValues.variantSize}
                onChange={handleChange}
                placeholder="Size you picked (optional)"
                className="w-full rounded-2xl border border-white/10 bg-[#07150f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/70"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-emerald-100/80">Colour</span>
              <input
                type="text"
                name="variantColor"
                value={formValues.variantColor}
                onChange={handleChange}
                placeholder="Colour you chose (optional)"
                className="w-full rounded-2xl border border-white/10 bg-[#07150f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/70"
              />
            </label>
          </div>

          <p className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200/80">
            Reviews help other shoppers make confident decisions. Keep your
            feedback honest, constructive, and focused on the product
            experience.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {defaultOrderId ? (
            <span className="text-xs uppercase tracking-[0.25em] text-emerald-200/60">
              Verified purchase
            </span>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full border border-emerald-300/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-50 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : actionLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WriteReviewDialog;
