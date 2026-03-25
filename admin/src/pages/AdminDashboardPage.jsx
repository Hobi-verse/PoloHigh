import { useCallback, useEffect, useState } from "react";
import { api } from "../api/endpoints";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import { formatINR } from "../utils/currency";

const ADMIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
  { id: "payments", label: "Payments" },
];

const ORDER_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out-for-delivery"],
  "out-for-delivery": ["delivered"],
  delivered: [],
  cancelled: ["refunded"],
  refunded: [],
};

const PRODUCT_FORM_INITIAL = {
  title: "",
  slug: "",
  category: "clothing",
  targetGender: "Men",
  basePrice: "",
  mrp: "",
  imageUrl: "",
  size: "M",
  colorName: "black",
  colorHex: "#111111",
  scentFamily: "",
  stockLevel: "10",
  description: "",
};

const PRODUCT_CATEGORY_OPTIONS = {
  clothing: {
    sizeLabel: "Size (e.g., S, M, L)",
    sizePlaceholder: "M",
    defaultSize: "M",
    requiresColor: true,
    defaultColorName: "black",
    defaultColorHex: "#111111",
  },
  perfumes: {
    sizeLabel: "Volume (e.g., 50ml, 100ml)",
    sizePlaceholder: "100ml",
    defaultSize: "100ml",
    requiresColor: false,
    defaultColorName: "clear",
    defaultColorHex: "#d9d9d9",
  },
  accessories: {
    sizeLabel: "Size (optional)",
    sizePlaceholder: "One Size",
    defaultSize: "ONE-SIZE",
    requiresColor: false,
    defaultColorName: "default",
    defaultColorHex: "#6b7280",
  },
};

const INITIAL_PAYMENT_FILTERS = {
  status: "",
  method: "",
  q: "",
};

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const resolveProducts = (response) => response?.products || response?.data?.products || [];
const resolveOrders = (response) => response?.data?.orders || response?.orders || [];
const resolveCustomers = (response) => response?.data?.results || [];
const resolvePayments = (response) => response?.data?.records || [];

