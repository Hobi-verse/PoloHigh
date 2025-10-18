const StatCard = ({ label, value, trend }) => (
  <div className="rounded-2xl border border-secondary/50 bg-secondary/40 p-4">
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
    {label}
  </p>
  <p className="mt-2 text-2xl font-semibold text-text-base">{value}</p>
  {trend ? <p className="mt-1 text-xs text-text-muted">{trend}</p> : null}
</div>
);

export default StatCard;
