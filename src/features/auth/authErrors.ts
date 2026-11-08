export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/user-disabled":
      return "Tài khoản đã bị vô hiệu hóa.";
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản với email này.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Cần ít nhất 6 ký tự.";
    case "auth/too-many-requests":
      return "Quá nhiều lần thử. Vui lòng thử lại sau vài phút.";
    case "auth/network-request-failed":
      return "Lỗi mạng. Kiểm tra kết nối và thử lại.";
    case "auth/operation-not-allowed":
      return "Phương thức đăng nhập chưa được bật trong Firebase.";
    default:
      return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  }
}
