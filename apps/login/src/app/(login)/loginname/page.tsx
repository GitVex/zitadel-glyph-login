import { GlyphDivider, GlyphPlinth } from "@/components/glyph/glyph-controls";
import { GlyphIdpButtons, GlyphUsernameForm } from "@/components/glyph/glyph-forms";
import { ThemeWrapper } from "@/components/theme-wrapper";
import { Translated } from "@/components/translated";
import { getServiceConfig } from "@/lib/service-url";
import { getActiveIdentityProviders, getBrandingSettings, getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loginname");
  return { title: t("title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const loginName = searchParams?.loginName;
  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;
  const orgDomain = searchParams?.orgDomain;
  const submit: boolean = searchParams?.submit === "true";

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({ serviceConfig });
    if (org) {
      defaultOrganization = org.id;
    }
  }

  const loginSettings = await getLoginSettings({ serviceConfig, organization: organization ?? defaultOrganization });

  const identityProviders = await getActiveIdentityProviders({
    serviceConfig,
    orgId: organization ?? defaultOrganization,
  }).then((resp) => {
    return resp.identityProviders;
  });

  const branding = await getBrandingSettings({ serviceConfig, organization: organization ?? defaultOrganization });

  const showIdps = loginSettings?.allowExternalIdp && !!identityProviders?.length;

  return (
    <ThemeWrapper branding={branding}>
      <GlyphPlinth title={<Translated i18nKey="title" namespace="loginname" />}>
        {/* Glyph: single sign-on first, then a divider, then the name field */}
        {showIdps && (
          <GlyphIdpButtons
            identityProviders={identityProviders ?? []}
            requestId={requestId}
            organization={organization}
            postErrorRedirectUrl="/loginname"
          />
        )}

        {showIdps && loginSettings?.allowLocalAuthentication && <GlyphDivider />}

        {loginSettings?.allowLocalAuthentication && (
          <GlyphUsernameForm
            loginName={loginName}
            requestId={requestId}
            organization={organization} // stick to "organization" as we still want to do user discovery based on the searchParams not the default organization, later the organization is determined by the found user
            defaultOrganization={defaultOrganization}
            loginSettings={loginSettings}
            suffix={orgDomain}
            hideSuffix={branding?.hideLoginNameSuffix}
            submit={submit}
            allowRegister={!!loginSettings?.allowRegister}
          />
        )}
      </GlyphPlinth>
    </ThemeWrapper>
  );
}
