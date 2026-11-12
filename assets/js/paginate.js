/* ─────────────────────────────────────────────
   글 목록 쪽 나누기
   - #postGrid 안의 카드를 data-per-page 개씩 보여 주고,
     그보다 많으면 아래에 쪽 번호를 만듭니다.
   - 쪽이 많으면 처음·끝·지금 쪽 앞뒤만 번호로 보이고 나머지는 '…'로 줄입니다.
   - #gridFilter(주제 단추)가 있으면 data-cat이 같은 카드만 골라 보여 줍니다.
   - 주소에 ?page=2, ?cat=animal 처럼 남아서, 글을 읽고
     '뒤로'를 눌러도 보던 쪽으로 돌아옵니다.
   - 자바스크립트가 꺼져 있으면 모든 글이 한꺼번에 보입니다.
   ───────────────────────────────────────────── */
(function () {
  "use strict";

  const grid = document.getElementById("postGrid");
  const pager = document.getElementById("pager");
  if (!grid || !pager) return;

  const cards = Array.from(grid.children);
  const per = Number(grid.dataset.perPage) || 6;
  const filter = document.getElementById("gridFilter");
  const fbtns = filter ? Array.from(filter.querySelectorAll("button[data-cat]")) : [];
  const cats = fbtns.map((b) => b.dataset.cat);

  function readState() {
    const q = new URLSearchParams(location.search);
    let cat = q.get("cat") || "";
    if (!filter || cats.indexOf(cat) === -1) cat = "";
    const n = Number(q.get("page"));
    return { cat, page: Number.isInteger(n) && n >= 1 ? n : 1 };
  }

  function btn(label, page, opts, go) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (opts.aria) b.setAttribute("aria-label", opts.aria);
    if (opts.current) {
      b.setAttribute("aria-current", "page");
      b.className = "is-current";
    }
    if (opts.disabled) b.disabled = true;
    else b.addEventListener("click", () => go(page));
    return b;
  }

  // 보여 줄 쪽 번호: 1, 끝, 지금 쪽과 그 앞뒤 한 쪽씩
  function pageList(cur, total) {
    const want = new Set([1, total, cur - 1, cur, cur + 1]);
    const out = [];
    let last = 0;
    for (let i = 1; i <= total; i++) {
      if (!want.has(i)) continue;
      if (i - last === 2) out.push(i - 1);       // 한 칸만 비면 번호로 채움
      else if (i - last > 2) out.push(0);        // 0 = …
      out.push(i);
      last = i;
    }
    return out;
  }

  function show(state, byUser) {
    const active = cards.filter((c) => !state.cat || c.dataset.cat === state.cat);
    const pages = Math.max(1, Math.ceil(active.length / per));
    const page = Math.min(state.page, pages);

    cards.forEach((c) => { c.hidden = true; });
    active.forEach((c, i) => {
      c.hidden = i < (page - 1) * per || i >= page * per;
    });

    fbtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat)));

    const go = (p) => update({ cat: state.cat, page: p }, true);
    pager.replaceChildren();
    if (pages > 1) {
      pager.appendChild(btn("‹", page - 1, { aria: "앞 쪽", disabled: page === 1 }, go));
      pageList(page, pages).forEach((i) => {
        if (i === 0) {
          const s = document.createElement("span");
          s.className = "pager-gap";
          s.textContent = "…";
          s.setAttribute("aria-hidden", "true");
          pager.appendChild(s);
        } else {
          pager.appendChild(btn(String(i), i, { aria: i + "쪽", current: i === page }, go));
        }
      });
      pager.appendChild(btn("›", page + 1, { aria: "다음 쪽", disabled: page === pages }, go));
    }
    return page;
  }

  function update(state, byUser, scroll) {
    const page = show(state, byUser);
    if (!byUser) return;
    const url = new URL(location.href);
    if (state.cat) url.searchParams.set("cat", state.cat);
    else url.searchParams.delete("cat");
    if (page === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", page);
    history.pushState({ cat: state.cat, page }, "", url);
    if (scroll !== false) grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  fbtns.forEach((b) => {
    b.addEventListener("click", () => update({ cat: b.dataset.cat, page: 1 }, true, false));
  });

  window.addEventListener("popstate", () => show(readState(), false));
  show(readState(), false);
})();
