"use client";

import {
  Alert,
  Button,
  Checkbox,
  Col,
  Flex,
  Input,
  Pagination,
  PaginationProps,
  Popconfirm,
  Row,
  Select,
  SelectProps,
  Space,
  Table,
  TableProps,
  Typography,
  message,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import {
  DownOutlined,
  UploadOutlined,
  SearchOutlined,
  RollbackOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { ChangeEvent, useRef, useState } from "react";

import { useTranslation } from "@/app/i18n/client";
import {
  useCreateManyUsersByCSVMutation,
  useDeleteUserMutation,
  useEditUserMutation,
  useGetAllUsersQuery,
  useResetPasswordMutation,
  useSetUserAdminRoleMutation,
  useSetUserPositionMutation,
  useSetUserTeamLeadershipMutation,
} from "@/store/queries/usersMangement";
import { createQueryString } from "@/utils/queryString";
import { useGetAllDepartmentsQuery } from "@/store/queries/departmentMangement";
import { useGetAllPositionQuery } from "@/store/queries/positionManagement";
import { useGetAllMajorQuery } from "@/store/queries/majorManagement";
import useModal from "@/hooks/useModal";
import { useAppSelector } from "@/hooks/redux-toolkit";

import CreateUserModal from "./CreateUserModal";
import OneTimeCredentialModal, {
  OneTimeCredential,
} from "./OneTimeCredentialModal";

import * as S from "./styles";

interface DataType {
  key: string;
  _id: string;
  firstname: string;
  lastname: string;
  position: string;
  major: string;
  departments: any;
  isAdmin: boolean;
  isExcellent: boolean;
  isLeader: boolean;
  email: string;
}

interface InterfaceDepartmentData {
  result: SelectProps["options"];
}

type CsvMember = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  mssv?: string;
};

type CsvValidationResult = {
  users: CsvMember[];
  errors: string[];
};

const REQUIRED_CSV_HEADERS = ["firstname", "lastname", "email", "phone"];
const EXECUTIVE_POSITION_CONSTANTS = new Set(["CHUNHIEM", "PHOCHUNHIEM"]);
const isExecutivePosition = (position: any) =>
  EXECUTIVE_POSITION_CONSTANTS.has(position?.constant);

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function parseMemberCsv(source: string): CsvValidationResult {
  const rows = source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((row) => row.trim().length > 0);

  if (rows.length < 2) {
    return { users: [], errors: ["CSV cần có hàng tiêu đề và ít nhất một thành viên."] };
  }

  const headers = parseCsvLine(rows[0]).map((header) => header.trim().toLowerCase());
  const missingHeaders = REQUIRED_CSV_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return {
      users: [],
      errors: [`Thiếu cột bắt buộc: ${missingHeaders.join(", ")}.`],
    };
  }

  const seenEmails = new Set<string>();
  const users: CsvMember[] = [];
  const errors: string[] = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const values = parseCsvLine(row);
    const record = headers.reduce<Record<string, string>>((result, header, index) => {
      result[header] = values[index]?.trim() ?? "";
      return result;
    }, {});
    const email = record.email.toLowerCase();
    const rowNumber = rowIndex + 2;

    if (REQUIRED_CSV_HEADERS.some((header) => !record[header])) {
      errors.push(`Hàng ${rowNumber}: thiếu họ, tên, email hoặc số điện thoại.`);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push(`Hàng ${rowNumber}: email không hợp lệ.`);
      return;
    }
    if (seenEmails.has(email)) {
      errors.push(`Hàng ${rowNumber}: email bị trùng trong tệp.`);
      return;
    }

    seenEmails.add(email);
    users.push({
      firstname: record.firstname,
      lastname: record.lastname,
      email,
      phone: record.phone,
      mssv: record.mssv || undefined,
    });
  });

  return { users, errors };
}

