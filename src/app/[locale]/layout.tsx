import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Providers from "@/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FU-DEVER",
  description: "Trang quản trị FU-DEVER",
  icons: "/icons/layout/logo.svg",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: {
    locale: string;
  };
}>) {
  return (
    <html lang={params?.locale}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
