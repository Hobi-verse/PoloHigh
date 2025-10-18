import SectionCard from "./SectionCard.jsx";
import OrderCard from "./OrderCard.jsx";

const OrdersSection = ({ orders }) => {
  const hasOrders = Array.isArray(orders) && orders.length > 0;

  return (
    <SectionCard
      title="Orders & returns"
      description="Track deliveries, download invoices, and start a return if needed."
    >
      {hasOrders ? (
        orders.map((order) => <OrderCard key={order.id} order={order} />)
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-secondary/40 p-6 text-sm text-text-muted">
          You haven&apos;t placed any orders yet. Once you do, they&apos;ll show
          up here for quick access.
        </div>
      )}
    </SectionCard>
  );
};

export default OrdersSection;
