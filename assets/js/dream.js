/* ─────────────────────────────────────────────
   운세쉼터 꿈해몽 찾기
   - 꿈 내용 문장에서 '꿈 낱말'을 찾아 미리 써 둔 풀이를 보여 줍니다.
   - 낱말 자료: 페이지 안의 <script id="dreamData"> (지킬이 _data/dream.json으로 만듦)
   - 찾는 말 앞에 ^ 가 붙으면 낱말의 첫머리에서만 찾습니다. (예: ^물이 → '동물이'는 제외)
   - 모든 처리는 브라우저 안에서만 합니다.
   ───────────────────────────────────────────── */
(function () {
  "use strict";

  /* ── 낱말 찾기 (화면 없이도 쓸 수 있게 따로 둡니다) ── */
  const BOUNDARY = /[\s.,!?~"'“”‘’()\[\]·…\-]/;

  function findKey(text, key) {
    if (key.charAt(0) !== "^") return text.indexOf(key);
    const k = key.slice(1);
    let i = text.indexOf(k);
    while (i !== -1) {
      if (i === 0 || BOUNDARY.test(text.charAt(i - 1))) return i;
      i = text.indexOf(k, i + 1);
    }
    return -1;
  }

  function matchDream(text, data) {
    const t = " " + String(text).replace(/\s+/g, " ").trim() + " ";
    const hits = [];
    data.forEach((e) => {
      let pos = -1;
      e.keys.forEach((k) => {
        const p = findKey(t, k);
        if (p !== -1 && (pos === -1 || p < pos)) pos = p;
      });
      if (pos === -1) return;
      const acts = (e.acts || []).filter((a) => a.k.some((k) => findKey(t, k) !== -1)).slice(0, 2);
      hits.push({ e, pos, acts });
    });
    hits.sort((a, b) => a.pos - b.pos);   // 문장에 나온 순서대로
    return hits.slice(0, 6);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { matchDream, findKey };
    return;
  }

  /* ── 화면 ── */
  const form = document.getElementById("dreamForm");
  const box = document.getElementById("dreamResult");
  const dataEl = document.getElementById("dreamData");
  if (!form || !box || !dataEl) return;

  let DATA = [];
  try { DATA = JSON.parse(dataEl.textContent); } catch (e) { DATA = []; }
  const byId = {};
  DATA.forEach((e) => { byId[e.id] = e; });
  const base = form.dataset.base || "";

  const el = (tag, cls, text) => {
    const x = document.createElement(tag);
    if (cls) x.className = cls;
    if (text !== undefined) x.textContent = text;
    return x;
  };

  function render(text, forced) {
    box.replaceChildren();
    const q = text.trim();
    if (q.length < 1) {
      box.appendChild(el("p", "error", "꿈 내용을 한두 마디라도 적어 주세요. 예) 돼지가 집에 들어왔어요"));
      return;
    }

    const hits = forced || matchDream(q, DATA);
    const card = el("div", "result-card dream-result");
    card.appendChild(el("h2", null, "🌙 꿈풀이"));
    card.appendChild(el("p", "dream-quote", "“" + q + "”"));

    if (!hits.length) {
      card.appendChild(el("p", null,
        "아직 이 꿈에 맞는 풀이를 찾지 못했습니다. 꿈에 나온 동물·사람·물건·장소를 한 낱말로 적어 보시거나, 아래 '주제별 꿈해몽'에서 찾아보세요."));
      const tips = el("div", "chip-row dream-chips");
      DATA.filter((e) => e.pop).slice(0, 6).forEach((e) => tips.appendChild(chip(e)));
      card.appendChild(tips);
    } else {
      const tags = el("p", "dream-tags");
      tags.appendChild(document.createTextNode("찾은 꿈 낱말: "));
      hits.forEach((h) => tags.appendChild(el("span", "tag", h.e.word)));
      card.appendChild(tags);

      hits.forEach((h) => {
        const item = el("section", "dream-hit");
        item.appendChild(el("h3", null, h.e.word + " 꿈"));
        item.appendChild(el("p", null, h.e.sum));
        h.acts.forEach((a) => item.appendChild(el("p", "dream-act", "👉 " + a.t)));
        const links = el("p", "dream-links");
        if (h.e.post) {
          const a = el("a", "btn btn-line", "📖 " + h.e.word + " 꿈 자세히 보기");
          a.href = base + h.e.post;
          links.appendChild(a);
        }
        const more = el("a", "more-link", "목록에서 보기");
        more.href = "#d-" + h.e.id;
        links.appendChild(more);
        item.appendChild(links);
        card.appendChild(item);
      });

      if (hits.length > 1) {
        card.appendChild(el("p", "luck-note",
          "꿈에 여러 가지가 함께 나왔다면, 가장 또렷하게 기억나는 것과 꿈에서 느낀 기분을 중심으로 읽어 보세요. 기분 좋은 꿈은 대개 좋은 뜻으로 풉니다."));
      }
    }

    card.appendChild(el("p", "notice", "꿈해몽은 재미와 참고를 위한 내용입니다. 좋은 풀이는 힘으로 삼고, 조심하라는 풀이는 한 번 더 살피는 계기로 삼아 주세요."));
    box.appendChild(card);
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chip(e) {
    const b = el("button", null, e.word + " 꿈");
    b.type = "button";
    b.addEventListener("click", () => {
      document.getElementById("dreamText").value = e.word + " 꿈";
      renderEntry(e);
    });
    return b;
  }

  // 단추로 고른 낱말은 문장 찾기 없이 바로 보여 줍니다
  function renderEntry(e) {
    render(e.word + " 꿈", [{ e, pos: 0, acts: [] }]);
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    render(document.getElementById("dreamText").value);
  });

  document.querySelectorAll("[data-dream]").forEach((b) => {
    b.addEventListener("click", () => {
      const e = byId[b.dataset.dream];
      if (!e) return;
      document.getElementById("dreamText").value = e.word + " 꿈";
      renderEntry(e);
    });
  });
})();
