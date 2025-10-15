import SectionCard from "./SectionCard.jsx";
import AddressCard from "./AddressCard.jsx";

const toneClassMap = {
  info: "text-emerald-200/70",
  success: "text-emerald-100",
  error: "text-rose-200",
};

const AddressesSection = ({
  addresses,
  loading,
  error,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
  pendingAction,
  statusMessage,
  statusTone = "info",
}) => {
  const hasAddresses = Array.isArray(addresses) && addresses.length > 0;
  const statusClass = toneClassMap[statusTone] ?? toneClassMap.info;

  return (
    <SectionCard
      title="Saved addresses"
      description="Manage where you want your orders to arrive."
    >
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-emerald-200/70">
          Loading your addresses...
        </div>
      ) : error ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-6 text-sm text-rose-100">
            {error}
          </div>
          {typeof onRefresh === "function" ? (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : hasAddresses ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetDefault={onSetDefault}
              actionState={pendingAction}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-200/40 bg-white/5 p-6 text-sm text-emerald-200/70">
          Add a shipping address to speed up checkout.
        </div>
      )}

      {statusMessage && !loading && !error ? (
        <p className={`mt-4 text-xs ${statusClass}`}>{statusMessage}</p>
      ) : null}

      {typeof onAdd === "function" ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200"
        >
          Add new address
        </button>
      ) : null}
    </SectionCard>
  );
};

export default AddressesSection;
