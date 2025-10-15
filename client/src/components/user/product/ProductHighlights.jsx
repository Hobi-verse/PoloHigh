const ProductHighlights = ({ highlights = [] }) => {
  if (!highlights.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white/5 bg-white/5 p-6">
      <h2 className="text-lg font-semibold text-white">Highlights</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {highlights.map((highlight) => (
          <li key={highlight.title} className="rounded-2xl bg-[#0d221c] p-4">
            <p className="text-sm font-semibold text-emerald-100">
              {highlight.title}
            </p>
            <p className="mt-2 text-sm text-emerald-200/80">
              {highlight.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProductHighlights;
