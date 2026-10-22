/* 로또 1등 당첨번호 분석 (lotto/analysis/)
   자료: /assets/data/lotto-data.json  ← _data/lotto.json 에서 지킬이 만들어 줌
   한 줄 형식: [회차, "추첨일", 번호1~6, 보너스, 1등 1인 당첨금, 1등 인원]
   모든 통계는 브라우저에서 계산합니다. */
(function () {
  "use strict";

  var app = document.getElementById("lottoApp");
  if (!app) return;

  var $ = function (id) { return document.getElementById(id); };
  var setHTML = function (id, html) { var el = $(id); if (el) el.innerHTML = html; };
  var setText = function (id, text) { var el = $(id); if (el) el.textContent = text; };

  fetch(app.dataset.src)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rows) {
      var D = rows.map(function (a) {
        return { no: a[0], date: a[1], n: a.slice(2, 8), b: a[8], amt: a[9], cnt: a[10] };
      }).sort(function (x, y) { return x.no - y.no; });
      if (!D.length) throw new Error("empty");
      start(D);
    })
    .catch(function () {
      setHTML("freqText",
        '<p class="error">당첨번호 자료를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.</p>');
    });

  /* ── 작은 도우미 ── */
  var fmt = function (n) { return Number(n).toLocaleString("ko-KR"); };
  var eok = function (w) { var e = w / 1e8; return (e >= 10 ? fmt(Math.round(e)) : Math.round(e * 10) / 10) + "억 원"; };
  var won = function (w) {
    if (w >= 1e8) {
      var e = Math.floor(w / 1e8), m = Math.round((w % 1e8) / 1e4);
      return fmt(e) + "억" + (m ? " " + fmt(m) + "만" : "") + " 원";
    }
    return fmt(w) + " 원";
  };
  var pct = function (x) { return (Math.round(x * 1000) / 10) + "%"; };
  var bc = function (n) { return n <= 10 ? "b1" : n <= 20 ? "b2" : n <= 30 ? "b3" : n <= 40 ? "b4" : "b5"; };
  var ball = function (n, extra) { return '<span class="ball ' + bc(n) + (extra ? " " + extra : "") + '">' + n + "</span>"; };
  var dk = function (d) { return d.replace(/-/g, "."); };
  var range = function (a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; };
  var sum = function (arr) { return arr.reduce(function (a, b) { return a + b; }, 0); };

  /* 그래프 색: 사이트 색에 맞춤 */
  var C = { main: "#6fae82", hi: "#e0614a", line: "#56655a", grid: "#e4ebe2", ink: "#26382b" };

  function start(D) {
    var N = D.length, LAST = D[N - 1];
    var nums = range(1, 45);

    /* ── 기본 통계 (한 번만 계산) ── */
    var freq = new Array(46).fill(0), bfreq = new Array(46).fill(0), lastSeen = new Array(46).fill(0);
    D.forEach(function (d) {
      d.n.forEach(function (x) { freq[x]++; lastSeen[x] = d.no; });
      bfreq[d.b]++;
    });
    var gap = nums.map(function (n) { return LAST.no - lastSeen[n]; }); gap.unshift(0);
    var exp = N * 6 / 45;
    var sd = Math.sqrt(N * 6 / 45 * (1 - 6 / 45));
    var sortBy = function (arr) {
      return nums.slice().sort(function (a, b) { return arr[b] - arr[a] || a - b; });
    };
    var byF = sortBy(freq), maxN = byF[0], minN = byF[44];
    var won1 = D.filter(function (d) { return d.cnt > 0; });
    var avgPrize = sum(won1.map(function (d) { return d.amt; })) / won1.length;
    var maxD = won1.reduce(function (a, d) { return d.amt > a.amt ? d : a; });
    var minD = won1.reduce(function (a, d) { return d.amt < a.amt ? d : a; });
    var maxW = D.reduce(function (a, d) { return d.cnt > a.cnt ? d : a; });
    var zeroW = N - won1.length;

    setText("fAvg", eok(avgPrize));
    setText("fMax", eok(maxD.amt));

    /* ── 번호별 출현 ── */
    setHTML("freqText",
      "<p>" + fmt(N) + "회 동안 공은 모두 " + fmt(N * 6) + "번 뽑혔습니다. 45개 번호가 똑같이 나온다면 번호 하나당 약 <strong>" +
      Math.round(exp) + "회</strong>씩입니다. 실제로는 <strong>" + maxN + "번</strong>이 " + freq[maxN] + "회로 가장 많이, <strong>" +
      minN + "번</strong>이 " + freq[minN] + "회로 가장 적게 나왔습니다.</p>");
    var worst = Math.max((freq[maxN] - exp) / sd, (exp - freq[minN]) / sd);
    setText("freqNote",
      "동전을 100번 던져도 앞면이 꼭 50번 나오지는 않습니다. 이만큼 추첨하면 번호마다 " + Math.round(exp) +
      "회에서 위아래로 " + Math.round(sd) + "회쯤 차이 나는 것이 보통이고, 45개 가운데 한두 개는 그 두세 배쯤 벗어나기도 합니다. " +
      (worst < 3
        ? "지금 가장 많이·적게 나온 번호도 이 범위 안이라서, '잘 나오는 번호'가 따로 있다는 증거로 보기 어렵습니다."
        : "가장 크게 벗어난 번호도 우연으로 생길 수 있는 범위이며, 다음 추첨에는 아무 영향을 주지 않습니다."));

    /* ── 순위 ── */
    var li = function (n, r) { return "<li>" + ball(n) + '<span class="r">' + r + "</span></li>"; };
    setHTML("rkTop", byF.slice(0, 5).map(function (n) { return li(n, freq[n] + "회"); }).join(""));
    setHTML("rkLow", byF.slice(-5).reverse().map(function (n) { return li(n, freq[n] + "회"); }).join(""));
    setHTML("rkGap", sortBy(gap).slice(0, 5).map(function (n) { return li(n, gap[n] + "회째"); }).join(""));
    setHTML("rkBonus", sortBy(bfreq).slice(0, 5).map(function (n) { return li(n, bfreq[n] + "회"); }).join(""));
    var rf = new Array(46).fill(0);
    D.slice(-10).forEach(function (d) { d.n.forEach(function (x) { rf[x]++; }); });
    setHTML("rkRecent", sortBy(rf).slice(0, 5).map(function (n) { return li(n, rf[n] + "회"); }).join(""));

    /* ── 모양 ── */
    var consCnt = D.filter(function (d) {
      var s = d.n.slice().sort(function (a, b) { return a - b; });
      return s.some(function (v, i) { return i && v - s[i - 1] === 1; });
    }).length;
    var carry = 0;
    for (var i = 1; i < N; i++) {
      if (D[i].n.some(function (x) { return D[i - 1].n.indexOf(x) > -1; })) carry++;
    }
    var sums = D.map(function (d) { return sum(d.n); });
    var BAND_LO = 100, BAND_HI = 179;
    var inBand = sums.filter(function (s) { return s >= BAND_LO && s <= BAND_HI; }).length;
    setText("sCons", pct(consCnt / N));
    setText("sCarry", pct(carry / (N - 1)));
    setText("sSum", (sum(sums) / N).toFixed(1));
    setText("sumCaption",
      "가장 작은 합은 " + Math.min.apply(null, sums) + ", 가장 큰 합은 " + Math.max.apply(null, sums) + "이었습니다. 전체의 " +
      pct(inBand / N) + "가 " + BAND_LO + "~" + BAND_HI + " 사이(빨간 막대)에 몰려 있습니다. 6개를 무작위로 뽑으면 합계는 평균 138 근처에 모이게 됩니다.");
    var oddDist = new Array(7).fill(0);
    D.forEach(function (d) { oddDist[d.n.filter(function (x) { return x % 2; }).length]++; });
    var rangeCnt = [0, 0, 0, 0, 0];
    D.forEach(function (d) { d.n.forEach(function (x) { rangeCnt[Math.min(4, Math.floor((x - 1) / 10))]++; }); });
    var tail = new Array(10).fill(0);
    D.forEach(function (d) { d.n.forEach(function (x) { tail[x % 10]++; }); });
    var tailCount = function (t) { return t >= 1 && t <= 5 ? 5 : 4; };   // 끝자리 5는 5·15·25·35·45 다섯 개

    /* ── 당첨금 ── */
    var years = {};
    won1.forEach(function (d) { var y = d.date.slice(0, 4); (years[y] = years[y] || []).push(d.amt); });
    var yKeys = Object.keys(years).sort();
    var yAvg = yKeys.map(function (y) { return sum(years[y]) / years[y].length / 1e8; });
    var wBuckets = ["0명", "1명", "2명", "3명", "4명", "5명", "6명", "7명", "8명", "9명", "10명", "11~15명", "16~20명", "21명 이상"];
    var wCnt = new Array(wBuckets.length).fill(0);
    D.forEach(function (d) { var c = d.cnt; wCnt[c <= 10 ? c : c <= 15 ? 11 : c <= 20 ? 12 : 13]++; });
    var commonW = wCnt.indexOf(Math.max.apply(null, wCnt));
    setHTML("prizeText",
      "<p>1등 당첨금은 그 회차에 얼마나 팔렸는지, 1등이 몇 명인지에 따라 크게 달라집니다. 역대 최고는 <strong>제" + maxD.no + "회(" + dk(maxD.date) +
      ")</strong>의 1인당 <strong>" + won(maxD.amt) + "</strong>이었습니다. 가장 적었던 회차는 <strong>제" + fmt(minD.no) + "회</strong>로, 1등이 " +
      minD.cnt + "명이나 나와 1인당 " + won(minD.amt) + "을 받았습니다.</p>" +
      "<p>초기에는 1게임이 2,000원이었고, 1등이 없으면 당첨금이 다음 회로 넘어가면서 금액이 크게 불어났습니다. 1등이 한 명도 없던 회차는 모두 " +
      zeroW + "번이었습니다. 요즘은 한 회차에 1등이 여러 명 나오는 일이 흔해서, 가장 흔한 1등 인원은 회차당 " + wBuckets[commonW] + "이었습니다.</p>");
    setHTML("recTable", [["최고 1인 당첨금", maxD], ["최저 1인 당첨금", minD], ["1등 최다 인원", maxW], ["가장 최근 회차", LAST]]
      .map(function (r) {
        var d = r[1];
        return "<tr><td>" + r[0] + "</td><td>" + fmt(d.no) + "회</td><td>" + dk(d.date) + "</td><td>" +
          (d.cnt ? won(d.amt) : "-") + "</td><td>" + d.cnt + "명</td></tr>";
      }).join(""));
    setText("tipShare", "실제로 제" + fmt(maxW.no) + "회에는 1등이 " + maxW.cnt + "명이나 나와 1인당 " + won(maxW.amt) + "에 그쳤습니다.");

    /* ── 오해와 진실 ── */
    var seen = {}, dup = 0;
    D.forEach(function (d) { var k = d.n.slice().sort(function (a, b) { return a - b; }).join("-"); if (seen[k]) dup++; seen[k] = 1; });
    var under31 = D.filter(function (d) { return d.n.every(function (x) { return x <= 31; }); }).length;
    var consRate = consCnt / N;
    var myths = [
      ["이어진 번호는 잘 안 나온다", "사실이 아님",
        pct(consRate) + "의 회차" + (consRate > 0.5 ? ", 곧 절반이 넘는 회차" : "") + "에 22·23처럼 붙은 번호가 들어 있었습니다. 6개를 뽑으면 이웃한 번호가 섞일 가능성이 생각보다 높습니다."],
      ["지난주 번호는 이번 주에 안 나온다", "사실이 아님",
        "바로 앞 회차 번호가 1개 이상 다시 나온 회차가 " + pct(carry / (N - 1)) + "였습니다. 추첨기는 지난주를 기억하지 못합니다."],
      ["오래 안 나온 번호가 나올 차례다", "근거 없음",
        "안 나온 기간과 다음 추첨은 아무 관계가 없습니다. 이런 생각을 '도박사의 오류'라고 부릅니다. 동전이 다섯 번 연속 앞면이어도 여섯 번째 앞면 가능성은 여전히 절반입니다."],
      ["같은 번호 조합이 또 나올 수 있다", dup ? "실제로 나옴" : "가능하지만 아직 없음",
        fmt(N) + "회 동안 똑같은 6개 조합이 두 번 나온 적은 " + (dup ? dup + "번 있습니다" : "한 번도 없습니다") +
        ". 가능한 조합이 814만 개가 넘으니 자연스러운 일입니다. 지난 조합이라고 가능성이 낮아지지도 않습니다."],
      ["모두 홀수, 모두 짝수는 안 나온다", "드물지만 나옴",
        "6개 모두 홀수인 회차가 " + oddDist[6] + "번, 모두 짝수인 회차가 " + oddDist[0] + "번 있었습니다. 이런 조합은 원래 수가 적어서 드물게 보일 뿐입니다."],
      ["생일 번호로 사면 손해다", "가능성은 같음",
        "6개가 모두 31 이하인 회차는 " + fmt(under31) + "번(" + pct(under31 / N) + ")이었습니다. 가능성은 다른 조합과 같지만, 생일 번호를 고르는 사람이 많아 당첨되면 나눠 가질 사람이 많아질 수 있습니다."],
      ["명당에서 사면 잘 된다", "판매량 효과",
        "1등이 많이 나온 판매점은 대체로 많이 팔리는 곳입니다. 한 장 한 장의 당첨 가능성은 어디서 사든 같습니다."]
    ];
    setHTML("myths", myths.map(function (m) {
      return '<div class="la-myth"><h3>' + m[0] + '</h3><p><span class="la-verdict">' + m[1] + "</span> " + m[2] + "</p></div>";
    }).join(""));

    /* ── 용지 그림 ── */
    var mode = "freq";
    function drawSlip() {
      var vals = nums.map(function (n) { return mode === "freq" ? freq[n] : gap[n]; });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      setHTML("grid45", nums.map(function (n, idx) {
        var v = vals[idx], o = hi === lo ? 0 : (v - lo) / (hi - lo);
        var t = mode === "freq" ? n + "번 " + v + "회 나옴" : n + "번 " + (v ? v + "회째 안 나옴" : "최근 회차에 나옴");
        return '<div class="la-cell' + (o > 0.55 ? " hot" : "") + '" style="--o:' + (0.06 + o * 0.94).toFixed(2) +
          '" role="img" aria-label="' + t + '" title="' + t + '"><span class="n">' + n + '</span><span class="v">' + v + "</span></div>";
      }).join(""));
      setText("scaleMin", lo + "회");
      setText("scaleMax", hi + "회");
      setText("slipCaption", mode === "freq"
        ? "칸 아래 작은 숫자 = 지금까지 나온 횟수"
        : "칸 아래 작은 숫자 = 마지막으로 나온 뒤 지난 회차 수 (0은 최근 회차에 나온 번호)");
      $("mFreq").setAttribute("aria-pressed", mode === "freq");
      $("mGap").setAttribute("aria-pressed", mode === "gap");
    }
    $("mFreq").addEventListener("click", function () { mode = "freq"; drawSlip(); });
    $("mGap").addEventListener("click", function () { mode = "gap"; drawSlip(); });
    drawSlip();

    /* ── 내 번호 조회 ── */
    var ex = [3, 12, 18, 27, 34, 42];
    setHTML("inputs", ex.map(function (v, k) {
      return '<input type="number" inputmode="numeric" min="1" max="45" id="in' + k + '" value="' + v + '" aria-label="번호 ' + (k + 1) + '">';
    }).join(""));
    var ins = range(0, 5).map(function (k) { return $("in" + k); });
    ins.forEach(function (el) {
      el.addEventListener("input", function () { setText("exampleNote", "입력한 번호로 확인합니다."); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") check(true); });
    });
    function check(scroll) {
      var v = ins.map(function (el) { return parseInt(el.value, 10); });
      if (v.some(function (x) { return isNaN(x) || x < 1 || x > 45; })) { setText("err", "1부터 45 사이 숫자 6개를 모두 넣어 주세요."); return; }
      if (new Set(v).size < 6) { setText("err", "같은 번호가 두 번 들어갔습니다. 서로 다른 번호 6개를 넣어 주세요."); return; }
      setText("err", "");
      var mine = new Set(v), cnt = [0, 0, 0, 0, 0, 0], money = 0, hits = [];
      D.forEach(function (d) {
        var m = d.n.filter(function (x) { return mine.has(x); }).length, r = 0;
        if (m === 6) r = 1; else if (m === 5 && mine.has(d.b)) r = 2; else if (m === 5) r = 3; else if (m === 4) r = 4; else if (m === 3) r = 5;
        if (!r) return;
        cnt[r]++;
        if (r === 1) money += d.amt; else if (r === 4) money += 50000; else if (r === 5) money += 5000;
        if (r <= 4) hits.push({ d: d, r: r });
      });
      var spent = N * 1000, total = sum(cnt);
      var best = hits.sort(function (a, b) { return a.r - b.r || b.d.no - a.d.no; }).slice(0, 8);
      var sorted = v.slice().sort(function (a, b) { return a - b; });
      setHTML("checkResult",
        '<div class="balls">' + sorted.map(function (n) { return ball(n); }).join("") + "</div>" +
        '<div class="la-res-grid">' + [1, 2, 3, 4, 5].map(function (r) { return "<div><b>" + cnt[r] + "</b><span>" + r + "등</span></div>"; }).join("") + "</div>" +
        "<p>" + fmt(N) + "회 동안 매주 1게임씩 샀다면 쓴 돈은 <strong>" + fmt(spent) + "원</strong>입니다. 그 가운데 " + fmt(total) +
        "번 당첨되어 <strong>" + fmt(money) + "원</strong>을 받았을 것입니다. 쓴 돈의 <strong>" + pct(money / spent) + "</strong>가 돌아온 셈입니다.</p>" +
        '<p class="help">계산을 쉽게 하려고 모든 회차를 1게임 1,000원, 4등 5만 원, 5등 5천 원으로 셈했습니다' +
        (cnt[2] || cnt[3] ? ". 2·3등 당첨금은 자료에 없어 뺐습니다" : "") + ".</p>" +
        (best.length
          ? "<h3>4등 이상 당첨된 회차" + (hits.length > 8 ? " (높은 등수 8개)" : "") + '</h3><ul class="la-hits">' +
            best.map(function (h) {
              return '<li><span class="tag">' + h.r + "등</span><span>" + fmt(h.d.no) + "회 · " + dk(h.d.date) + '</span><span class="balls">' +
                h.d.n.map(function (n) { return ball(n, mine.has(n) ? "" : "miss"); }).join("") + "</span></li>";
            }).join("") + "</ul>"
          : "<p>4등 이상은 한 번도 없었습니다. 4등 확률이 733분의 1이니, " + fmt(N) + "회 동안이면 평균 " + (N / 733).toFixed(1) + "번쯤 나오는 것이 보통입니다.</p>"));
      if (scroll) $("checkResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    $("btnCheck").addEventListener("click", function () { check(true); });
    $("btnRand").addEventListener("click", function () {
      var s = new Set();
      while (s.size < 6) s.add(1 + Math.floor(Math.random() * 45));
      Array.from(s).forEach(function (n, k) { ins[k].value = n; });
      setText("exampleNote", "무작위로 뽑은 번호입니다.");
      check(true);
    });
    check(false);

    /* ── 그래프: 화면에 가까워질 때 하나씩 그림 (휴대폰 속도 개선) ── */
    var defs = {
      cFreq: function () {
        return {
          type: "bar",
          data: {
            labels: nums, datasets: [
              { type: "line", label: "기대", data: nums.map(function () { return exp; }), borderColor: C.line, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, pointHitRadius: 0, order: 0 },
              { type: "bar", label: "출현", data: nums.map(function (n) { return freq[n]; }), backgroundColor: nums.map(function (n) { return n === maxN || n === minN ? C.hi : C.main; }), order: 1, categoryPercentage: 0.85, barPercentage: 0.9 }
            ]
          },
          options: opts({
            interaction: { mode: "index", intersect: false },
            tip: { title: function (i) { return i[0].label + "번"; }, label: function (i) { return i.dataset.label === "기대" ? "고르게 나왔을 때 " + exp.toFixed(1) + "회" : i.raw + "회 나옴"; } },
            yMin: Math.floor(Math.min.apply(null, freq.slice(1)) / 20) * 20 - 20, xFont: 11
          })
        };
      },
      cOdd: function () {
        return {
          type: "bar",
          data: { labels: ["홀0", "홀1", "홀2", "홀3", "홀4", "홀5", "홀6"], datasets: [{ data: oddDist.map(function (c) { return c / N * 100; }), backgroundColor: oddDist.map(function (c, k) { return k === 3 ? C.hi : C.main; }) }] },
          options: opts({ tip: { title: function (i) { var k = i[0].dataIndex; return "홀수 " + k + "개 · 짝수 " + (6 - k) + "개"; }, label: function (i) { return i.raw.toFixed(1) + "% (" + oddDist[i.dataIndex] + "회)"; } }, yFmt: function (v) { return v + "%"; } })
        };
      },
      cRange: function () {
        return {
          type: "bar",
          data: {
            labels: ["1~10", "11~20", "21~30", "31~40", "41~45"], datasets: [
              { type: "bar", label: "실제", data: rangeCnt.map(function (c) { return c / N; }), backgroundColor: C.main },
              { type: "line", label: "고르게", data: [10, 10, 10, 10, 5].map(function (k) { return k * 6 / 45; }), borderColor: C.line, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 4, pointBackgroundColor: "#fff", pointBorderColor: C.line }
            ]
          },
          options: opts({ tip: { label: function (i) { return i.dataset.label + " " + i.raw.toFixed(2) + "개"; } }, yZero: true })
        };
      },
      cSum: function () {
        var bins = [];
        for (var s = 20; s <= 260; s += 10) bins.push({ b: s, c: sums.filter(function (x) { return x >= s && x < s + 10; }).length });
        var first = bins.findIndex(function (x) { return x.c; }), last = bins.length - 1;
        while (last > first && !bins[last].c) last--;
        bins = bins.slice(first, last + 1);
        return {
          type: "bar",
          data: { labels: bins.map(function (x) { return x.b; }), datasets: [{ data: bins.map(function (x) { return x.c; }), backgroundColor: bins.map(function (x) { return x.b >= BAND_LO && x.b + 9 <= BAND_HI ? C.hi : C.main; }), categoryPercentage: 0.92, barPercentage: 0.95 }] },
          options: opts({ tip: { title: function (i) { return "합계 " + i[0].label + "~" + (+i[0].label + 9); }, label: function (i) { return i.raw + "회 (" + (i.raw / N * 100).toFixed(1) + "%)"; } } })
        };
      },
      cTail: function () {
        return {
          type: "bar",
          data: { labels: range(0, 9).map(function (k) { return "끝" + k; }), datasets: [{ data: tail, backgroundColor: tail.map(function (c, k) { return tailCount(k) === 5 ? C.hi : C.main; }) }] },
          options: opts({ tip: { label: function (i) { return i.raw + "회 · 해당 번호 " + tailCount(i.dataIndex) + "개"; } } })
        };
      },
      cPrize: function () {
        return {
          type: "line",
          data: { labels: yKeys, datasets: [{ data: yAvg, borderColor: C.hi, backgroundColor: "rgba(224,97,74,.12)", fill: true, borderWidth: 2, tension: 0.25, pointRadius: 3, pointBackgroundColor: C.hi, pointHoverRadius: 6 }] },
          options: opts({
            interaction: { mode: "index", intersect: false },
            tip: { title: function (i) { return i[0].label + "년"; }, label: function (i) { return "평균 " + i.raw.toFixed(1) + "억 원 (1등 나온 " + years[i.label].length + "회)"; } },
            yZero: true, yFmt: function (v) { return v + "억"; }
          })
        };
      },
      cWin: function () {
        return {
          type: "bar",
          data: { labels: wBuckets, datasets: [{ data: wCnt, backgroundColor: wCnt.map(function (c, k) { return k === commonW ? C.hi : C.main; }) }] },
          options: opts({ tip: { label: function (i) { return i.raw + "회"; } }, xFont: 11 })
        };
      }
    };

    function opts(o) {
      var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      var res = {
        responsive: true, maintainAspectRatio: false,
        animation: reduce ? false : { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#fff", titleColor: C.ink, bodyColor: C.ink, borderColor: C.grid, borderWidth: 1,
            padding: 10, displayColors: false, titleFont: { size: 15 }, bodyFont: { size: 15 },
            callbacks: o.tip || {}
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: C.line, maxRotation: 0, autoSkip: true, font: { size: o.xFont || 13 } } },
          y: { grid: { color: C.grid }, border: { display: false }, ticks: { color: C.line, font: { size: 13 } } }
        }
      };
      if (o.interaction) res.interaction = o.interaction;
      if (o.yZero) res.scales.y.beginAtZero = true;
      if (o.yMin !== undefined) res.scales.y.min = Math.max(0, o.yMin);
      if (o.yFmt) res.scales.y.ticks.callback = o.yFmt;
      return res;
    }

    function draw(canvas) {
      if (!window.Chart || canvas.dataset.done) return;
      var def = defs[canvas.id];
      if (!def) return;
      canvas.dataset.done = "1";
      var cfg = def();
      cfg.data.datasets.forEach(function (ds) {
        if (ds.type !== "line" && cfg.type !== "line") { ds.borderRadius = 4; ds.maxBarThickness = 42; }
      });
      new Chart(canvas, cfg);
    }

    function setupCharts() {
      if (!window.Chart) return false;
      Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
      var canvases = Object.keys(defs).map($).filter(Boolean);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } });
        }, { rootMargin: "300px 0px" });
        canvases.forEach(function (c) { io.observe(c); });
      } else {
        canvases.forEach(draw);
      }
      return true;
    }
    // 그래프 도구(Chart.js)가 늦게 오면 잠깐 기다렸다가 다시 시도
    if (!setupCharts()) {
      var tries = 0, timer = setInterval(function () {
        if (setupCharts() || ++tries > 20) clearInterval(timer);
      }, 250);
    }
  }
})();
