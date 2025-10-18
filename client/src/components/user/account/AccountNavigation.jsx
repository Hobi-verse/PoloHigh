import { formatDate } from "./accountUtils.js";

const AccountNavigation = ({
  sections,
  selectedSection,
  onSelect,
  support,
}) => (
  <aside className="space-y-6">
    <div className="rounded-3xl border border-secondary/50 bg-secondary/40 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-text-muted">
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
                  ? "border-primary/70 bg-primary/20 text-primary"
                  : "border-secondary/50 bg-secondary/40 text-text-muted hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </div>

    {support ? (
      <div className="rounded-3xl border border-primary/40 bg-primary/10 p-6 text-sm text-text-base/90">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
          Need help?
        </p>
        <p className="mt-2 text-base font-semibold text-text-base">
          {support.concierge?.name}
        </p>
        <p className="text-xs text-text-muted">{support.concierge?.hours}</p>
        <div className="mt-4 space-y-2 text-sm">
          <p>Email: {support.concierge?.email}</p>
          <p>Phone: {support.concierge?.phone}</p>
        </div>
        {support.lastTicket ? (
          <div className="mt-4 rounded-2xl border border-secondary/50 bg-secondary/40 p-3 text-xs text-text-muted">
            <p className="font-semibold text-text-base">
              Last ticket · {support.lastTicket.status}
            </p>
            <p>{support.lastTicket.subject}</p>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-text-muted/80">
              Updated {formatDate(support.lastTicket.updatedOn)}
            </p>
          </div>
        ) : null}
      </div>
    ) : null}
  </aside>
);

export default AccountNavigation;
