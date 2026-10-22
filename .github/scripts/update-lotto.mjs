// 로또 당첨번호 자동 갱신 스크립트
// _data/lotto.json 의 마지막 회차 다음부터 동행복권에서 새 회차를 가져와 덧붙입니다.
// 깃허브 액션(.github/workflows/update-lotto.yml)이 매주 일요일에 실행합니다.
// 직접 실행: node .github/scripts/update-lotto.mjs   (Node.js 18 이상, 추가 설치 없음)
//
// 한 줄 형식: [회차, "YYYY-MM-DD", 번호1~6, 보너스, 1등 1인 당첨금, 1등 인원]

import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../../_data/lotto.json", import.meta.url);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "ko-KR,ko;q=0.9",
  "X-Requested-With": "XMLHttpRequest",
  "Referer": "https://www.dhlottery.co.kr/lt645/result",
};

// 동행복권 주소 두 가지를 차례로 시도합니다.
// 1) 새 홈페이지 주소  2) 예전 주소 (지금은 HTML을 돌려주는 경우가 많음)
const SOURCES = [
  {
    name: "새 주소",
    url: (no) => `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${no}`,
    parse(j, no) {
      const list = j?.data?.list;
      if (!Array.isArray(list)) throw new Error("응답 모양이 예상과 다릅니다");
      const it = list.find((e) => Number(e.ltEpsd) === no);
      if (!it) return null; // 아직 추첨 전
      const ymd = String(it.ltRflYmd);
      return [
        Number(it.ltEpsd), `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
        ...[it.tm1WnNo, it.tm2WnNo, it.tm3WnNo, it.tm4WnNo, it.tm5WnNo, it.tm6WnNo].map(Number),
        Number(it.bnsWnNo), Number(it.rnk1WnAmt), Number(it.rnk1WnNope),
      ];
    },
  },
  {
    name: "예전 주소",
    url: (no) => `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${no}`,
    parse(j) {
      if (j.returnValue !== "success") return null; // 아직 추첨 전
      return [
        j.drwNo, j.drwNoDate,
        j.drwtNo1, j.drwtNo2, j.drwtNo3, j.drwtNo4, j.drwtNo5, j.drwtNo6,
        j.bnusNo, j.firstWinamnt, j.firstPrzwnerCo,
      ];
    },
  },
];

function check(row, no) {
  const nums = row.slice(2, 9);
  const ok = row[0] === no
    && /^\d{4}-\d{2}-\d{2}$/.test(row[1])
    && nums.every((n) => Number.isInteger(n) && n >= 1 && n <= 45)
    && new Set(nums).size === 7
    && Number.isFinite(row[9]) && row[9] >= 0
    && Number.isInteger(row[10]) && row[10] >= 0;
  if (!ok) throw new Error(`${no}회 자료 형식이 이상합니다: ${JSON.stringify(row)}`);
  // 번호 6개는 작은 수부터 정렬해 기존 자료와 맞춤
  const six = row.slice(2, 8).sort((a, b) => a - b);
  return [row[0], row[1], ...six, row[8], row[9], row[10]];
}

async function fetchDraw(no) {
  const errors = [];
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url(no), { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      let j;
      try { j = JSON.parse(text); } catch { throw new Error("JSON이 아닌 응답(점검 중이거나 접속 차단)"); }
      const row = src.parse(j, no);
      return row ? check(row, no) : null;
    } catch (e) {
      errors.push(`${src.name}: ${e.message}`);
    }
  }
  throw new Error(errors.join(" / "));
}

const rows = JSON.parse(readFileSync(FILE, "utf8")).sort((a, b) => a[0] - b[0]);
console.log(`현재 마지막 회차: ${rows.at(-1)[0]}회 (${rows.at(-1)[1]})`);

let added = 0;
let failed = false;
for (let next = rows.at(-1)[0] + 1; ; next++) {
  let row;
  try { row = await fetchDraw(next); }
  catch (e) { console.error(`가져오기 실패 (${next}회): ${e.message}`); failed = true; break; }
  if (!row) { console.log(`${next}회는 아직 결과가 없습니다.`); break; }
  rows.push(row);
  added++;
  console.log(`추가: ${row[0]}회 ${row[1]} [${row.slice(2, 8).join(", ")}] + ${row[8]}`);
  await new Promise((r) => setTimeout(r, 800)); // 서버 부담 줄이기
}

if (added) {
  writeFileSync(FILE, "[\n" + rows.map((r) => JSON.stringify(r)).join(",\n") + "\n]\n");
  console.log(`${added}개 회차를 추가했습니다.`);
}

// 마지막 추첨일로부터 8일이 넘었는데 새 회차가 없으면 실패로 끝냅니다 → 깃허브가 알림 메일을 보냅니다.
const lastDate = new Date(rows.at(-1)[1] + "T21:00:00+09:00");
const days = (Date.now() - lastDate) / 86400000;
if (days > 8) {
  console.error(`마지막 자료가 ${Math.floor(days)}일 전 회차입니다.${failed ? " 동행복권 응답을 확인해 주세요." : ""}`);
  process.exit(1);
}
