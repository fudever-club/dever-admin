"use client";

import {
  Flex,
  Form,
  Popconfirm,
  Table,
  TableProps,
  Typography,
  message,
} from "antd";
import { useParams } from "next/navigation";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import _ from "lodash";
import { useRouter } from "next-nprogress-bar";

import { useTranslation } from "@/app/i18n/client";
import {
  useDeleteProjectMutation,
  useGetAllProjectsQuery,
} from "@/store/queries/projectMangement";
import useModal from "@/hooks/useModal";

import Button from "@/components/core/common/Button";

import * as S from "./styles";

interface DataType {
  key: string;
  _id: string;
  name: string;
  constant: string;
  slug: string;
}

function ProjectManagementModule() {
  const params = useParams();
  const router = useRouter();

  const [editForm] = Form.useForm();

  const addModal = useModal();
  const editModal = useModal();

  const { t } = useTranslation(params?.locale as string, "socialManagement");

  const [deleteProject] = useDeleteProjectMutation();
  const { result, isFetching, refetch } = useGetAllProjectsQuery(undefined, {
    selectFromResult: ({ data, isFetching }) => {
      return {
        result: data?.data ?? [],
        isFetching,
      };
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id).unwrap();
      message.success("Xóa thành công");
      refetch();
    } catch (error) {}
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "ID",
      key: "_id",
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "name",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_, record) => {
        return (
          <Flex justify="center" gap={20}>
            <Button
              type="default"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => {
                router?.push(`/project-management/${record?.slug}`);
              }}
            />
            <Popconfirm
              title={t("deleteSocial.title")}
              description={t("deleteSocial.description")}
              okText={t("deleteSocial.okText")}
              cancelText={t("deleteSocial.cancelText")}
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

  return (
    <S.PageWrapper>
      <S.Head>
        <Typography.Title level={2}>Quản lý dự án</Typography.Title>
      </S.Head>
      <S.FilterWrapper>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/project-management/create")}
        >
          Thêm dự án mới
        </Button>
      </S.FilterWrapper>
      <S.TableWrapper>
        <Table
          columns={columns}
          dataSource={result}
          loading={isFetching}
          rowKey={(record) => record._id}
        />
      </S.TableWrapper>
    </S.PageWrapper>
  );
}

export default ProjectManagementModule;