function UsersManagementModule() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editUser] = useEditUserMutation();
  const [setUserAdminRole, { isLoading: isChangingAdminAccess }] =
    useSetUserAdminRoleMutation();
  const [setUserPosition, { isLoading: isChangingPosition }] =
    useSetUserPositionMutation();
  const [setUserTeamLeadership, { isLoading: isChangingTeamLeadership }] =
    useSetUserTeamLeadershipMutation();
  const currentUser = useAppSelector((state) => state.auth.userInfo);
  const isPresident = Boolean(
    currentUser?.isAdmin && currentUser?.positionId?.constant === "CHUNHIEM"
  );
  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword] = useResetPasswordMutation();
  const [createManyUsersByCSV, { isLoading: isImporting }] =
    useCreateManyUsersByCSVMutation();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvFeedback, setCsvFeedback] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [issuedCredentials, setIssuedCredentials] = useState<OneTimeCredential[]>([]);

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || "";
  const positionId = searchParams.get("positionId") || "";
  const majorId = searchParams.get("majorId") || "";
  const departments = searchParams.get("departments") || "";
  const kGeneration = searchParams.get("kGeneration") || "";

  const { t } = useTranslation(params?.locale as string, "usersManagement");

  const modal = useModal();

  const { result, total, isFetching, refetch } = useGetAllUsersQuery(
    {
      page: page,
      limit: limit,
      search: search,
      filter: JSON.stringify({ positionId, departments, majorId, kGeneration }),
    },
    {
      selectFromResult: ({ data, isFetching }) => {
        console.log(data);

        return {
          result: data?.data?.users ?? [],
          total: data?.total ?? 0,
          isFetching,
        };
      },
    }
  );

  const departmentData: InterfaceDepartmentData = useGetAllDepartmentsQuery(
    undefined,
    {
      selectFromResult: ({ data, isFetching }) => {
        const newDepartmentData = data?.data?.map((department: any) => ({
          label: department.name,
          value: department._id,
          ...department,
        }));
        return {
          result: newDepartmentData ?? [],
          isFetching,
        };
      },
    }
  );

  const positionData: InterfaceDepartmentData = useGetAllPositionQuery(
    undefined,
    {
      selectFromResult: ({ data, isFetching }) => {
        const newPositionData = data?.data?.filter((position: any) =>
          isPresident || !isExecutivePosition(position)
        ).map((position: any) => ({
          label: position.name,
          value: position._id,
          ...position,
        }));
        return {
          result: newPositionData ?? [],
          total: data?.result ?? 0,
          isFetching,
        };
      },
    }
  );

  const majorData: InterfaceDepartmentData = useGetAllMajorQuery(undefined, {
    selectFromResult: ({ data, isFetching }) => {
      const newMajorData = data?.data?.map((major: any) => ({
        label: major.name,
        value: major._id,
        ...major,
      }));
      return {
        result: newMajorData ?? [],
        isFetching,
      };
    },
  });

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "STT",
      dataIndex: "",
      key: "",
      width: 65,
      fixed: "left",
      render: (text, _, index) => (
        <Typography.Text>{limit * (page - 1) + index + 1}</Typography.Text>
      ),
    },
    {
      title: t("name"),
      dataIndex: "",
      key: "name",
      fixed: "left",
      width: 200,
      render: (value, record) => {
        return (
          <Typography.Text>
            {record?.firstname} {record?.lastname}
          </Typography.Text>
        );
      },
    },
    {
      title: t("email"),
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (value, record) => (
        <Typography.Text>{record?.email}</Typography.Text>
      ),
    },
    {
      title: t("position"),
      dataIndex: "positionId",
      key: "positionId",
      width: 200,
      render: (value, record) => (
        <div>
          <S.Select
            options={positionData?.result}
            defaultValue={value?.name}
            disabled={isChangingPosition || (!isPresident && isExecutivePosition(value))}
            title={
              isPresident || !isExecutivePosition(value)
                ? "Cập nhật chức danh"
                : "Chỉ Chủ nhiệm mới có thể thay đổi chức danh điều hành"
            }
            onChange={(id) => handlePositionChange(record, String(id))}
          >
            <Space>
              {value?.name}
              <DownOutlined />
            </Space>
          </S.Select>
        </div>
      ),
    },
    {
      title: t("department"),
      dataIndex: "departments",
      key: "departments",
      width: 160,
      render: (values, record) => {
        const defaultValue = values.map((value: any) => ({
          label: value?.name,
          value: value?._id,
        }));
        return (
          <div>
            <S.Select
              mode="multiple"
              options={departmentData?.result}
              defaultValue={defaultValue}
              onChange={(id: any) => {
                const newData = departmentData?.result?.filter((department) => {
                  return id.includes(department?._id);
                });
                const newEdit = {
                  ...record,
                  departments: newData,
                };
                handleEditUser(newEdit);
              }}
            >
              <DownOutlined />
            </S.Select>
          </div>
        );
      },
    },
    {
      title: t("major"),
      dataIndex: "majorId",
      key: "majorId",
      width: 180,
      render: (value, record) => (
        <div>
          <S.Select
            options={majorData?.result}
            defaultValue={value?.name}
            onChange={(id: any) =>
              HandleField(id, record, majorData, "majorId")
            }
          >
            <Space>
              {value?.name}
              <DownOutlined />
            </Space>
          </S.Select>
        </div>
      ),
    },
    {
      title: t("admin"),
      dataIndex: "isAdmin",
      key: "isAdmin",
      width: 120,
      render: (value, record) => {
        return (
          <Flex justify="center" align="center">
            <Checkbox
              checked={Boolean(value)}
              disabled={isChangingAdminAccess || !isPresident}
              title={
                isPresident
                  ? "Cấp hoặc thu quyền vào trang quản trị"
                  : "Chỉ Chủ nhiệm mới có thể thay đổi quyền quản trị"
              }
              onChange={() => handleAdminRoleChange(record, !Boolean(value))}
            ></Checkbox>
          </Flex>
        );
      },
    },
    {
      title: "Trưởng nhóm/Ban",
      dataIndex: "isLeader",
      key: "isLeader",
      width: 100,
      render: (_, record) => {
        return (
          <Flex justify="center" align="center">
            <Checkbox
              checked={Boolean(record?.isLeader)}
              disabled={isChangingTeamLeadership}
              title="Gán nhãn Trưởng nhóm/Ban; không cấp quyền trang quản trị"
              onChange={() => handleTeamLeadershipChange(record, !Boolean(record?.isLeader))}
            ></Checkbox>
          </Flex>
        );
      },
    },
    {
      title: t("excellent"),
      dataIndex: "isExcellent",
      key: "isExcellent",
      width: 100,
      render: (_, record) => {
        return (
          <Flex justify="center" align="center">
            <Checkbox
              defaultChecked={record?.isExcellent}
              onChange={async () => {
                const newRecord = {
                  ...record,
                  isExcellent: !record?.isExcellent,
                };
                handleEditUser(newRecord);
              }}
            ></Checkbox>
          </Flex>
        );
      },
    },
    {
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => {
        return (
          <Flex justify="center" gap={20}>
            <Popconfirm
              title={"Reset mật khẩu"}
              description="Bạn có chắc chắn muốn reset mật khẩu của tài khoản này?"
              okText={"Đồng ý"}
              cancelText="Huỷ bỏ"
              onConfirm={() => handleResetPassword(record?._id)}
            >
              <Button shape="circle" icon={<RollbackOutlined />} />
            </Popconfirm>
            <Popconfirm
              title={"Xóa thành viên"}
              description={"Bạn có chắc chắn muốn xoá thành viên này?"}
              okText={"Xác nhận"}
              cancelText={"Huỷ bỏ"}
              onConfirm={() => handleDelete(record?._id)}
            >
              <Button
                type="primary"
                shape="circle"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  const HandleField = (
    id: string,
    record: any,
    dataField: any,
    type: string
  ) => {
    const newDataField = dataField?.result?.find(
      (data: any) => data._id === id
    );
    const { label, value, ...newData } = newDataField;
    const newEdit = {
      ...record,
      [type]: newData,
    };
    handleEditUser(newEdit);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id).unwrap();
      refetch();
      message.success("Xóa thành công");
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể xóa thành viên. Vui lòng thử lại.");
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await resetPassword(id).unwrap();
      refetch();
      message.success("Reset mật khẩu thành công!");
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể reset mật khẩu. Vui lòng thử lại.");
    }
  };

  const handleEditUser = async (data: any) => {
    try {
      await editUser({
        params: { id: data?._id },
        body: data,
      }).unwrap();
      refetch();
      message.success("Thay đổi thành công");
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể cập nhật thành viên. Vui lòng thử lại.");
    }
  };

  const handleAdminRoleChange = async (record: DataType, isAdmin: boolean) => {
    try {
      const response: any = await setUserAdminRole({ id: record._id, isAdmin }).unwrap();
      await refetch();
      message.success(
        response?.message || (isAdmin ? "Đã cấp quyền quản trị viên." : "Đã thu hồi quyền quản trị viên.")
      );
    } catch (err: any) {
      message.error(
        err?.data?.message || "Không thể cập nhật quyền quản trị viên. Vui lòng thử lại."
      );
    }
  };

  const handlePositionChange = async (record: DataType, positionId: string) => {
    try {
      const response: any = await setUserPosition({ id: record._id, positionId }).unwrap();
      await refetch();
      message.success(response?.message || "Đã cập nhật chức danh.");
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể cập nhật chức danh. Vui lòng thử lại.");
    }
  };

  const handleTeamLeadershipChange = async (record: DataType, isLeader: boolean) => {
    try {
      const response: any = await setUserTeamLeadership({ id: record._id, isLeader }).unwrap();
      await refetch();
      message.success(response?.message || "Đã cập nhật nhãn Trưởng nhóm/Ban.");
    } catch (err: any) {
      message.error(err?.data?.message || "Không thể cập nhật nhãn Trưởng nhóm/Ban. Vui lòng thử lại.");
    }
  };

  const importCsv = async (source: string) => {
    const { users, errors } = parseMemberCsv(source);
    if (errors.length > 0) {
      const summary = `CSV chưa hợp lệ: ${errors.slice(0, 2).join(" ")}`;
      setCsvFeedback({ type: "error", message: summary });
      message.error("CSV chưa hợp lệ. Sửa dữ liệu rồi thử lại.");
      return;
    }

    try {
      const response: any = await createManyUsersByCSV({ users }).unwrap();
      const report = response?.data?.rows ?? [];
      const credentials = Array.isArray(report)
        ? report.reduce<OneTimeCredential[]>((result, row) => {
            const temporaryPassword = row?.created?.temporaryPassword;
            const email = row?.created?.user?.email ?? row?.email;
            if (temporaryPassword && email) {
              result.push({ email, temporaryPassword });
            }
            return result;
          }, [])
        : [];
      const createdCount = Number(response?.data?.created ?? credentials.length);
      const skippedCount = Number(response?.data?.skipped ?? 0);
      const errorCount = Number(response?.data?.errors ?? 0);

      setIssuedCredentials(credentials);

      if (skippedCount > 0 || errorCount > 0) {
        const summary = `Đã tạo ${createdCount} thành viên; bỏ qua ${skippedCount}, lỗi ${errorCount}.`;
        setCsvFeedback({ type: "warning", message: summary });
        message.warning(summary);
      } else {
        const summary = `Đã tạo ${createdCount} thành viên.`;
        setCsvFeedback({ type: "success", message: summary });
        message.success("Import thành công");
      }
      refetch();
    } catch {
      const summary = "Không thể import CSV. Kiểm tra lại tệp hoặc thử lại.";
      setCsvFeedback({ type: "error", message: summary });
      message.error(summary);
    }
  };

  const handleImportCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setCsvFeedback(null);

    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      const summary = "Chỉ hỗ trợ tệp .csv.";
      setCsvFeedback({ type: "error", message: summary });
      message.error(summary);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      const summary = "Tệp CSV phải nhỏ hơn 2 MB.";
      setCsvFeedback({ type: "error", message: summary });
      message.error(summary);
      return;
    }

    await importCsv(await file.text());
  };

  const downloadCsvTemplate = () => {
    const content = "firstname,lastname,email,phone,mssv\nNguyen,An,an.nguyen@fpt.edu.vn,0900000000,HE190000\n";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "dever-member-import-template.csv";
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const onShowSizeChange: PaginationProps["onShowSizeChange"] = (
    current,
    pageSize
  ) => {
    console.log(pageSize);
    router.push(createQueryString("limit", `${20}`));
  };

  const handleSearch = _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(createQueryString("search", `${e?.target?.value}`));
  }, 300);

  const handleFilterPosition = _.debounce((e: string) => {
    router.push(createQueryString("positionId", `${e ?? ""}`));
  }, 300);

  const handleFilterMajor = _.debounce((e: string) => {
    router.push(createQueryString("majorId", `${e ?? ""}`));
  }, 300);
  const handleFilterK = _.debounce((e: string) => {
    router.push(createQueryString("kGeneration", `${e ?? ""}`));
  }, 300);

  const handleFilterDepartment = _.debounce((e) => {
    router.push(createQueryString("departments", `${e ?? ""}`));
  }, 300);

  return (
    <S.PageWrapper>
      <S.Head>
        <Typography.Title level={2}>{t("title")}</Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={modal?.openModal}
        >
          Tạo thành viên
        </Button>
      </S.Head>
      <S.FilterWrapper>
        <div className="item">
          <Typography.Title level={5}>{t("search")}</Typography.Title>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            onChange={handleSearch}
            defaultValue={search}
          />
        </div>
        <div className="input_csv">
          <Space direction="vertical" size={4} align="end">
            <Space wrap>
              <Button onClick={downloadCsvTemplate} disabled={isImporting}>
                Tải mẫu CSV
              </Button>
              <Button
                icon={<UploadOutlined />}
                loading={isImporting}
                disabled={isImporting}
                onClick={() => csvInputRef.current?.click()}
              >
                {isImporting ? "Đang import" : t("import")}
              </Button>
            </Space>
            <Typography.Text type="secondary">
              Chỉ admin có thể cấp tài khoản thành viên qua CSV.
            </Typography.Text>
          </Space>
          <input
            ref={csvInputRef}
            id="import_csv"
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCsv}
            aria-label="Chọn tệp CSV thành viên"
          />
        </div>
      </S.FilterWrapper>
      {csvFeedback && (
        <Alert
          className="mb-4"
          type={csvFeedback.type}
          showIcon
          message={csvFeedback.message}
          closable
          onClose={() => setCsvFeedback(null)}
        />
      )}
      <Row gutter={16}>
        <Col span={6}>
          <Typography.Title level={5}>Chức vụ</Typography.Title>
          <Select
            placeholder="Chọn vị trí"
            allowClear
            onChange={handleFilterPosition}
            defaultValue={positionId || undefined}
            options={positionData?.result}
          />
        </Col>
        <Col span={6}>
          <Typography.Title level={5}>Ban hoạt động</Typography.Title>
          <Select
            placeholder="Chọn ban hoạt động"
            allowClear
            onChange={handleFilterDepartment}
            defaultValue={departments?.length ? departments?.split(",") : null}
            options={departmentData?.result}
            mode="multiple"
          />
        </Col>
        <Col span={6}>
          <Typography.Title level={5}>Chuyên ngành</Typography.Title>
          <Select
            placeholder="Chọn chuyên ngành"
            allowClear
            onChange={handleFilterMajor}
            defaultValue={majorId || undefined}
            options={majorData?.result}
          />
        </Col>
        <Col span={6}>
          <Typography.Title level={5}>Khoá</Typography.Title>
          <Select
            placeholder="Chọn khoá"
            allowClear
            onChange={handleFilterK}
            defaultValue={kGeneration || undefined}
            options={[
              {
                label: "Khoá K21 (Gen 9 - Năm 2026)",
                value: 21,
              },
              {
                label: "Khoá K20 (Gen 8 - Năm 2025)",
                value: 20,
              },
              {
                label: "Khoá K19 (Gen 7)",
                value: 19,
              },
              {
                label: "Khoá K18 (Gen 6)",
                value: 18,
              },
              {
                label: "Khoá K17 (Gen 5)",
                value: 17,
              },
              {
                label: "Khoá K16 (Gen 4)",
                value: 16,
              },
              {
                label: "Khoá K15 (Gen 3)",
                value: 15,
              },
            ]}
          />
        </Col>
      </Row>
      <S.TableWrapper>
        <Table
          columns={columns}
          dataSource={result}
          loading={isFetching}
          rowKey={(record) => record._id}
          scroll={{ x: 1300 }}
          pagination={false}
        />
        <br />
        <Flex justify="flex-end">
          <Pagination
            showSizeChanger={false}
            onShowSizeChange={onShowSizeChange}
            defaultCurrent={page}
            total={total}
            onChange={(page) =>
              router.push(createQueryString("page", `${page}`))
            }
          />
        </Flex>
      </S.TableWrapper>
      <CreateUserModal
        visible={modal?.visible}
        close={modal?.closeModal}
        refetch={refetch}
      />
      <OneTimeCredentialModal
        credentials={issuedCredentials}
        onClose={() => setIssuedCredentials([])}
      />
    </S.PageWrapper>
  );
}

export default UsersManagementModule;
