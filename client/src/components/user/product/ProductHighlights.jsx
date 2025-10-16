const ProductHighlights = ({ highlights = [] }) => {
  if (!highlights.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-secondary/20 bg-secondary p-6">
  <h2 className="text-lg font-semibold text-text-base">Highlights</h2>
  <ul className="mt-4 grid gap-4 sm:grid-cols-2">
    {highlights.map((highlight) => (
      <li key={highlight.title} className="rounded-2xl bg-background p-4">
        <p className="text-sm font-semibold text-text-base">
          {highlight.title}
        </p>
        <p className="mt-2 text-sm text-text-muted">
          {highlight.description}
        </p>
      </li>
    ))}
  </ul>
</section>
  );
};

export default ProductHighlights;
