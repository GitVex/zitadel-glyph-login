import { GlyphPlinth } from "@/components/glyph/glyph-controls";
import { GlyphPasswordForm } from "@/components/glyph/glyph-forms";
import ui from "@/components/glyph/glyph-ui.module.css";
import { ThemeWrapper } from "@/components/theme-wrapper";
import { Translated } from "@/components/translated";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getBrandingSettings, getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("password");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;
  let { loginName, organization, requestId } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({ serviceConfig });

    if (org) {
      defaultOrganization = org.id;
    }
  }

  // also allow no session to be found (ignoreUnkownUsername)
  let sessionFactors;
  try {
    sessionFactors = await loadMostRecentSession({
      serviceConfig,
      sessionParams: {
        loginName,
        organization,
      },
    });
  } catch (error) {
    // ignore error to continue to show the password form
    console.warn(error);
  }

  const branding = await getBrandingSettings({
    serviceConfig,
    organization: organization ?? sessionFactors?.factors?.user?.organizationId ?? defaultOrganization,
  });
  const loginSettings = await getLoginSettings({
    serviceConfig,
    organization: organization ?? sessionFactors?.factors?.user?.organizationId ?? defaultOrganization,
  });

  const who = sessionFactors?.factors?.user?.displayName || loginName || sessionFactors?.factors?.user?.loginName;

  return (
    <ThemeWrapper branding={branding}>
      <GlyphPlinth title={<Translated i18nKey="verify.title" namespace="password" />}>
        {who && <p className={ui.who}>{who}</p>}

        {/* show error only if usernames should be shown to be unknown */}
        {(!sessionFactors || !loginName) && !loginSettings?.ignoreUnknownUsernames && (
          <p className={ui.statusError} role="alert">
            <Translated i18nKey="unknownContext" namespace="error" />
          </p>
        )}

        {loginName && (
          <GlyphPasswordForm
            loginName={loginName}
            requestId={requestId}
            organization={organization} // stick to "organization" as we still want to do user discovery based on the searchParams not the default organization, later the organization is determined by the found user
            defaultOrganization={defaultOrganization}
            loginSettings={loginSettings}
          />
        )}
      </GlyphPlinth>
    </ThemeWrapper>
  );
}
