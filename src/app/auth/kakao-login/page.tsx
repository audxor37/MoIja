import { ArrowLeft, ChevronRight, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function KakaoLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-5 py-8 text-ink">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-line bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-[#18332d] p-8 text-white sm:p-10">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-white/72 transition hover:text-white"
            href="/"
          >
            <ArrowLeft size={17} />
            대시보드로 돌아가기
          </Link>

          <div className="mt-12 flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#f8df62] text-3xl font-black text-[#19332d]">
              M
            </div>
            <div>
              <p className="text-sm font-bold text-white/60">MoIja</p>
              <h1 className="mt-1 text-3xl font-black leading-tight tracking-normal">
                모임참석
                <br />
                운영 플랫폼
              </h1>
            </div>
          </div>

          <p className="mt-10 max-w-sm text-lg font-semibold leading-8 text-white/78">
            카카오 계정으로 빠르게 로그인하고, 참석 신청부터 실제 참석 기록까지 한 화면에서 관리하세요.
          </p>

          <div className="mt-10 grid gap-4 text-sm font-semibold text-white/74">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#f8df62]" size={20} />
              <span>Kakao ID, 닉네임, 프로필 이미지만 사용합니다.</span>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#f8df62]" size={20} />
              <span>팀 역할에 따라 운영자와 멤버 권한을 분리합니다.</span>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#f8df62]" size={20} />
              <span>출석 변경 기록은 신뢰도 계산을 위해 남깁니다.</span>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#fff7bf] text-[#3a2f00]">
              <MessageCircle size={30} />
            </div>

            <p className="mt-8 text-sm font-black text-[#285b55]">카카오 로그인</p>
            <h2 className="mt-2 text-4xl font-black leading-tight tracking-normal">
              카카오 계정으로
              <br />
              시작하세요
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/62">
              별도 회원가입 없이 카카오 인증 후 MoIja 운영자 대시보드로 돌아옵니다.
            </p>

            <a
              className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-md bg-[#fee500] px-5 text-base font-black text-[#191600] shadow-sm transition hover:brightness-95"
              href="/api/auth/kakao"
            >
              <MessageCircle size={22} />
              카카오로 계속하기
              <ChevronRight size={20} />
            </a>

            <div className="mt-5 rounded-lg border border-[#f0d5a8] bg-[#fff8e6] p-4 text-sm leading-6 text-[#7a4d12]">
              <p className="font-black">실제 카카오 로그인 연결 전 확인</p>
              <p className="mt-1 font-semibold">
                `.env.local`에 Supabase URL과 anon key를 넣고, Supabase와 Kakao Developers의
                Redirect URL을 설정해야 실제 카카오 인증 화면으로 이동합니다.
              </p>
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-ink/45">
              로그인하면 MoIja의 최소 개인정보 저장 원칙에 동의한 것으로 처리됩니다.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
