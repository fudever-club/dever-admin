import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FU-DEVER | Quản lý người dùng",
};

import UsersManagementModule from "@/components/modules/UsersManagement";

export default function UserManagementPage() {
  return <UsersManagementModule />;
}
