"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarClock, MapPin, Plus, Repeat2, Timer, Users } from "lucide-react";
import { HelpIcon } from "@/components/help-icon";
import { RoutePendingLink, SubmitButton } from "@/components/pending-ui";
import { resolveWeeklyStartsOn } from "@/lib/meetings";

const attendanceMethods = [
  { value: "manual", label: "운영자 확인", description: "현장에서 운영자가 직접 출석을 확정합니다.", badge: "MVP 권장" },
  { value: "qr", label: "QR 체크", description: "멤버가 QR로 빠르게 체크인합니다.", badge: "빠른 체크" },
  { value: "gps_approval", label: "GPS + 승인", description: "위치 확인 후 운영자가 최종 승인합니다.", badge: "신뢰도 강화" }
];

const capacityOptions = Array.from({ length: 15 }, (_, index) => index + 10);
const repeatCountOptions = Array.from({ length: 11 }, (_, index) => index + 2);
const maxSeriesCount = 12;
const weekdayOptions = [
  { value: "1", label: "월요일" },
  { value: "2", label: "화요일" },
  { value: "3", label: "수요일" },
  { value: "4", label: "목요일" },
  { value: "5", label: "금요일" },
  { value: "6", label: "토요일" },
  { value: "0", label: "일요일" }
];

type MeetingCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function MeetingCreateForm({ action }: MeetingCreateFormProps) {
  const [startsOn, setStartsOn] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [weeklyStartOn, setWeeklyStartOn] = useState("");
  const [weeklyWeekday, setWeeklyWeekday] = useState("4");
  const [repeatMode, setRepeatMode] = useState<"once" | "weekly">("once");
  const [repeatCount, setRepeatCount] = useState(8);
  const [baseOpponent, setBaseOpponent] = useState("");
  const [seriesOpponents, setSeriesOpponents] = useState<string[]>(Array.from({ length: maxSeriesCount }, () => ""));

  const firstWeeklyStartsOn = useMemo(
    () => resolveWeeklyStartsOn(weeklyStartOn, weeklyWeekday) ?? "",
    [weeklyStartOn, weeklyWeekday]
  );
  const scheduleStartsOn = repeatMode === "weekly" ? firstWeeklyStartsOn : startsOn;
  const rounds = useMemo(
    () =>
      Array.from({ length: repeatCount }, (_, index) => ({
        index,
        label: formatRoundLabel(scheduleStartsOn, startsAt, index)
      })),
    [repeatCount, scheduleStartsOn, startsAt]
  );

  const updateBaseOpponent = (value: string) => {
    setBaseOpponent(value);
    setSeriesOpponents((currentOpponents) =>
      Array.from({ length: maxSeriesCount }, (_, index) => (index < repeatCount ? value : currentOpponents[index] ?? ""))
    );
  };

  return (
    <form action={action} className="grid gap-5 rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <section>
        <SectionHeader eyebrow="기본 정보" title="경기 정보" />
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-secondary">경기 이름</span>
            <input
              className="field-input"
              name="title"
              placeholder="예: 목요일 풋살 정기전"
              required
              type="text"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-secondary">운영 메모</span>
            <textarea
              className="min-h-32 resize-none rounded-[14px] border border-line bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition placeholder:text-disabled focus:border-strategy focus:ring-4 focus:ring-[#2563EB]/10"
              name="memo"
              placeholder="준비물, 팀 배정, 우천 안내"
            />
          </label>
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="반복 설정 및 일정" title="언제 열리나요?" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["once", "1회성 경기", "선택한 날짜에 한 경기만 만듭니다."],
            ["weekly", "매주 반복", "같은 요일과 시간으로 원하는 주차만큼 만듭니다."]
          ].map(([value, label, description]) => (
            <label className="grid cursor-pointer gap-2 rounded-2xl border border-line bg-white p-4 text-sm" key={value}>
              <span className="flex items-center gap-2 font-bold">
                <input
                  checked={repeatMode === value}
                  className="h-4 w-4 accent-primary"
                  name="repeatMode"
                  onChange={() => setRepeatMode(value as "once" | "weekly")}
                  type="radio"
                  value={value}
                />
                <Repeat2 size={16} />
                {label}
              </span>
              <span className="text-xs font-semibold leading-5 text-secondary">{description}</span>
            </label>
          ))}
        </div>
        <input name="startsOn" type="hidden" value={repeatMode === "weekly" ? "" : startsOn} />
        {repeatMode === "weekly" ? (
          <div className="mt-4 grid gap-3 rounded-2xl border border-line bg-surfaceAlt p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">반복 시작 주</span>
                <input
                  className="field-input bg-white"
                  name="weeklyStartOn"
                  onChange={(event) => setWeeklyStartOn(event.target.value)}
                  required
                  type="date"
                  value={weeklyStartOn}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">요일</span>
                <select
                  className="field-input bg-white"
                  name="weeklyWeekday"
                  onChange={(event) => setWeeklyWeekday(event.target.value)}
                  value={weeklyWeekday}
                >
                  {weekdayOptions.map((weekday) => (
                    <option key={weekday.value} value={weekday.value}>
                      {weekday.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">시간</span>
                <input className="field-input bg-white" name="startsAt" onChange={(event) => setStartsAt(event.target.value)} required type="time" />
              </label>
            </div>
            <label className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center">
              <span className="text-sm font-semibold text-secondary">반복 주차</span>
              <select
                className="field-input bg-white"
                name="repeatCount"
                onChange={(event) => setRepeatCount(Number(event.target.value))}
                value={repeatCount}
              >
                {repeatCountOptions.map((count) => (
                  <option key={count} value={count}>
                    {count}주
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs font-semibold leading-5 text-secondary">
              첫 경기는 {firstWeeklyStartsOn ? formatRoundLabel(firstWeeklyStartsOn, startsAt, 0) : "시작 주와 요일 선택 후"}에 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 rounded-2xl border border-line bg-surfaceAlt p-4 sm:grid-cols-2">
            <input name="repeatCount" type="hidden" value="1" />
            <input name="weeklyStartOn" type="hidden" value="" />
            <input name="weeklyWeekday" type="hidden" value="" />
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-secondary">경기 날짜</span>
              <input className="field-input bg-white" onChange={(event) => setStartsOn(event.target.value)} required type="date" value={startsOn} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-secondary">시간</span>
              <input className="field-input bg-white" name="startsAt" onChange={(event) => setStartsAt(event.target.value)} required type="time" />
            </label>
          </div>
        )}
      </section>

      <section>
        <FieldGroup icon={MapPin} title="장소">
          <div className="grid gap-3">
            <input className="field-input" name="placeName" placeholder="장소명" type="text" />
            <input className="field-input" name="placeAddress" placeholder="주소 또는 지도 링크" type="text" />
          </div>
        </FieldGroup>
      </section>

      <section>
        <SectionHeader eyebrow="운영 규칙" title="참석 규칙" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="setup-field">
            <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
              <Users size={17} />
              정원
            </span>
            <select className="field-input bg-white" name="capacity" defaultValue="18" required>
              {capacityOptions.map((capacity) => (
                <option key={capacity} value={capacity}>
                  {capacity}명
                </option>
              ))}
            </select>
          </label>
          <label className="setup-field">
            <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
              대기 허용
              <HelpIcon title="대기 허용">
                정원이 찼을 때 멤버가 대기 상태로 응답할 수 있습니다.
              </HelpIcon>
            </span>
            <select className="field-input bg-white" name="allowWaitlist" defaultValue="on">
              <option value="on">허용</option>
              <option value="">허용 안 함</option>
            </select>
          </label>
          <label className="setup-field">
            <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
              <Timer size={17} />
              신청 마감
            </span>
            <select className="field-input bg-white" name="deadlineHours" defaultValue="6">
              <option value="6">시작 6시간 전</option>
              <option value="12">시작 12시간 전</option>
              <option value="24">시작 24시간 전</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="상대팀" title={repeatMode === "weekly" ? "회차별 상대팀" : "상대팀"} />
        {repeatMode === "weekly" ? (
          <div className="mt-5 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-secondary">모든 회차 기본 상대팀</span>
              <input
                className="field-input"
                name="opponentName"
                onChange={(event) => updateBaseOpponent(event.target.value)}
                placeholder="예: FC 관악"
                type="text"
                value={baseOpponent}
              />
            </label>
            <div className="max-h-80 overflow-y-auto rounded-2xl border border-line bg-surfaceAlt p-2">
              {rounds.map((round) => (
                <label
                  className="grid gap-2 border-b border-line/70 bg-surfaceAlt px-2 py-2 last:border-b-0 sm:grid-cols-[minmax(112px,160px)_1fr] sm:items-center"
                  key={round.index}
                >
                  <span className="text-sm font-bold text-secondary">{round.label}</span>
                  <input
                    className="field-input h-10 bg-white"
                    name="seriesOpponents"
                    onChange={(event) => {
                      const nextOpponents = [...seriesOpponents];
                      nextOpponents[round.index] = event.target.value;
                      setSeriesOpponents(nextOpponents);
                    }}
                    placeholder="상대팀 미정"
                    type="text"
                    value={seriesOpponents[round.index]}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : (
          <label className="mt-5 grid gap-2">
            <span className="text-sm font-semibold text-secondary">상대팀</span>
            <input className="field-input" name="opponentName" placeholder="상대팀 미정" type="text" />
          </label>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2">
          <SectionHeader eyebrow="출석 방식" title="출석 확정" />
          <HelpIcon title="출석 방식">
            참석 응답과 실제 출석 확정은 분리됩니다. MVP에서는 운영자 확인을 권장합니다.
          </HelpIcon>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {attendanceMethods.map((method, index) => (
            <label
              className={`grid cursor-pointer gap-3 rounded-2xl border p-4 transition hover:border-strategy ${
                index === 0 ? "border-primary bg-[#F7FCF9]" : "border-line bg-white"
              }`}
              key={method.value}
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  className="h-4 w-4 accent-primary"
                  defaultChecked={index === 0}
                  name="attendanceMethod"
                  type="radio"
                  value={method.value}
                />
                <span className="rounded-full bg-[#E8F3FF] px-2.5 py-1 text-[11px] font-bold text-strategy">
                  {method.badge}
                </span>
              </div>
              <span className="flex items-center gap-2 text-base font-bold">
                {method.label}
                <HelpIcon title={method.label}>{method.description}</HelpIcon>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-card backdrop-blur sm:flex-row sm:justify-end">
        <RoutePendingLink
          className="inline-flex h-12 items-center justify-center rounded-xl bg-surfaceAlt px-5 text-sm font-semibold text-secondary transition hover:bg-line"
          href="/"
        >
          취소
        </RoutePendingLink>
        <SubmitButton
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-card transition hover:bg-[#12843D]"
          pendingLabel="생성 중"
        >
          <Plus size={18} />
          경기 만들기
        </SubmitButton>
      </div>
    </form>
  );
}

function formatRoundLabel(startsOn: string, startsAt: string, index: number) {
  if (!startsOn) {
    return `${index + 1}주차`;
  }

  const date = new Date(`${startsOn}T${startsAt || "00:00"}:00+09:00`);
  date.setDate(date.getDate() + index * 7);

  if (Number.isNaN(date.getTime())) {
    return `${index + 1}주차`;
  }

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(date);

  return startsAt ? `${formattedDate} ${startsAt}` : formattedDate;
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-strategy">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-bold leading-7">{title}</h2>
    </div>
  );
}

function FieldGroup({
  children,
  icon: Icon,
  title
}: {
  children: ReactNode;
  icon: typeof CalendarClock;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surfaceAlt p-4">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Icon className="text-strategy" size={20} />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
