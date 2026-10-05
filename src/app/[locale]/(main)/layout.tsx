import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import MainLayout from "@/components/core/layouts/MainLayout";

import { constants } from "@/settings";

export default async function RootMainLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const token = getCookie(constants.ACCESS_TOKEN, { cookies });

  if (!token) {
    redirect(`/${locale}/sign-in`);
  }

  return <MainLayout>{children}</MainLayout>;
}
