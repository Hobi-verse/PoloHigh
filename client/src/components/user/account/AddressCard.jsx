const AddressCard = ({
  address,
  onEdit,
  onSetDefault,
  onDelete,
  actionState,
}) => {
  if (!address) {
    return null;
  }

  const pendingType = actionState?.type ?? "";
  const pendingId = actionState?.id ?? "";
  const isPending = pendingId === address.id ? pendingType : "";

  const handleEdit = () => onEdit?.(address);
  const handleDelete = () => onDelete?.(address);
  const handleSetDefault = () => onSetDefault?.(address);

  const showSetDefault = Boolean(!address.isDefault && onSetDefault);
  const showDelete = typeof onDelete === "function";
  const showEdit = typeof onEdit === "function";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{address.label}</p>
          <p className="text-xs text-emerald-200/70">{address.recipient}</p>
        </div>
        {address.isDefault ? (
          <span className="rounded-full border border-emerald-300/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Default
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-emerald-100">
        {address.addressLine1}
        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
      </p>
      <p className="text-sm text-emerald-100">
        {address.city}, {address.state} {address.postalCode}
      </p>
      <p className="text-xs text-emerald-200/70">{address.country}</p>
      <p className="mt-2 text-xs text-emerald-200/70">Phone: {address.phone}</p>
      {address.type ? (
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-emerald-200/50">
          {address.type}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
        {showEdit ? (
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-full border border-white/10 px-3 py-1 transition hover:border-emerald-200/70 hover:text-emerald-100"
            disabled={isPending === "delete"}
          >
            Edit
          </button>
        ) : null}
        {showSetDefault ? (
          <button
            type="button"
            onClick={handleSetDefault}
            disabled={isPending === "set-default" || isPending === "delete"}
            className="rounded-full border border-white/10 px-3 py-1 transition hover:border-emerald-200/70 hover:text-emerald-100 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-emerald-200/40"
          >
            {isPending === "set-default" ? "Setting..." : "Set default"}
          </button>
        ) : null}
        {showDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending === "delete"}
            className="rounded-full border border-rose-300/30 px-3 py-1 text-rose-200/80 transition hover:border-rose-200/60 hover:text-rose-100 disabled:cursor-not-allowed disabled:border-rose-200/20 disabled:text-rose-200/40"
          >
            {isPending === "delete" ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default AddressCard;
