import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FU-DEVER | Quản lý thư mời",
};

import InviteManagement from "@/components/modules/InviteManagement";

export default function InviteManagementPage() {
  return <InviteManagement />;
}
