import SectionCard from "./SectionCard.jsx";
import PreferenceToggle from "./PreferenceToggle.jsx";
import { preferenceLabels } from "./accountConstants.js";
import { formatDate } from "./accountUtils.js";

const PreferencesSection = ({
  preferences,
  togglePreference,
  pendingPreference,
  preferenceError,
  preferenceMessage,
  security,
}) => (
  <SectionCard
    title="Security & preferences"
    description="Control how we reach you and keep your account safe."
  >
    {preferenceError ? (
      <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-100">
        {preferenceError}
      </div>
    ) : null}
    {preferenceMessage ? (
      <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        {preferenceMessage}
      </div>
    ) : null}

    <div className="space-y-3">
      {Object.entries(preferenceLabels).map(([key, label]) => (
        <PreferenceToggle
          key={key}
          id={`pref-${key}`}
          label={label}
          description={
            key === "securityAlerts"
              ? "Important alerts about sign-ins and account settings."
              : undefined
          }
          checked={!!preferences?.[key]}
          busy={pendingPreference === key}
          onChange={() => togglePreference(key)}
        />
      ))}
    </div>

    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">Security check</h3>
      <dl className="mt-3 grid gap-3 text-sm text-emerald-200/80 md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-emerald-200/60">
            Last password update
          </dt>
          <dd className="mt-1 text-sm text-emerald-100">
            {formatDate(security?.lastPasswordChange)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.3em] text-emerald-200/60">
            2-step verification
          </dt>
          <dd className="mt-1 text-sm text-emerald-100">
            {security?.twoFactorEnabled ? "Enabled" : "Not enabled"}
          </dd>
        </div>
      </dl>

      {Array.isArray(security?.trustedDevices) &&
      security.trustedDevices.length ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/60">
            Trusted devices
          </p>
          {security.trustedDevices.map((device) => (
            <div
              key={device.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-emerald-200/80"
            >
              <p className="font-medium text-emerald-100">
                {device.device || "Trusted device"}
              </p>
              <p className="text-xs text-emerald-200/70">
                {device.location || "Location unknown"}
              </p>
              <p className="text-xs text-emerald-200/70">
                Last active: {formatDate(device.lastActive)}
              </p>
              {device.trusted ? (
                <span className="mt-2 inline-flex rounded-full border border-emerald-300/60 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-100">
                  Trusted
                </span>
              ) : (
                <button
                  type="button"
                  className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/80 transition hover:border-emerald-200/60 hover:text-emerald-100"
                >
                  Remove access
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className="mt-4 inline-flex items-center justify-center rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-200"
      >
        Review security settings
      </button>
    </div>
  </SectionCard>
);

export default PreferencesSection;
