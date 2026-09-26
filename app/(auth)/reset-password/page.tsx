import { Box } from "lucide-react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Box size={20} />
          </span>
          <span className="text-lg font-bold text-foreground">재고관리</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">비밀번호 재설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          새로 사용할 비밀번호를 입력해 주세요
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
