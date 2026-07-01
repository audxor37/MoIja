export type ReliabilityAttendanceStatus = "attending" | "confirmed" | "absent" | "no_show";

export type ReliabilityAttendanceInput = {
  status: ReliabilityAttendanceStatus | null | undefined;
};

export type ReliabilityScore = {
  score: number;
  attendedCount: number;
  absentCount: number;
  noShowCount: number;
  totalCount: number;
  attendanceRate: number;
  noShowRate: number;
  currentStreak: number;
};

const ATTENDED_STATUSES: ReliabilityAttendanceStatus[] = ["attending", "confirmed"];

export function calculateReliabilityScore(attendances: ReliabilityAttendanceInput[]): ReliabilityScore {
  const completedAttendances = attendances.filter((attendance) => isReliabilityStatus(attendance.status));
  const attendedCount = completedAttendances.filter((attendance) => isAttendedStatus(attendance.status)).length;
  const absentCount = completedAttendances.filter((attendance) => attendance.status === "absent").length;
  const noShowCount = completedAttendances.filter((attendance) => attendance.status === "no_show").length;
  const totalCount = completedAttendances.length;
  const accountableCount = attendedCount + absentCount + noShowCount;
  const noShowBaseCount = attendedCount + noShowCount;
  const attendanceRate = accountableCount > 0 ? Math.round((attendedCount / accountableCount) * 100) : 0;
  const noShowRate = noShowBaseCount > 0 ? Math.round((noShowCount / noShowBaseCount) * 100) : 0;
  const currentStreak = countCurrentAttendanceStreak(completedAttendances);

  if (totalCount === 0) {
    return {
      score: 50,
      attendedCount,
      absentCount,
      noShowCount,
      totalCount,
      attendanceRate,
      noShowRate,
      currentStreak
    };
  }

  const rawScore = attendanceRate * 0.7 + (100 - noShowRate) * 0.2 + Math.min(currentStreak * 2, 10);

  return {
    score: clampScore(Math.round(rawScore)),
    attendedCount,
    absentCount,
    noShowCount,
    totalCount,
    attendanceRate,
    noShowRate,
    currentStreak
  };
}

function isReliabilityStatus(status: ReliabilityAttendanceInput["status"]): status is ReliabilityAttendanceStatus {
  return status === "attending" || status === "confirmed" || status === "absent" || status === "no_show";
}

function isAttendedStatus(status: ReliabilityAttendanceInput["status"]) {
  return status ? ATTENDED_STATUSES.includes(status as ReliabilityAttendanceStatus) : false;
}

function countCurrentAttendanceStreak(attendances: ReliabilityAttendanceInput[]) {
  let streak = 0;

  for (const attendance of attendances) {
    if (!isAttendedStatus(attendance.status)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function clampScore(score: number) {
  return Math.min(Math.max(score, 0), 100);
}
