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
import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/hooks/redux-toolkit";
import { setAuthenticatedUser } from "@/store/slices/auth";
import { clearSession } from "@/store/session";

import * as S from "./styles";

type FieldType = {
  email: string;
  password: string;
  remember: boolean;
};

function SignInModule() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const submitting = useRef(false);
  const mounted = useRef(true);
  const navigationTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(navigationTimer.current);
    };
  }, []);
  const params = useParams();
  const locale = useLocale();
  const [form] = Form.useForm<FieldType>();

  const { t } = useTranslation(params?.locale as string, "signIn");

  const [signIn, { isLoading }] = useSignInMutation();
  const [isNavigatingToAdmin, setIsNavigatingToAdmin] = useState<boolean>(false);

  const onFinish = async (values: FieldType) => {
    if (submitting.current) return;
    submitting.current = true;
    let navigating = false;
    try {
      const res: any = await signIn(values).unwrap();
      if (!mounted.current) return;

      const user = res?.data?.user;
      const token = res?.data?.token;

      if (user?.isAdmin !== true) {
        dispatch(clearSession());
        message.error(t("notAdmin"));
        return;
      }

      if (typeof token !== "string" || !token.trim()) {
        dispatch(clearSession());
        message.error(t("signInFailed"));
        return;
      }
      dispatch(clearSession());
      webStorageClient.setToken(token);
      webStorageClient.set("_user_info", user);
      dispatch(setAuthenticatedUser(user));

      message.success(t("signInSuccess"));
      navigating = true;
      setIsNavigatingToAdmin(true);
      navigationTimer.current = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = `/${locale}/user-management`;
        } else {
          router?.push(`/${locale}/user-management`);
        }
      }, 450);
    } catch (err: any) {
      if (!mounted.current) return;
      const errMsg = err?.data?.message || err?.message || t("signInFailed");
      message.error(errMsg);
    } finally {
      if (!navigating) submitting.current = false;
    }
  };

  return (
    <S.Wrapper>
      {isNavigatingToAdmin && (
        <LoadingScreen message="Đang kết nối trung tâm điều hành DEVER..." />
      )}
      <Flex justify="space-between" align="center">
        <Image
          alt="FU-DEVER Logo"
          src={"/icons/layout/fu-dever-logo.png"}
          width={42}
          height={42}
          priority
          style={{ objectFit: "contain" }}
        />
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
        aria-busy={isLoading || isNavigatingToAdmin}
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
            disabled={isLoading || isNavigatingToAdmin}
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
            disabled={isLoading || isNavigatingToAdmin}
            aria-label={t("passwordLabel")}
          />
        </Form.Item>

        <S.LoginOptions>
            <Form.Item<FieldType>
              wrapperCol={{ span: 24 }}
              name="remember"
              valuePropName="checked"
            >
              <Checkbox disabled={isLoading || isNavigatingToAdmin}>{t("remember")}</Checkbox>
            </Form.Item>
            <S.RecoveryHint role="note">{t("recoveryHint")}</S.RecoveryHint>
        </S.LoginOptions>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            $width="100%"
            loading={isLoading}
            disabled={isLoading || isNavigatingToAdmin}
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
