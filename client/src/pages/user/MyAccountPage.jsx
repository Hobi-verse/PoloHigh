import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UserNavbar from "../../components/user/common/UserNavbar.jsx";
import Breadcrumbs from "../../components/common/Breadcrumbs.jsx";
import {
  fetchAccountSummary,
  updateAccountPreferences,
  updateAccountProfile,
} from "../../api/user.js";
import { ApiError } from "../../api/client.js";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from "../../api/addresses.js";
import {
  deleteReview as deleteReviewRequest,
  fetchUserReviews,
} from "../../api/reviews.js";
import AccountNavigation from "../../components/user/account/AccountNavigation.jsx";
import OverviewSection from "../../components/user/account/OverviewSection.jsx";
import OrdersSection from "../../components/user/account/OrdersSection.jsx";
import AddressesSection from "../../components/user/account/AddressesSection.jsx";
import PaymentsSection from "../../components/user/account/PaymentsSection.jsx";
import PreferencesSection from "../../components/user/account/PreferencesSection.jsx";
import EditProfileDialog from "../../components/user/account/EditProfileDialog.jsx";
import AddressDialog from "../../components/user/account/AddressDialog.jsx";
import MyReviewsSection from "../../components/user/account/reviews/MyReviewsSection.jsx";
import WriteReviewDialog from "../../components/user/reviews/WriteReviewDialog.jsx";
import {
  accountSections,
  preferenceLabels,
} from "../../components/user/account/accountConstants.js";

const getApiErrorMessage = (error, fallbackMessage) => {
  if (error instanceof ApiError) {
    return (
      error.payload?.message ||
      error.payload?.error ||
      fallbackMessage ||
      "Something went wrong."
    );
  }

  return error?.message || fallbackMessage || "Something went wrong.";
};

