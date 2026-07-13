import { createMeeting } from "@/app/meetings/actions";
import { AppShell, TopBar } from "@/components/app-shell";
import { MeetingCreateForm } from "@/components/meeting-create-form";

export default async function NewMeetingPage() {
  return (
    <AppShell activePath="/meetings">
      <TopBar title="경기 만들기" backHref="/meetings" />
      <p className="mt-8 text-sm font-black text-appTextSoft">운영자만 볼 수 있는 설정입니다</p>
      <h1 className="mt-2 text-[30px] font-black leading-tight text-white">새 경기 만들기</h1>
      <section className="mt-6">
        <MeetingCreateForm action={createMeeting} />
      </section>
    </AppShell>
  );
}
