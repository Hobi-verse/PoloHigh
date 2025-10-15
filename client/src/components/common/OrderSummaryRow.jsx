const OrderSummaryRow = ({ label, value, emphasis = false }) => {
  if (label == null && value == null) {
    return null;
  }

  const valueClasses = emphasis
    ? "text-lg font-semibold text-white"
    : "text-emerald-100";

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-emerald-200/70">{label}</span>
      <span className={valueClasses}>{value}</span>
    </div>
  );
};

export default OrderSummaryRow;
