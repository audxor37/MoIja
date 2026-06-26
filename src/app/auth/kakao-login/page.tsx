import { ArrowLeft, ChevronRight, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

const requiredInfo = ["Kakao ID", "닉네임", "프로필 이미지"];

export default function KakaoLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-5 py-8 text-ink">
      <section className="w-full max-w-[480px] rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-secondary transition hover:text-ink"
          href="/"
        >
          <ArrowLeft size={17} />
          처음 화면으로 돌아가기
        </Link>

        <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7BF] text-[#3A2F00]">
          <MessageCircle size={30} />
        </div>

        <p className="mt-7 text-sm font-black text-primary">카카오 로그인</p>
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-normal">
          참석 관리를 위해
          <br />
          카카오 계정으로 시작하세요
        </h1>
        <p className="mt-4 text-base font-semibold leading-7 text-secondary">
          MoIja는 멤버 식별과 프로필 표시를 위해 꼭 필요한 정보만 사용합니다.
        </p>

        <section className="mt-6 rounded-2xl bg-surfaceAlt p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary" size={20} />
            <h2 className="text-sm font-black">사용하는 정보</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {requiredInfo.map((item) => (
              <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-secondary shadow-soft" key={item}>
                {item}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-muted">
            전화번호, 주소, 생년월일 같은 민감정보는 저장하지 않습니다.
          </p>
        </section>

        <a
          className="mt-7 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-5 text-base font-black text-[#191600] shadow-sm transition hover:brightness-95"
          href="/api/auth/kakao"
        >
          <MessageCircle size={22} />
          카카오로 계속하기
          <ChevronRight size={20} />
        </a>

        <p className="mt-5 text-center text-xs font-semibold leading-5 text-muted">
          로그인하면 MoIja의 최소 개인정보 저장 원칙에 동의한 것으로 처리됩니다.
        </p>
      </section>
    </main>
  );
}
