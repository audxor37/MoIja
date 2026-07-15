"use client";

import { type Dispatch, type SetStateAction, useMemo, useRef, useState } from "react";
import { Download, Plus, Save, Share2, Trash2, Trophy, UserPlus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  performSaveLineup,
  performSaveMatchRecord,
  performUpdateGuestAttendance
} from "@/app/meetings/actions";
import { InlineSpinner, PendingButtonContent } from "@/components/pending-ui";
import {
  FORMATION_PRESETS,
  buildInviteSharePayload,
  getBoardImageFileName,
  getBoardImageSaveFallback,
  getDefaultLineupSlots,
  getFormationPreset,
  guestStatusLabel,
  playerKindLabel,
  summarizeScoringEvents,
  type LineupSlot
} from "@/lib/match-cycle";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/toast-provider";

export type MatchCyclePlayer = {
  id: string;
  playerKind: "member" | "guest";
  profileId: string | null;
  guestId: string | null;
  matchGuestId: string | null;
  displayName: string;
  status: string;
  positionCode: string | null;
};

export type MatchInviteRow = {
  id: string;
  code: string;
  expiresAt: string | null;
  usedCount: number;
  maxUses: number | null;
};

export type MatchRecordValue = {
  result: "win" | "draw" | "loss" | null;
  goalsFor: number;
  goalsAgainst: number;
  opponentName: string | null;
  formation: string | null;
  memo: string | null;
};
export type PlayerRecordValue = {
  profileId: string | null;
  guestId: string | null;
  goals: number;
  assists: number;
  positionCode: string | null;
};

type LineupSlotState = LineupSlot;
type ScoringEventState = {
  id: string;
  scorerId: string;
  assistId: string | null;
};