const getAllowedStatuses = (currentStatus) => [
  currentStatus,
  ...(ORDER_TRANSITIONS[currentStatus] || []),
];

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const getCategoryConfig = (category = "") =>
  PRODUCT_CATEGORY_OPTIONS[category] || PRODUCT_CATEGORY_OPTIONS.clothing;

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [productForm, setProductForm] = useState(PRODUCT_FORM_INITIAL);
  const [productSlugTouched, setProductSlugTouched] = useState(false);
  const [productActionMessage, setProductActionMessage] = useState("");
  const [productActionError, setProductActionError] = useState("");
  const [productActionBusy, setProductActionBusy] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderActionMessage, setOrderActionMessage] = useState("");
  const [orderActionError, setOrderActionError] = useState("");
  const [orderDrafts, setOrderDrafts] = useState({});
  const [orderActionBusyId, setOrderActionBusyId] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState("");
  const [paymentFilters, setPaymentFilters] = useState(INITIAL_PAYMENT_FILTERS);

  const loadOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      setOverviewError("");
      const response = await api.admin.getOverview();
      setOverview(response?.data || null);
    } catch (requestError) {
      setOverviewError(requestError?.message || "Unable to load admin overview.");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError("");
      const response = await api.products.list({
        includeInactive: true,
        sort: "newest",
        limit: 100,
      });
      setProducts(resolveProducts(response));
    } catch (requestError) {
      setProductsError(requestError?.message || "Unable to load products.");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");
      const response = await api.orders.listAllAdmin({
        page: 1,
        limit: 50,
        sortBy: "placedAt",
        sortOrder: "desc",
      });
      setOrders(resolveOrders(response));
    } catch (requestError) {
      setOrdersError(requestError?.message || "Unable to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async (query = "") => {
    try {
      setCustomersLoading(true);
      setCustomersError("");
      const response = await api.search.searchCustomersAdmin({
        q: query || undefined,
        page: 1,
        limit: 50,
        sortBy: "recentActivity",
        sortOrder: "desc",
      });
      setCustomers(resolveCustomers(response));
    } catch (requestError) {
      setCustomersError(requestError?.message || "Unable to load customers.");
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async (filters) => {
    try {
      setPaymentsLoading(true);
      setPaymentsError("");
      const response = await api.admin.listPayments({
        page: 1,
        limit: 50,
        sortBy: "placedAt",
        sortOrder: "desc",
        status: filters.status || undefined,
        method: filters.method || undefined,
        q: filters.q || undefined,
      });
      setPayments(resolvePayments(response));
    } catch (requestError) {
      setPaymentsError(requestError?.message || "Unable to load payment records.");
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadProducts();
    loadOrders();
    loadCustomers();
    loadPayments(INITIAL_PAYMENT_FILTERS);
  }, [loadCustomers, loadOrders, loadOverview, loadPayments, loadProducts]);

  const handleProductFormChange = (field, value) => {
    if (field === "title") {
      setProductForm((current) => ({
        ...current,
        title: value,
        slug: productSlugTouched ? current.slug : slugify(value),
      }));
      return;
    }

    if (field === "slug") {
      setProductSlugTouched(true);
    }

    if (field === "category") {
      const config = getCategoryConfig(value);
      setProductForm((current) => ({
        ...current,
        category: value,
        size: config.defaultSize,
        colorName: config.requiresColor ? current.colorName || config.defaultColorName : config.defaultColorName,
        colorHex: config.requiresColor ? current.colorHex || config.defaultColorHex : config.defaultColorHex,
      }));
      return;
    }

    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    try {
      setProductActionBusy(true);
      setProductActionMessage("");
      setProductActionError("");

      const slug = slugify(productForm.slug || productForm.title);
      if (!slug) {
        throw new Error("Product slug is required.");
      }

      const price = Number(productForm.basePrice);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Base price must be greater than zero.");
      }

      const category = (productForm.category || "").trim().toLowerCase();
      const categoryConfig = getCategoryConfig(category);
      const isPerfume = category === "perfumes";

      const resolvedSize = (productForm.size || categoryConfig.defaultSize).trim();
      if (!resolvedSize) {
        throw new Error("Variant size or volume is required.");
      }

      const resolvedColorName = categoryConfig.requiresColor
        ? (productForm.colorName || "").trim().toLowerCase()
        : categoryConfig.defaultColorName;

      if (categoryConfig.requiresColor && !resolvedColorName) {
        throw new Error("Color is required for clothing products.");
      }

      const resolvedColorHex = categoryConfig.requiresColor
        ? (productForm.colorHex || categoryConfig.defaultColorHex).trim()
        : categoryConfig.defaultColorHex;

      const sku = `${slug}-${resolvedSize}-${resolvedColorName}`
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .toUpperCase();

      await api.products.create({
        slug,
        title: productForm.title.trim(),
        description: productForm.description.trim(),
        category,
        targetGender: productForm.targetGender,
        basePrice: price,
        mrp: productForm.mrp ? Number(productForm.mrp) : undefined,
        tags: isPerfume && productForm.scentFamily.trim()
          ? [productForm.scentFamily.trim().toLowerCase()]
          : undefined,
        media: [
          {
            url:
              productForm.imageUrl.trim() ||
              "https://placehold.co/900x1200/1d212a/e9dfcb?text=Product",
            alt: productForm.title.trim(),
            isPrimary: true,
            type: "image",
          },
        ],
        variants: [
          {
            sku,
            size: resolvedSize.toUpperCase(),
            color: {
              name: resolvedColorName,
              hex: resolvedColorHex,
            },
            stockLevel: Number(productForm.stockLevel || 0),
          },
        ],
      });

      setProductActionMessage("Product created successfully.");
      setProductForm(PRODUCT_FORM_INITIAL);
      setProductSlugTouched(false);
      await Promise.all([loadProducts(), loadOverview()]);
    } catch (requestError) {
      setProductActionError(requestError?.message || "Unable to create product.");
    } finally {
      setProductActionBusy(false);
    }
  };

  const handleToggleProductStatus = async (product) => {
    try {
      setProductActionBusy(true);
      setProductActionMessage("");
      setProductActionError("");
      await api.products.update(product.id, { isActive: !product.isActive });
      setProductActionMessage(
        `Product ${product.title} ${product.isActive ? "deactivated" : "activated"} successfully.`
      );
      await Promise.all([loadProducts(), loadOverview()]);
    } catch (requestError) {
      setProductActionError(requestError?.message || "Unable to update product status.");
    } finally {
      setProductActionBusy(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    try {
      setProductActionBusy(true);
      setProductActionMessage("");
      setProductActionError("");
      await api.products.remove(product.id);
      setProductActionMessage(`Product ${product.title} deleted successfully.`);
      await Promise.all([loadProducts(), loadOverview()]);
    } catch (requestError) {
      setProductActionError(requestError?.message || "Unable to delete product.");
    } finally {
      setProductActionBusy(false);
    }
  };

  const handleOrderDraftChange = (orderId, field, value) => {
    setOrderDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value,
      },
    }));
  };

  const handleUpdateOrder = async (order) => {
    const draft = orderDrafts[order.id] || {};
    const nextStatus = draft.status || order.status;
    if (nextStatus === order.status) {
      return;
    }

    try {
      setOrderActionBusyId(order.id);
      setOrderActionError("");
      setOrderActionMessage("");

      await api.orders.updateStatus(order.id, {
        status: nextStatus,
        trackingNumber: draft.trackingNumber || undefined,
        courierService: draft.courierService || undefined,
      });

      setOrderActionMessage(`Order ${order.orderNumber} moved to ${nextStatus}.`);
      await Promise.all([loadOrders(), loadOverview(), loadPayments(paymentFilters)]);
    } catch (requestError) {
      setOrderActionError(requestError?.message || "Unable to update order status.");
    } finally {
      setOrderActionBusyId("");
    }
  };

  const handleConfirmPayment = async (orderId, orderNumber) => {
    const draft = orderDrafts[orderId] || {};
    try {
      setOrderActionBusyId(orderId);
      setOrderActionError("");
      setOrderActionMessage("");
      await api.orders.confirmPayment(orderId, {
        transactionId: draft.transactionId || undefined,
      });
      setOrderActionMessage(`Payment confirmed for order ${orderNumber}.`);
      await Promise.all([loadOrders(), loadOverview(), loadPayments(paymentFilters)]);
    } catch (requestError) {
      setOrderActionError(requestError?.message || "Unable to confirm payment.");
    } finally {
      setOrderActionBusyId("");
    }
  };

  const handleCustomerSearch = async (event) => {
    event.preventDefault();
    await loadCustomers(customerQuery);
  };

  const handlePaymentFilterChange = (field, value) => {
    setPaymentFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePaymentFilterSubmit = async (event) => {
    event.preventDefault();
    await loadPayments(paymentFilters);
  };

  const metrics = overview?.metrics || {};
  const orderStatusMetrics = Object.entries(metrics?.orders?.byStatus || {});
  const paymentStatusMetrics = Object.entries(metrics?.payments?.byStatus || {});
  const categoryConfig = getCategoryConfig(productForm.category);
  const showColorInputs = categoryConfig.requiresColor;
  const isPerfumeCategory = productForm.category === "perfumes";

  return (
    <main className="admin-page">
      <section className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Operations Console</p>
          <h1>Admin Dashboard</h1>
        </div>
      </section>

      <nav className="admin-tabs">
        {ADMIN_TABS.map((tab) => (
          <button
            className={`admin-tabs__item${activeTab === tab.id ? " is-active" : ""}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <section className="admin-panel">
          {overviewLoading ? <LoadingState message="Loading dashboard metrics..." /> : null}
          {!overviewLoading && overviewError ? <ErrorState message={overviewError} /> : null}
          {!overviewLoading && !overviewError ? (
            <>
              <div className="admin-kpi-grid">
                <article className="admin-kpi-card">
                  <p>Total Products</p>
                  <h3>{metrics?.products?.total || 0}</h3>
                </article>
                <article className="admin-kpi-card">
                  <p>Active Customers</p>
                  <h3>{metrics?.customers?.total || 0}</h3>
                </article>
                <article className="admin-kpi-card">
                  <p>Total Orders</p>
                  <h3>{metrics?.orders?.total || 0}</h3>
                </article>
                <article className="admin-kpi-card">
                  <p>Captured Revenue</p>
                  <h3>{formatINR(metrics?.revenue?.captured || 0)}</h3>
                </article>
              </div>

              <div className="admin-overview-grid">
                <section className="admin-card">
                  <h2>Order Status Distribution</h2>
                  {orderStatusMetrics.length ? (
                    <div className="admin-status-list">
                      {orderStatusMetrics.map(([status, data]) => (
                        <div className="admin-status-row" key={status}>
                          <span>{status}</span>
                          <strong>{data?.count || 0}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="catalog-footnote">No order status data.</p>
                  )}
                </section>

                <section className="admin-card">
                  <h2>Payment Status Distribution</h2>
                  {paymentStatusMetrics.length ? (
                    <div className="admin-status-list">
                      {paymentStatusMetrics.map(([status, data]) => (
                        <div className="admin-status-row" key={status}>
                          <span>{status}</span>
                          <strong>{data?.count || 0}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="catalog-footnote">No payment status data.</p>
                  )}
                </section>
              </div>

              <section className="admin-card">
                <h2>Recent Orders</h2>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Placed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(overview?.recentOrders || []).map((order) => (
                        <tr key={order.id}>
                          <td>{order.orderNumber}</td>
                          <td>{order.customer?.name || "-"}</td>
                          <td>{order.status}</td>
                          <td>{order.paymentStatus}</td>
                          <td>{formatINR(order.grandTotal || 0)}</td>
                          <td>{formatDateTime(order.placedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </section>
      ) : null}

      {activeTab === "products" ? (
        <section className="admin-panel">
          <div className="admin-layout">
            <section className="admin-card">
              <h2>Create Product</h2>
              <form className="admin-form-grid" onSubmit={handleCreateProduct}>
                <input
                  onChange={(event) => handleProductFormChange("title", event.target.value)}
                  placeholder="Product title"
                  required
                  value={productForm.title}
                />
                <input
                  onChange={(event) => handleProductFormChange("slug", event.target.value)}
                  placeholder="Slug"
                  required
                  value={productForm.slug}
                />
                <select
                  onChange={(event) => handleProductFormChange("category", event.target.value)}
                  value={productForm.category}
                >
                  <option value="clothing">Clothing</option>
                  <option value="perfumes">Perfumes</option>
                  <option value="accessories">Accessories</option>
                </select>
                <select
                  onChange={(event) => handleProductFormChange("targetGender", event.target.value)}
                  value={productForm.targetGender}
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Kids">Kids</option>
                </select>
                <input
                  min="1"
                  onChange={(event) => handleProductFormChange("basePrice", event.target.value)}
                  placeholder="Base price"
                  required
                  type="number"
                  value={productForm.basePrice}
                />
                <input
                  min="0"
                  onChange={(event) => handleProductFormChange("mrp", event.target.value)}
                  placeholder="MRP"
                  type="number"
                  value={productForm.mrp}
                />
                <input
                  onChange={(event) => handleProductFormChange("imageUrl", event.target.value)}
                  placeholder="Primary image URL"
                  value={productForm.imageUrl}
                />
                <input
                  onChange={(event) => handleProductFormChange("size", event.target.value)}
                  placeholder={categoryConfig.sizePlaceholder}
                  required
                  value={productForm.size}
                />
                {showColorInputs ? (
                  <>
                    <input
                      onChange={(event) => handleProductFormChange("colorName", event.target.value)}
                      placeholder="Color name"
                      required
                      value={productForm.colorName}
                    />
                    <input
                      onChange={(event) => handleProductFormChange("colorHex", event.target.value)}
                      placeholder="Color hex"
                      value={productForm.colorHex}
                    />
                  </>
                ) : null}
                {isPerfumeCategory ? (
                  <input
                    onChange={(event) => handleProductFormChange("scentFamily", event.target.value)}
                    placeholder="Scent family (e.g., woody, citrus)"
                    value={productForm.scentFamily}
                  />
                ) : null}
                <input
                  min="0"
                  onChange={(event) => handleProductFormChange("stockLevel", event.target.value)}
                  placeholder="Stock level"
                  type="number"
                  value={productForm.stockLevel}
                />
                <textarea
                  onChange={(event) => handleProductFormChange("description", event.target.value)}
                  placeholder="Product description"
                  rows={4}
                  value={productForm.description}
                />
                <button className="button button--gold" disabled={productActionBusy} type="submit">
                  {productActionBusy ? "Saving..." : "Create Product"}
                </button>
              </form>
              {productActionError ? (
                <p className="inline-message inline-message--error">{productActionError}</p>
              ) : null}
              {productActionMessage ? <p className="inline-message">{productActionMessage}</p> : null}
            </section>

            <section className="admin-card">
              <div className="admin-card__head">
                <h2>Products</h2>
                <button className="button button--outline" onClick={loadProducts} type="button">
                  Refresh
                </button>
              </div>
              {productsLoading ? <LoadingState message="Loading products..." /> : null}
              {!productsLoading && productsError ? <ErrorState message={productsError} /> : null}
              {!productsLoading && !productsError ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id || product.slug}>
                          <td>{product.title}</td>
                          <td>{product.category}</td>
                          <td>{formatINR(product.price || product.basePrice || 0)}</td>
                          <td>{product.totalStock || 0}</td>
                          <td>{product.isActive ? "Active" : "Inactive"}</td>
                          <td>
                            <div className="admin-inline-actions">
                              <button
                                className="button button--outline"
                                disabled={productActionBusy}
                                onClick={() => handleToggleProductStatus(product)}
                                type="button"
                              >
                                {product.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                className="button button--text"
                                disabled={productActionBusy}
                                onClick={() => handleDeleteProduct(product)}
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      ) : null}

      {activeTab === "orders" ? (
        <section className="admin-panel">
          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Order Tracking</h2>
              <button className="button button--outline" onClick={loadOrders} type="button">
                Refresh
              </button>
            </div>
            {ordersLoading ? <LoadingState message="Loading orders..." /> : null}
            {!ordersLoading && ordersError ? <ErrorState message={ordersError} /> : null}
            {orderActionError ? <p className="inline-message inline-message--error">{orderActionError}</p> : null}
            {orderActionMessage ? <p className="inline-message">{orderActionMessage}</p> : null}
            {!ordersLoading && !ordersError ? (
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--compact">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const draft = orderDrafts[order.id] || {};
                      const selectedStatus = draft.status || order.status;
                      const allowedStatuses = getAllowedStatuses(order.status);

                      return (
                        <tr key={order.id}>
                          <td>
                            <p>{order.orderNumber}</p>
                            <small>{formatDateTime(order.placedAt)}</small>
                          </td>
                          <td>
                            <p>{order.customer?.name || "-"}</p>
                            <small>{order.customer?.email || "-"}</small>
                          </td>
                          <td>{order.status}</td>
                          <td>
                            <p>{order.payment?.status || "pending"}</p>
                            <small>{order.payment?.method || "N/A"}</small>
                          </td>
                          <td>{formatINR(order.pricing?.grandTotal || 0)}</td>
                          <td>
                            <div className="admin-order-actions">
                              <select
                                onChange={(event) =>
                                  handleOrderDraftChange(order.id, "status", event.target.value)
                                }
                                value={selectedStatus}
                              >
                                {allowedStatuses.map((statusOption) => (
                                  <option key={statusOption} value={statusOption}>
                                    {statusOption}
                                  </option>
                                ))}
                              </select>
                              <input
                                onChange={(event) =>
                                  handleOrderDraftChange(order.id, "trackingNumber", event.target.value)
                                }
                                placeholder="Tracking no."
                                value={draft.trackingNumber || ""}
                              />
                              <input
                                onChange={(event) =>
                                  handleOrderDraftChange(order.id, "courierService", event.target.value)
                                }
                                placeholder="Courier"
                                value={draft.courierService || ""}
                              />
                              <input
                                onChange={(event) =>
                                  handleOrderDraftChange(order.id, "transactionId", event.target.value)
                                }
                                placeholder="Transaction ID"
                                value={draft.transactionId || ""}
                              />
                              <div className="admin-inline-actions">
                                <button
                                  className="button button--outline"
                                  disabled={orderActionBusyId === order.id || selectedStatus === order.status}
                                  onClick={() => handleUpdateOrder(order)}
                                  type="button"
                                >
                                  Update Status
                                </button>
                                <button
                                  className="button button--gold"
                                  disabled={
                                    orderActionBusyId === order.id ||
                                    order.payment?.status === "completed"
                                  }
                                  onClick={() => handleConfirmPayment(order.id, order.orderNumber)}
                                  type="button"
                                >
                                  Confirm Payment
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}

      {activeTab === "customers" ? (
        <section className="admin-panel">
          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Customers</h2>
              <form className="admin-search-form" onSubmit={handleCustomerSearch}>
                <input
                  onChange={(event) => setCustomerQuery(event.target.value)}
                  placeholder="Search by name, email, phone"
                  value={customerQuery}
                />
                <button className="button button--outline" type="submit">
                  Search
                </button>
              </form>
            </div>
            {customersLoading ? <LoadingState message="Loading customers..." /> : null}
            {!customersLoading && customersError ? <ErrorState message={customersError} /> : null}
            {!customersLoading && !customersError ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Tier</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                      <th>Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.name || "-"}</td>
                        <td>
                          <p>{customer.email || "-"}</p>
                          <small>{customer.phone || "-"}</small>
                        </td>
                        <td>{customer.membershipTier || "Bronze"}</td>
                        <td>{customer.totalOrders || 0}</td>
                        <td>{formatINR(customer.totalSpent || 0)}</td>
                        <td>{customer.isVerified ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className="admin-panel">
          <section className="admin-card">
            <div className="admin-card__head">
              <h2>Payment Records</h2>
              <form className="admin-search-form" onSubmit={handlePaymentFilterSubmit}>
                <input
                  onChange={(event) => handlePaymentFilterChange("q", event.target.value)}
                  placeholder="Search order / customer / transaction"
                  value={paymentFilters.q}
                />
                <select
                  onChange={(event) => handlePaymentFilterChange("status", event.target.value)}
                  value={paymentFilters.status}
                >
                  <option value="">All status</option>
                  <option value="pending">pending</option>
                  <option value="completed">completed</option>
                  <option value="failed">failed</option>
                  <option value="refunded">refunded</option>
                </select>
                <select
                  onChange={(event) => handlePaymentFilterChange("method", event.target.value)}
                  value={paymentFilters.method}
                >
                  <option value="">All methods</option>
                  <option value="COD">COD</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Wallet">Wallet</option>
                </select>
                <button className="button button--outline" type="submit">
                  Apply
                </button>
              </form>
            </div>
            {paymentsLoading ? <LoadingState message="Loading payment records..." /> : null}
            {!paymentsLoading && paymentsError ? <ErrorState message={paymentsError} /> : null}
            {!paymentsLoading && !paymentsError ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Payment Status</th>
                      <th>Transaction</th>
                      <th>Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <p>{record.orderNumber}</p>
                          <small>{record.orderStatus}</small>
                        </td>
                        <td>
                          <p>{record.customer?.name || "-"}</p>
                          <small>{record.customer?.email || "-"}</small>
                        </td>
                        <td>{formatINR(record.amount || 0)}</td>
                        <td>{record.method || "N/A"}</td>
                        <td>{record.paymentStatus}</td>
                        <td>{record.transactionId || "-"}</td>
                        <td>{formatDateTime(record.paidAt || record.placedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}
    </main>
  );
};

export default AdminDashboardPage;

