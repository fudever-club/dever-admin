import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FU-DEVER | Trang quản trị",
};

import DashboardModule from "@/components/modules/Dashboard";

export default function DashboardPage() {
  return <DashboardModule />;
}
