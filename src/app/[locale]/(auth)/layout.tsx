import { getCookie } from "cookies-next";
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
  const token = getCookie(constants.ACCESS_TOKEN, { cookies });

  if (token) {
    redirect(`/${locale}/user-management`);
  }

  return <AuthLayout>{children}</AuthLayout>;
}
