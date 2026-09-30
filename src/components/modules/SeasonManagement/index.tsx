"use client";

// TODO(i18n): hardcode tiếng Việt như FundManagement/InviteManagement để giữ scope;
// full i18n (vi/en seasonManagement.json) làm sau.
import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  TableProps,
  Tag,
  Typography,
  message,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import {
  Season,
  useCreateSeasonMutation,
  useListSeasonsQuery,
  useUpdateSeasonMutation,
} from "@/store/queries/seasonManagement";

import * as S from "./styles";

const { Title, Text } = Typography;

interface SeasonFormValues {
  name: string;
  dateRange: [Dayjs, Dayjs];
  status: "upcoming" | "active";
  easy: number;
  medium: number;
  hard: number;
}

function formatSeasonWindow(startDate: string, endDate: string): string {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid() || !end.isValid()) return "—";
  return `${start.format("DD/MM/YYYY")} – ${end.format("DD/MM/YYYY")}`;
}

function getSeasonStatusTag(status: Season["status"]) {
  if (status === "active") return <Tag color="success">Đang chạy</Tag>;
  if (status === "upcoming") return <Tag color="processing">Sắp diễn ra</Tag>;
  return <Tag color="default">Đã kết thúc</Tag>;
}

export default function SeasonManagement() {
  const [form] = Form.useForm<SeasonFormValues>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);

  const watchedStatus = Form.useWatch("status", form);

  const { data, error, isLoading, isFetching, refetch } =
    useListSeasonsQuery();
  const [createSeason, { isLoading: isCreating }] =
    useCreateSeasonMutation();
  const [updateSeason, { isLoading: isUpdating }] =
    useUpdateSeasonMutation();

  const saving = isCreating || isUpdating;

  const seasons: Season[] = useMemo(
    () => (data && Array.isArray(data.data) ? data.data : []),
    [data]
  );

  const activeSeason = useMemo(
    () => seasons.find((season) => season.status === "active") ?? null,
    [seasons]
  );

  const handleRetry = () => {
    if (!isFetching) refetch();
  };

  const openCreate = () => {
    setEditingSeason(null);
    form.resetFields();
    form.setFieldsValue({ status: "upcoming", easy: 1, medium: 3, hard: 5 });
    setModalOpen(true);
  };

  const openEdit = (record: Season) => {
    if (record.status === "ended" || saving || endingId !== null) return;
    setEditingSeason(record);
    form.setFieldsValue({
      name: record.name,
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
      status: record.status === "active" ? "active" : "upcoming",
      easy: record.scoring?.easy ?? 1,
      medium: record.scoring?.medium ?? 3,
      hard: record.scoring?.hard ?? 5,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSeason(null);
  };

  const handleFinish = async (values: SeasonFormValues) => {
    const range = values.dateRange;
    if (!range || range.length !== 2 || !range[0]?.isValid() || !range[1]?.isValid()) {
      message.error("Vui lòng chọn cửa sổ bắt đầu – kết thúc hợp lệ.");
      return;
    }
    if (!range[0].isBefore(range[1])) {
      message.error("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    const payload = {
      name: values.name.trim(),
      startDate: range[0].toISOString(),
      endDate: range[1].toISOString(),
      status: values.status,
      scoring: {
        easy: Number(values.easy),
        medium: Number(values.medium),
        hard: Number(values.hard),
      },
    };
    try {
      if (editingSeason) {
        await updateSeason({ id: editingSeason._id, body: payload }).unwrap();
        message.success("Cập nhật mùa giải thành công.");
      } else {
        await createSeason(payload).unwrap();
        message.success("Tạo mùa giải mới thành công.");
      }
      setModalOpen(false);
      setEditingSeason(null);
    } catch (err: any) {
      // 409 = mùa đã kết thúc bị khóa — giữ thông báo lâu hơn để admin đọc kịp.
      message.error(
        err?.data?.message || "Lưu mùa giải thất bại. Vui lòng thử lại.",
        err?.status === 409 ? 6 : 3
      );
    }
  };

  // Kết thúc mùa: PATCH status ended. Server khóa mùa ended (409) và ghi audit season.ended.
  const handleEnd = async (record: Season) => {
    if (!record?._id || endingId !== null || record.status === "ended") return;
    setEndingId(record._id);
    try {
      await updateSeason({
        id: record._id,
        body: { status: "ended" },
      }).unwrap();
      message.success(`Đã kết thúc mùa "${record.name}".`);
    } catch (err: any) {
      message.error(
        err?.data?.message || "Kết thúc mùa giải thất bại. Vui lòng thử lại.",
        err?.status === 409 ? 6 : 3
      );
    } finally {
      setEndingId(null);
    }
  };

  const columns: TableProps<Season>["columns"] = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
    },
    {
      title: "Tên mùa",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name || "—"}</Text>,
    },
    {
      title: "Cửa sổ",
      key: "window",
      width: 220,
      render: (_, record) => (
        <Text style={{ fontSize: 13 }}>
          {formatSeasonWindow(record.startDate, record.endDate)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: Season["status"]) => getSeasonStatusTag(status),
    },
    {
      title: "Điểm (E/M/H)",
      key: "scoring",
      width: 200,
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag color="blue">E: {record.scoring?.easy ?? "—"}</Tag>
          <Tag color="orange">M: {record.scoring?.medium ?? "—"}</Tag>
          <Tag color="red">H: {record.scoring?.hard ?? "—"}</Tag>
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 220,
      fixed: "right" as const,
      render: (_, record) => {
        // Locks pattern (như Blog deletingId / Fund submittingReview):
        // mùa ended bị khóa; chặn cả chuột lẫn bàn phím bằng native disabled.
        const locked = record.status === "ended" || saving || endingId !== null;
        return (
          <Space size={8} wrap>
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={locked}
              onClick={() => openEdit(record)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Kết thúc mùa giải?"
              description="Mùa đã kết thúc sẽ bị khóa chỉnh sửa. Bạn có chắc chắn?"
              okText="Kết thúc"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: endingId === record._id }}
              onConfirm={() => handleEnd(record)}
            >
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                disabled={locked}
                loading={endingId === record._id}
              >
                Kết thúc mùa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const showActivateWarning =
    watchedStatus === "active" &&
    (!editingSeason || editingSeason.status !== "active") &&
    activeSeason !== null &&
    activeSeason._id !== editingSeason?._id;

  return (
    <S.PageWrapper>
      <S.Head>
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TrophyOutlined style={{ color: "#0066CC" }} /> Quản lý mùa giải
          </Title>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: "block" }}>
            Tạo mùa giải mới, chỉnh sửa cửa sổ tính điểm và kết thúc mùa đang chạy.
            Server tự ghi audit season.created/updated/ended.
          </Text>
        </div>
        <Space size={12} wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRetry}
            loading={isFetching}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={saving}
            onClick={openCreate}
            style={{ backgroundColor: "#0066CC" }}
          >
            Tạo mùa giải
          </Button>
        </Space>
      </S.Head>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : error ? (
        <Alert
          type="error"
          showIcon
          message="Không thể tải danh sách mùa giải"
          description="Vui lòng kiểm tra kết nối và thử lại."
          action={
            <Button size="small" danger onClick={handleRetry} loading={isFetching}>
              Thử lại
            </Button>
          }
        />
      ) : seasons.length === 0 ? (
        <Empty description="Chưa có mùa giải nào.">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo mùa giải đầu tiên
          </Button>
        </Empty>
      ) : (
        <S.TableWrapper>
          <Table
            columns={columns}
            dataSource={seasons}
            rowKey={(record) => record._id}
            loading={isFetching}
            scroll={{ x: 880 }}
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50"],
              onShowSizeChange: (_current, size) => setPageSize(size),
              onChange: (_page, size) => {
                if (size && size !== pageSize) setPageSize(size);
              },
              showTotal: (total) => `Tổng cộng ${total} mùa giải`,
            }}
          />
        </S.TableWrapper>
      )}

      <Modal
        title={editingSeason ? "Sửa mùa giải" : "Tạo mùa giải mới"}
        open={modalOpen}
        onCancel={closeModal}
        footer={[]}
        width="min(640px, 95vw)"
      >
        <Form
          form={form}
          name="seasonForm"
          layout="vertical"
          autoComplete="off"
          initialValues={{ status: "upcoming", easy: 1, medium: 3, hard: 5 }}
          onFinish={handleFinish}
        >
          <Form.Item
            label="Tên mùa giải"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên mùa giải." },
              { max: 120, message: "Tên mùa giải tối đa 120 ký tự." },
            ]}
          >
            <Input placeholder="Ví dụ: Arena Season 1 – Fall 2026" maxLength={120} />
          </Form.Item>

          <Form.Item
            label="Cửa sổ mùa giải (Bắt đầu – Kết thúc)"
            name="dateRange"
            rules={[{ required: true, message: "Vui lòng chọn cửa sổ mùa giải." }]}
          >
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
          >
            <Select
              options={[
                { value: "upcoming", label: "Sắp diễn ra" },
                { value: "active", label: "Đang chạy (kích hoạt ngay)" },
              ]}
            />
          </Form.Item>

          {watchedStatus === "active" && (
            <Alert
              type="warning"
              showIcon
              message="Kích hoạt sẽ kết thúc mùa đang chạy"
              description={
                showActivateWarning
                  ? `Mùa "${activeSeason?.name}" đang chạy sẽ tự động chuyển sang đã kết thúc.`
                  : "Mùa này sẽ trở thành mùa đang chạy duy nhất."
              }
              style={{ marginBottom: 16 }}
            />
          )}

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item
              label="Điểm Easy"
              name="easy"
              rules={[{ required: true, message: "Nhập điểm Easy." }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="1" />
            </Form.Item>
            <Form.Item
              label="Điểm Medium"
              name="medium"
              rules={[{ required: true, message: "Nhập điểm Medium." }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="3" />
            </Form.Item>
            <Form.Item
              label="Điểm Hard"
              name="hard"
              rules={[{ required: true, message: "Nhập điểm Hard." }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} placeholder="5" />
            </Form.Item>
          </Space>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={saving}
            disabled={saving}
            style={{ marginTop: 24, backgroundColor: "#0066CC" }}
          >
            {editingSeason ? "Lưu thay đổi" : "Tạo mùa giải"}
          </Button>
        </Form>
      </Modal>
    </S.PageWrapper>
  );
}
