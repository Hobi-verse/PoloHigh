import { useEffect, useMemo, useState } from "react";
import RatingDisplay from "../../common/RatingDisplay.jsx";
import SelectionGroup from "../../common/SelectionGroup.jsx";
import ColorSwatchGroup from "../../common/ColorSwatchGroup.jsx";
import QuantitySelector from "../../common/QuantitySelector.jsx";
import { formatINR } from "../../../utils/currency.js";
import heartIcon from "../../../assets/icons/heart.svg";

const getVariantColorValue = (variantColor) => {
  if (!variantColor) {
    return null;
  }

  if (typeof variantColor === "string") {
    return variantColor;
  }

  return variantColor.value ?? variantColor.name ?? null;
};

const ProductSummary = ({
  product,
  onAddToCart,
  onBuyNow,
  actionStatus,
  onToggleWishlist,
  wishlistState,
  onRequestReview,
  reviewEligibility,
}) => {
  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product?.variants]
  );

  const defaultSize = useMemo(() => {
    if (product.defaultSize) {
      return product.defaultSize;
    }

    if (variants.length) {
      return variants[0]?.size ?? null;
    }

    return product.sizes?.[0] ?? null;
  }, [product.defaultSize, product.sizes, variants]);

  const defaultColor = useMemo(() => {
    if (product.defaultColor) {
      return product.defaultColor;
    }

    if (variants.length) {
      const variantColor = getVariantColorValue(variants[0]?.color);
      if (variantColor) {
        return variantColor;
      }
    }

    const firstColor = product.colors?.[0];
    if (!firstColor) {
      return null;
    }

    return typeof firstColor === "string"
      ? firstColor
      : firstColor.value ?? firstColor.name ?? null;
  }, [product.colors, product.defaultColor, variants]);

  const [size, setSize] = useState(defaultSize);
  const [color, setColor] = useState(defaultColor);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSize(defaultSize);
    setColor(defaultColor);
    setQuantity(1);
  }, [defaultColor, defaultSize, product?.id]);

  const sizeOptions = useMemo(
    () =>
      (product.sizes ?? []).map((value) => ({
        label: value.toUpperCase(),
        value,
      })),
    [product.sizes]
  );

  const colorOptions = useMemo(() => {
    const options = new Map();

    variants.forEach((variant) => {
      const value = getVariantColorValue(variant.color);
      if (!value || options.has(value)) {
        return;
      }

      options.set(value, {
        value,
        label:
          variant.color?.label ??
          variant.color?.name ??
          value
            .split(/[\s-_]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
        hex: variant.color?.hex ?? undefined,
      });
    });

    if (!options.size && Array.isArray(product.colors)) {
      product.colors.forEach((colorOption) => {
        const value =
          typeof colorOption === "string"
            ? colorOption
            : colorOption.value ?? colorOption.name;
        if (!value || options.has(value)) {
          return;
        }

        options.set(value, {
          value,
          label:
            typeof colorOption === "string"
              ? colorOption
                  .split(/[\s-_]+/)
                  .filter(Boolean)
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" ")
              : colorOption.label ?? colorOption.name ?? value,
          hex:
            typeof colorOption === "string"
              ? undefined
              : colorOption.hex ?? undefined,
        });
      });
    }

    return Array.from(options.values());
  }, [product.colors, variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) {
      return null;
    }

    const directMatch = variants.find((variant) => {
      const colorValue = getVariantColorValue(variant.color);
      return (
        (!size || variant.size === size) && (!color || colorValue === color)
      );
    });

    if (directMatch) {
      return directMatch;
    }

    const sizeMatch = variants.find((variant) => variant.size === size);
    if (sizeMatch) {
      return sizeMatch;
    }

    return variants[0];
  }, [variants, size, color]);

  const maxQuantity = useMemo(() => {
    const stockLevel = selectedVariant?.stockLevel;
    const limitFromVariant = Number.isFinite(stockLevel)
      ? Math.max(0, stockLevel)
      : undefined;
    const limitFromProduct = Number.isFinite(product?.maxQuantity)
      ? product.maxQuantity
      : undefined;

    const limits = [limitFromVariant, limitFromProduct]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    if (limits.length) {
      return Math.max(1, limits[0]);
    }

    return 6;
  }, [product?.maxQuantity, selectedVariant?.stockLevel]);

  useEffect(() => {
    if (!maxQuantity || quantity <= maxQuantity) {
      return;
    }
    setQuantity(maxQuantity);
  }, [maxQuantity, quantity]);

  const ratingValue = useMemo(
    () => Number(product.rating ?? product.averageRating ?? 0),
    [product.rating, product.averageRating]
  );

  const reviewCountValue = product.reviewCount ?? product.reviewsCount ?? 0;

  const summaryText = product.summary ?? product.description ?? "";

  const benefits = useMemo(() => {
    if (!Array.isArray(product.benefits)) {
      return [];
    }

    return product.benefits.map((benefit) =>
      typeof benefit === "string"
        ? { title: benefit, description: "" }
        : {
            title: benefit.title ?? "Benefit",
            description: benefit.description ?? benefit.detail ?? "",
          }
    );
  }, [product.benefits]);

  const handleAddToCart = () => {
    onAddToCart?.({ product, size, color, quantity, variant: selectedVariant });
  };

  const handleBuyNow = () => {
    onBuyNow?.({ product, size, color, quantity, variant: selectedVariant });
  };

  const handleToggleWishlist = () => {
    if (!onToggleWishlist || wishlistState?.loading) {
      return;
    }

    onToggleWishlist({
      product,
      size,
      color,
      quantity,
      variant: selectedVariant,
    });
  };

  const isVariantAvailable = selectedVariant
    ? selectedVariant.isActive !== false &&
      (selectedVariant.stockLevel === undefined ||
        selectedVariant.stockLevel > 0)
    : true;

  const isProcessing = actionStatus?.status === "loading";
  const addButtonDisabled = !isVariantAvailable || isProcessing;

  const wishlistButtonDisabled =
    wishlistState?.loading || !onToggleWishlist || !product;
  const wishlistButtonLabel = wishlistState?.inWishlist
    ? "Saved"
    : "Save to wishlist";

  const displayedPrice = useMemo(() => {
    const candidates = [
      selectedVariant?.priceOverride,
      selectedVariant?.price,
      product?.salePrice,
      product?.price,
      product?.basePrice,
    ];

    const numeric = candidates.find((value) => Number.isFinite(Number(value)));
    return Number.isFinite(Number(numeric)) ? Number(numeric) : 0;
  }, [product?.basePrice, product?.price, product?.salePrice, selectedVariant]);

  const hasExistingReview = Boolean(reviewEligibility?.existingReview);
  const reviewButtonLabel = hasExistingReview
    ? "Edit your review"
    : "Write a review";

  return (
    <section className="space-y-6 rounded-3xl border border-secondary/20 bg-secondary p-6 shadow-xl shadow-secondary/20">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
        {product.category}
      </p>
      <h1 className="text-3xl font-semibold text-text-base sm:text-4xl">
        {product.title}
      </h1>
      <div className="flex flex-wrap items-center gap-3 text-sm text-text-base">
        <RatingDisplay rating={ratingValue} count={reviewCountValue} />
        {onRequestReview ? (
          <button
            type="button"
            onClick={() =>
              onRequestReview(hasExistingReview ? "edit" : "create")
            }
            className="rounded-full border border-primary/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text-base transition hover:border-primary"
          >
            {reviewButtonLabel}
          </button>
        ) : null}
      </div>
    </header>

    {onToggleWishlist ? (
      <button
        type="button"
        onClick={handleToggleWishlist}
        disabled={wishlistButtonDisabled}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
          wishlistState?.inWishlist
            ? "border-primary bg-primary/20 text-text-base"
            : "border-secondary/20 bg-secondary text-text-muted hover:border-primary/60 hover:text-text-base"
        } disabled:cursor-not-allowed disabled:border-secondary/10 disabled:text-text-muted/40`}
      >
        <img
          src={heartIcon}
          alt=""
          aria-hidden
          className={`h-4 w-4 ${
            wishlistState?.inWishlist ? "opacity-100" : "opacity-80"
          }`}
        />
        {wishlistState?.loading ? "Saving…" : wishlistButtonLabel}
      </button>
    ) : null}
  </div>

  <p className="text-sm leading-relaxed text-text-base/80">
    {summaryText}
  </p>

  <div className="rounded-2xl bg-background p-4 text-lg font-semibold text-text-base">
    <span className="text-sm uppercase tracking-[0.2em] text-text-muted">
      Price
    </span>
    <p className="text-3xl text-primary">{formatINR(displayedPrice)}</p>
    {product.discount ? (
      <p className="text-sm text-text-muted">
        {product.discount}% off today
      </p>
    ) : null}
  </div>

  {sizeOptions.length ? (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        <span>Size</span>
        {product.sizeGuide ? (
          <button
            type="button"
            onClick={() => product.onOpenSizeGuide?.()}
            className="text-text-base transition hover:text-primary"
          >
            Size Guide
          </button>
        ) : null}
      </div>
      <SelectionGroup value={size} onChange={setSize} items={sizeOptions} />
    </div>
  ) : null}

  {colorOptions.length ? (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        Color
      </p>
      <ColorSwatchGroup
        value={color}
        onChange={setColor}
        colors={colorOptions}
      />
    </div>
  ) : null}

  <div className="space-y-3">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
      Quantity
    </p>
    <QuantitySelector
      value={quantity}
      onChange={setQuantity}
      max={maxQuantity}
    />
  </div>

  <div className="flex flex-col gap-3 sm:flex-row">
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={addButtonDisabled}
      className="inline-flex flex-1 items-center justify-center rounded-full border border-primary/70 bg-primary/10 px-4 py-3 text-sm font-semibold text-text-base transition hover:border-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:border-primary/20 disabled:bg-secondary/40 disabled:text-text-muted/60"
    >
      {isProcessing && actionStatus?.context !== "buy"
        ? "Adding…"
        : "Add to bag"}
    </button>
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={isProcessing}
      className="inline-flex flex-1 items-center justify-center rounded-full border border-transparent bg-primary px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-primary/60 disabled:text-background/40"
    >
      {isProcessing && actionStatus?.context === "buy"
        ? "Processing…"
        : "Buy now"}
    </button>
  </div>

  {benefits.length ? (
    <ul className="space-y-3 rounded-2xl bg-background p-4 text-sm text-text-base/80">
      {benefits.map((benefit, index) => (
        <li key={`${benefit.title}-${index}`} className="flex gap-3">
          <span aria-hidden className="mt-1 text-primary">
            •
          </span>
          <div>
            <p className="font-semibold text-text-base">
              {benefit.title}
            </p>
            {benefit.description ? (
              <p className="text-text-muted">{benefit.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  ) : null}

  {actionStatus?.message ? (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        actionStatus.status === "error"
          ? "border-primary/60 bg-primary/10 text-text-base"
          : "border-primary/40 bg-primary/10 text-text-base"
      }`}
    >
      {actionStatus.message}
    </div>
  ) : null}

  {wishlistState?.error ? (
    <div className="rounded-2xl border border-primary/60 bg-primary/10 px-4 py-3 text-sm text-text-base">
      {wishlistState.error}
    </div>
  ) : null}
</section>
  );
};

export default ProductSummary;
