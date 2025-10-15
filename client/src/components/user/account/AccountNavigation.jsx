import { formatDate } from "./accountUtils.js";

const AccountNavigation = ({
  sections,
  selectedSection,
  onSelect,
  support,
}) => (
  <aside className="space-y-6">
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
        Account menu
      </h2>
      <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
        {sections.map((section) => {
          const isActive = section.id === selectedSection;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isActive
                  ? "border-emerald-300/70 bg-emerald-400/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-emerald-200/80 hover:border-emerald-200/50 hover:bg-emerald-400/10 hover:text-emerald-100"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </div>

    {support ? (
      <div className="rounded-3xl border border-emerald-300/30 bg-emerald-500/10 p-6 text-sm text-emerald-100">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
          Need help?
        </p>
        <p className="mt-2 text-base font-semibold">
          {support.concierge?.name}
        </p>
        <p className="text-xs text-emerald-200/80">
          {support.concierge?.hours}
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <p>Email: {support.concierge?.email}</p>
          <p>Phone: {support.concierge?.phone}</p>
        </div>
        {support.lastTicket ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-emerald-200/80">
            <p className="font-semibold text-emerald-100">
              Last ticket · {support.lastTicket.status}
            </p>
            <p>{support.lastTicket.subject}</p>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-emerald-200/60">
              Updated {formatDate(support.lastTicket.updatedOn)}
            </p>
          </div>
        ) : null}
      </div>
    ) : null}
  </aside>
);

export default AccountNavigation;
