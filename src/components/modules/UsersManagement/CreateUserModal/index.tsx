import { useSignUpMutation } from "@/store/queries/auth";
import { Button, Col, Flex, Form, Input, Modal, Row, message } from "antd";
import React from "react";

function CreateUserModal({
  visible,
  close,
  refetch,
}: {
  visible: boolean;
  close: () => void;
  refetch: () => void;
}) {
  const [signUp] = useSignUpMutation();

  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await signUp(values).unwrap();
      message.success("Tạo thành viên thành công");
      refetch();
      close();
    } catch (error) {
      message.error("Tạo thành viên thất bại");
    }
  };
  return (
    <Modal title="Tạo thành viên" open={visible} footer={[]} onCancel={close}>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Họ"
              name="firstname"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập họ",
                },
              ]}
            >
              <Input placeholder="Nhập họ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tên"
              name="lastname"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập Tên",
                },
              ]}
            >
              <Input placeholder="Nhập Tên" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập Email",
            },
          ]}
        >
          <Input placeholder="Nhập Email" />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập Mật khẩu",
            },
          ]}
        >
          <Input placeholder="Nhập Mật khẩu" />
        </Form.Item>
        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập số điện thoại",
            },
          ]}
        >
          <Input placeholder="Nhập SĐT" />
        </Form.Item>
        <Flex justify="center" gap={16}>
          <Button onClick={close}>Huỷ</Button>
          <Button type="primary" htmlType="submit">
            Tạo
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
}

export default CreateUserModal;
