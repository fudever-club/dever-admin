import { useCreateUserMutation } from "@/store/queries/usersMangement";
import { Alert, Button, Col, Flex, Form, Input, Modal, Row, message } from "antd";
import React, { useState } from "react";

import OneTimeCredentialModal, { OneTimeCredential } from "../OneTimeCredentialModal";

type CreateMemberValues = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  mssv?: string;
};

function CreateUserModal({
  visible,
  close,
  refetch,
}: {
  visible: boolean;
  close: () => void;
  refetch: () => void;
}) {
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [form] = Form.useForm<CreateMemberValues>();
  const [issuedCredential, setIssuedCredential] = useState<OneTimeCredential | null>(null);

  const onFinish = async (values: CreateMemberValues) => {
    try {
      const response: any = await createUser({
        ...values,
        email: values.email.trim().toLowerCase(),
        mssv: values.mssv?.trim() || undefined,
      }).unwrap();
      const temporaryPassword = response?.data?.temporaryPassword;
      const email = response?.data?.user?.email ?? values.email.trim().toLowerCase();

      if (!temporaryPassword) {
        throw new Error("Missing one-time credential");
      }

      message.success("Tạo thành viên thành công");
      form.resetFields();
      refetch();
      close();
      setIssuedCredential({ email, temporaryPassword });
    } catch {
      message.error("Không thể tạo thành viên. Kiểm tra lại thông tin và thử lại.");
    }
  };

  return (
    <>
      <Modal
        title="Tạo tài khoản thành viên"
        open={visible}
        footer={[]}
        onCancel={close}
        destroyOnClose
        maskClosable={!isLoading}
      >
        <Alert
          className="mb-6"
          type="info"
          showIcon
          message="Tài khoản thành viên"
          description="Chỉ quản trị viên có thể cấp tài khoản. Biểu mẫu này không cấp quyền quản trị hoặc nhận mật khẩu."
        />
        <Form<CreateMemberValues>
        layout="vertical"
        form={form}
        onFinish={onFinish}
        validateTrigger={["onBlur", "onChange"]}
        aria-busy={isLoading}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ"
              name="firstname"
              rules={[{ required: true, message: "Vui lòng nhập họ" }]}
            >
              <Input autoComplete="family-name" disabled={isLoading} placeholder="Nhập họ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tên"
              name="lastname"
              rules={[{ required: true, message: "Vui lòng nhập tên" }]}
            >
              <Input autoComplete="given-name" disabled={isLoading} placeholder="Nhập tên" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email chưa đúng định dạng" },
          ]}
        >
          <Input autoComplete="email" disabled={isLoading} placeholder="name@fpt.edu.vn" />
        </Form.Item>
        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
        >
          <Input autoComplete="tel" disabled={isLoading} placeholder="Nhập số điện thoại" />
        </Form.Item>
        <Form.Item
          label="MSSV (không bắt buộc)"
          name="mssv"
          rules={[{ max: 32, message: "MSSV không được vượt quá 32 ký tự" }]}
        >
          <Input disabled={isLoading} placeholder="Ví dụ: HE190000" />
        </Form.Item>
        <Flex justify="center" gap={16}>
          <Button onClick={close} disabled={isLoading}>
            Huỷ
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading} disabled={isLoading}>
            Tạo tài khoản
          </Button>
        </Flex>
        </Form>
      </Modal>
      <OneTimeCredentialModal
        credentials={issuedCredential ? [issuedCredential] : []}
        onClose={() => setIssuedCredential(null)}
      />
    </>
  );
}

export default CreateUserModal;
