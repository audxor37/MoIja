import { ArrowLeft, ChevronRight, KeyRound, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function KakaoLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-5 py-8 text-ink">
      <section className="w-full max-w-[440px] rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-secondary transition hover:text-ink"
          href="/"
        >
          <ArrowLeft size={17} />
          처음 화면으로 돌아가기
        </Link>

        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEE500] text-[#191600]">
          <MessageCircle size={28} />
        </div>

        <h1 className="mt-6 text-center text-3xl font-black leading-tight tracking-normal">
          카카오로 로그인
        </h1>
        <p className="mt-3 text-center text-base font-semibold leading-7 text-secondary">
          모임 참석과 알림을 바로 확인하세요.
        </p>

        <a
          className="mt-7 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-5 text-base font-black text-[#191600] shadow-sm transition hover:brightness-95"
          href="/api/auth/kakao"
        >
          <MessageCircle size={22} />
          카카오로 계속하기
          <ChevronRight size={20} />
        </a>

        <Link
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surfaceAlt px-5 text-sm font-black text-secondary transition hover:bg-line"
          href="/auth/password"
        >
          <KeyRound size={18} />
          일반 계정으로 로그인
        </Link>

        <p className="mt-5 text-center text-xs font-semibold leading-5 text-muted">
          닉네임과 프로필 정보만 사용합니다.
        </p>
      </section>
    </main>
  );
}
