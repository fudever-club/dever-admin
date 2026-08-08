import { Alert, Button, Modal, Space, Typography, message } from "antd";

export type OneTimeCredential = {
  email: string;
  temporaryPassword: string;
};

type OneTimeCredentialModalProps = {
  credentials: OneTimeCredential[];
  onClose: () => void;
};

function OneTimeCredentialModal({
  credentials,
  onClose,
}: OneTimeCredentialModalProps) {
  const copyCredential = async (credential: OneTimeCredential) => {
    try {
      await navigator.clipboard.writeText(
        `Email: ${credential.email}\nMật khẩu tạm thời: ${credential.temporaryPassword}`
      );
      message.success(`Đã sao chép thông tin của ${credential.email}`);
    } catch {
      message.error("Không thể sao chép. Hãy lưu thông tin hiển thị bên dưới theo kênh an toàn.");
    }
  };

  return (
    <Modal
      title="Thông tin đăng nhập tạm thời"
      open={credentials.length > 0}
      closable={false}
      maskClosable={false}
      footer={[
        <Button key="acknowledge" type="primary" onClick={onClose}>
          Tôi đã lưu thông tin
        </Button>,
      ]}
    >
      <Alert
        type="warning"
        showIcon
        message="Chỉ hiển thị một lần"
        description="Hãy sao chép và gửi mật khẩu tạm thời cho thành viên qua một kênh an toàn. Khi đóng cửa sổ này, quản trị viên không thể xem lại mật khẩu này."
      />
      <Space className="mt-4 w-full" direction="vertical" size={12}>
        {credentials.map((credential) => (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={`${credential.email}-${credential.temporaryPassword}`}
          >
            <Typography.Text strong>{credential.email}</Typography.Text>
            <Typography.Paragraph className="mb-3 mt-2" copyable={false}>
              <Typography.Text type="secondary">Mật khẩu tạm thời: </Typography.Text>
              <Typography.Text code>{credential.temporaryPassword}</Typography.Text>
            </Typography.Paragraph>
            <Button onClick={() => copyCredential(credential)}>Sao chép thông tin</Button>
          </div>
        ))}
      </Space>
    </Modal>
  );
}

export default OneTimeCredentialModal;
