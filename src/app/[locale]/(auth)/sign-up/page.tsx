import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "FU-DEVER | Đăng nhập",
};

async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/sign-in`);
}

export default SignUpPage;
