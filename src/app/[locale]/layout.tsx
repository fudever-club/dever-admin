import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import Providers from "@/providers";
import DeverRouteLoader from "@/components/ui/DeverRouteLoader";
import { Suspense } from "react";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtErr(e, s) {
                  var str = String((e && (e.stack || e.message)) || e || s || '');
                  return str.indexOf('chrome-extension://') !== -1 ||
                         str.indexOf('moz-extension://') !== -1 ||
                         str.indexOf('M_ID') !== -1 ||
                         str.indexOf('nimlmejbmnecnaghgmbahmbaddhjbecg') !== -1;
                }
                window.addEventListener('error', function(ev) {
                  if (isExtErr(ev.error, ev.filename) || isExtErr(ev.message)) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(ev) {
                  if (isExtErr(ev.reason)) {
                    ev.stopImmediatePropagation();
                    ev.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className={deverSans.className} suppressHydrationWarning={true}>
        <Providers>
          <Suspense fallback={null}>
            <DeverRouteLoader />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
