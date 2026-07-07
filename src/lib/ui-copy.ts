const discouragedVisibleCopyPatterns = [
  "확인할 수 있습니다",
  "사용할 수 있습니다",
  "바로 확인하세요",
  "먼저 로그인하세요",
  "입력하세요",
  "진행합니다"
];

const helpOnlyConcepts = new Set(["출석 방식", "GPS", "대기", "노쇼", "역할", "권한", "신뢰도"]);

export function extractDiscouragedCopyMatches(copy: string) {
  return discouragedVisibleCopyPatterns.filter((pattern) => copy.includes(pattern));
}

export function shouldMoveToHelp(label: string) {
  return Array.from(helpOnlyConcepts).some((concept) => label.includes(concept));
}
