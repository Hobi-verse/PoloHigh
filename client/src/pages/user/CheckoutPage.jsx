import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/user/common/UserNavbar.jsx";
import Breadcrumbs from "../../components/common/Breadcrumbs.jsx";
import CheckoutProgress from "../../components/user/checkout/CheckoutProgress.jsx";
import CheckoutSection from "../../components/user/checkout/CheckoutSection.jsx";
import CheckoutField from "../../components/user/checkout/CheckoutField.jsx";
import CheckoutOrderSummary from "../../components/user/checkout/CheckoutOrderSummary.jsx";
import {
  fetchCart,
  validateCart,
  updateCartItem,
  removeCartItem,
} from "../../api/cart.js";
import { fetchAddresses, createAddress } from "../../api/addresses.js";
import { fetchAccountSummary } from "../../api/user.js";
import { processPayment } from "../../api/payments.js";

const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 50;
const TAX_RATE = 0.18;
const DEFAULT_COUNTRY = "India";
const NEW_ADDRESS_OPTION_VALUE = "new-address";

const EMPTY_ADDRESS_FORM = {
  label: "Home",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: DEFAULT_COUNTRY,
  deliveryInstructions: "",
};

const TEXTAREA_FIELD_CLASSES =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-emerald-200/40 focus:border-emerald-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition";

const computePricing = (cart) => {
  const subtotalFromTotals = Number(cart?.totals?.subtotal);
  const subtotal = Number.isFinite(subtotalFromTotals)
    ? subtotalFromTotals
    : Array.isArray(cart?.items)
    ? cart.items.reduce((sum, item) => {
        const unitPrice = Number(item?.price) || 0;
        const quantity = Number(item?.quantity) || 0;
        return sum + unitPrice * quantity;
      }, 0)
    : 0;

  const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
  };
};

const buildOrderFromCart = (cart) => {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return null;
  }

  const items = cart.items
    .filter((item) => !item?.savedForLater)
    .map((item) => ({
      id: item?.id ?? item?.productId ?? item?.variantSku,
      title: item?.title ?? "",
      size: item?.size ?? "",
      price: Number(item?.price) || 0,
      quantity: Number(item?.quantity) || 0,
      imageUrl: item?.imageUrl ?? "",
    }));

  if (!items.length) {
    return null;
  }

  const pricing = computePricing({ ...cart, items });

  return {
    items,
    shipping: pricing.shipping,
    shippingLabel: pricing.shipping === 0 ? "Free" : undefined,
    tax: pricing.tax,
  };
};

const formatAddressOptionLabel = (address) => {
  const parts = [address.label ?? "Saved address"];

  if (address.city) {
    parts.push(address.city);
  }

  if (address.state) {
    parts.push(address.state);
  }

  return parts.join(" - ");
};

