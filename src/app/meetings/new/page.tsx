import { ArrowLeft } from "lucide-react";
import { createMeeting } from "@/app/meetings/actions";
import { MeetingCreateForm } from "@/components/meeting-create-form";
import { RoutePendingLink } from "@/components/pending-ui";

export default async function NewMeetingPage() {
  return (
    <main className="min-h-screen bg-app text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <RoutePendingLink
              aria-label="대시보드로 돌아가기"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-secondary shadow-soft transition hover:bg-surfaceAlt"
              href="/"
            >
              <ArrowLeft size={20} />
            </RoutePendingLink>
            <div>
              <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
                경기 생성
              </span>
              <h1 className="mt-2 text-[30px] font-bold leading-10">
                새 경기
              </h1>
            </div>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-3xl gap-6 py-6 lg:py-8">
          <MeetingCreateForm action={createMeeting} />
        </section>
      </div>
    </main>
  );
}
