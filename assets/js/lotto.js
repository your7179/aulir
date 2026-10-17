/* ─────────────────────────────────────────────
   aulir 행운의 로또번호 만들기
   - 1~45 중 중복 없는 6개 번호 (보너스 번호 선택)
   - 한 번에 1·3·5줄
   - 생년월일·좋아하는 숫자는 '재미 요소' (선택)
   - 모든 계산은 브라우저 안에서만 합니다. 서버로 보내지 않습니다.
   ───────────────────────────────────────────── */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("lottoForm");
  if (!form) return;

  let calendarType = "solar";
  let lineCount = 1;
  let drawCount = 0;

  const messages = [
    "작은 즐거움이 모여 기분 좋은 하루가 되길 바랍니다!",
    "오늘은 새로운 가능성을 발견하는 날로 만들어 보세요.",
    "행운도 좋지만, 소중한 사람과 웃는 시간이 더 큰 행운입니다.",
    "기대는 가볍게, 즐거움은 크게! 오늘도 행복하세요.",
    "좋아하는 숫자와 함께 기분 좋은 하루를 시작해 보세요.",
    "뜻밖의 좋은 소식이 찾아오는 하루가 되길 바랍니다!"
  ];

  /* ── 양력·음력 선택 ── */
  $("solarBtn").addEventListener("click", () => setCalendar("solar"));
  $("lunarBtn").addEventListener("click", () => setCalendar("lunar"));

  function setCalendar(type) {
    calendarType = type;
    $("solarBtn").setAttribute("aria-pressed", String(type === "solar"));
    $("lunarBtn").setAttribute("aria-pressed", String(type === "lunar"));
    $("leapWrap").classList.toggle("hidden", type !== "lunar");
  }

  /* ── 줄 수 선택 ── */
  document.querySelectorAll("[data-lines]").forEach((btn) => {
    btn.addEventListener("click", () => {
      lineCount = Number(btn.dataset.lines);
      document.querySelectorAll("[data-lines]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
    });
  });

  /* ── 오류 표시 ── */
  function showError(text) {
    const result = $("result");
    result.replaceChildren();
    const p = document.createElement("p");
    p.className = "error";
    p.textContent = text;
    result.appendChild(p);
  }

  /* ── 음력을 양력으로 바꾸기 (lunar-javascript 라이브러리) ── */
  function toSolarDate(year, month, day, isLeap) {
    if (!window.Lunar || !window.Solar) throw new Error("library");
    if (calendarType === "lunar") {
      // 윤달은 월을 음수로 넘깁니다.
      const lunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
      return lunar.getSolar();
    }
    // 2월 30일처럼 없는 날짜를 걸러냅니다.
    const check = new Date(year, month - 1, day);
    if (check.getFullYear() !== year || check.getMonth() !== month - 1 ||
        check.getDate() !== day) {
      throw new Error("date");
    }
    return Solar.fromYmd(year, month, day);
  }

  /* ── 무작위 수 만들기 ──
     브라우저의 안전한 난수(crypto)에 입력값을 섞어 씨앗을 만들고,
     그 씨앗으로 번호를 섞습니다. 입력값은 재미 요소일 뿐,
     결과는 매번 달라지는 무작위 번호입니다. */
  function cryptoInt() {
    if (window.crypto && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Math.floor(Math.random() * 4294967296);
  }

  function makeSeed(text) {
    let seed = 2166136261;
    for (let i = 0; i < text.length; i++) {
      seed ^= text.charCodeAt(i);
      seed = Math.imul(seed, 16777619) >>> 0;
    }
    seed ^= cryptoInt();
    seed ^= ++drawCount;
    return seed >>> 0;
  }

  // mulberry32: 짧고 고르게 퍼지는 난수 생성기
  function seededRandom(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── 한 줄 만들기 ── */
  function makeLine(rand, fav, withBonus) {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    // 피셔-예이츠 섞기
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let main;
    let rest;
    if (fav) {
      const others = pool.filter((n) => n !== fav);
      main = [fav, ...others.slice(0, 5)];
      rest = others.slice(5);
    } else {
      main = pool.slice(0, 6);
      rest = pool.slice(6);
    }
    main.sort((a, b) => a - b);

    return { main, bonus: withBonus ? rest[0] : null };
  }

  /* ── 공 색 (실제 로또 공 색 구분과 같게) ── */
  function ballClass(n) {
    if (n <= 10) return "b1";
    if (n <= 20) return "b2";
    if (n <= 30) return "b3";
    if (n <= 40) return "b4";
    return "b5";
  }

  function makeBall(n, isFav, label) {
    const ball = document.createElement("span");
    ball.className = "ball " + ballClass(n) + (isFav ? " fav" : "");
    ball.textContent = n;
    ball.title = label || (isFav ? "좋아하는 숫자" : "번호 " + n);
    return ball;
  }

  /* ── 번호 만들기 버튼 ── */
  function makeNumbers(e) {
    if (e) e.preventDefault();

    const yearText = $("year").value.trim();
    const monthText = $("month").value.trim();
    const dayText = $("day").value.trim();
    const favText = $("favorite").value.trim();
    const withBonus = $("bonus").checked;
    const isLeap = $("leap").value === "true";

    // 좋아하는 숫자 (선택)
    let fav = null;
    if (favText !== "") {
      fav = Number(favText);
      if (!Number.isInteger(fav) || fav < 1 || fav > 45) {
        showError("좋아하는 숫자는 1부터 45 사이로 넣어 주세요. 비워 두셔도 됩니다.");
        return;
      }
    }

    // 생년월일 (선택, 넣으려면 연·월·일 모두)
    let birth = null;
    const filled = [yearText, monthText, dayText].filter((v) => v !== "").length;
    if (filled > 0 && filled < 3) {
      showError("생년월일은 연도·월·일을 모두 넣거나, 모두 비워 주세요.");
      return;
    }
    if (filled === 3) {
      const year = Number(yearText);
      const month = Number(monthText);
      const day = Number(dayText);
      if (!Number.isInteger(year) || year < 1900 || year > 2050 ||
          !Number.isInteger(month) || month < 1 || month > 12 ||
          !Number.isInteger(day) || day < 1 || day > 31) {
        showError("생년월일을 다시 확인해 주세요. 연도는 1900~2050년 사이로 넣어 주세요.");
        return;
      }
      let solar;
      try {
        solar = toSolarDate(year, month, day, isLeap);
      } catch (err) {
        showError(err.message === "library"
          ? "음력 변환 도구를 불러오지 못했습니다. 인터넷 연결을 확인하신 뒤 새로고침해 주세요."
          : "없는 날짜입니다. 날짜와 평달·윤달을 다시 확인해 주세요.");
        return;
      }
      birth = {
        year, month, day, isLeap,
        sy: solar.getYear(), sm: solar.getMonth(), sd: solar.getDay()
      };
    }

    const seedText = [
      birth ? birth.sy + "-" + birth.sm + "-" + birth.sd : "none",
      fav || 0, lineCount, Date.now()
    ].join("|");
    const rand = seededRandom(makeSeed(seedText));

    const lines = [];
    for (let i = 0; i < lineCount; i++) lines.push(makeLine(rand, fav, withBonus));

    renderResult(lines, { birth, fav, rand });
  }

  /* ── 결과 그리기 ── */
  function renderResult(lines, info) {
    const result = $("result");
    result.replaceChildren();

    const card = document.createElement("section");
    card.className = "result-card";

    const title = document.createElement("h2");
    title.textContent = "🍀 나의 행운 번호";
    card.appendChild(title);

    if (info.birth) {
      const b = info.birth;
      const date = document.createElement("p");
      date.className = "result-date";
      date.textContent =
        (calendarType === "lunar" ? "음력 " : "양력 ") +
        b.year + "년 " + b.month + "월 " + b.day + "일" +
        (calendarType === "lunar" && b.isLeap ? "(윤달)" : "") +
        (calendarType === "lunar"
          ? " → 양력 " + b.sy + "년 " + b.sm + "월 " + b.sd + "일"
          : "");
      card.appendChild(date);
    }

    const names = "ABCDE";
    lines.forEach((line, idx) => {
      const box = document.createElement("div");
      box.className = "line";

      const label = document.createElement("div");
      label.className = "line-label";
      label.textContent = names[idx] + "줄";
      box.appendChild(label);

      const balls = document.createElement("div");
      balls.className = "balls";
      line.main.forEach((n) => balls.appendChild(makeBall(n, n === info.fav)));
      if (line.bonus) {
        const plus = document.createElement("span");
        plus.className = "plus";
        plus.textContent = "+";
        plus.setAttribute("aria-label", "보너스");
        balls.appendChild(plus);
        balls.appendChild(makeBall(line.bonus, false, "보너스 번호 " + line.bonus));
      }
      box.appendChild(balls);
      card.appendChild(box);
    });

    if (info.fav) {
      const favNote = document.createElement("p");
      favNote.className = "result-date";
      favNote.textContent = "좋아하는 숫자 " + info.fav + "을(를) 모든 줄에 넣었습니다. (초록 테두리)";
      card.appendChild(favNote);
    }

    const message = document.createElement("div");
    message.className = "message";
    message.textContent = messages[Math.floor(info.rand() * messages.length)];
    card.appendChild(message);

    const actions = document.createElement("div");
    actions.className = "result-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-line btn-full";
    copy.textContent = "📋 번호 복사하기";
    copy.addEventListener("click", () => copyLines(lines, copy));
    actions.appendChild(copy);

    const again = document.createElement("button");
    again.type = "button";
    again.className = "btn btn-primary btn-full";
    again.textContent = "🔄 다른 번호 뽑기";
    again.addEventListener("click", () => makeNumbers());
    actions.appendChild(again);

    card.appendChild(actions);
    result.appendChild(card);

    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── 복사 ── */
  async function copyLines(lines, button) {
    const names = "ABCDE";
    const text = lines.map((l, i) =>
      names[i] + "줄: " + l.main.join(", ") + (l.bonus ? " + 보너스 " + l.bonus : "")
    ).join("\n");

    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (err) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove();
    }
    button.textContent = ok ? "✅ 복사했습니다!" : "복사가 안 되면 번호를 길게 눌러 주세요";
    setTimeout(() => { button.textContent = "📋 번호 복사하기"; }, 2500);
  }

  form.addEventListener("submit", makeNumbers);
})();
