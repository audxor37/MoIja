"use client";

import { useState } from "react";
import { RefreshCcw, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performRegenerateTeamInviteCode, performUpdateTeamMemberRole } from "@/app/team/actions";
import { HelpIcon } from "@/components/help-icon";
import { InviteCodeCopyButton } from "@/components/invite-code-copy-button";
import { PendingButtonContent } from "@/components/pending-ui";
import { useToast } from "@/components/toast-provider";
import { queryKeys } from "@/lib/query-keys";
import { canAssignTeamRole, TEAM_ROLES, teamRoleLabel } from "@/lib/team-management";

export type TeamManagementMember = {
  id: string;
  profileId: string;
  role: string;
  joinedAt: string;
  nickname: string;
};

export function TeamManagementPanel({
  team,
  actorRole,
  currentUserId,
  initialMembers
}: {
  team: { id: string; name: string; inviteCode: string | null };
  actorRole: string;
  currentUserId: string;
  initialMembers: TeamManagementMember[];
}) {
  const queryClient = useQueryClient();
  const showToast = useToast();
  const [inviteCode, setInviteCode] = useState(team.inviteCode);
  const [members, setMembers] = useState(initialMembers);

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("teamId", team.id);
      return performRegenerateTeamInviteCode(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });

      if (result.ok) {
        setInviteCode(result.data.inviteCode);
        void queryClient.invalidateQueries({ queryKey: queryKeys.team(team.id) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
      }
    },
    onError: () => {
      showToast({ message: "변경 내용을 저장하지 못했습니다.", tone: "error" });
    }
  });

  const roleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("role", role);
      return performUpdateTeamMemberRole(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });

      if (result.ok) {
        setMembers((current) =>
          current.map((member) => (member.id === result.data.memberId ? { ...member, role: result.data.role } : member))
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(team.id) });
      }
    },
    onError: () => {
      showToast({ message: "변경 내용을 저장하지 못했습니다.", tone: "error" });
    }
  });

  return (
    <section className="mt-6 grid gap-5">
      <aside className="grid gap-4">
        <section className="rounded-2xl border border-appLine bg-appCard p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-appCardSoft text-lime">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-lime">{teamRoleLabel(actorRole)}</p>
              <h1 className="text-2xl font-bold text-white">{team.name}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold text-appTextSoft">축구를 더 오래, 더 즐겁게</p>
          <div className="mt-5 grid gap-2">
            <InviteCodeCopyButton inviteCode={inviteCode} />
            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-appLine bg-appCardSoft px-4 text-sm font-bold text-appTextSoft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
              type="button"
            >
              <RefreshCcw size={16} />
              <PendingButtonContent pending={inviteMutation.isPending} pendingLabel="재발급 중">
                초대 코드 재발급
              </PendingButtonContent>
            </button>
          </div>
        </section>
      </aside>

      <section className="rounded-2xl border border-appLine bg-appCard p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">멤버 목록</h2>
              <HelpIcon title="역할">
                Owner와 Manager는 팀과 경기를 관리합니다. Coach는 라인업을 관리하고 Member는 본인 참석 응답을 남깁니다.
              </HelpIcon>
            </div>
          </div>
          <Users className="text-lime" size={24} />
        </div>

        <div className="mt-5 grid gap-3">
          {members.map((member) => {
            const isPending = roleMutation.isPending && roleMutation.variables?.memberId === member.id;
            return (
              <article className="rounded-2xl border border-appLine bg-appCardSoft p-4" key={member.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-white">{member.nickname}</p>
                    <p className="mt-1 text-xs font-semibold text-appMuted">{teamRoleLabel(member.role)}</p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="field-input h-11 min-w-32 py-0 text-sm"
                      defaultValue={member.role}
                      disabled={isPending}
                      onChange={(event) => roleMutation.mutate({ memberId: member.id, role: event.target.value })}
                    >
                      {TEAM_ROLES.map((role) => (
                        <option
                          disabled={
                            !canAssignTeamRole({
                              actorRole,
                              currentTargetRole: member.role,
                              nextTargetRole: role,
                              isSelf: member.profileId === currentUserId
                            }) && role !== member.role
                          }
                          key={role}
                          value={role}
                        >
                          {teamRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <span className="inline-flex h-11 min-w-14 items-center justify-center text-xs font-bold text-appMuted">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-lime">
                          <PendingButtonContent pending pendingLabel="저장 중">
                            저장
                          </PendingButtonContent>
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
