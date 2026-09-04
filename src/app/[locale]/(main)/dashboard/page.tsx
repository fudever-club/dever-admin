import { redirect } from "next/navigation";

export default function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/user-management`);
}