const CheckoutPage = () => {
  const navigate = useNavigate();

  const states = useMemo(
    () => [
      { value: "", label: "Select state", disabled: true },
      { value: "KA", label: "Karnataka" },
      { value: "MH", label: "Maharashtra" },
      { value: "TN", label: "Tamil Nadu" },
      { value: "DL", label: "Delhi" },
      { value: "WB", label: "West Bengal" },
      { value: "GJ", label: "Gujarat" },
      { value: "RJ", label: "Rajasthan" },
      { value: "UP", label: "Uttar Pradesh" },
    ],
    []
  );

  const [cart, setCart] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [checkoutIssues, setCheckoutIssues] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...EMPTY_ADDRESS_FORM });
  const [contactForm, setContactForm] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const addressOptions = useMemo(() => {
    if (!addresses.length) {
      return [
        {
          value: NEW_ADDRESS_OPTION_VALUE,
          label: "Add new address",
        },
      ];
    }

    return [
      ...addresses.map((address) => ({
        value: address.id,
        label: formatAddressOptionLabel(address),
      })),
      {
        value: NEW_ADDRESS_OPTION_VALUE,
        label: "Add new address",
      },
    ];
  }, [addresses]);

  const checkoutSteps = useMemo(() => {
    const hasShippingSelection = useNewAddress
      ? true
      : Boolean(selectedAddressId);
    const hasOrder = Boolean(order);

    return [
      {
        label: "Shipping",
        status: hasShippingSelection ? "complete" : "current",
      },
      {
        label: "Payment",
        status: hasShippingSelection
          ? hasOrder
            ? "complete"
            : "current"
          : "upcoming",
      },
      {
        label: "Review",
        status: hasOrder ? "current" : "upcoming",
      },
    ];
  }, [order, selectedAddressId, useNewAddress]);

  const loadCheckoutData = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const [cartResponse, addressResponse, accountSummary] = await Promise.all(
        [
          fetchCart({ signal }),
          fetchAddresses({ signal }).catch((addressError) => {
            if (signal?.aborted) {
              return { addresses: [] };
            }

            console.warn("Failed to load addresses:", addressError);
            return { addresses: [] };
          }),
          fetchAccountSummary({ signal }).catch(() => null),
        ]
      );

      if (signal?.aborted) {
        return;
      }

      setCart(cartResponse);
      setOrder(buildOrderFromCart(cartResponse));

      const availableAddresses = addressResponse?.addresses ?? [];
      setAddresses(availableAddresses);

      if (availableAddresses.length) {
        const defaultAddress =
          availableAddresses.find((address) => address.isDefault) ??
          availableAddresses[0];
        setSelectedAddressId(defaultAddress?.id ?? "");
        setUseNewAddress(false);
      } else {
        setSelectedAddressId("");
        setUseNewAddress(true);
        setAddressForm({ ...EMPTY_ADDRESS_FORM });
      }

      if (accountSummary?.profile) {
        setContactForm((prev) => ({
          fullName: accountSummary.profile.name ?? prev.fullName,
          phone: accountSummary.profile.phone ?? prev.phone,
          email: accountSummary.profile.email ?? prev.email,
        }));
      }
    } catch (loadError) {
      if (!signal?.aborted) {
        setError(loadError);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCheckoutData({ signal: controller.signal });

    return () => controller.abort();
  }, [loadCheckoutData]);

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressFormChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressSelection = (event) => {
    const value = event.target.value;

    if (value === NEW_ADDRESS_OPTION_VALUE) {
      setUseNewAddress(true);
      setSelectedAddressId("");
      setAddressForm({ ...EMPTY_ADDRESS_FORM });
      return;
    }

    setUseNewAddress(false);
    setSelectedAddressId(value);
  };

  useEffect(() => {
    if (!useNewAddress && selectedAddress) {
      setContactForm((prev) => ({
        fullName: prev.fullName || selectedAddress.recipient || "",
        phone: prev.phone || selectedAddress.phone || "",
        email: prev.email,
      }));
    }
  }, [selectedAddress, useNewAddress]);

  const handlePlaceOrder = async () => {
    if (isPlacingOrder || !order) {
      return;
    }

    setOrderError(null);
    setCheckoutIssues([]);

    const fullName = contactForm.fullName.trim();
    const email = contactForm.email.trim();
    const phone = contactForm.phone.trim();

    if (!fullName || !email || !phone) {
      setOrderError(
        "Please complete your contact information before continuing."
      );
      return;
    }

    const creatingNewAddress = useNewAddress || !selectedAddressId;

    if (creatingNewAddress) {
      const requiredFields = ["addressLine1", "city", "state", "postalCode"];
      const missingFields = requiredFields.filter(
        (field) => !addressForm[field]?.trim()
      );

      if (missingFields.length) {
        setOrderError(
          "Please complete your shipping address details before paying."
        );
        return;
      }
    }

    setIsPlacingOrder(true);
    setIsSavingAddress(false);

    try {
      let resolvedAddressId = selectedAddressId;
      let resolvedShippingAddress = selectedAddress;

      if (creatingNewAddress) {
        setIsSavingAddress(true);
        const newAddress = await createAddress({
          label: addressForm.label || "Home",
          recipient: fullName,
          phone,
          addressLine1: addressForm.addressLine1,
          addressLine2: addressForm.addressLine2,
          city: addressForm.city,
          state: addressForm.state,
          postalCode: addressForm.postalCode,
          country: addressForm.country || DEFAULT_COUNTRY,
          deliveryInstructions: addressForm.deliveryInstructions,
        });

        resolvedAddressId = newAddress.id;
        resolvedShippingAddress = newAddress;
        setAddresses((prev) => [newAddress, ...prev]);
        setSelectedAddressId(newAddress.id);
        setUseNewAddress(false);
      }

      const validation = await validateCart();
      let issues = validation?.issues ?? validation?.cartIssues ?? [];
      let normalizedCart = validation?.cart ?? cart;

      if (!validation?.valid) {
        const insufficientStockIssues = issues.filter(
          (issue) =>
            issue?.type === "insufficient_stock" &&
            Number.isFinite(issue?.availableQuantity)
        );

        let adjustedCart = normalizedCart;

        if (insufficientStockIssues.length) {
          for (const issue of insufficientStockIssues) {
            const itemId = issue?.itemId;
            const availableQuantity = Number(issue?.availableQuantity);

            if (!itemId || !Number.isFinite(availableQuantity)) {
              continue;
            }

            try {
              if (availableQuantity > 0) {
                adjustedCart = await updateCartItem(itemId, {
                  quantity: availableQuantity,
                });
              } else {
                adjustedCart = await removeCartItem(itemId);
              }
            } catch (adjustError) {
              console.warn(
                "Failed to auto-adjust cart item after stock validation",
                adjustError
              );
            }
          }

          try {
            const refreshedValidation = await validateCart();
            normalizedCart = refreshedValidation?.cart ?? adjustedCart;
            issues = refreshedValidation?.issues ?? [];
          } catch (revalidateError) {
            console.warn(
              "Failed to revalidate cart after stock adjustment",
              revalidateError
            );
            normalizedCart = adjustedCart;
          }
        }

        setCheckoutIssues(issues);
        setCart(normalizedCart);
        setOrder(buildOrderFromCart(normalizedCart));

        const issueMessage = issues
          .map((issue) => issue?.message)
          .filter(Boolean)
          .join(" ");

        setOrderError(
          issueMessage.length
            ? issueMessage
            : "We found some issues with your cart. Please review the highlighted items and try again."
        );
        return;
      }

      if (
        !normalizedCart ||
        !Array.isArray(normalizedCart.items) ||
        !normalizedCart.items.length
      ) {
        setCart(normalizedCart);
        setOrder(null);
        setOrderError("Your cart looks empty. Add items before checking out.");
        return;
      }

      setCart(normalizedCart);
      const nextOrder = buildOrderFromCart(normalizedCart);
      setOrder(nextOrder);

      const pricing = computePricing(normalizedCart);

      const verificationData = await processPayment({
        amount: pricing.total,
        shippingAddressId: resolvedAddressId,
        paymentMethodId: null,
        couponCode: validation?.appliedCoupon?.code ?? undefined,
        customerNotes: addressForm.deliveryInstructions,
        customerDetails: {
          name: fullName,
          email,
          phone,
        },
      });

      const resolvedOrder =
        verificationData?.order ??
        verificationData?.data?.order ??
        nextOrder ??
        order;
      const orderId =
        verificationData?.orderId ??
        verificationData?.data?.orderId ??
        resolvedOrder?._id ??
        resolvedOrder?.id ??
        null;

      const confirmationOrder = {
        ...resolvedOrder,
        id:
          resolvedOrder?.orderNumber ??
          resolvedOrder?.id ??
          orderId ??
          nextOrder?.id ??
          null,
        items: nextOrder?.items ?? resolvedOrder?.items ?? [],
        totals: {
          subtotal: pricing.subtotal,
          shipping: pricing.shipping,
          shippingLabel: nextOrder?.shippingLabel,
          tax: pricing.tax,
        },
        paymentMethod:
          resolvedOrder?.payment?.method ??
          resolvedOrder?.paymentMethod ??
          "Online payment",
        transactionId:
          resolvedOrder?.payment?.transactionId ??
          resolvedOrder?.transactionId ??
          verificationData?.payment?.transactionId ??
          null,
      };

      const shippingAddress = resolvedShippingAddress ??
        selectedAddress ?? {
          addressLine1: addressForm.addressLine1,
          addressLine2: addressForm.addressLine2,
          city: addressForm.city,
          state: addressForm.state,
          postalCode: addressForm.postalCode,
          country: addressForm.country,
          deliveryInstructions: addressForm.deliveryInstructions,
        };

      navigate("/confirmation", {
        replace: true,
        state: {
          order: confirmationOrder,
          orderId,
          pricing,
          customer: {
            name: fullName,
            email,
            phone,
          },
          shipping: {
            addressLines: [
              shippingAddress.addressLine1,
              shippingAddress.addressLine2,
              [
                shippingAddress.city,
                shippingAddress.state,
                shippingAddress.postalCode,
              ]
                .filter(Boolean)
                .join(", "),
              shippingAddress.country,
            ].filter(Boolean),
            instructions: shippingAddress.deliveryInstructions,
          },
        },
      });
    } catch (submissionError) {
      const apiMessage =
        submissionError?.payload?.message ??
        submissionError?.message ??
        "We couldn't complete the payment. Please try again.";

      setOrderError(apiMessage);
    } finally {
      setIsPlacingOrder(false);
      setIsSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07150f] text-emerald-50">
      <UserNavbar />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Shopping Cart", to: "/cart" },
            { label: "Checkout" },
          ]}
        />

        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            Checkout
          </h1>
          <p className="text-sm text-emerald-200/80">
            Complete your purchase in a few simple steps.
          </p>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-emerald-200/70">
            Loading your checkout details...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-6 text-sm text-rose-100">
            We couldn't load your checkout information. Please refresh the page.
          </div>
        ) : (
          <CheckoutProgress steps={checkoutSteps} />
        )}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <form
            className="space-y-6"
            onSubmit={(event) => event.preventDefault()}
          >
            <CheckoutSection
              title="Contact information"
              description="We'll use these details to send order updates."
              action={<span>Already have an account? Sign in</span>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <CheckoutField
                  label="Full name"
                  name="fullName"
                  autoComplete="name"
                  placeholder="e.g. Aditi Sharma"
                  value={contactForm.fullName}
                  onChange={handleContactChange}
                />
                <CheckoutField
                  label="Phone number"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={contactForm.phone}
                  onChange={handleContactChange}
                />
              </div>
              <CheckoutField
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={contactForm.email}
                onChange={handleContactChange}
              />
            </CheckoutSection>

            <CheckoutSection
              title="Shipping address"
              description="Your order will be delivered to this address."
            >
              {addresses.length ? (
                <CheckoutField
                  label="Saved addresses"
                  name="shippingAddressId"
                  options={addressOptions}
                  value={
                    useNewAddress ? NEW_ADDRESS_OPTION_VALUE : selectedAddressId
                  }
                  onChange={handleAddressSelection}
                />
              ) : (
                <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                  We don't have a saved address yet. Add a new one below to
                  continue.
                </div>
              )}

              {!useNewAddress && selectedAddress ? (
                <div className="mt-4 space-y-1 rounded-2xl border border-white/10 bg-[#0b1f19] p-4 text-sm text-emerald-200/80">
                  <p className="text-sm font-semibold text-white">
                    {selectedAddress.recipient ?? "Primary recipient"}
                  </p>
                  <p>{selectedAddress.addressLine1}</p>
                  {selectedAddress.addressLine2 ? (
                    <p>{selectedAddress.addressLine2}</p>
                  ) : null}
                  <p>
                    {[
                      selectedAddress.city,
                      selectedAddress.state,
                      selectedAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p>{selectedAddress.country}</p>
                  {selectedAddress.phone ? (
                    <p className="text-xs text-emerald-200/60">
                      Phone: {selectedAddress.phone}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {useNewAddress ? (
                <div className="mt-6 space-y-4">
                  <CheckoutField
                    label="Address label"
                    name="label"
                    placeholder="e.g. Home, Office"
                    value={addressForm.label}
                    onChange={handleAddressFormChange}
                  />
                  <CheckoutField
                    label="Address line 1"
                    name="addressLine1"
                    autoComplete="address-line1"
                    placeholder="Apartment, house number, street"
                    value={addressForm.addressLine1}
                    onChange={handleAddressFormChange}
                  />
                  <CheckoutField
                    label="Address line 2"
                    name="addressLine2"
                    autoComplete="address-line2"
                    placeholder="Landmark, area"
                    optional
                    value={addressForm.addressLine2}
                    onChange={handleAddressFormChange}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <CheckoutField
                      label="City"
                      name="city"
                      autoComplete="address-level2"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={handleAddressFormChange}
                    />
                    <CheckoutField
                      label="State"
                      name="state"
                      options={states}
                      value={addressForm.state}
                      onChange={handleAddressFormChange}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <CheckoutField
                      label="Postal code"
                      name="postalCode"
                      autoComplete="postal-code"
                      placeholder="PIN code"
                      value={addressForm.postalCode}
                      onChange={handleAddressFormChange}
                    />
                    <CheckoutField
                      label="Country"
                      name="country"
                      options={[
                        { value: "", label: "Select country", disabled: true },
                        { value: DEFAULT_COUNTRY, label: DEFAULT_COUNTRY },
                      ]}
                      value={addressForm.country}
                      onChange={handleAddressFormChange}
                    />
                  </div>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
                      Delivery instructions
                      <span className="ml-2 text-[0.7rem] font-medium lowercase text-emerald-200/50">
                        optional
                      </span>
                    </span>
                    <textarea
                      name="deliveryInstructions"
                      placeholder="e.g. Leave the package at the front desk"
                      value={addressForm.deliveryInstructions}
                      onChange={handleAddressFormChange}
                      rows={3}
                      className={TEXTAREA_FIELD_CLASSES}
                    />
                  </label>
                </div>
              ) : null}

              {checkoutIssues.length ? (
                <div className="mt-6 space-y-2 text-sm text-amber-200/80">
                  {checkoutIssues.map((issue) => (
                    <p key={`${issue?.type}-${issue?.itemId ?? "global"}`}>
                      {issue?.message ??
                        "We found an issue with an item in your cart."}
                    </p>
                  ))}
                </div>
              ) : null}
            </CheckoutSection>
          </form>

          {order ? (
            <div className="space-y-4">
              {orderError ? (
                <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {orderError}
                </div>
              ) : null}
              <CheckoutOrderSummary
                order={order}
                onPlaceOrder={handlePlaceOrder}
                isPlacingOrder={isPlacingOrder || isSavingAddress}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-emerald-200/70">
              No items in your order yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CheckoutPage;