const MyAccountPage = ({ isLoggedIn }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState("overview");
  const [preferences, setPreferences] = useState({});
  const [pendingPreference, setPendingPreference] = useState("");
  const [preferenceError, setPreferenceError] = useState("");
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [addressesState, setAddressesState] = useState({
    items: [],
    loading: false,
    error: "",
    pendingAction: null,
    statusMessage: "",
    statusTone: "info",
  });
  const [addressDialogState, setAddressDialogState] = useState({
    open: false,
    mode: "create",
    address: null,
    saving: false,
    error: "",
  });
  const [reviewsState, setReviewsState] = useState({
    items: [],
    loading: false,
    error: "",
    pagination: {
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
    },
  });
  const [reviewsLoadedOnce, setReviewsLoadedOnce] = useState(false);
  const [accountReviewDialogState, setAccountReviewDialogState] = useState({
    open: false,
    review: null,
    mode: "edit",
  });
  const successTimeoutRef = useRef();
  const addressStatusTimeoutRef = useRef();

  const loadSummary = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAccountSummary({ signal });
      if (signal?.aborted) {
        return;
      }

      setSummary(response ?? {});
      setPreferences(response?.preferences ?? {});
    } catch (apiError) {
      if (!signal?.aborted) {
        setError(apiError);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const loadAddresses = useCallback(async ({ signal } = {}) => {
    if (signal?.aborted) {
      return;
    }

    setAddressesState((current) => ({
      ...current,
      loading: true,
      error: "",
      statusMessage: "",
      statusTone: "info",
      pendingAction: null,
    }));

    try {
      const response = await fetchAddresses({ signal });
      if (signal?.aborted) {
        return;
      }

      setAddressesState((current) => ({
        ...current,
        items: Array.isArray(response?.addresses) ? response.addresses : [],
        loading: false,
        error: "",
      }));
    } catch (apiError) {
      if (signal?.aborted) {
        return;
      }

      setAddressesState((current) => ({
        ...current,
        loading: false,
        error: getApiErrorMessage(
          apiError,
          "We couldn't load your addresses right now."
        ),
      }));
    }
  }, []);

  const loadUserReviews = useCallback(
    async ({ page = 1, append = false } = {}) => {
      setReviewsState((current) => ({
        ...current,
        loading: true,
        error: append ? current.error : "",
      }));

      try {
        const response = await fetchUserReviews({ page, limit: 6 });
        const nextReviews = Array.isArray(response?.reviews)
          ? response.reviews
          : [];
        const nextPagination = response?.pagination ?? {
          currentPage: page,
          totalPages: page,
          hasMore: Boolean(response?.hasMore),
          nextPage: response?.nextPage,
        };
        const hasMore =
          typeof nextPagination.hasMore === "boolean"
            ? nextPagination.hasMore
            : nextPagination.nextPage
            ? true
            : (nextPagination.currentPage ?? page) <
              (nextPagination.totalPages ?? page);

        setReviewsState((current) => ({
          items: append ? [...current.items, ...nextReviews] : nextReviews,
          loading: false,
          error: "",
          pagination: {
            currentPage: nextPagination.currentPage ?? page,
            totalPages: nextPagination.totalPages ?? page,
            hasMore,
          },
        }));
        setReviewsLoadedOnce(true);
      } catch (apiError) {
        setReviewsState((current) => ({
          ...current,
          loading: false,
          error: getApiErrorMessage(
            apiError,
            "We couldn't load your reviews right now."
          ),
        }));
      }
    },
    []
  );

  useEffect(() => {
    if (
      selectedSection === "reviews" &&
      !reviewsLoadedOnce &&
      !reviewsState.loading
    ) {
      loadUserReviews();
    }
  }, [
    selectedSection,
    reviewsLoadedOnce,
    loadUserReviews,
    reviewsState.loading,
  ]);

  const handleRefreshReviews = useCallback(() => {
    loadUserReviews();
  }, [loadUserReviews]);

  const handleLoadMoreReviews = useCallback(() => {
    let nextPageToLoad = null;

    setReviewsState((current) => {
      if (current.loading || !current.pagination?.hasMore) {
        return current;
      }

      nextPageToLoad = (current.pagination?.currentPage ?? 1) + 1;
      return {
        ...current,
        loading: true,
      };
    });

    if (nextPageToLoad) {
      loadUserReviews({ page: nextPageToLoad, append: true });
    }
  }, [loadUserReviews]);

  const handleEditReview = useCallback((review) => {
    if (!review) {
      return;
    }

    setAccountReviewDialogState({
      open: true,
      review,
      mode: "edit",
    });
  }, []);

  const handleCloseReviewDialog = useCallback(() => {
    setAccountReviewDialogState({
      open: false,
      review: null,
      mode: "edit",
    });
  }, []);

  const handleReviewUpdated = useCallback((updatedReview) => {
    if (!updatedReview?.id) {
      return;
    }

    setReviewsState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === updatedReview.id
          ? {
              ...item,
              ...updatedReview,
              product: updatedReview.product ?? item.product,
            }
          : item
      ),
    }));
  }, []);

  const handleDeleteReview = useCallback(async (review) => {
    if (!review?.id) {
      return;
    }

    let confirmed = true;
    if (typeof window !== "undefined") {
      confirmed = window.confirm("Delete this review?\nThis cannot be undone.");
    }

    if (!confirmed) {
      return;
    }

    try {
      await deleteReviewRequest(review.id);
      setReviewsState((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== review.id),
        error: "",
      }));
    } catch (apiError) {
      const message = getApiErrorMessage(
        apiError,
        "We couldn't delete that review just yet."
      );
      setReviewsState((current) => ({
        ...current,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    const summaryController = new AbortController();
    const addressesController = new AbortController();

    loadSummary({ signal: summaryController.signal });
    loadAddresses({ signal: addressesController.signal });

    return () => {
      summaryController.abort();
      addressesController.abort();
      if (successTimeoutRef.current && typeof window !== "undefined") {
        window.clearTimeout(successTimeoutRef.current);
      }
      if (addressStatusTimeoutRef.current && typeof window !== "undefined") {
        window.clearTimeout(addressStatusTimeoutRef.current);
      }
    };
  }, [loadSummary, loadAddresses]);

  const handlePreferenceToggle = async (key) => {
    if (!key) {
      return;
    }

    const nextValue = !preferences?.[key];
    setPreferences((current) => ({
      ...current,
      [key]: nextValue,
    }));
    setPendingPreference(key);
    setPreferenceError("");
    setPreferenceMessage("");

    try {
      const updatedPreferences = await updateAccountPreferences({
        [key]: nextValue,
      });
      if (updatedPreferences && typeof updatedPreferences === "object") {
        setPreferences((current) => ({
          ...current,
          ...updatedPreferences,
        }));
      }
      if (successTimeoutRef.current && typeof window !== "undefined") {
        window.clearTimeout(successTimeoutRef.current);
      }
      const label = preferenceLabels[key] ?? key;
      setPreferenceMessage(`${label} updated.`);
      if (typeof window !== "undefined") {
        successTimeoutRef.current = window.setTimeout(() => {
          setPreferenceMessage("");
        }, 2800);
      }
    } catch (apiError) {
      setPreferences((current) => ({
        ...current,
        [key]: !nextValue,
      }));
      setPreferenceError(
        apiError?.message || "We couldn't update your preferences just yet."
      );
    } finally {
      setPendingPreference("");
    }
  };

  const setAddressStatus = useCallback((message, tone = "info") => {
    if (addressStatusTimeoutRef.current && typeof window !== "undefined") {
      window.clearTimeout(addressStatusTimeoutRef.current);
    }

    setAddressesState((current) => ({
      ...current,
      statusMessage: message,
      statusTone: tone,
    }));

    if (message && typeof window !== "undefined") {
      addressStatusTimeoutRef.current = window.setTimeout(() => {
        setAddressesState((current) => ({
          ...current,
          statusMessage: "",
          statusTone: "info",
        }));
      }, 3000);
    }
  }, []);

  const handleAddAddress = () => {
    setAddressDialogState({
      open: true,
      mode: "create",
      address: null,
      saving: false,
      error: "",
    });
  };

  const handleEditAddress = (address) => {
    if (!address) {
      return;
    }

    setAddressDialogState({
      open: true,
      mode: "edit",
      address,
      saving: false,
      error: "",
    });
  };

  const handleCloseAddressDialog = () => {
    setAddressDialogState({
      open: false,
      mode: "create",
      address: null,
      saving: false,
      error: "",
    });
  };

  const handleAddressSubmit = async (formValues) => {
    setAddressDialogState((current) => ({
      ...current,
      saving: true,
      error: "",
    }));

    const addressId =
      addressDialogState.mode === "edit"
        ? addressDialogState.address?.id
        : undefined;

    try {
      if (addressDialogState.mode === "edit" && addressId) {
        await updateAddress(addressId, formValues);
        await loadAddresses();
        setAddressStatus("Address updated.", "success");
      } else {
        await createAddress(formValues);
        await loadAddresses();
        setAddressStatus("Address saved.", "success");
      }

      setAddressDialogState({
        open: false,
        mode: "create",
        address: null,
        saving: false,
        error: "",
      });
    } catch (apiError) {
      setAddressDialogState((current) => ({
        ...current,
        saving: false,
        error: getApiErrorMessage(
          apiError,
          "We couldn't save this address right now."
        ),
      }));
    }
  };

  const handleDeleteAddress = async (address) => {
    if (!address?.id) {
      return;
    }

    let confirmed = true;
    if (typeof window !== "undefined") {
      confirmed = window.confirm("Remove this address?");
    }

    if (!confirmed) {
      return;
    }

    setAddressesState((current) => ({
      ...current,
      pendingAction: { id: address.id, type: "delete" },
      statusMessage: "",
    }));

    try {
      await deleteAddress(address.id);
      setAddressesState((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== address.id),
        pendingAction: null,
        error: "",
      }));
      setAddressStatus("Address deleted.", "success");
    } catch (apiError) {
      setAddressesState((current) => ({
        ...current,
        pendingAction: null,
      }));
      setAddressStatus(
        getApiErrorMessage(
          apiError,
          "We couldn't delete that address just yet."
        ),
        "error"
      );
    }
  };

  const handleSetDefaultAddress = async (address) => {
    if (!address?.id) {
      return;
    }

    setAddressesState((current) => ({
      ...current,
      pendingAction: { id: address.id, type: "set-default" },
      statusMessage: "",
    }));

    try {
      const updated = await setDefaultAddress(address.id);
      setAddressesState((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === updated.id
            ? { ...updated, isDefault: true }
            : { ...item, isDefault: false }
        ),
        pendingAction: null,
        error: "",
      }));
      setAddressStatus("Default address updated.", "success");
    } catch (apiError) {
      setAddressesState((current) => ({
        ...current,
        pendingAction: null,
      }));
      setAddressStatus(
        getApiErrorMessage(
          apiError,
          "We couldn't update your default address right now."
        ),
        "error"
      );
    }
  };

  const handleRefreshAddresses = () => {
    loadAddresses();
  };

  const orders = useMemo(
    () => (Array.isArray(summary?.recentOrders) ? summary.recentOrders : []),
    [summary]
  );
  const payments = useMemo(
    () =>
      Array.isArray(summary?.paymentMethods) ? summary.paymentMethods : [],
    [summary]
  );

  const handleProfileUpdate = useCallback(
    async (updates) => {
      try {
        const updated = await updateAccountProfile(updates);

        if (updated) {
          setSummary((current) => {
            if (!current) {
              return current;
            }

            const nextProfile = current.profile
              ? {
                  ...current.profile,
                  ...updated,
                }
              : updated;

            return {
              ...current,
              profile: nextProfile,
            };
          });
        }

        return updated;
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.payload?.message ||
              error.payload?.error ||
              "We couldn't update your profile right now."
            : error?.message || "We couldn't update your profile right now.";

        throw new Error(message);
      }
    },
    [setSummary]
  );

  return (
    <div className="min-h-screen bg-[#07150f] text-emerald-50">
      <UserNavbar isLoggedIn={isLoggedIn} />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "My account" }]}
        />

        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            My account
          </h1>
          <p className="text-sm text-emerald-200/80">
            Manage your personal details, orders, and how you hear from us.
          </p>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-emerald-200/70">
            Loading your account...
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-8 text-sm text-rose-100">
              We couldn&apos;t load your account details right now.
            </div>
            <button
              type="button"
              onClick={() => {
                loadSummary();
                loadAddresses();
              }}
              className="inline-flex items-center justify-center rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)]">
            <AccountNavigation
              sections={accountSections}
              selectedSection={selectedSection}
              onSelect={setSelectedSection}
              support={summary?.support}
            />

            <div className="space-y-6">
              {selectedSection === "overview" ? (
                <OverviewSection
                  profile={summary?.profile}
                  stats={summary?.stats}
                  recentOrders={orders}
                  paymentMethods={payments}
                  onShowOrders={() => setSelectedSection("orders")}
                  onEditProfile={() => setShowEditProfile(true)}
                />
              ) : null}

              {selectedSection === "orders" ? (
                <OrdersSection orders={orders} />
              ) : null}

              {selectedSection === "addresses" ? (
                <AddressesSection
                  addresses={addressesState.items}
                  loading={addressesState.loading}
                  error={addressesState.error}
                  onRefresh={handleRefreshAddresses}
                  onAdd={handleAddAddress}
                  onEdit={handleEditAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                  pendingAction={addressesState.pendingAction}
                  statusMessage={addressesState.statusMessage}
                  statusTone={addressesState.statusTone}
                />
              ) : null}

              {selectedSection === "payments" ? (
                <PaymentsSection
                  paymentMethods={payments}
                  walletBalance={summary?.profile?.walletBalance ?? 0}
                />
              ) : null}

              {selectedSection === "preferences" ? (
                <PreferencesSection
                  preferences={preferences}
                  togglePreference={handlePreferenceToggle}
                  pendingPreference={pendingPreference}
                  preferenceError={preferenceError}
                  preferenceMessage={preferenceMessage}
                  security={summary?.security}
                />
              ) : null}

              {selectedSection === "reviews" ? (
                <MyReviewsSection
                  reviews={reviewsState.items}
                  loading={reviewsState.loading}
                  error={reviewsState.error}
                  onRefresh={handleRefreshReviews}
                  onLoadMore={handleLoadMoreReviews}
                  hasMore={Boolean(reviewsState.pagination?.hasMore)}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                />
              ) : null}
            </div>
          </div>
        )}
      </main>
      <EditProfileDialog
        open={showEditProfile}
        profile={summary?.profile}
        onClose={() => setShowEditProfile(false)}
        onSubmit={handleProfileUpdate}
      />
      <AddressDialog
        open={addressDialogState.open}
        mode={addressDialogState.mode}
        initialAddress={addressDialogState.address}
        onClose={handleCloseAddressDialog}
        onSubmit={handleAddressSubmit}
        saving={addressDialogState.saving}
        error={addressDialogState.error}
      />
      <WriteReviewDialog
        open={accountReviewDialogState.open}
        mode={accountReviewDialogState.mode}
        productId={accountReviewDialogState.review?.product?.id}
        productName={accountReviewDialogState.review?.product?.title}
        existingReview={accountReviewDialogState.review}
        defaultOrderId={accountReviewDialogState.review?.orderId}
        onClose={handleCloseReviewDialog}
        onSuccess={handleReviewUpdated}
      />
    </div>
  );
};

export default MyAccountPage;
