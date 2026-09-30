import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FU-DEVER | Quản lý mùa giải",
};

import SeasonManagement from "@/components/modules/SeasonManagement";

export default function SeasonManagementPage() {
  return <SeasonManagement />;
}
