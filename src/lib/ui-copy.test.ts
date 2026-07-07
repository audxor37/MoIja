import assert from "node:assert/strict";
import test from "node:test";
import { extractDiscouragedCopyMatches, shouldMoveToHelp } from "./ui-copy";

test("flags long instructional copy that should not be visible by default", () => {
  const matches = extractDiscouragedCopyMatches(
    "초대받은 경기의 참석 여부, 대기 상태, 리마인드, 내 기록을 로그인 후 바로 확인할 수 있습니다."
  );

  assert.deepEqual(matches, ["확인할 수 있습니다"]);
});

test("keeps short labels and moves complex concepts to help", () => {
  assert.equal(extractDiscouragedCopyMatches("카카오로 시작하기").length, 0);
  assert.equal(shouldMoveToHelp("출석 방식"), true);
  assert.equal(shouldMoveToHelp("노쇼"), true);
  assert.equal(shouldMoveToHelp("팀 이름"), false);
});
