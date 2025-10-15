const StatCard = ({ label, value, trend }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/60">
      {label}
    </p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {trend ? <p className="mt-1 text-xs text-emerald-200/70">{trend}</p> : null}
  </div>
);

export default StatCard;
