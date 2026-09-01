"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Input,
  Typography,
  message,
  Tabs,
  Badge,
  Descriptions,
  Row,
  Col,
  Statistic,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Image,
  Upload,
  Divider,
  Alert,
  Tooltip,
  Popconfirm,
  QRCode,
} from "antd";
import {
  WalletOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
  BankOutlined,
  QrcodeOutlined,
  UserOutlined,
  DollarOutlined,
  FileDoneOutlined,
  EditOutlined,
  UploadOutlined,
  CopyOutlined,
  CheckOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import webStorageClient from "@/utils/webStorageClient";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface BankInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  transferSyntaxTemplate: string;
  qrTemplateUrl?: string;
  customQrUrl?: string;
}

interface FundCampaign {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  startDate: string;
  deadline: string;
  semester: string;
  status: "active" | "closed" | "upcoming";
  bankInfo: BankInfo;
  targetTotalAmount?: number;
  stats?: {
    totalPayments: number;
    approvedPayments: number;
    pendingPayments: number;
    totalCollected: number;
  };
  createdAt: string;
}

interface FundPayment {
  _id: string;
  campaignId: {
    _id: string;
    title: string;
    amount: number;
    deadline: string;
    semester: string;
  };
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    nickname?: string;
    email: string;
    MSSV?: string;
    avatar?: string;
  };
  amount: number;
  proofImageUrl: string;
  transactionCode?: string;
  note?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: {
    firstname: string;
    lastname: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export default function FundManagementModule() {
  const [activeTab, setActiveTab] = useState<string>("payments");
  const [loading, setLoading] = useState<boolean>(false);
  const [payments, setPayments] = useState<FundPayment[]>([]);
  const [campaigns, setCampaigns] = useState<FundCampaign[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<FundPayment | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Campaign Create/Edit Modal State
  const [campaignModalOpen, setCampaignModalOpen] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<FundCampaign | null>(null);
  const [customQrImage, setCustomQrImage] = useState<string>("");
  const [uploadingQr, setUploadingQr] = useState<boolean>(false);
  const [campaignForm] = Form.useForm();
  const [submittingCampaign, setSubmittingCampaign] = useState<boolean>(false);

  // Bill Image Zoom Modal State
  const [billImageModal, setBillImageModal] = useState<string | null>(null);

  const apiServer = process.env.NEXT_PUBLIC_API_SERVER || "http://localhost:5000";

  // Escape key listener for Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReviewModalOpen(false);
        setCampaignModalOpen(false);
        setBillImageModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const token = webStorageClient.getToken();
      const statusParam = selectedStatus !== "all" ? `?status=${selectedStatus}` : "";
      const res = await fetch(`${apiServer}/api/v1/funds/admin/payments${statusParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data || []);
      }
    } catch {
      message.error("Không thể tải danh sách nộp quỹ.");
    } finally {
      setLoading(false);
    }
  }, [apiServer, selectedStatus]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const token = webStorageClient.getToken();
      const res = await fetch(`${apiServer}/api/v1/funds/admin/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setCampaigns(json.data || []);
      }
    } catch {
      message.error("Không thể tải danh sách kỳ thu quỹ.");
    }
  }, [apiServer]);

  useEffect(() => {
    fetchPayments();
    fetchCampaigns();
  }, [fetchPayments, fetchCampaigns]);

  // Upload Custom QR Image for Treasurer / Admin
  const handleUploadQrFile = async (file: File) => {
    setUploadingQr(true);
    try {
      const token = webStorageClient.getToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiServer}/api/v1/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const url = json.url || json.data?.url || json.secure_url;
        setCustomQrImage(url);
        campaignForm.setFieldValue("customQrUrl", url);
        message.success("Tải ảnh mã QR thủ quỹ thành công!");
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          setCustomQrImage(url);
          campaignForm.setFieldValue("customQrUrl", url);
          message.success("Đã chọn ảnh mã QR!");
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setCustomQrImage(url);
        campaignForm.setFieldValue("customQrUrl", url);
        message.success("Đã chọn ảnh mã QR!");
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingQr(false);
    }
    return false;
  };

  // Handle Review Submission
  const handleReview = async () => {
    if (!selectedPayment) return;
    setSubmittingReview(true);
    try {
      const token = webStorageClient.getToken();
      const res = await fetch(`${apiServer}/api/v1/funds/admin/payments/${selectedPayment._id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewAction,
          reviewNotes,
        }),
      });

      if (res.ok) {
        message.success(
          reviewAction === "approved"
            ? "Đã duyệt minh chứng đóng quỹ thành công!"
            : "Đã từ chối minh chứng đóng quỹ."
        );
        setReviewModalOpen(false);
        fetchPayments();
        fetchCampaigns();
      } else {
        const err = await res.json();
        message.error(err.message || "Xử lý thất bại.");
      }
    } catch {
      message.error("Lỗi kết nối máy chủ.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Campaign Submit (Create / Edit)
  const handleCampaignSubmit = async (values: any) => {
    setSubmittingCampaign(true);
    try {
      const token = webStorageClient.getToken();
      const qrUrl = customQrImage || values.customQrUrl || `https://img.vietqr.io/image/${values.bankCode || "MB"}-${values.accountNumber}-compact2.png`;

      const payload = {
        title: values.title,
        description: values.description,
        amount: Number(values.amount),
        semester: values.semester,
        startDate: values.dateRange ? values.dateRange[0].toISOString() : new Date().toISOString(),
        deadline: values.dateRange ? values.dateRange[1].toISOString() : dayjs().add(30, "day").toISOString(),
        status: values.status || "active",
        bankInfo: {
          bankName: values.bankName || "MBBank",
          bankCode: values.bankCode || "MB",
          accountNumber: values.accountNumber,
          accountHolder: values.accountHolder,
          transferSyntaxTemplate: values.transferSyntaxTemplate || "DEVER [MSSV] [HoTen]",
          qrTemplateUrl: qrUrl,
          customQrUrl: customQrImage || values.customQrUrl || "",
        },
        targetTotalAmount: Number(values.targetTotalAmount) || 5000000,
      };

      const url = editingCampaign
        ? `${apiServer}/api/v1/funds/admin/campaigns/${editingCampaign._id}`
        : `${apiServer}/api/v1/funds/admin/campaigns`;
      const method = editingCampaign ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success(editingCampaign ? "Cập nhật kỳ thu quỹ thành công!" : "Tạo kỳ thu quỹ mới thành công!");
        setCampaignModalOpen(false);
        campaignForm.resetFields();
        setEditingCampaign(null);
        setCustomQrImage("");
        fetchCampaigns();
      } else {
        const err = await res.json();
        message.error(err.message || "Thao tác thất bại.");
      }
    } catch {
      message.error("Lỗi kết nối.");
    } finally {
      setSubmittingCampaign(false);
    }
  };

  // Metrics Calculation
  const activeCampaign = campaigns.find((c) => c.status === "active") || campaigns[0];
  const approvedPaymentsCount = payments.filter((p) => p.status === "approved").length;
  const pendingPaymentsCount = payments.filter((p) => p.status === "pending").length;
  const totalMoneyCollected = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const userName = [p.userId?.firstname, p.userId?.lastname].filter(Boolean).join(" ").toLowerCase();
    const userEmail = (p.userId?.email || "").toLowerCase();
    const userMSSV = (p.userId?.MSSV || "").toLowerCase();
    const txCode = (p.transactionCode || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return userName.includes(q) || userEmail.includes(q) || userMSSV.includes(q) || txCode.includes(q);
  });

  const paymentColumns = [
    {
      title: "Thành viên",
      key: "user",
      render: (_: any, record: FundPayment) => {
        const fullName = [record.userId?.firstname, record.userId?.lastname].filter(Boolean).join(" ") || "Thành viên";
        return (
          <Space direction="horizontal" size={12} style={{ display: "flex", alignItems: "center" }}>
            {record.userId?.avatar ? (
              <img
                src={record.userId.avatar}
                alt={fullName}
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "1px solid #E2E8F0" }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "#0066CC",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                {fullName.charAt(0)}
              </div>
            )}
            <div>
              <Text strong style={{ display: "block", color: "#0F172A", fontSize: 13 }}>{fullName}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{record.userId?.MSSV ? `MSSV: ${record.userId.MSSV}` : record.userId?.email}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Kỳ thu quỹ",
      key: "campaign",
      render: (_: any, record: FundPayment) => (
        <div>
          <Text strong style={{ display: "block", fontSize: 12, color: "#1E293B" }}>{record.campaignId?.title || "Quỹ CLB"}</Text>
          <Tag color="blue" style={{ fontSize: 10, marginTop: 2 }}>{record.campaignId?.semester || "Fall 2026"}</Tag>
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong style={{ fontSize: 14, color: "#0066CC" }}>
          {(amount || 100000).toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Biên lai / Bill",
      key: "proof",
      render: (_: any, record: FundPayment) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          size="small"
          onClick={() => setBillImageModal(record.proofImageUrl)}
          style={{ borderRadius: 8, fontSize: 11, fontWeight: 600 }}
        >
          Xem Bill
        </Button>
      ),
    },
    {
      title: "Mã giao dịch",
      dataIndex: "transactionCode",
      key: "transactionCode",
      render: (code: string) => <Text code style={{ fontSize: 11 }}>{code || "N/A"}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        if (status === "approved") {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Đã duyệt</Tag>;
        }
        if (status === "rejected") {
          return <Tag color="error" icon={<CloseCircleOutlined />}>Bị từ chối</Tag>;
        }
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>;
      },
    },
    {
      title: "Thời gian nộp",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Text style={{ fontSize: 11, color: "#64748B" }}>
          {dayjs(date).format("HH:mm DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: FundPayment) => (
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            style={{ backgroundColor: "#0066CC", borderRadius: 8, fontSize: 11, fontWeight: "bold" }}
            onClick={() => {
              setSelectedPayment(record);
              setReviewAction("approved");
              setReviewNotes("");
              setReviewModalOpen(true);
            }}
          >
            Duyệt
          </Button>
          <Button
            danger
            size="small"
            style={{ borderRadius: 8, fontSize: 11, fontWeight: "bold" }}
            onClick={() => {
              setSelectedPayment(record);
              setReviewAction("rejected");
              setReviewNotes("");
              setReviewModalOpen(true);
            }}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1300, margin: "0 auto", backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
            <WalletOutlined style={{ color: "#0066CC" }} /> Quản Lý Quỹ Câu Lạc Bộ (Club Fund)
          </Title>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: "block" }}>
            Theo dõi, duyệt biên lai chuyển khoản thành viên và cấu hình chiến dịch thu quỹ cùng mã QR thủ quỹ.
          </Text>
        </div>
        <Space size={12}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchPayments();
              fetchCampaigns();
            }}
            loading={loading}
            style={{ borderRadius: 10, fontWeight: 600, height: 38 }}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: "#0066CC", borderRadius: 10, fontWeight: "bold", height: 38, boxShadow: "0 4px 12px rgba(0,102,204,0.25)" }}
            onClick={() => {
              setEditingCampaign(null);
              setCustomQrImage("");
              campaignForm.resetFields();
              campaignForm.setFieldsValue({
                amount: 100000,
                semester: "Fall 2026",
                bankName: "TPBank (Ngân hàng Tiên Phong)",
                bankCode: "TPB",
                accountNumber: "81836101820",
                accountHolder: "NGUYEN THI NGOC ANH",
                transferSyntaxTemplate: "DEVER [MSSV] [HoTen]",
                status: "active",
                targetTotalAmount: 5000000,
              });
              setCampaignModalOpen(true);
            }}
          >
            Tạo Kỳ Thu Quỹ Mới
          </Button>
        </Space>
      </div>

      {/* KPI Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: "1px solid #E0F2FE",
              background: "linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)",
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: "#0369A1", textTransform: "uppercase" }}>Tổng tiền quỹ đã thu</span>}
              value={totalMoneyCollected}
              precision={0}
              suffix="đ"
              valueStyle={{ color: "#0066CC", fontWeight: 800, fontSize: 24 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: "1px solid #DCFCE7",
              background: "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: "#15803D", textTransform: "uppercase" }}>Lượt đóng đã duyệt</span>}
              value={approvedPaymentsCount}
              valueStyle={{ color: "#16A34A", fontWeight: 800, fontSize: 24 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: "1px solid #FEF3C7",
              background: "linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)",
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: "#B45309", textTransform: "uppercase" }}>Biên lai chờ duyệt</span>}
              value={pendingPaymentsCount}
              valueStyle={{ color: "#D97706", fontWeight: 800, fontSize: 24 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Kỳ quỹ hiện tại</span>
              <Text strong style={{ fontSize: 14, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeCampaign?.title || "Chưa có kỳ quỹ"}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Hạn chót: {activeCampaign?.deadline ? dayjs(activeCampaign.deadline).format("DD/MM/YYYY") : "N/A"}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Container */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "payments",
              label: (
                <span style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <FileDoneOutlined /> Duyệt Minh Chứng Nộp Quỹ
                  {pendingPaymentsCount > 0 && <Badge count={pendingPaymentsCount} style={{ marginLeft: 4 }} />}
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  {/* Filter & Search Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <Select
                      value={selectedStatus}
                      onChange={setSelectedStatus}
                      style={{ width: 180 }}
                      options={[
                        { value: "all", label: "Tất cả trạng thái" },
                        { value: "pending", label: "Chờ duyệt" },
                        { value: "approved", label: "Đã duyệt" },
                        { value: "rejected", label: "Bị từ chối" },
                      ]}
                    />
                    <Input.Search
                      placeholder="Tìm theo tên, email, MSSV, mã GD..."
                      allowClear
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: 320 }}
                    />
                  </div>

                  {/* Table */}
                  <Table
                    columns={paymentColumns}
                    dataSource={filteredPayments}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} lượt nộp` }}
                    style={{ borderRadius: 12, overflow: "hidden" }}
                  />
                </div>
              ),
            },
            {
              key: "campaigns",
              label: (
                <span style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <BankOutlined /> Cấu Hình Kỳ Thu Quỹ &amp; Mã QR Thủ Quỹ
                </span>
              ),
              children: (
                <div style={{ paddingTop: 12 }}>
                  <Row gutter={[20, 20]}>
                    {campaigns.map((camp) => (
                      <Col xs={24} lg={12} key={camp._id}>
                        <Card
                          hoverable
                          style={{
                            borderRadius: 16,
                            border: camp.status === "active" ? "2px solid #0066CC" : "1px solid #E2E8F0",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                              <Tag color={camp.status === "active" ? "green" : "default"} style={{ fontWeight: "bold" }}>
                                {camp.status === "active" ? "ĐANG MỞ THU QUỸ" : "ĐÃ KẾT THÚC"}
                              </Tag>
                              <Title level={5} style={{ margin: "6px 0 2px 0", color: "#0F172A" }}>
                                {camp.title}
                              </Title>
                              <Text type="secondary" style={{ fontSize: 12 }}>{camp.description || "Quỹ hoạt động & phát triển CLB"}</Text>
                            </div>
                            <Button
                              type="primary"
                              ghost
                              icon={<EditOutlined />}
                              onClick={() => {
                                setEditingCampaign(camp);
                                setCustomQrImage(camp.bankInfo?.customQrUrl || camp.bankInfo?.qrTemplateUrl || "");
                                campaignForm.setFieldsValue({
                                  title: camp.title,
                                  description: camp.description,
                                  amount: camp.amount,
                                  semester: camp.semester,
                                  dateRange: [dayjs(camp.startDate), dayjs(camp.deadline)],
                                  bankName: camp.bankInfo?.bankName,
                                  bankCode: camp.bankInfo?.bankCode,
                                  accountNumber: camp.bankInfo?.accountNumber,
                                  accountHolder: camp.bankInfo?.accountHolder,
                                  transferSyntaxTemplate: camp.bankInfo?.transferSyntaxTemplate,
                                  customQrUrl: camp.bankInfo?.customQrUrl,
                                  status: camp.status,
                                  targetTotalAmount: camp.targetTotalAmount || 5000000,
                                });
                                setCampaignModalOpen(true);
                              }}
                              style={{ borderRadius: 8 }}
                            >
                              Sửa / Đổi QR
                            </Button>
                          </div>

                          <Row gutter={12} align="middle" style={{ backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, marginBottom: 12 }}>
                            <Col xs={24} sm={16}>
                              <Descriptions size="small" column={1}>
                                <Descriptions.Item label="Mức thu">
                                  <Text strong style={{ color: "#0066CC" }}>{camp.amount?.toLocaleString("vi-VN")} đ / người</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Hạn chót">
                                  <Text strong style={{ color: "#DC2626" }}>{dayjs(camp.deadline).format("HH:mm DD/MM/YYYY")}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tài khoản">
                                  {camp.bankInfo?.bankName} - <b>{camp.bankInfo?.accountNumber}</b> ({camp.bankInfo?.accountHolder})
                                </Descriptions.Item>
                                <Descriptions.Item label="Cú pháp">
                                  <Text code>{camp.bankInfo?.transferSyntaxTemplate}</Text>
                                </Descriptions.Item>
                              </Descriptions>
                            </Col>
                            <Col xs={24} sm={8} style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 10, display: "block", marginBottom: 4, fontWeight: 700 }}>MÃ QR ĐANG ÁP DỤNG</Text>
                              {camp.bankInfo?.customQrUrl || camp.bankInfo?.qrTemplateUrl ? (
                                <img
                                  src={camp.bankInfo.customQrUrl || camp.bankInfo.qrTemplateUrl}
                                  alt="QR Preview"
                                  style={{ width: 90, height: 90, objectFit: "contain", borderRadius: 8, border: "1px solid #E2E8F0", padding: 2, background: "#FFF" }}
                                />
                              ) : (
                                <QRCode value={`https://fudever.com/fund?amount=${camp.amount}`} size={85} />
                              )}
                            </Col>
                          </Row>

                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748B" }}>
                            <span>Lượt hoàn thành: <b>{camp.stats?.approvedPayments || 0}</b></span>
                            <span style={{ color: "#0066CC", fontWeight: 700 }}>
                              Tổng thu: {(camp.stats?.totalCollected || 0).toLocaleString("vi-VN")} đ
                            </span>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={reviewAction === "approved" ? "Duyệt Biên Lai Chuyển Khoản" : "Từ Chối Minh Chứng Đóng Quỹ"}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={handleReview}
        confirmLoading={submittingReview}
        okText={reviewAction === "approved" ? "Xác Nhận Duyệt" : "Gửi Từ Chối"}
        okButtonProps={{ danger: reviewAction === "rejected", style: reviewAction === "approved" ? { backgroundColor: "#0066CC" } : {} }}
        style={{ borderRadius: 16 }}
      >
        {selectedPayment && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 10 }}>
            <Descriptions size="small" column={1} bordered style={{ borderRadius: 10, overflow: "hidden" }}>
              <Descriptions.Item label="Thành viên">
                {[selectedPayment.userId?.firstname, selectedPayment.userId?.lastname].filter(Boolean).join(" ")} ({selectedPayment.userId?.MSSV || selectedPayment.userId?.email})
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền">
                <Text strong style={{ color: "#0066CC" }}>{(selectedPayment.amount || 100000).toLocaleString("vi-VN")} đ</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mã giao dịch">
                <Text code>{selectedPayment.transactionCode || "Chưa cung cấp"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                {selectedPayment.note || "Không có"}
              </Descriptions.Item>
            </Descriptions>

            {/* Bill Preview Thumbnail */}
            {selectedPayment.proofImageUrl && (
              <div style={{ textAlign: "center" }}>
                <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Ảnh biên lai chuyển khoản (Nhấp để phóng to):</Text>
                <img
                  src={selectedPayment.proofImageUrl}
                  alt="Bill"
                  style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 10, border: "1px solid #E2E8F0", cursor: "pointer" }}
                  onClick={() => setBillImageModal(selectedPayment.proofImageUrl)}
                />
              </div>
            )}

            <div>
              <Text strong style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Lời nhắn / Ghi chú phản hồi cho thành viên:</Text>
              <TextArea
                rows={3}
                placeholder={reviewAction === "approved" ? "Đã xác nhận nhận tiền thành công." : "Lý do từ chối (ảnh mờ, sai cú pháp, chuyển thiếu tiền...)"}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                style={{ borderRadius: 8, fontSize: 12 }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Bill Zoom Modal */}
      <Modal
        open={Boolean(billImageModal)}
        onCancel={() => setBillImageModal(null)}
        footer={null}
        width={750}
        style={{ textAlign: "center" }}
      >
        {billImageModal && (
          <img src={billImageModal} alt="Bill Zoom" style={{ width: "100%", height: "auto", borderRadius: 12, marginTop: 16 }} />
        )}
      </Modal>

      {/* Campaign Create/Edit Modal with Custom QR Upload */}
      <Modal
        title={editingCampaign ? "Chỉnh Sửa Kỳ Thu Quỹ & Cấu Hình QR" : "Tạo Kỳ Thu Quỹ Mới"}
        open={campaignModalOpen}
        onCancel={() => setCampaignModalOpen(false)}
        onOk={() => campaignForm.submit()}
        confirmLoading={submittingCampaign}
        okText="Lưu Kỳ Thu Quỹ"
        okButtonProps={{ style: { backgroundColor: "#0066CC" } }}
        width={720}
        style={{ borderRadius: 16 }}
      >
        <Form
          form={campaignForm}
          layout="vertical"
          onFinish={handleCampaignSubmit}
          style={{ paddingTop: 10 }}
        >
          <Form.Item name="title" label="Tiêu đề kỳ thu quỹ" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}>
            <Input placeholder="Ví dụ: Quỹ CLB FU-DEVER Kỳ Fall 2026" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Số tiền mỗi thành viên (VNĐ)" rules={[{ required: true, message: "Nhập số tiền" }]}>
                <InputNumber
                  style={{ width: "100%", borderRadius: 8 }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="semester" label="Kỳ học" rules={[{ required: true, message: "Nhập kỳ học" }]}>
                <Input placeholder="Fall 2026" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dateRange" label="Thời gian thu quỹ (Bắt đầu - Deadline)" rules={[{ required: true, message: "Chọn thời gian" }]}>
            <DatePicker.RangePicker style={{ width: "100%", borderRadius: 8 }} format="DD/MM/YYYY" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bankName" label="Tên Ngân Hàng" rules={[{ required: true, message: "Nhập tên ngân hàng" }]}>
                <Input placeholder="TPBank / MBBank..." style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankCode" label="Mã Ngân Hàng (VietQR Code)" rules={[{ required: true, message: "Nhập mã ngân hàng" }]}>
                <Input placeholder="TPB, MB, VCB..." style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountNumber" label="Số Tài Khoản Nhận Quỹ" rules={[{ required: true, message: "Nhập số tài khoản" }]}>
                <Input placeholder="05371798501" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountHolder" label="Tên Chủ Tài Khoản (Thủ Quỹ)" rules={[{ required: true, message: "Nhập tên chủ tài khoản" }]}>
                <Input placeholder="DANG QUANG NHAT" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="transferSyntaxTemplate" label="Cú pháp chuyển khoản">
            <Input placeholder="DEVER [MSSV] [HoTen]" style={{ borderRadius: 8 }} />
          </Form.Item>

          {/* Dedicated Custom QR Upload for Treasurer */}
          <div style={{ backgroundColor: "#F0F9FF", padding: 16, borderRadius: 12, border: "1px dashed #0066CC", marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, color: "#0066CC", display: "block", marginBottom: 6 }}>
              <QrcodeOutlined /> Tải Lên Ảnh Mã QR Ngân Hàng Của Thủ Quỹ (Tùy chọn):
            </Text>
            <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 10 }}>
              Nếu tải ảnh lên, hệ thống sẽ ưu tiên hiển thị ảnh QR chuẩn của thủ quỹ. Nếu không tải, hệ thống sẽ tự động vẽ mã VietQR động.
            </Text>
            
            <Upload beforeUpload={handleUploadQrFile} showUploadList={false}>
              <Button icon={<UploadOutlined />} loading={uploadingQr} style={{ borderRadius: 8, fontWeight: 600 }}>
                {customQrImage ? "Thay Đổi Ảnh Mã QR" : "Chọn Ảnh Mã QR Của Thủ Quỹ"}
              </Button>
            </Upload>

            {customQrImage && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={customQrImage}
                  alt="Custom QR Preview"
                  style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, border: "1px solid #BAE6FD", background: "#FFF" }}
                />
                <div>
                  <Text strong style={{ color: "#16A34A", fontSize: 12, display: "block" }}>✓ Đã đính kèm ảnh mã QR</Text>
                  <Button type="link" danger size="small" onClick={() => setCustomQrImage("")} style={{ padding: 0, fontSize: 11 }}>
                    Xóa ảnh và dùng VietQR tự động
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
