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
  Progress,
  Statistic,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Image,
  Empty,
  Popconfirm,
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
          qrTemplateUrl: values.qrTemplateUrl || `https://img.vietqr.io/image/${values.bankCode || "MB"}-${values.accountNumber}-compact2.png`,
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
          <Space direction="horizontal" size={12}>
            {record.userId?.avatar ? (
              <img
                src={record.userId.avatar}
                alt={fullName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0066CC] text-white flex items-center justify-center font-bold text-sm">
                {fullName.charAt(0)}
              </div>
            )}
            <div>
              <Text strong className="text-slate-900 block">{fullName}</Text>
              <Text type="secondary" className="text-xs">{record.userId?.MSSV ? `MSSV: ${record.userId.MSSV}` : record.userId?.email}</Text>
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
          <Text strong className="text-xs text-slate-800 block">{record.campaignId?.title || "Quỹ CLB"}</Text>
          <Tag color="blue" className="text-[10px] mt-0.5">{record.campaignId?.semester || "Fall 2026"}</Tag>
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong className="text-sm text-[#0066CC]">
          {(amount || 100000).toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Biên lai / Bill",
      key: "proof",
      render: (_: any, record: FundPayment) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => setBillImageModal(record.proofImageUrl)}
          className="text-xs font-semibold text-[#0066CC] p-0"
        >
          Xem Bill
        </Button>
      ),
    },
    {
      title: "Mã giao dịch",
      dataIndex: "transactionCode",
      key: "transactionCode",
      render: (code: string) => <Text code className="text-xs">{code || "N/A"}</Text>,
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
        <Text className="text-xs text-slate-500">
          {dayjs(date).format("HH:mm DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: FundPayment) => (
        <Space size={8}>
          <Button
            type="primary"
            size="small"
            className="bg-[#0066CC] text-xs font-semibold rounded-lg"
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
            className="text-xs font-semibold rounded-lg"
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={3} className="!mb-1 flex items-center gap-2 text-slate-900">
            <WalletOutlined className="text-[#0066CC]" /> Quản Lý Quỹ Câu Lạc Bộ (Club Fund)
          </Title>
          <Text type="secondary" className="text-xs">
            Theo dõi, duyệt biên lai chuyển khoản và cấu hình các chiến dịch thu quỹ thành viên.
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchPayments();
              fetchCampaigns();
            }}
            loading={loading}
            className="rounded-xl font-semibold text-xs"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-[#0066CC] hover:bg-[#004C99] rounded-xl font-bold text-xs shadow-md"
            onClick={() => {
              setEditingCampaign(null);
              campaignForm.resetFields();
              campaignForm.setFieldsValue({
                amount: 100000,
                semester: "Fall 2026",
                bankName: "MBBank (Ngân hàng Quân Đội)",
                bankCode: "MB",
                accountNumber: "0912345678",
                accountHolder: "CLB LAP TRINH FU DEVER",
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

      {/* Analytics Overview Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-slate-500 uppercase">Tổng tiền quỹ đã thu</span>}
              value={totalMoneyCollected}
              precision={0}
              suffix="đ"
              valueStyle={{ color: "#0066CC", fontWeight: "800", fontSize: "22px" }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-slate-500 uppercase">Lượt đóng đã duyệt</span>}
              value={approvedPaymentsCount}
              valueStyle={{ color: "#10B981", fontWeight: "800", fontSize: "22px" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-bold text-slate-500 uppercase">Biên lai chờ duyệt</span>}
              value={pendingPaymentsCount}
              valueStyle={{ color: "#F59E0B", fontWeight: "800", fontSize: "22px" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase block">Kỳ quỹ hiện tại</span>
              <Text strong className="text-sm text-slate-900 block truncate">
                {activeCampaign?.title || "Chưa có kỳ quỹ"}
              </Text>
              <Text type="secondary" className="text-[11px] block">
                Hạn chót: {activeCampaign?.deadline ? dayjs(activeCampaign.deadline).format("DD/MM/YYYY") : "N/A"}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card className="rounded-3xl border border-slate-200/80 shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "payments",
              label: (
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <FileDoneOutlined /> Duyệt Minh Chứng Nộp Quỹ
                  {pendingPaymentsCount > 0 && (
                    <Badge count={pendingPaymentsCount} className="ml-1" />
                  )}
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  {/* Filters & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Space size={8}>
                      <Select
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                        className="w-36 text-xs"
                        options={[
                          { value: "all", label: "Tất cả trạng thái" },
                          { value: "pending", label: "Chờ duyệt" },
                          { value: "approved", label: "Đã duyệt" },
                          { value: "rejected", label: "Bị từ chối" },
                        ]}
                      />
                    </Space>
                    <Input.Search
                      placeholder="Tìm theo tên, email, MSSV, mã GD..."
                      allowClear
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-80 text-xs"
                    />
                  </div>

                  {/* Table */}
                  <Table
                    columns={paymentColumns}
                    dataSource={filteredPayments}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} lượt nộp` }}
                    className="rounded-2xl overflow-hidden border border-slate-100"
                  />
                </div>
              ),
            },
            {
              key: "campaigns",
              label: (
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <BankOutlined /> Cấu Hình &amp; Kỳ Thu Quỹ
                </span>
              ),
              children: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {campaigns.map((camp) => (
                    <Card
                      key={camp._id}
                      className="rounded-2xl border border-blue-100/80 hover:border-[#0066CC] shadow-sm transition-all"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Tag color={camp.status === "active" ? "green" : "default"} className="font-bold">
                              {camp.status === "active" ? "Đang Mở Thu Quỹ" : "Đã Kết Thúc"}
                            </Tag>
                            <h3 className="text-base font-bold text-slate-900 mt-1">{camp.title}</h3>
                            <p className="text-xs text-slate-500">{camp.description || "Quỹ hoạt động CLB"}</p>
                          </div>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingCampaign(camp);
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
                                status: camp.status,
                                targetTotalAmount: camp.targetTotalAmount || 5000000,
                              });
                              setCampaignModalOpen(true);
                            }}
                          />
                        </div>

                        <Descriptions size="small" column={1} className="bg-slate-50 p-3 rounded-xl">
                          <Descriptions.Item label="Mức thu">{camp.amount?.toLocaleString("vi-VN")} đ / thành viên</Descriptions.Item>
                          <Descriptions.Item label="Hạn chót">{dayjs(camp.deadline).format("HH:mm DD/MM/YYYY")}</Descriptions.Item>
                          <Descriptions.Item label="Tài khoản">{camp.bankInfo?.bankName} - {camp.bankInfo?.accountNumber} ({camp.bankInfo?.accountHolder})</Descriptions.Item>
                          <Descriptions.Item label="Cú pháp">{camp.bankInfo?.transferSyntaxTemplate}</Descriptions.Item>
                        </Descriptions>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 font-medium">Lượt hoàn thành: <b>{camp.stats?.approvedPayments || 0}</b></span>
                          <span className="text-[#0066CC] font-bold">Tổng thu: {(camp.stats?.totalCollected || 0).toLocaleString("vi-VN")} đ</span>
                        </div>
                      </div>
                    </Card>
                  ))}
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
        okButtonProps={{ danger: reviewAction === "rejected", className: reviewAction === "approved" ? "bg-[#0066CC]" : "" }}
        className="rounded-2xl"
      >
        {selectedPayment && (
          <div className="space-y-4 py-2">
            <Descriptions size="small" column={1} bordered className="rounded-xl overflow-hidden">
              <Descriptions.Item label="Thành viên">
                {[selectedPayment.userId?.firstname, selectedPayment.userId?.lastname].filter(Boolean).join(" ")} ({selectedPayment.userId?.MSSV || selectedPayment.userId?.email})
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền">
                {(selectedPayment.amount || 100000).toLocaleString("vi-VN")} đ
              </Descriptions.Item>
              <Descriptions.Item label="Mã giao dịch">
                {selectedPayment.transactionCode || "Chưa cung cấp"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú từ thành viên">
                {selectedPayment.note || "Không có"}
              </Descriptions.Item>
            </Descriptions>

            {/* Bill Preview Thumbnail */}
            {selectedPayment.proofImageUrl && (
              <div className="text-center">
                <Text strong className="text-xs block mb-1">Ảnh biên lai chuyển khoản:</Text>
                <img
                  src={selectedPayment.proofImageUrl}
                  alt="Bill"
                  className="max-h-56 mx-auto rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-90"
                  onClick={() => setBillImageModal(selectedPayment.proofImageUrl)}
                />
              </div>
            )}

            <div>
              <Text strong className="text-xs block mb-1">Lời nhắn / Ghi chú phản hồi cho thành viên:</Text>
              <TextArea
                rows={3}
                placeholder={reviewAction === "approved" ? "Đã xác nhận nhận tiền thành công." : "Lý do từ chối (ảnh mờ, sai cú pháp, chuyển thiếu tiền...)"}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="rounded-xl text-xs"
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
        width={700}
        className="text-center"
      >
        {billImageModal && (
          <img src={billImageModal} alt="Bill Zoom" className="w-full h-auto rounded-xl mt-4" />
        )}
      </Modal>

      {/* Campaign Create/Edit Modal */}
      <Modal
        title={editingCampaign ? "Chỉnh Sửa Kỳ Thu Quỹ" : "Tạo Kỳ Thu Quỹ Mới"}
        open={campaignModalOpen}
        onCancel={() => setCampaignModalOpen(false)}
        onOk={() => campaignForm.submit()}
        confirmLoading={submittingCampaign}
        okText="Lưu Kỳ Thu Quỹ"
        okButtonProps={{ className: "bg-[#0066CC]" }}
        width={680}
        className="rounded-2xl"
      >
        <Form
          form={campaignForm}
          layout="vertical"
          onFinish={handleCampaignSubmit}
          className="pt-3"
        >
          <Form.Item name="title" label="Tiêu đề kỳ thu quỹ" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}>
            <Input placeholder="Ví dụ: Quỹ CLB FU-DEVER Kỳ Fall 2026" className="rounded-xl text-xs" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Số tiền mỗi thành viên (VNĐ)" rules={[{ required: true, message: "Nhập số tiền" }]}>
                <InputNumber
                  className="w-full rounded-xl text-xs"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ""))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="semester" label="Kỳ học" rules={[{ required: true, message: "Nhập kỳ học" }]}>
                <Input placeholder="Fall 2026" className="rounded-xl text-xs" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dateRange" label="Thời gian thu quỹ (Bắt đầu - Deadline)" rules={[{ required: true, message: "Chọn thời gian" }]}>
            <DatePicker.RangePicker className="w-full rounded-xl text-xs" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="description" label="Mục đích sử dụng quỹ">
            <TextArea rows={2} placeholder="Mô tả các hoạt động sẽ chi tiêu từ quỹ..." className="rounded-xl text-xs" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bankName" label="Tên Ngân Hàng">
                <Input placeholder="MBBank (Ngân hàng Quân Đội)" className="rounded-xl text-xs" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankCode" label="Mã Ngân Hàng (VietQR Code)">
                <Input placeholder="MB, VCB, TPB..." className="rounded-xl text-xs" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountNumber" label="Số Tài Khoản">
                <Input placeholder="0912345678" className="rounded-xl text-xs" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountHolder" label="Chủ Tài Khoản">
                <Input placeholder="CLB LAP TRINH FU DEVER" className="rounded-xl text-xs" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="transferSyntaxTemplate" label="Cú pháp chuyển khoản chuẩn">
            <Input placeholder="DEVER [MSSV] [HoTen]" className="rounded-xl text-xs" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
