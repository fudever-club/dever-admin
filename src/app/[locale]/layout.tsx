import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import Providers from "@/providers";

const deverSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

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
      <body className={deverSans.className} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
