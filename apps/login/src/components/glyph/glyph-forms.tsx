"use client";

/**
 * Glyph versions of the login-name and password forms and the identity-provider
 * buttons. The logic mirrors username-form.tsx, password-form.tsx and
 * sign-in-with-idp.tsx and calls the same server actions; only the presentation
 * differs (the mockup's plinth controls).
 */
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { handleServerActionResponse } from "@/lib/client-utils";
import { idpTypeToSlug } from "@/lib/idp";
import { redirectToIdp } from "@/lib/server/idp";
import { sendLoginname } from "@/lib/server/loginname";
import { resetPassword, sendPassword } from "@/lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import {
  IdentityProvider,
  IdentityProviderType,
  LoginSettings,
} from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { GlyphButton, GlyphField, GlyphLink, GlyphStatus } from "./glyph-controls";
import { isErrorResponse, isRedirectResponse, playGlyphExit, playGlyphGlitch, playGlyphInscribe } from "./glyph-exit";
import ui from "./glyph-ui.module.css";

type SamlData = { url: string; fields: Record<string, string> };

/**
 * Autofocus only when the stele sits beside the form. On phones the stele is above
 * it, and focusing the field would scroll the page straight past the stele.
 */
function useFocusOnWideScreens(focus: () => void) {
  useEffect(() => {
    if (window.matchMedia("(min-width: 900px)").matches) focus();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ------------------------------------------------------------------ */
/* Login name                                                          */
/* ------------------------------------------------------------------ */

type UsernameProps = {
  loginName: string | undefined;
  requestId: string | undefined;
  loginSettings: LoginSettings | undefined;
  organization?: string;
  defaultOrganization?: string;
  suffix?: string;
  hideSuffix?: boolean;
  submit: boolean;
  allowRegister: boolean;
};

export function GlyphUsernameForm({
  loginName,
  requestId,
  organization,
  defaultOrganization,
  suffix,
  hideSuffix,
  loginSettings,
  submit,
  allowRegister,
}: UsernameProps) {
  const { register, handleSubmit, formState, setFocus, watch } = useForm<{ loginName: string }>({
    mode: "onChange",
    defaultValues: { loginName: loginName ?? "" },
  });
  const t = useTranslations("loginname");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [samlData, setSamlData] = useState<SamlData | null>(null);

  const submitLoginName = useCallback(
    async (values: { loginName: string }, org?: string) => {
      setError("");
      setLoading(true);
      try {
        const res = await sendLoginname({
          loginName: values.loginName,
          organization: org,
          defaultOrganization,
          requestId,
          suffix,
          ignoreUnknownUsernames: loginSettings?.ignoreUnknownUsernames,
        });
        // the stele keeps the name: it scrambles into the top rows before the next step
        if (isRedirectResponse(res)) await playGlyphInscribe(values.loginName);
        if (isErrorResponse(res)) playGlyphGlitch();
        handleServerActionResponse(res, router, setSamlData, setError);
        return res;
      } catch {
        playGlyphGlitch();
        setError(t("errors.internalError"));
      } finally {
        setLoading(false);
      }
    },
    [defaultOrganization, requestId, suffix, loginSettings, router, t],
  );

  useFocusOnWideScreens(() => setFocus("loginName"));

  useEffect(() => {
    // same as the stock form: with submit=true and a login name, continue right away
    if (submit && loginName) {
      submitLoginName({ loginName }, organization);
    }
  }, [submit, loginName, organization, submitLoginName]);

  let label = t("labels.loginname");
  if (loginSettings?.disableLoginWithEmail && loginSettings?.disableLoginWithPhone) {
    label = t("labels.username");
  } else if (loginSettings?.disableLoginWithEmail) {
    label = t("labels.usernameOrPhoneNumber");
  } else if (loginSettings?.disableLoginWithPhone) {
    label = t("labels.usernameOrEmail");
  }

  const goRegister = () => {
    const params = new URLSearchParams();
    if (organization) params.append("organization", organization);
    if (requestId) params.append("requestId", requestId);
    router.push("/register?" + params);
  };

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <form className={ui.form} onSubmit={handleSubmit((v) => submitLoginName(v, organization))} noValidate>
        <GlyphField
          id="loginName"
          label={label}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          suffix={hideSuffix ? undefined : suffix}
          echo={watch("loginName") ?? ""}
          data-testid="username-text-input"
          {...register("loginName", { required: t("required.loginName") })}
        />
        <GlyphButton
          label={t("submit")}
          loading={loading}
          disabled={loading || !formState.isValid}
          data-testid="submit-button"
        />
        <GlyphStatus error={error} />
        <div className={ui.links}>
          <GlyphLink onClick={() => router.back()} data-testid="back-button">
            {tc("back")}
          </GlyphLink>
          {allowRegister && (
            <GlyphLink onClick={goRegister} disabled={loading} data-testid="register-button">
              {t("register")}
            </GlyphLink>
          )}
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

type PasswordProps = {
  loginSettings: LoginSettings | undefined;
  loginName: string;
  organization?: string;
  defaultOrganization?: string;
  requestId?: string;
};

export function GlyphPasswordForm({ loginSettings, loginName, organization, defaultOrganization, requestId }: PasswordProps) {
  const { register, handleSubmit, formState, setFocus } = useForm<{ password: string }>({ mode: "onChange" });
  const t = useTranslations("password");
  const tc = useTranslations("common");
  const router = useRouter();
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [samlData, setSamlData] = useState<SamlData | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusOnWideScreens(() => setFocus("password"));

  async function submitPassword(values: { password: string }) {
    setError("");
    setLoading(true);
    try {
      const response = await sendPassword({
        loginName,
        organization,
        defaultOrganization,
        checks: create(ChecksSchema, { password: { password: values.password } }),
        requestId,
      });
      if (isRedirectResponse(response)) await playGlyphExit();
      if (isErrorResponse(response)) playGlyphGlitch();
      handleServerActionResponse(response, router, setSamlData, setError);
    } catch {
      playGlyphGlitch();
      setError(t("verify.errors.couldNotVerifyPassword"));
    } finally {
      setLoading(false);
    }
  }

  async function resetPasswordAndContinue() {
    setError("");
    setInfo("");
    setLoading(true);
    const response = await resetPassword({ loginName, organization, defaultOrganization, requestId })
      .catch(() => {
        setError(t("errors.couldNotSendResetLink"));
        return;
      })
      .finally(() => setLoading(false));

    if (response && "error" in response) {
      setError(response.error as string);
      return;
    }
    setInfo(t("verify.info.passwordResetSent"));

    const params = new URLSearchParams({ loginName });
    if (organization) params.append("organization", organization);
    if (requestId) params.append("requestId", requestId);
    return router.push("/password/set?" + params);
  }

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <form className={ui.form} onSubmit={handleSubmit(submitPassword)} noValidate>
        <input type="hidden" name="loginName" autoComplete="username" value={loginName} readOnly />
        <GlyphField
          id="password"
          label={t("verify.labels.password")}
          type="password"
          autoComplete="current-password"
          data-testid="password-text-input"
          {...register("password", { required: t("verify.required.password") })}
        />
        <GlyphButton
          label={t("verify.submit")}
          loading={loading}
          disabled={loading || !formState.isValid}
          data-testid="submit-button"
        />
        <GlyphStatus error={error} info={info} />
        <div className={ui.links}>
          <GlyphLink onClick={() => router.back()} data-testid="back-button">
            {tc("back")}
          </GlyphLink>
          {!loginSettings?.hidePasswordReset && (
            <GlyphLink onClick={resetPasswordAndContinue} disabled={loading} data-testid="reset-button">
              {t("verify.resetPassword")}
            </GlyphLink>
          )}
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Identity providers                                                  */
/* ------------------------------------------------------------------ */

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GitHubMark() {
  // single-colour mark in the current text colour (white on dark, black on light)
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

function IdpButton({ idp }: { idp: IdentityProvider }) {
  const t = useTranslations("idp");
  const { pending } = useFormStatus();
  const isGoogle = idp.type === IdentityProviderType.GOOGLE;
  const isGithub = idp.type === IdentityProviderType.GITHUB || idp.type === IdentityProviderType.GITHUB_ES;
  const label = isGoogle ? t("signInWithGoogle") : isGithub ? t("signInWithGithub") : idp.name;

  return (
    <button type="submit" disabled={pending} className={`${ui.idp} ${isGoogle ? ui.google : ui.outlined}`}>
      {isGoogle ? <GoogleG /> : isGithub ? <GitHubMark /> : null}
      <span>{label}</span>
    </button>
  );
}

const SUPPORTED_IDPS = new Set<IdentityProviderType>([
  IdentityProviderType.APPLE,
  IdentityProviderType.OAUTH,
  IdentityProviderType.OIDC,
  IdentityProviderType.GITHUB,
  IdentityProviderType.GITHUB_ES,
  IdentityProviderType.AZURE_AD,
  IdentityProviderType.GOOGLE,
  IdentityProviderType.GITLAB,
  IdentityProviderType.GITLAB_SELF_HOSTED,
  IdentityProviderType.SAML,
  IdentityProviderType.LDAP,
  IdentityProviderType.JWT,
]);

export function GlyphIdpButtons({
  identityProviders,
  requestId,
  organization,
  sessionId,
  postErrorRedirectUrl,
}: {
  identityProviders: IdentityProvider[];
  requestId?: string;
  organization?: string;
  sessionId?: string;
  postErrorRedirectUrl?: string;
}) {
  const [state, action] = useActionState(redirectToIdp, {});

  useEffect(() => {
    if (state?.error) playGlyphGlitch();
  }, [state?.error]);

  return (
    <div className={ui.idps}>
      {state?.samlData && <AutoSubmitForm url={state.samlData.url} fields={state.samlData.fields} />}
      {identityProviders
        .filter((idp) => SUPPORTED_IDPS.has(idp.type))
        .map((idp, index) => (
          <form action={action} onSubmit={() => void playGlyphExit()} className={ui.idpForm} key={`idp-${idp.id}-${index}`}>
            <input type="hidden" name="id" value={idp.id} />
            <input type="hidden" name="provider" value={idpTypeToSlug(idp.type)} />
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="organization" value={organization} />
            {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
            {postErrorRedirectUrl && <input type="hidden" name="postErrorRedirectUrl" value={postErrorRedirectUrl} />}
            <IdpButton idp={idp} />
          </form>
        ))}
      {state?.error && <GlyphStatus error={state.error} />}
    </div>
  );
}
