import { redirect } from "next/navigation";

export default function ContentManagementAliasPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Canonical route is /[locale]/community-content — keep this alias as a
  // redirect so bookmarks survive without forking the UI into two URLs.
  redirect(`/${locale}/community-content`);
}
