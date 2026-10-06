import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FU-DEVER | Bảng điều khiển",
};

import DashboardModule from "@/components/modules/Dashboard";

export default function DashboardPage() {
  return <DashboardModule />;
}
