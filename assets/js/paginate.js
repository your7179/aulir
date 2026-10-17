/* ─────────────────────────────────────────────
   글 목록 쪽 나누기
   - #postGrid 안의 카드를 data-per-page 개씩 보여 주고,
     그보다 많으면 아래에 쪽 번호를 만듭니다.
   - 주소에 ?page=2 처럼 쪽 번호가 남아서, 글을 읽고
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
  const pages = Math.ceil(cards.length / per);
  if (pages <= 1) return;

  function readPage() {
    const n = Number(new URLSearchParams(location.search).get("page"));
    return Number.isInteger(n) && n >= 1 && n <= pages ? n : 1;
  }

  function btn(label, page, opts) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (opts.aria) b.setAttribute("aria-label", opts.aria);
    if (opts.current) {
      b.setAttribute("aria-current", "page");
      b.className = "is-current";
    }
    if (opts.disabled) b.disabled = true;
    else b.addEventListener("click", () => show(page, true));
    return b;
  }

  function show(page, byUser) {
    cards.forEach((c, i) => {
      c.hidden = i < (page - 1) * per || i >= page * per;
    });

    pager.replaceChildren();
    pager.appendChild(btn("‹", page - 1, { aria: "앞 쪽", disabled: page === 1 }));
    for (let i = 1; i <= pages; i++) {
      pager.appendChild(btn(String(i), i, { aria: i + "쪽", current: i === page }));
    }
    pager.appendChild(btn("›", page + 1, { aria: "다음 쪽", disabled: page === pages }));

    if (byUser) {
      const url = new URL(location.href);
      if (page === 1) url.searchParams.delete("page");
      else url.searchParams.set("page", page);
      history.pushState({ page }, "", url);
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  window.addEventListener("popstate", () => show(readPage(), false));
  show(readPage(), false);
})();
