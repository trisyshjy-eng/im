"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  signInAction,
  requestPasswordResetAction,
  type LoginState,
  type ResetState,
} from "./actions";
import { inputClass, labelClass } from "@/components/ui/form";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "처리 중..." : children}
    </button>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(
    signInAction,
    initialError ? { error: initialError } : undefined
  );
  const [resetState, resetAction] = useActionState<ResetState, FormData>(
    requestPasswordResetAction,
    undefined
  );
  const [showReset, setShowReset] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">로그인</h1>
      <p className="mt-1 text-sm text-muted-foreground">계정 정보를 입력해 주세요</p>

      {!showReset ? (
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@company.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="비밀번호"
              className={inputClass}
            />
            <div className="mt-1.5 text-right">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-xs font-medium text-accent hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <SubmitButton>로그인</SubmitButton>

          <div className="relative py-2 text-center text-xs text-muted-foreground">
            <span className="relative bg-card px-2">또는</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <span className="font-medium text-accent">관리자에게 문의</span>
          </p>
        </form>
      ) : (
        <form action={resetAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-email" className={labelClass}>
              이메일
            </label>
            <input
              id="reset-email"
              name="reset-email"
              type="email"
              required
              placeholder="name@company.com"
              className={inputClass}
            />
          </div>

          {resetState?.error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {resetState.error}
            </p>
          )}
          {resetState?.success && (
            <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
              비밀번호 재설정 링크를 이메일로 보냈습니다.
            </p>
          )}

          <SubmitButton>재설정 링크 보내기</SubmitButton>

          <button
            type="button"
            onClick={() => setShowReset(false)}
            className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            로그인으로 돌아가기
          </button>
        </form>
      )}
    </div>
  );
}
