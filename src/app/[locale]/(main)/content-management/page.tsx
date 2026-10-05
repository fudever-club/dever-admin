import { redirect } from "next/navigation";

export default async function ContentManagementAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Canonical route is /[locale]/community-content — keep this alias as a
  // redirect so bookmarks survive without forking the UI into two URLs.
  redirect(`/${locale}/community-content`);
}
