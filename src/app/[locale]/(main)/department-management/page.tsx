import DepartmentManagementModule from "@/components/modules/DepartmentManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FU-DEVER | Quản lý Ban",
};

export default function DashboardPage() {
  return <DepartmentManagementModule />;
}
