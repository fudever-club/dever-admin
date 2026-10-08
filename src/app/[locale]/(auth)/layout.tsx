import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AuthLayout from "@/components/core/layouts/AuthLayout";

import { constants } from "@/settings";

export default async function RootAuthLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // Awaited for Next 15+ async cookies(); resolves immediately on Next 14.
  const token = (await cookies()).get(constants.ACCESS_TOKEN)?.value;

  if (token) {
    redirect(`/${locale}/user-management`);
  }

  return <AuthLayout>{children}</AuthLayout>;
}
