"use client";

import Image from "next/image";
import { Checkbox, Flex, Form, FormProps, Input, message } from "antd";
import { useRouter } from "next-nprogress-bar";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";

import Button from "@/components/core/common/Button";
import SelectLanguage from "@/components/core/layouts/MainLayout/SelectLanguage";
import Typography from "@/components/core/common/Typography";

import themeColors from "@/style/themes/default/colors";
import { useTranslation } from "@/app/i18n/client";
import { useSignInMutation } from "@/store/queries/auth";
import webStorageClient from "@/utils/webStorageClient";
import LoadingScreen from "@/components/core/common/LoadingScreen";
import { useState } from "react";

import * as S from "./styles";

type FieldType = {
  email: string;
  password: string;
  remember: boolean;
};

function SignInModule() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const [form] = Form.useForm<FieldType>();

  const { t } = useTranslation(params?.locale as string, "signIn");

  const [signIn, { isLoading }] = useSignInMutation();
  const [isNavigatingToAdmin, setIsNavigatingToAdmin] = useState<boolean>(false);

  const onFinish = async (values: FieldType) => {
    try {
      const res: any = await signIn(values).unwrap();

      const user = res?.data?.user;
      const token = res?.data?.token;

      if (!user?.isAdmin) {
        message.error(t("notAdmin"));
        return;
      }

      if (token) {
        webStorageClient.setToken(token);
        webStorageClient.set("_access_token", token);
        if (user) {
          webStorageClient.set("_user_info", user);
        }
      }

      message.success(t("signInSuccess"));
      setIsNavigatingToAdmin(true);
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = `/${locale}/user-management`;
        } else {
          router?.push(`/${locale}/user-management`);
        }
      }, 450);
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || t("signInFailed");
      message.error(errMsg);
    }
  };

  return (
    <S.Wrapper>
      {isNavigatingToAdmin && (
        <LoadingScreen message="Đang kết nối trung tâm điều hành DEVER..." />
      )}
      <Flex justify="space-between">
        <Image alt="" src={"/icons/layout/logo.svg"} width={40} height={40} />
        <SelectLanguage />
      </Flex>
      <Typography.Title
        level={2}
        $color={themeColors?.primary}
        $align="center"
        $margin="32px 0px 16px 0"
      >
        {t("welcome")}
      </Typography.Title>
      <Typography.Text $align="center" $margin="0px 0px 16px 0">
        {t("description")}
      </Typography.Text>
      <S.AccessNotice role="note">
        <strong>{t("accessNoticeTitle")}</strong>
        <span>{t("accessNoticeDescription")}</span>
      </S.AccessNotice>
      <Form<FieldType>
        form={form}
        name="admin-sign-in"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        validateTrigger={["onBlur", "onChange"]}
        aria-busy={isLoading}
      >
        <Form.Item<FieldType>
          label={t("emailLabel")}
          name="email"
          wrapperCol={{ span: 24 }}
          hasFeedback
          rules={[
            { required: true, message: t("emailRequired") },
            { type: "email", message: t("emailInvalid") },
          ]}
        >
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            autoFocus
            disabled={isLoading}
            aria-label={t("emailLabel")}
          />
        </Form.Item>

        <Form.Item<FieldType>
          label={t("passwordLabel")}
          name="password"
          wrapperCol={{ span: 24 }}
          hasFeedback
          rules={[{ required: true, message: t("passwordRequired") }]}
        >
          <Input.Password
            placeholder={t("passwordPlaceholder")}
            autoComplete="current-password"
            disabled={isLoading}
            aria-label={t("passwordLabel")}
          />
        </Form.Item>

        <S.LoginOptions>
            <Form.Item<FieldType>
              wrapperCol={{ span: 24 }}
              name="remember"
              valuePropName="checked"
            >
              <Checkbox disabled={isLoading}>{t("remember")}</Checkbox>
            </Form.Item>
            <S.RecoveryHint role="note">{t("recoveryHint")}</S.RecoveryHint>
        </S.LoginOptions>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            $width="100%"
            loading={isLoading}
            disabled={isLoading}
            aria-label={isLoading ? t("submitting") : t("submit")}
          >
            {isLoading ? t("submitting") : t("submit")}
          </Button>
        </Form.Item>

      </Form>
      <S.AccountHint>{t("accountHint")}</S.AccountHint>
    </S.Wrapper>
  );
}

export default SignInModule;
