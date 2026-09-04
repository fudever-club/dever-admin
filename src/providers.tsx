"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ThemeProvider } from "styled-components";
import StyledComponentsRegistry from "./services/base/styledComponentsRegistry";
import { themes } from "./style/themes";
import GlobalStyle from "./style/global";
import { App, ConfigProvider } from "antd";
import ProviderI18n from "./services/i18n/ProviderI18n";
import { Provider } from "react-redux";
import { store } from "./store";

if (typeof window !== "undefined") {
  const isExtensionError = (errOrMsg: any, source?: string) => {
    const str = String(errOrMsg?.stack || errOrMsg?.message || errOrMsg || source || "");
    return (
      str.includes("chrome-extension://") ||
      str.includes("moz-extension://") ||
      str.includes("M_ID") ||
      str.includes("nimlmejbmnecnaghgmbahmbaddhjbecg")
    );
  };

  window.addEventListener(
    "error",
    (event) => {
      if (isExtensionError(event.error) || isExtensionError(event.message, event.filename)) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (isExtensionError(event.reason)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProviderI18n>
      <StyledComponentsRegistry>
        <ThemeProvider theme={themes.default}>
          <GlobalStyle />
          <AntdRegistry>
            <ConfigProvider
              theme={{
                components: {
                  Button: {
                    colorPrimary: themes.default.colors.primary,
                    algorithm: true,
                  },
                  Input: {
                    paddingBlock: 8,
                  },
                  Typography: {
                    titleMarginBottom: 0,
                    titleMarginTop: 0,
                  },
                  Table: {
                    headerBg: themes.default.colors.primary,
                    headerColor: themes.default.colors.textWhite,
                    headerBorderRadius: 0,
                  },
                  Select: {
                    controlHeight: 40,
                  },
                },
                token: {
                  colorPrimary: themes.default.colors.primary,
                },
              }}
            >
              <App>
                <Provider store={store}>{children}</Provider>
              </App>
            </ConfigProvider>
          </AntdRegistry>
        </ThemeProvider>
      </StyledComponentsRegistry>
    </ProviderI18n>
  );
}

export default Providers;
