"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "antd";
import { ReloadOutlined, HomeOutlined, WarningOutlined } from "@ant-design/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  scope?: "page" | "component";
  title?: string;
  description?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[DEVER Admin ErrorBoundary caught an error]:", error, errorInfo);
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  private handleReloadPage = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isComponentScope = this.props.scope === "component";

      if (isComponentScope) {
        return (
          <div
            style={{
              padding: "24px",
              margin: "16px 0",
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              <WarningOutlined />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "15px", fontWeight: 600 }}>
                {this.props.title || "Phân hệ quản trị này tạm thời bị gián đoạn"}
              </h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                {this.props.description || "Đã xảy ra lỗi khi tải dữ liệu bảng/form. Vui lòng thử lại."}
              </p>
            </div>
            <Button
              type="primary"
              size="middle"
              icon={<ReloadOutlined />}
              onClick={this.handleReset}
              style={{
                backgroundColor: "#0066CC",
                borderColor: "#0066CC",
                borderRadius: "8px",
                fontWeight: 500,
              }}
            >
              Thử lại
            </Button>
          </div>
        );
      }

      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 16px",
            textAlign: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#f0f7ff",
              color: "#0066CC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              marginBottom: "20px",
              boxShadow: "0 4px 12px rgba(0, 102, 204, 0.12)",
            }}
          >
            <WarningOutlined />
          </div>

          <h2
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "8px",
            }}
          >
            {this.props.title || "Bảng điều khiển quản trị gặp sự cố không mong muốn"}
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              maxWidth: "500px",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            {this.props.description ||
              "Lỗi đã được khoanh vùng an toàn. Bạn có thể làm mới trang hoặc quay lại trung tâm điều hành quản trị."}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={this.handleReloadPage}
              style={{
                backgroundColor: "#0066CC",
                borderColor: "#0066CC",
                borderRadius: "8px",
                fontWeight: 600,
                padding: "0 24px",
              }}
            >
              Tải lại trang
            </Button>

            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={this.handleGoHome}
              style={{
                borderRadius: "8px",
                fontWeight: 500,
                borderColor: "#cbd5e1",
                color: "#334155",
              }}
            >
              Về Trang chủ
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
