import { Box } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "inactive"
      ? "비활성화된 계정입니다. 관리자에게 문의해 주세요."
      : undefined;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="relative flex flex-col justify-between overflow-hidden bg-accent px-8 py-10 text-accent-foreground md:w-1/2 md:px-16 md:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/20" />
        <div className="pointer-events-none absolute bottom-10 left-[-4rem] h-40 w-40 rounded-full border border-white/10" />

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Box size={20} />
          </span>
          <span className="text-lg font-bold">재고관리</span>
        </div>

        <div className="my-12 md:my-0">
          <h2 className="text-3xl font-bold leading-snug md:text-4xl">
            생산품·소스류 재고를
            <br />한 눈에 파악하세요
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            일일 생산량과 출고량만 입력하면
            <br />재고 수량과 재고량이 자동으로 계산됩니다.
          </p>
        </div>

        <p className="text-xs text-white/60">© 2026 재고관리. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12 md:px-16">
        <div className="w-full max-w-sm">
          <LoginForm initialError={initialError} />
        </div>
      </div>
    </div>
  );
}
