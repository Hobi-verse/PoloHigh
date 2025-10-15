import RatingDisplay from "../../../common/RatingDisplay.jsx";

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusStyles = {
  approved: "bg-emerald-400/15 text-emerald-100",
  pending: "bg-amber-400/15 text-amber-100",
  rejected: "bg-rose-500/20 text-rose-100",
};

const MyReviewsSection = ({
  reviews,
  loading,
  error,
  onRefresh,
  onLoadMore,
  hasMore,
  onEdit,
  onDelete,
}) => {
  const renderReview = (review) => {
    const statusStyle =
      statusStyles[review.status] ?? "bg-white/10 text-emerald-100";

    return (
      <article
        key={review.id}
        className="rounded-3xl border border-white/5 bg-[#0d221c] p-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                {review.product?.image ? (
                  <img
                    src={review.product.image}
                    alt={review.product?.title || "Product image"}
                    className="h-12 w-12 rounded-xl object-cover"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : null}
                <div>
                  <p className="text-sm font-semibold text-emerald-100">
                    {review.product?.title || "Product"}
                  </p>
                  <p className="text-xs text-emerald-200/60">
                    Reviewed on {formatDate(review.createdAt) || "recently"}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${statusStyle}`}
              >
                {review.status}
              </span>
              {review.isVerifiedPurchase ? (
                <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                  Verified purchase
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <RatingDisplay
                rating={review.rating}
                size="sm"
                showCount={false}
              />
              <span className="text-xs text-emerald-200/60">
                {review.rating.toFixed(1)} out of 5
              </span>
            </div>

            {review.title ? (
              <p className="text-sm font-semibold text-emerald-100">
                {review.title}
              </p>
            ) : null}

            <p className="text-sm leading-relaxed text-emerald-200/80">
              {review.comment}
            </p>

            {review.adminResponse?.message ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-emerald-200/80">
                <p className="font-semibold text-emerald-100">Ciyatake team</p>
                <p className="mt-1 leading-relaxed">
                  {review.adminResponse.message}
                </p>
              </div>
            ) : null}

            {review.rejectionReason ? (
              <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-xs text-rose-100">
                <p className="font-semibold">Why it was rejected</p>
                <p className="mt-1 leading-relaxed">{review.rejectionReason}</p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80 md:ml-6">
            <button
              type="button"
              onClick={() => onEdit?.(review)}
              className="rounded-full border border-white/10 px-3 py-1 transition hover:border-emerald-200 hover:text-emerald-100"
            >
              Edit review
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(review)}
              className="rounded-full border border-rose-300/30 px-3 py-1 text-rose-200 transition hover:border-rose-200 hover:text-rose-100"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="rounded-3xl border border-white/5 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/60">
            My reviews
          </p>
          <h2 className="text-xl font-semibold text-white">
            Your product feedback
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200"
        >
          Refresh
        </button>
      </div>

      {loading && !reviews.length ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-3xl border border-white/5 bg-[#0d221c] p-5"
            >
              <div className="mb-3 h-4 w-1/4 rounded bg-white/10" />
              <div className="mb-2 h-4 rounded bg-white/10" />
              <div className="h-16 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-6 space-y-3 rounded-3xl border border-rose-300/40 bg-rose-500/10 p-5 text-sm text-rose-100">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-rose-200/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-100 transition hover:border-rose-200"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && !reviews.length ? (
        <div className="mt-6 rounded-3xl border border-dashed border-emerald-300/40 bg-[#0d221c] p-6 text-center text-sm text-emerald-200/70">
          You haven't shared any reviews yet. Head to a product page to write
          one.
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {reviews.map((review) => renderReview(review))}
      </div>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-emerald-300/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default MyReviewsSection;