export function MatchCyclePanel({
  meetingId,
  canManageGuests,
  canManageLineup,
  canManageRecord,
  initialInvites,
  initialPlayers,
  initialLineup,
  initialRecord,
  initialPlayerRecords,
  meetingTitle,
  initialSection = "lineup",
  showSectionTabs = true
}: {
  meetingId: string;
  meetingTitle: string;
  canManageGuests: boolean;
  canManageLineup: boolean;
  canManageRecord: boolean;
  initialInvites: MatchInviteRow[];
  initialPlayers: MatchCyclePlayer[];
  initialLineup: { formation: string; boardNote: string | null } | null;
  initialRecord: MatchRecordValue | null;
  initialPlayerRecords: PlayerRecordValue[];
  initialSection?: "lineup" | "guests" | "record";
  showSectionTabs?: boolean;
}) {
  const queryClient = useQueryClient();
  const showToast = useToast();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [players, setPlayers] = useState(initialPlayers);
  const [activeSection, setActiveSection] = useState<"lineup" | "guests" | "record">(initialSection);
  const [formation, setFormation] = useState(getFormationPreset(initialLineup?.formation ?? initialRecord?.formation ?? "4-4-2").code);
  const [boardNote, setBoardNote] = useState(initialLineup?.boardNote ?? "");
  const [scoringEvents, setScoringEvents] = useState<ScoringEventState[]>(() =>
    buildInitialScoringEvents(initialPlayers, initialPlayerRecords)
  );
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedScorerId, setSelectedScorerId] = useState("");
  const [selectedAssistId, setSelectedAssistId] = useState("");
  const [sharingInviteCode, setSharingInviteCode] = useState<string | null>(null);
  const [isBoardImagePending, setIsBoardImagePending] = useState(false);

  const playablePlayers = useMemo(
    () => players.filter((player) => ["attending", "accepted", "confirmed"].includes(player.status)),
    [players]
  );
  const [lineupSlots, setLineupSlots] = useState<LineupSlotState[]>(() =>
    buildDefaultLineupState(initialLineup?.formation ?? initialRecord?.formation ?? "4-4-2", initialPlayers.filter((player) => ["attending", "accepted", "confirmed"].includes(player.status)))
  );
  const assignedPlayerIds = useMemo(() => new Set(lineupSlots.map((slot) => slot.playerId).filter(Boolean)), [lineupSlots]);
  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const scoreOptions = Array.from({ length: 21 }, (_, index) => index);

  const guestStatusMutation = useMutation({
    mutationFn: async ({ matchGuestId, status }: { matchGuestId: string; status: string }) => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      formData.set("matchGuestId", matchGuestId);
      formData.set("status", status);
      return performUpdateGuestAttendance(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });
      if (result.ok) {
        setPlayers((current) =>
          current.map((player) =>
            player.matchGuestId === result.data.matchGuestId ? { ...player, status: result.data.status } : player
          )
        );
      }
    }
  });

  const lineupMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      formData.set("formation", formation);
      formData.set("boardNote", boardNote);
      formData.set("players", JSON.stringify(buildLineupPayload(lineupSlots)));
      return performSaveLineup(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendances(meetingId) });
    }
  });

  const recordMutation = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const formData = new FormData(form);
      formData.set("meetingId", meetingId);
      formData.set("formation", formation);
      formData.set("playerRecords", JSON.stringify(buildRecordPayload(playablePlayers, scoringEvents)));
      return performSaveMatchRecord(formData);
    },
    onSuccess: (result) => showToast({ message: result.message, tone: result.ok ? "success" : "error" })
  });

  async function shareInviteCode(inviteCode: string) {
    setSharingInviteCode(inviteCode);
    const payload = buildInviteSharePayload({
      inviteCode,
      siteUrl: window.location.origin
    });

    try {
      if (navigator.share) {
        await navigator.share(payload);
        showToast({ message: "초대 공유를 열었습니다." });
        return;
      }

      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      showToast({ message: "공유가 제한된 환경이라 초대 내용을 복사했습니다." });
    } catch {
      showToast({ message: `공유가 제한된 환경입니다. 코드: ${inviteCode}`, tone: "error" });
    } finally {
      setSharingInviteCode(null);
    }
  }

  function openScoreModal() {
    setSelectedScorerId(playablePlayers[0]?.id ?? "");
    setSelectedAssistId("");
    setIsScoreModalOpen(true);
  }

  function addScoringEvent() {
    if (!selectedScorerId) {
      showToast({ message: "득점자를 선택해 주세요.", tone: "error" });
      return;
    }

    setScoringEvents((current) => [
      ...current,
      {
        id: `event:${Date.now()}:${current.length}`,
        scorerId: selectedScorerId,
        assistId: selectedAssistId || null
      }
    ]);
    setIsScoreModalOpen(false);
  }

  async function downloadBoardImage() {
    try {
      const pngBlob = await createBoardPngBlob({ formation, slots: lineupSlots, note: boardNote });
      downloadBlob(pngBlob, getBoardImageFileName(meetingTitle));
      showToast({ message: "라인업 이미지를 저장했습니다." });
    } catch {
      showToast({ message: "라인업 이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.", tone: "error" });
    }
  }

  async function saveBoardImageToPhotos() {
    setIsBoardImagePending(true);
    try {
      const pngBlob = await createBoardPngBlob({ formation, slots: lineupSlots, note: boardNote });
      await saveBoardImageWithFallback(pngBlob);
    } catch {
      showToast({ message: "라인업 이미지 공유에 실패했습니다. 잠시 후 다시 시도해 주세요.", tone: "error" });
    } finally {
      setIsBoardImagePending(false);
    }
  }

  async function saveBoardImageWithFallback(pngBlob: Blob) {
    const file = new File([pngBlob], getBoardImageFileName(meetingTitle), { type: "image/png" });

    if (canShareBoardImage(file)) {
      await navigator.share({
        files: [file],
        title: "MoIja 라인업"
      });
      showToast({ message: "라인업 이미지 공유를 열었습니다." });
      return;
    }

    const fallback = getBoardImageSaveFallback({
      userAgent: navigator.userAgent,
      canShareFiles: false
    });

    if (fallback.primaryAction === "open") {
      openBlobInNewTab(pngBlob);
    } else {
      downloadBlob(pngBlob, file.name);
    }

    showToast({ message: fallback.message });
  }

  return (
    <article className="min-w-0 rounded-2xl border border-appLine bg-appCard p-4 text-appText shadow-card sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white">경기 운영 사이클</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-appTextSoft">
            용병, 라인업, 라인업 공유, 경기 기록을 참석자 기준으로 관리합니다.
          </p>
        </div>
      </div>

      {showSectionTabs ? (
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-appCardSoft p-1">
          {[
            ["lineup", "라인업"],
            ["guests", "용병"],
            ["record", "기록"]
          ].map(([value, label]) => (
            <button
              className={`h-10 rounded-lg text-sm font-bold ${activeSection === value ? "bg-lime text-app shadow-soft" : "text-appTextSoft"}`}
              key={value}
              onClick={() => setActiveSection(value as typeof activeSection)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {canManageLineup && activeSection === "lineup" ? (
        <section className="mt-4 grid gap-4">
          <select
            className="field-input"
            value={formation}
            onChange={(event) => {
              const nextFormation = getFormationPreset(event.target.value).code;
              setFormation(nextFormation);
              setLineupSlots(buildDefaultLineupState(nextFormation, playablePlayers));
            }}
          >
            {FORMATION_PRESETS.map((presetOption) => (
              <option key={presetOption.code} value={presetOption.code}>
                {presetOption.label}
              </option>
            ))}
          </select>
          <input className="field-input" value={boardNote} onChange={(event) => setBoardNote(event.target.value)} placeholder="작전 메모" />
          <div ref={boardRef} className="relative aspect-[4/3] w-full max-w-full touch-none overflow-hidden rounded-xl bg-[#166534] text-white">
            <div className="absolute inset-4 rounded-lg border-2 border-white/55" />
            <div className="absolute inset-x-4 top-1/2 border-t border-white/35" />
            <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
            <div className="absolute bottom-4 left-1/2 h-[18%] w-[34%] -translate-x-1/2 rounded-t-lg border-x border-t border-white/35" />
            {lineupSlots.map((slot) => (
              <button
                className={`absolute grid min-h-9 w-14 max-w-[18%] -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full px-1 text-center text-[10px] font-black leading-tight shadow-soft active:cursor-grabbing sm:min-h-12 sm:w-20 sm:px-2 sm:text-[11px] ${slot.displayName ? "bg-white text-primary" : "border border-dashed border-white/80 bg-white/15 text-white"}`}
                key={slot.id}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (event.buttons !== 1) return;
                  moveLineupSlot(boardRef.current, setLineupSlots, slot.id, event.clientX, event.clientY);
                }}
                style={{ left: `${slot.xPercent}%`, top: `${slot.yPercent}%` }}
                type="button"
              >
                <span className={slot.displayName ? "text-[9px] text-secondary sm:text-[10px]" : "text-[9px] text-white/90 sm:text-[10px]"}>{slot.positionCode}</span>
                <span className="max-w-full truncate">{slot.displayName ?? "미배정"}</span>
              </button>
            ))}
          </div>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {lineupSlots.map((slot) => (
              <div className="grid gap-2 rounded-xl border border-line p-3" key={slot.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{slot.positionCode} · {slot.displayName ?? "미배정"}</p>
                    <p className="truncate text-xs font-semibold text-muted">{slot.positionLabel}</p>
                  </div>
                  <select
                    className="h-9 min-w-0 max-w-[50%] rounded-lg border border-line bg-white px-2 text-xs font-bold"
                    value={slot.playerId ?? ""}
                    onChange={(event) => {
                      assignPlayerToSlot(setLineupSlots, slot.id, event.target.value, playablePlayers);
                    }}
                  >
                    <option value="">미배정</option>
                    {playablePlayers.map((player) => (
                      <option disabled={assignedPlayerIds.has(player.id) && player.id !== slot.playerId} key={player.id} value={player.id}>
                        {player.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-lime px-2 text-sm font-bold text-app disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4" disabled={lineupMutation.isPending} onClick={() => lineupMutation.mutate()} type="button">
              <PendingButtonContent pending={lineupMutation.isPending} pendingLabel="저장 중"><Save size={16} /> 저장</PendingButtonContent>
            </button>
            <button className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-appCardSoft px-2 text-sm font-bold text-appTextSoft disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4" disabled={isBoardImagePending} onClick={saveBoardImageToPhotos} type="button">
              <PendingButtonContent pending={isBoardImagePending} pendingLabel="공유 준비 중"><Share2 size={16} /> 라인업 공유</PendingButtonContent>
            </button>
            {/* <button className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-surfaceAlt px-2 text-sm font-bold text-secondary sm:gap-2 sm:px-4" onClick={downloadBoardImage} type="button"><Download size={16} /> 이미지</button> */}
          </div>
        </section>
      ) : null}

      {canManageGuests && activeSection === "guests" ? (
        <section className="mt-4 grid gap-4 rounded-xl border border-appLine bg-appCardSoft p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-bold"><UserPlus size={18} /> 용병 초대</h3>
          </div>
          <div className="grid gap-2">
            {initialInvites.length === 0 ? (
              <div className="rounded-lg bg-white px-3 py-3 text-sm font-bold text-muted">초대코드 준비 중</div>
            ) : null}
            {initialInvites.map((invite) => (
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-bold" key={invite.id}>
                <span className="select-all">{invite.code}</span>
                <button
                  className="text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={sharingInviteCode !== null}
                  onClick={() => void shareInviteCode(invite.code)}
                  title="초대코드 공유"
                  type="button"
                >
                  {sharingInviteCode === invite.code ? <InlineSpinner /> : <Share2 size={16} />}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeSection === "guests" ? (
      <section className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
        <h3 className="font-bold">참석자</h3>
        {players.map((player) => (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-3" key={player.id}>
            <div>
              <p className="font-bold">{player.displayName}</p>
              <p className="text-xs font-semibold text-muted">{playerKindLabel(player.playerKind)} · {player.playerKind === "guest" ? guestStatusLabel(player.status) : player.status}</p>
            </div>
            {canManageGuests && player.playerKind === "guest" && player.matchGuestId ? (
              <div className="flex gap-2">
                <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={guestStatusMutation.isPending} onClick={() => guestStatusMutation.mutate({ matchGuestId: player.matchGuestId!, status: "confirmed" })} type="button">
                  <PendingButtonContent pending={guestStatusMutation.isPending && guestStatusMutation.variables?.matchGuestId === player.matchGuestId && guestStatusMutation.variables.status === "confirmed"} pendingLabel="저장 중">참석</PendingButtonContent>
                </button>
                <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#FFD7D7] px-3 text-xs font-bold text-danger disabled:cursor-not-allowed disabled:opacity-60" disabled={guestStatusMutation.isPending} onClick={() => guestStatusMutation.mutate({ matchGuestId: player.matchGuestId!, status: "no_show" })} type="button">
                  <PendingButtonContent pending={guestStatusMutation.isPending && guestStatusMutation.variables?.matchGuestId === player.matchGuestId && guestStatusMutation.variables.status === "no_show"} pendingLabel="저장 중">노쇼</PendingButtonContent>
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </section>
      ) : null}

      {canManageRecord && activeSection === "record" ? (
        <form className="mt-4 grid gap-4 rounded-xl border border-line p-4" onSubmit={(event) => {
          event.preventDefault();
          recordMutation.mutate(event.currentTarget);
        }}>
          <h3 className="flex items-center gap-2 font-bold"><Trophy size={18} /> 경기 기록</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="field-input" name="result" defaultValue={initialRecord?.result ?? "win"}>
              <option value="win">승</option>
              <option value="draw">무</option>
              <option value="loss">패</option>
            </select>
            <select className="field-input" name="goalsFor" defaultValue={initialRecord?.goalsFor ?? 0}>
              {scoreOptions.map((score) => (
                <option key={score} value={score}>우리 {score}</option>
              ))}
            </select>
            <select className="field-input" name="goalsAgainst" defaultValue={initialRecord?.goalsAgainst ?? 0}>
              {scoreOptions.map((score) => (
                <option key={score} value={score}>상대 {score}</option>
              ))}
            </select>
          </div>
          <section className="grid gap-2 rounded-xl bg-appCardSoft p-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold">골 / 어시스트</h4>
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={playablePlayers.length === 0}
                onClick={openScoreModal}
                type="button"
              >
                <Plus size={14} /> 골 추가
              </button>
            </div>
            {scoringEvents.length === 0 ? (
              <div className="rounded-lg bg-white px-3 py-3 text-sm font-bold text-muted">아직 골 기록이 없습니다.</div>
            ) : null}
            {scoringEvents.map((event, index) => {
              const scorer = playerById.get(event.scorerId);
              const assist = event.assistId ? playerById.get(event.assistId) : null;

              return (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm font-bold" key={event.id}>
                  <span className="min-w-0 truncate">
                    {index + 1}골 · {scorer?.displayName ?? "득점자 미확인"}
                    {assist ? ` / 도움 ${assist.displayName}` : " / 도움 없음"}
                  </span>
                  <button
                    className="shrink-0 text-danger"
                    onClick={() => setScoringEvents((current) => current.filter((item) => item.id !== event.id))}
                    title="골 기록 삭제"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </section>
          <input className="field-input" name="opponentName" placeholder="상대팀" defaultValue={initialRecord?.opponentName ?? ""} />
          <textarea className="field-input min-h-24" name="memo" placeholder="경기 메모" defaultValue={initialRecord?.memo ?? ""} />
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={recordMutation.isPending} type="submit">
            <PendingButtonContent pending={recordMutation.isPending} pendingLabel="저장 중"><Save size={16} /> 경기 기록 저장</PendingButtonContent>
          </button>
        </form>
      ) : null}

      {isScoreModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 px-3 py-4 sm:place-items-center">
          <div className="grid w-full max-w-md gap-4 rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">골 기록 추가</h3>
              <button className="grid size-9 place-items-center rounded-lg bg-surfaceAlt text-secondary" onClick={() => setIsScoreModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <label className="grid gap-1 text-sm font-bold">
              득점자
              <select className="field-input bg-white" value={selectedScorerId} onChange={(event) => setSelectedScorerId(event.target.value)}>
                {playablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>{player.displayName}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              어시스트
              <select className="field-input bg-white" value={selectedAssistId} onChange={(event) => setSelectedAssistId(event.target.value)}>
                <option value="">없음</option>
                {playablePlayers.map((player) => (
                  <option disabled={player.id === selectedScorerId} key={player.id} value={player.id}>{player.displayName}</option>
                ))}
              </select>
            </label>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white" onClick={addScoringEvent} type="button">
              <Save size={16} /> 저장
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function buildLineupPayload(slots: LineupSlotState[]) {
  return slots
    .filter((slot) => slot.displayName && slot.playerKind)
    .map((slot) => ({
      playerKind: slot.playerKind,
      profileId: slot.profileId,
      guestId: slot.guestId,
      displayName: slot.displayName,
      positionCode: slot.positionCode,
      xPercent: slot.xPercent,
      yPercent: slot.yPercent,
      isStarter: slot.isStarter
    }));
}

function buildDefaultLineupState(formation: string, players: MatchCyclePlayer[]): LineupSlotState[] {
  return getDefaultLineupSlots(formation, players);
}

function buildRecordPayload(players: MatchCyclePlayer[], scoringEvents: ScoringEventState[]) {
  return summarizeScoringEvents({
    players: players.map((player) => ({
      id: player.id,
      playerKind: player.playerKind,
      profileId: player.profileId,
      guestId: player.guestId,
      positionCode: player.positionCode
    })),
    events: scoringEvents.map((event) => ({
      scorerId: event.scorerId,
      assistId: event.assistId
    }))
  });
}

function buildInitialScoringEvents(players: MatchCyclePlayer[], records: PlayerRecordValue[]): ScoringEventState[] {
  const playerIdByRecordKey = new Map(
    players.map((player) => [
      player.playerKind === "member" ? `member:${player.profileId}` : `guest:${player.guestId}`,
      player.id
    ])
  );
  const scorers = records.flatMap((record) => {
    const key = record.profileId ? `member:${record.profileId}` : `guest:${record.guestId}`;
    const playerId = playerIdByRecordKey.get(key);
    return playerId ? Array.from({ length: record.goals }, () => playerId) : [];
  });
  const assists = records.flatMap((record) => {
    const key = record.profileId ? `member:${record.profileId}` : `guest:${record.guestId}`;
    const playerId = playerIdByRecordKey.get(key);
    return playerId ? Array.from({ length: record.assists }, () => playerId) : [];
  });

  return scorers.map((scorerId, index) => ({
    id: `initial:${index}`,
    scorerId,
    assistId: assists[index] && assists[index] !== scorerId ? assists[index] : null
  }));
}

async function svgToPngBlob(svg: string) {
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = svgUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("canvas_unavailable");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("png_blob_unavailable"));
        }
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function createBoardPngBlob({ formation, slots, note }: { formation: string; slots: LineupSlotState[]; note: string }) {
  const svg = buildBoardSvg({ formation, slots, note });
  return svgToPngBlob(svg);
}

function canShareBoardImage(file?: File) {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  if (file) {
    return navigator.canShare({ files: [file] });
  }

  try {
    const probeFile = new File([""], "moija-lineup.png", { type: "image/png" });
    return navigator.canShare({ files: [probeFile] });
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function buildBoardSvg({ formation, slots, note }: { formation: string; slots: LineupSlotState[]; note: string }) {
  const playerNodes = slots
    .map((slot) => {
      const x = slot.xPercent * 8;
      const y = slot.yPercent * 6;
      const hasPlayer = Boolean(slot.displayName);
      return `<circle cx="${x}" cy="${y}" r="42" fill="${hasPlayer ? "white" : "#ffffff22"}" stroke="white" stroke-dasharray="${hasPlayer ? "0" : "5 5"}"/><text x="${x}" y="${y - 4}" text-anchor="middle" font-size="15" font-weight="700" fill="${hasPlayer ? "#64748b" : "white"}">${escapeSvg(slot.positionCode)}</text><text x="${x}" y="${y + 17}" text-anchor="middle" font-size="17" font-weight="800" fill="${hasPlayer ? "#166534" : "white"}">${escapeSvg(slot.displayName ?? "미배정")}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" rx="36" fill="#166534"/><rect x="40" y="40" width="720" height="520" rx="18" fill="none" stroke="white" stroke-opacity=".55" stroke-width="4"/><line x1="40" y1="300" x2="760" y2="300" stroke="white" stroke-opacity=".35" stroke-width="3"/><circle cx="400" cy="300" r="60" fill="none" stroke="white" stroke-opacity=".3" stroke-width="3"/><path d="M264 560V452H536V560" fill="none" stroke="white" stroke-opacity=".35" stroke-width="3"/><text x="50" y="30" font-size="22" font-weight="800" fill="#0f172a">${escapeSvg(formation)} ${escapeSvg(note)}</text>${playerNodes}</svg>`;
}

function assignPlayerToSlot(
  setLineupSlots: Dispatch<SetStateAction<LineupSlotState[]>>,
  slotId: string,
  playerId: string,
  players: MatchCyclePlayer[]
) {
  const selected = players.find((player) => player.id === playerId) ?? null;
  setLineupSlots((current) =>
    current.map((slot) => {
      if (slot.id === slotId) {
        return {
          ...slot,
          playerId: selected?.id ?? null,
          playerKind: selected?.playerKind ?? null,
          profileId: selected?.profileId ?? null,
          guestId: selected?.guestId ?? null,
          displayName: selected?.displayName ?? null
        };
      }
      if (selected && slot.playerId === selected.id) {
        return { ...slot, playerId: null, playerKind: null, profileId: null, guestId: null, displayName: null };
      }
      return slot;
    })
  );
}

function moveLineupSlot(
  board: HTMLDivElement | null,
  setLineupSlots: Dispatch<SetStateAction<LineupSlotState[]>>,
  slotId: string,
  clientX: number,
  clientY: number
) {
  if (!board) return;
  const rect = board.getBoundingClientRect();
  const xPercent = clamp(((clientX - rect.left) / rect.width) * 100, 8, 92);
  const yPercent = clamp(((clientY - rect.top) / rect.height) * 100, 7, 93);
  setLineupSlots((current) => current.map((slot) => (slot.id === slotId ? { ...slot, xPercent, yPercent } : slot)));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}
