import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "FU-DEVER | Đăng nhập",
};

function SignUpPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/sign-in`);
}

export default SignUpPage;
