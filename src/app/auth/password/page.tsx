import { ArrowLeft, KeyRound, Mail, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { signInWithPassword, signUpWithPassword } from "./actions";

type PasswordAuthMode = "sign-in" | "sign-up";

export default async function PasswordAuthPage({
  searchParams
}: {
  searchParams?: Promise<{ mode?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const mode: PasswordAuthMode = params?.mode === "sign-up" ? "sign-up" : "sign-in";
  const isSignUp = mode === "sign-up";

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

        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F3FF] text-strategy">
          <KeyRound size={28} />
        </div>

        <h1 className="mt-6 text-center text-3xl font-black leading-tight tracking-normal">
          {isSignUp ? "회원가입" : "로그인"}
        </h1>
        <p className="mt-3 text-center text-base font-semibold leading-7 text-secondary">
          {isSignUp ? "이메일, 비밀번호, 닉네임만 입력하세요." : "이메일과 비밀번호를 입력하세요."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-surfaceAlt p-1.5">
          <Link
            className={`flex h-11 items-center justify-center rounded-xl text-sm font-black transition ${
              mode === "sign-in" ? "bg-white text-ink shadow-soft" : "text-secondary hover:text-ink"
            }`}
            href="/auth/password"
          >
            로그인
          </Link>
          <Link
            className={`flex h-11 items-center justify-center rounded-xl text-sm font-black transition ${
              mode === "sign-up" ? "bg-white text-ink shadow-soft" : "text-secondary hover:text-ink"
            }`}
            href="/auth/password?mode=sign-up"
          >
            회원가입
          </Link>
        </div>

        {isSignUp ? <SignUpForm /> : <SignInForm />}

        <Link
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-5 text-sm font-black text-[#191600] transition hover:brightness-95"
          href="/auth/kakao-login"
        >
          <MessageCircle size={19} />
          카카오로 계속하기
        </Link>
      </section>
    </main>
  );
}

function SignInForm() {
  return (
    <form action={signInWithPassword} className="mt-6 grid gap-4">
      <AuthField icon={Mail} label="이메일" name="email" placeholder="you@example.com" type="email" />
      <AuthField icon={KeyRound} label="비밀번호" name="password" placeholder="비밀번호" type="password" />
      <button
        className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-black text-white shadow-card transition hover:bg-[#12843D]"
        type="submit"
      >
        <KeyRound size={19} />
        이메일로 로그인
      </button>
    </form>
  );
}

function SignUpForm() {
  return (
    <form action={signUpWithPassword} className="mt-6 grid gap-4">
      <AuthField icon={Mail} label="이메일" name="email" placeholder="you@example.com" type="email" />
      <AuthField icon={KeyRound} label="비밀번호" name="password" placeholder="6자 이상" type="password" />
      <AuthField icon={UserRound} label="닉네임" name="nickname" placeholder="예: 모이자FC" type="text" />
      <button
        className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-black text-white shadow-card transition hover:bg-[#12843D]"
        type="submit"
      >
        <UserRound size={19} />
        회원가입
      </button>
    </form>
  );
}

function AuthField({
  icon: Icon,
  label,
  name,
  placeholder,
  type
}: {
  icon: typeof Mail;
  label: string;
  name: string;
  placeholder: string;
  type: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-secondary">{label}</span>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          autoComplete={name === "password" ? "current-password" : undefined}
          className="field-input w-full pl-11"
          name={name}
          placeholder={placeholder}
          type={type}
        />
      </div>
    </label>
  );
}
