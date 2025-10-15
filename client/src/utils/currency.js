const USD_TO_INR_RATE = 83;

export const usdToInr = (amountInUsd) =>
  Math.round(Number.isFinite(amountInUsd) ? amountInUsd * USD_TO_INR_RATE : 0);

export const formatINR = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeValue);
};

export default formatINR;
