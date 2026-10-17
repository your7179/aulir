/* ─────────────────────────────────────────────
   운세쉼터 사주보기
   - 만세력 계산: lunar-javascript (절기 기준 년·월주, 음력 변환)
   - 사주팔자, 일간 풀이, 오행 분포, 대운
   - 오늘·이번 주·이달·올해 운세 (일간과 그때 기운의 관계로 풀이)
   - 별자리와 오늘의 별자리 운세
   - 모든 계산은 브라우저 안에서만 합니다. 서버로 보내거나 저장하지 않습니다.
   ───────────────────────────────────────────── */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("sajuForm");
  if (!form) return;

  /* ═════════════ 1. 기본 자료 ═════════════ */

  const STEM_HJ = "甲乙丙丁戊己庚辛壬癸";
  const STEM_KO = "갑을병정무기경신임계";
  const STEM_EL = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];           // 오행 번호
  const BR_HJ = "子丑寅卯辰巳午未申酉戌亥";
  const BR_KO = "자축인묘진사오미신유술해";
  const BR_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const BR_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];       // 지지 속 본기(本氣) 천간
  const ANIMAL = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

  const EL = [
    { ko: "목", hj: "木", name: "나무", cls: "el-wood",  color: "초록색·청색", dir: "동쪽", num: "3, 8",
      word: "자라나는 힘, 인자함",
      weak: "초록색 옷이나 화분을 가까이 두고, 아침 산책을 해 보세요.",
      strong: "생각이 앞서 일이 많아지기 쉬우니, 하나씩 마무리하는 습관을 들이세요." },
    { ko: "화", hj: "火", name: "불", cls: "el-fire", color: "빨간색·분홍색", dir: "남쪽", num: "2, 7",
      word: "뜨거운 열정, 밝은 예의",
      weak: "밝은 색 옷을 입고 햇볕을 자주 쬐며, 즐거운 모임에 나가 보세요.",
      strong: "마음이 급해질 때는 물 한 잔 마시고 숨을 천천히 고르세요." },
    { ko: "토", hj: "土", name: "흙", cls: "el-earth", color: "노란색·황토색", dir: "가운데(집 안)", num: "5, 10",
      word: "든든한 믿음, 안정",
      weak: "규칙적으로 식사하고 잠자리에 드는 시간을 일정하게 지켜 보세요.",
      strong: "고집이 세지기 쉬우니 일부러 새로운 경험을 해 보세요." },
    { ko: "금", hj: "金", name: "쇠", cls: "el-metal", color: "흰색·은색", dir: "서쪽", num: "4, 9",
      word: "맺고 끊는 결단, 의리",
      weak: "흰색 옷을 입고, 집 안 정리정돈으로 마음도 함께 정리해 보세요.",
      strong: "말이 날카롭게 들리지 않도록 부드러운 말투를 곁들이세요." },
    { ko: "수", hj: "水", name: "물", cls: "el-water", color: "검은색·남색", dir: "북쪽", num: "1, 6",
      word: "깊은 지혜, 유연함",
      weak: "물을 넉넉히 마시고 잠을 충분히 자며, 조용히 쉬는 시간을 가지세요.",
      strong: "생각이 많아질 때는 몸을 움직여 머리를 비워 보세요." }
  ];

  const DAY_MASTER = [
    { title: "큰 나무 (갑목)", text: "곧게 뻗은 큰 나무처럼 바르고 듬직합니다. 앞장서서 이끄는 힘이 있고, 한번 정한 뜻은 끝까지 지킵니다. 다만 굽힐 줄 모르면 부러지기 쉬우니, 때로는 바람에 몸을 맡기는 여유가 필요합니다." },
    { title: "풀과 꽃 (을목)", text: "부드럽고 끈기 있는 풀꽃처럼 어떤 곳에서도 잘 적응합니다. 사람을 잘 살피고 관계를 오래 이어 갑니다. 남의 눈치를 너무 보지 말고 자기 뜻을 드러내면 더 크게 피어납니다." },
    { title: "하늘의 해 (병화)", text: "하늘의 해처럼 밝고 따뜻합니다. 솔직하고 시원시원해 주변을 환하게 만듭니다. 마음이 급해 서두르기 쉬우니, 한 박자 쉬어 가면 실수가 줄어듭니다." },
    { title: "등불과 촛불 (정화)", text: "어둠을 밝히는 등불처럼 섬세하고 정이 깊습니다. 남을 세심하게 챙기고 예절이 바릅니다. 속으로만 끙끙 앓기 쉬우니 마음을 털어놓을 사람을 곁에 두세요." },
    { title: "큰 산 (무토)", text: "큰 산처럼 묵직하고 믿음직합니다. 쉽게 흔들리지 않아 사람들이 기대어 옵니다. 변화를 늦게 받아들이는 편이니 새로운 것에도 마음을 열어 보세요." },
    { title: "기름진 논밭 (기토)", text: "곡식을 키우는 논밭처럼 포근하고 알뜰합니다. 실속을 잘 챙기고 남을 잘 돌봅니다. 걱정이 많아질 때는 생각을 덜어 내고 몸을 움직여 보세요." },
    { title: "단단한 무쇠 (경금)", text: "단단한 무쇠처럼 의리가 있고 결단력이 강합니다. 옳고 그름이 분명해 믿음을 줍니다. 말이 날카롭게 들릴 수 있으니 부드러운 표현을 곁들이면 좋습니다." },
    { title: "빛나는 보석 (신금)", text: "빛나는 보석처럼 깔끔하고 섬세합니다. 감각이 뛰어나고 자존심이 강합니다. 작은 말에도 마음이 쓰이기 쉬우니 스스로를 너그럽게 대해 주세요." },
    { title: "넓은 바다 (임수)", text: "넓은 바다처럼 마음이 크고 지혜롭습니다. 생각이 깊고 사람을 두루 사귑니다. 한곳에 오래 머물기 어려워하니 꾸준함을 기르면 큰 힘이 됩니다." },
    { title: "비와 이슬 (계수)", text: "만물을 적시는 비와 이슬처럼 조용하고 슬기롭습니다. 남이 놓치는 것을 잘 알아차리고 상상력이 풍부합니다. 걱정이 깊어지지 않도록 햇볕을 쬐며 자주 걸으세요." }
  ];

  /* 십성: 일간과 다른 글자의 관계 */
  const TEN = {
    비견: { g: "비겁", mean: "나와 같은 기운 · 친구, 형제" },
    겁재: { g: "비겁", mean: "나와 같은 기운 · 경쟁, 동료" },
    식신: { g: "식상", mean: "내가 낳는 기운 · 재능, 먹을 복" },
    상관: { g: "식상", mean: "내가 낳는 기운 · 표현력, 말솜씨" },
    편재: { g: "재성", mean: "내가 다스리는 기운 · 큰 재물, 활동" },
    정재: { g: "재성", mean: "내가 다스리는 기운 · 꾸준한 재물, 살림" },
    편관: { g: "관성", mean: "나를 다스리는 기운 · 도전, 책임" },
    정관: { g: "관성", mean: "나를 다스리는 기운 · 명예, 직장" },
    편인: { g: "인성", mean: "나를 돕는 기운 · 특별한 재주, 직관" },
    정인: { g: "인성", mean: "나를 돕는 기운 · 배움, 어른의 도움" }
  };

  function tenGod(dm, other) {
    const d = STEM_EL[dm], o = STEM_EL[other];
    const same = (dm % 2) === (other % 2);
    if (o === d) return same ? "비견" : "겁재";
    if (o === (d + 1) % 5) return same ? "식신" : "상관";
    if (o === (d + 2) % 5) return same ? "편재" : "정재";
    if (d === (o + 2) % 5) return same ? "편관" : "정관";
    return same ? "편인" : "정인";
  }

  /* 지지 관계: 육합·육충 */
  const HAP = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
  function branchRel(a, b) {
    if (a === b) return "same";
    if (HAP[a] === b) return "hap";
    if ((a + 6) % 12 === b) return "chung";
    return null;
  }

  /* ═════════════ 2. 운세 문장 ═════════════ */

  const FORTUNE = {
    비겁: {
      base: 3,
      today: [
        "나와 같은 기운이 들어오는 날입니다. 자신감이 생기고 사람들과 어울리기 좋습니다. 고집이 세질 수 있으니 한 번 더 들어 주는 여유를 가지세요.",
        "힘이 나는 하루입니다. 미뤄 둔 일을 밀어붙이기 좋고, 친구나 형제에게 연락하면 반가운 이야기를 듣게 됩니다. 함께 쓰는 돈이 늘기 쉬우니 지갑은 가볍게 여세요."
      ],
      week: "동료와 친구의 도움이 큰 한 주입니다. 혼자보다 함께할 때 일이 잘 풀립니다. 경쟁심이 생길 수 있으니 양보할 줄 알면 더 좋은 결과가 옵니다.",
      month: "주관이 뚜렷해지고 추진력이 붙는 달입니다. 새로운 모임이나 활동을 시작하기 좋습니다. 큰돈이 오가는 약속이나 보증은 신중하게 하세요.",
      year: "자기 힘으로 우뚝 서는 한 해입니다. 뜻이 맞는 사람과 손잡으면 큰일도 해낼 수 있습니다. 씀씀이가 늘기 쉬우니 미리 계획을 세워 두면 든든합니다.",
      area: { money: "들어오는 만큼 나가기 쉬우니 계획적으로 쓰세요.", work: "함께하는 일이 잘 맞습니다. 의견을 모으면 길이 보입니다.", people: "친구·형제와 가까워지기 좋습니다.", health: "기운이 넘치니 가벼운 운동으로 풀어 주세요." }
    },
    식상: {
      base: 4,
      today: [
        "생각과 말이 술술 풀리는 날입니다. 하고 싶은 말을 부드럽게 전하면 좋은 반응이 돌아옵니다. 요리, 글쓰기, 노래처럼 손과 입을 쓰는 일이 즐겁습니다.",
        "재주가 빛나는 하루입니다. 좋은 생각이 떠오르면 바로 적어 두세요. 말이 앞서기 쉬우니 약속은 지킬 수 있는 만큼만 하세요."
      ],
      week: "솜씨를 보여 줄 기회가 생기는 한 주입니다. 배우던 것을 써먹거나 남에게 가르쳐 보면 보람이 큽니다. 몸이 고단할 수 있으니 잠을 넉넉히 주무세요.",
      month: "베풀고 나누는 일에 복이 따르는 달입니다. 취미나 작은 부업을 시작하기 좋습니다. 윗사람 앞에서는 말을 조금 아끼면 오해가 줄어듭니다.",
      year: "재능을 펼치는 한 해입니다. 그동안 쌓은 경험이 열매를 맺고, 새로운 일을 벌이기에도 좋습니다. 여러 가지를 벌이기보다 잘하는 한두 가지에 힘을 모으세요.",
      area: { money: "솜씨로 버는 돈이 생깁니다. 작은 수입도 소중히 모으세요.", work: "아이디어를 내면 인정받습니다.", people: "웃음과 대화가 많아집니다. 자녀·아랫사람과 사이가 좋아집니다.", health: "먹는 즐거움이 커지니 과식만 조심하세요." }
    },
    재성: {
      base: 4,
      today: [
        "작은 이익과 기쁜 소식이 기대되는 날입니다. 꼼꼼하게 챙기면 손해 볼 일이 없습니다. 장보기나 살림 정리에도 좋은 날입니다.",
        "현실 감각이 살아나는 하루입니다. 미뤄 둔 계산이나 정리를 끝내기 좋습니다. 충동구매만 조심하면 알뜰한 하루가 됩니다."
      ],
      week: "부지런히 움직인 만큼 거두는 한 주입니다. 계획한 일을 차근차근 마무리하세요. 가족과 함께하는 시간에서 기쁨을 찾게 됩니다.",
      month: "재물의 흐름이 활발한 달입니다. 들어올 돈과 나갈 돈을 적어 두면 여유가 생깁니다. 큰 투자는 충분히 알아본 뒤 결정하세요.",
      year: "노력이 결실로 돌아오는 한 해입니다. 살림을 넉넉하게 꾸리고 앞날을 준비하기 좋습니다. 욕심을 줄이고 꾸준함을 지키면 복이 오래 머뭅니다.",
      area: { money: "알뜰하게 모으기 좋은 때입니다.", work: "실속 있는 일을 고르면 성과가 납니다.", people: "배우자·가족과의 정이 깊어집니다.", health: "바쁘게 움직이다 무리하기 쉬우니 쉬는 시간을 꼭 챙기세요." }
    },
    관성: {
      base: 3,
      today: [
        "책임감이 빛나는 날입니다. 맡은 일을 차분히 해내면 인정받습니다. 규칙과 약속을 잘 지키면 하루가 순조롭습니다.",
        "조금 긴장되는 일이 있을 수 있지만, 그만큼 성장하는 하루입니다. 서두르지 말고 순서대로 처리하세요. 저녁에는 마음 편히 쉬어 주세요."
      ],
      week: "할 일이 많지만 해낸 만큼 인정받는 한 주입니다. 관공서나 윗사람과 관련된 일은 서류를 꼼꼼히 챙기세요. 무리하지 말고 하나씩 해 나가세요.",
      month: "질서와 책임이 강조되는 달입니다. 미뤄 둔 서류 정리, 건강검진 같은 일을 하기 좋습니다. 원칙을 지키면 믿음이 쌓입니다.",
      year: "책임과 명예가 함께 오는 한 해입니다. 새로운 역할이나 직책을 맡게 될 수 있습니다. 부담을 혼자 지기보다 나누면 한결 가벼워집니다.",
      area: { money: "정해진 수입을 잘 지키는 것이 가장 좋습니다.", work: "성실함이 인정받는 때입니다.", people: "예의를 갖추면 윗사람의 도움이 있습니다.", health: "긴장이 쌓이기 쉬우니 어깨와 목을 자주 풀어 주세요." }
    },
    인성: {
      base: 4,
      today: [
        "도움의 손길이 닿는 날입니다. 어른이나 선배의 조언을 들으면 길이 보입니다. 책을 읽거나 배우기에도 좋습니다.",
        "마음이 차분해지는 하루입니다. 생각을 정리하고 계획을 세우기 좋습니다. 문서나 연락과 관련된 기쁜 일이 있을 수 있습니다."
      ],
      week: "배우고 채우는 한 주입니다. 새로 알게 된 것이 오래 도움이 됩니다. 생각만 하다 때를 놓치지 않도록 작은 일부터 실천해 보세요.",
      month: "주변의 응원과 도움이 많은 달입니다. 공부, 자격증, 기도처럼 마음을 채우는 일에 좋은 때입니다. 계약이나 문서 일도 순조롭습니다.",
      year: "든든한 도움이 따르는 한 해입니다. 배우고 익힌 것이 바탕이 되어 마음이 안정됩니다. 받은 도움을 나누면 복이 더 커집니다.",
      area: { money: "큰돈보다 안정이 먼저입니다. 문서·계약 운이 좋습니다.", work: "공부한 것이 실력이 됩니다.", people: "어른과 스승의 도움이 있습니다.", health: "마음이 편안해져 잠을 푹 자기 좋습니다." }
    }
  };

  const GROUP_NAME = {
    비겁: "친구·동료", 식상: "재능·표현", 재성: "재물·결실", 관성: "책임·명예", 인성: "배움·도움"
  };

  /* 원하는 날의 운세: 목적별 조언 */
  const PURPOSE = {
    exam: {
      label: "📝 시험",
      비겁: "평소 실력을 믿고 자신 있게 임하세요. 함께 공부한 사람과 마지막 점검을 하면 도움이 됩니다.",
      식상: "생각이 잘 풀리는 날이라 쓰고 말하는 시험에 강합니다. 실수하지 않도록 답을 한 번 더 확인하세요.",
      재성: "꼼꼼함이 빛나는 날입니다. 시간 배분만 잘 하면 아는 문제를 놓치지 않습니다.",
      관성: "조금 긴장되기 쉬운 날이지만 규칙을 지키는 힘이 강합니다. 시험장에 일찍 도착해 숨을 고르세요.",
      인성: "배운 것이 잘 떠오르는 날입니다. 공부와 시험에 잘 맞는 기운이니, 전날 푹 자는 것이 가장 좋은 준비입니다."
    },
    interview: {
      label: "🤝 면접",
      비겁: "자신감 있는 태도가 장점입니다. 상대의 말을 끝까지 듣고 답하면 더 좋은 인상을 줍니다.",
      식상: "말솜씨가 살아나는 날입니다. 준비한 이야기를 편하게 풀어 보세요.",
      재성: "해 온 일과 성과를 구체적으로 말하면 좋은 인상을 남깁니다.",
      관성: "단정한 차림과 예의가 큰 점수가 됩니다. 믿음직한 모습이 돋보입니다.",
      인성: "차분하고 성실한 인상을 줍니다. 배우려는 자세를 보여 주세요."
    },
    contract: {
      label: "📑 이사·계약",
      비겁: "함께 일을 나눌 사람이 있으면 수월합니다. 돈 문제는 미리 정확히 정해 두세요.",
      식상: "새 출발의 설렘이 있는 날입니다. 조건은 말로만 정하지 말고 꼭 글로 남기세요.",
      재성: "실속을 따지기 좋은 날입니다. 금액과 날짜를 꼼꼼히 확인하면 손해가 없습니다.",
      관성: "서류와 절차를 잘 챙기면 순조롭습니다. 도장 찍기 전에 한 번 더 읽어 보세요.",
      인성: "문서 운이 좋은 날입니다. 믿을 만한 사람의 조언을 들으면 더욱 좋습니다."
    },
    trip: {
      label: "🧳 여행·나들이",
      비겁: "친구나 가족과 함께하면 즐거움이 두 배가 됩니다.",
      식상: "맛있는 음식과 볼거리가 기다리는 날입니다. 사진을 많이 남기세요.",
      재성: "알뜰하게 계획하면 만족스러운 나들이가 됩니다. 지갑과 소지품을 잘 챙기세요.",
      관성: "일정을 넉넉하게 잡으면 마음 편한 여행이 됩니다. 교통 시간을 미리 확인하세요.",
      인성: "조용한 곳에서 쉬어 가기 좋은 날입니다. 절이나 숲길 산책도 좋습니다."
    },
    meet: {
      label: "💐 만남·모임",
      비겁: "편안하고 솔직한 대화가 오가는 날입니다.",
      식상: "웃음이 많은 자리가 됩니다. 재치 있는 말이 호감을 삽니다.",
      재성: "작은 선물이나 배려가 좋은 인상을 남깁니다.",
      관성: "약속 시간을 잘 지키면 믿음을 얻습니다. 예의를 갖추면 좋은 인연이 됩니다.",
      인성: "어른이나 스승을 뵙기 좋은 날입니다. 따뜻한 조언을 듣게 됩니다."
    }
  };

  const REL_NOTE = {
    hap: "타고난 일지(태어난 날의 지지)와 잘 어울리는 기운이라, 사람 사이의 일이 순조롭습니다.",
    chung: "타고난 일지와 부딪히는 기운이 있어 변화가 생기기 쉽습니다. 서두르지 말고 한 번 더 확인하면 오히려 좋은 기회가 됩니다.",
    same: "타고난 일지와 같은 기운이라 익숙하고 편안한 흐름입니다."
  };

  /* ═════════════ 3. 별자리 ═════════════ */

  // [이름, 기호, 시작 월, 시작 일, 원소, 성격, 행운의 색]
  const SIGNS = [
    ["물병자리", "♒", 1, 20, "공기", "생각이 자유롭고 남다른 시각을 가졌습니다. 사람을 차별 없이 대하고 새로운 것을 반깁니다.", "하늘색"],
    ["물고기자리", "♓", 2, 19, "물", "마음이 따뜻하고 남의 아픔에 잘 공감합니다. 예술적 감각과 상상력이 풍부합니다.", "연보라색"],
    ["양자리", "♈", 3, 21, "불", "용기 있고 시원시원합니다. 누구보다 먼저 시작하고 앞장서는 힘이 있습니다.", "빨간색"],
    ["황소자리", "♉", 4, 20, "흙", "느긋하고 성실합니다. 한번 시작한 일은 끝까지 해내고, 좋은 것을 알아보는 눈이 있습니다.", "초록색"],
    ["쌍둥이자리", "♊", 5, 21, "공기", "재치 있고 말솜씨가 좋습니다. 호기심이 많아 무엇이든 빨리 배웁니다.", "노란색"],
    ["게자리", "♋", 6, 22, "물", "가족과 집을 아끼고 정이 많습니다. 소중한 사람을 지키는 힘이 강합니다.", "은색"],
    ["사자자리", "♌", 7, 23, "불", "당당하고 마음이 넓습니다. 주변을 밝게 만들고 사람들을 이끄는 매력이 있습니다.", "금색"],
    ["처녀자리", "♍", 8, 23, "흙", "꼼꼼하고 부지런합니다. 작은 것까지 챙기며 남을 돕는 일에 보람을 느낍니다.", "베이지색"],
    ["천칭자리", "♎", 9, 24, "공기", "균형 감각이 뛰어나고 부드럽습니다. 다툼을 잘 풀고 아름다운 것을 좋아합니다.", "분홍색"],
    ["전갈자리", "♏", 10, 23, "물", "속이 깊고 집중력이 강합니다. 한번 믿은 사람에게는 끝까지 의리를 지킵니다.", "자주색"],
    ["사수자리", "♐", 11, 23, "불", "밝고 낙천적입니다. 여행과 배움을 좋아하고 넓은 세상을 꿈꿉니다.", "보라색"],
    ["염소자리", "♑", 12, 25, "흙", "책임감이 강하고 참을성이 있습니다. 차근차근 쌓아 올려 끝내 목표를 이룹니다.", "갈색"]
  ];
  const SIGN_FRIEND = { "불": "공기", "공기": "불", "흙": "물", "물": "흙" };

  const STAR_POOL = {
    total: [
      "작은 일에서 기쁨을 찾게 되는 하루입니다. 웃는 얼굴이 복을 부릅니다.",
      "미뤄 둔 일을 하나 끝내면 마음이 한결 가벼워집니다.",
      "뜻밖의 연락이 반가움을 줍니다. 먼저 안부를 물어도 좋습니다.",
      "서두르지 않으면 모든 일이 제자리를 찾는 날입니다.",
      "새로운 것을 하나 배워 보세요. 생각보다 재미있습니다.",
      "주변을 정리하면 운의 흐름도 맑아집니다.",
      "오늘의 친절이 머지않아 고마움으로 돌아옵니다.",
      "익숙한 길 대신 조금 다른 길로 걸어 보면 좋은 일이 생깁니다.",
      "차분하게 계획을 세우기 좋은 날입니다. 내일이 더 쉬워집니다.",
      "칭찬 한마디가 하루를 환하게 바꿉니다.",
      "몸과 마음이 쉬어 가기를 바라는 날입니다. 무리하지 마세요.",
      "좋아하는 일을 할 때 행운이 따라옵니다."
    ],
    people: [
      "가족과 따뜻한 밥 한 끼를 나눠 보세요.",
      "오랜 친구에게 먼저 연락하면 반가워합니다.",
      "듣는 쪽이 되어 주면 마음이 더 가까워집니다.",
      "작은 선물이나 고맙다는 말이 큰 기쁨이 됩니다.",
      "의견이 다를 때는 하루 미뤄 이야기하면 잘 풀립니다.",
      "새로 만난 사람과 이야기가 잘 통합니다.",
      "어른의 말씀에 귀 기울이면 도움이 됩니다.",
      "웃음이 많은 자리에 함께하면 기운이 납니다."
    ],
    money: [
      "꼭 필요한 것만 사면 알뜰한 하루가 됩니다.",
      "작은 돈이라도 모아 두면 든든해집니다.",
      "가계부를 한번 들여다보면 새는 돈이 보입니다.",
      "남에게 빌려주는 일은 오늘은 쉬어 가세요.",
      "할인이나 혜택을 잘 챙기는 날입니다.",
      "물건을 정리하다 쓸모 있는 것을 찾게 됩니다.",
      "큰 결정은 하루 더 생각한 뒤에 하세요.",
      "나누면 오히려 마음이 넉넉해지는 날입니다."
    ],
    health: [
      "물을 자주 마시고 가볍게 걸어 보세요.",
      "따뜻한 차 한 잔이 몸을 편하게 해 줍니다.",
      "어깨와 목을 자주 돌려 풀어 주세요.",
      "일찍 잠자리에 들면 내일이 개운합니다.",
      "햇볕을 쬐며 걷기 좋은 날입니다.",
      "제철 과일과 채소가 기운을 북돋워 줍니다.",
      "눈을 자주 쉬게 해 주세요.",
      "깊게 숨을 쉬는 것만으로도 마음이 편안해집니다."
    ]
  };

  function zodiacIndex(m, d) {
    // SIGNS 시작일 기준으로 거꾸로 찾기
    for (let i = SIGNS.length - 1; i >= 0; i--) {
      const [, , sm, sd] = SIGNS[i];
      if (m > sm || (m === sm && d >= sd)) return i;
    }
    return 11; // 1월 1~19일은 염소자리
  }

  /* ═════════════ 4. 도우미 ═════════════ */

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
  const fmtDate = (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;
  const fmtMD = (d) => `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY[d.getDay()]})`;
  const gzKo = (s, b) => STEM_KO[s] + BR_KO[b];
  const gzHj = (s, b) => STEM_HJ[s] + BR_HJ[b];
  const gzFull = (s, b) => `${gzKo(s, b)}(${gzHj(s, b)})`;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function stars(n) {
    const s = el("span", "stars");
    s.textContent = "★".repeat(n) + "☆".repeat(5 - n);
    s.setAttribute("aria-label", `별 5개 중 ${n}개`);
    return s;
  }

  function showError(text) {
    const r = $("sajuResult");
    r.replaceChildren(el("p", "error", text));
  }

  /* ═════════════ 5. 입력 처리 ═════════════ */

  let calendarType = "solar";
  let gender = 1; // 1 남, 0 여

  $("solarBtn").addEventListener("click", () => setCal("solar"));
  $("lunarBtn").addEventListener("click", () => setCal("lunar"));
  function setCal(type) {
    calendarType = type;
    $("solarBtn").setAttribute("aria-pressed", String(type === "solar"));
    $("lunarBtn").setAttribute("aria-pressed", String(type === "lunar"));
    $("leapWrap").classList.toggle("hidden", type !== "lunar");
  }

  $("maleBtn").addEventListener("click", () => setGender(1));
  $("femaleBtn").addEventListener("click", () => setGender(0));
  function setGender(g) {
    gender = g;
    $("maleBtn").setAttribute("aria-pressed", String(g === 1));
    $("femaleBtn").setAttribute("aria-pressed", String(g === 0));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!window.Solar || !window.Lunar) {
      showError("만세력 도구를 불러오지 못했습니다. 인터넷 연결을 확인하신 뒤 새로고침해 주세요.");
      return;
    }

    const y = Number($("year").value);
    const m = Number($("month").value);
    const d = Number($("day").value);
    const hourVal = $("hour").value;
    const isLeap = $("leap").value === "true";

    if (!Number.isInteger(y) || y < 1900 || y > 2050 ||
        !Number.isInteger(m) || m < 1 || m > 12 ||
        !Number.isInteger(d) || d < 1 || d > 31) {
      showError("생년월일을 다시 확인해 주세요. 연도는 1900~2050년 사이로 넣어 주세요.");
      return;
    }

    const known = hourVal !== "";
    const hb = known ? Number(hourVal) : 6;     // 모르면 낮 12시(오시)로 계산하고 시주는 비웁니다
    const hh = hb * 2, mm = 30;                 // 각 시(時)의 가운데 시각

    let solar;
    try {
      if (calendarType === "lunar") {
        solar = Lunar.fromYmdHms(y, isLeap ? -m : m, d, hh, mm, 0).getSolar();
      } else {
        const chk = new Date(y, m - 1, d);
        if (chk.getFullYear() !== y || chk.getMonth() !== m - 1 || chk.getDate() !== d) throw new Error("date");
        solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
      }
    } catch (err) {
      showError("없는 날짜입니다. 날짜와 양력·음력, 평달·윤달을 다시 확인해 주세요.");
      return;
    }

    const lunar = solar.getLunar();
    const ec = lunar.getEightChar();
    const idx = (s) => ({ s: STEM_HJ.indexOf(s[0]), b: BR_HJ.indexOf(s[1]) });

    const chart = {
      year: idx(ec.getYear()),
      month: idx(ec.getMonth()),
      day: idx(ec.getDay()),
      time: known ? idx(ec.getTime()) : null
    };

    const info = {
      input: { y, m, d, isLeap, cal: calendarType, known, hb, gender },
      solar: { y: solar.getYear(), m: solar.getMonth(), d: solar.getDay() },
      lunar: { y: lunar.getYear(), m: Math.abs(lunar.getMonth()), d: lunar.getDay(), leap: lunar.getMonth() < 0 },
      chart,
      ec
    };

    render(info);
  });

  /* ═════════════ 6. 결과 계산 ═════════════ */

  function elementCounts(chart) {
    const c = [0, 0, 0, 0, 0];
    ["year", "month", "day", "time"].forEach((k) => {
      const p = chart[k];
      if (!p) return;
      c[STEM_EL[p.s]]++;
      c[BR_EL[p.b]]++;
    });
    return c;
  }

  function periodFortune(dm, dayBranch, weakEls, s, b) {
    const god = tenGod(dm, s);
    const group = TEN[god].g;
    const rel = branchRel(dayBranch, b);
    let score = FORTUNE[group].base;
    if (rel === "hap") score++;
    if (rel === "chung") score--;
    const fills = weakEls.includes(STEM_EL[s]);   // 그날 천간이 부족한 오행일 때
    if (fills) score++;
    score = Math.max(2, Math.min(5, score));
    return { god, group, rel, fills, score };
  }

  function dayGz(date) {
    const l = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
    return { s: STEM_HJ.indexOf(l.getDayGan()), b: BR_HJ.indexOf(l.getDayZhi()) };
  }

  /* ═════════════ 7. 결과 그리기 ═════════════ */

  function section(id, title) {
    const s = el("section", "saju-sec");
    s.id = id;
    s.appendChild(el("h3", null, title));
    return s;
  }

  function render(info) {
    const { chart, input } = info;
    const dm = chart.day.s;
    const dayBranch = chart.day.b;
    const counts = elementCounts(chart);
    const total = counts.reduce((a, b) => a + b, 0);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const weakEls = counts.map((c, i) => (c === minCount ? i : -1)).filter((i) => i >= 0);
    const strongEls = counts.map((c, i) => (c === maxCount ? i : -1)).filter((i) => i >= 0);

    const result = $("sajuResult");
    result.replaceChildren();
    const card = el("div", "result-card saju-result");

    /* 요약 */
    const head = el("div", "saju-summary");
    head.appendChild(el("h2", null, "🔮 나의 사주팔자"));
    const birthText =
      (input.cal === "lunar"
        ? `음력 ${input.y}년 ${input.m}월 ${input.d}일${input.isLeap ? "(윤달)" : ""} → 양력 ${info.solar.y}년 ${info.solar.m}월 ${info.solar.d}일`
        : `양력 ${input.y}년 ${input.m}월 ${input.d}일 (음력 ${info.lunar.y}년 ${info.lunar.leap ? "윤" : ""}${info.lunar.m}월 ${info.lunar.d}일)`);
    head.appendChild(el("p", "result-date", birthText));
    head.appendChild(el("p", "result-date",
      `${input.known ? BR_KO[input.hb] + "시" : "태어난 시 모름"} · ${input.gender ? "남성" : "여성"} · ` +
      `${gzKo(chart.year.s, chart.year.b)}년생 ${ANIMAL[chart.year.b]}띠`));
    card.appendChild(head);

    /* 바로가기 */
    const nav = el("nav", "saju-nav");
    nav.setAttribute("aria-label", "결과 바로가기");
    [["s-chart", "사주표"], ["s-five", "오행"], ["s-luck", "운세"], ["s-pick", "날짜 운세"], ["s-daeun", "대운"], ["s-star", "별자리"]]
      .forEach(([id, t]) => {
        const a = el("a", null, t);
        a.href = "#" + id;
        nav.appendChild(a);
      });
    card.appendChild(nav);

    /* ── 사주표 ── */
    const sChart = section("s-chart", "📜 사주팔자 표");
    const table = el("div", "pillars");
    [["time", "시주", "태어난 시"], ["day", "일주", "태어난 날"], ["month", "월주", "태어난 달"], ["year", "년주", "태어난 해"]]
      .forEach(([k, name, sub]) => {
        const p = chart[k];
        const col = el("div", "pillar" + (k === "day" ? " is-me" : ""));
        col.appendChild(el("div", "p-name", name));
        col.appendChild(el("div", "p-sub", sub));
        if (!p) {
          col.appendChild(el("div", "p-god", " "));
          col.appendChild(el("div", "gz unknown", "?"));
          col.appendChild(el("div", "gz unknown", "?"));
          col.appendChild(el("div", "p-god", "모름"));
        } else {
          col.appendChild(el("div", "p-god", k === "day" ? "나(일간)" : tenGod(dm, p.s)));
          const s = el("div", "gz " + EL[STEM_EL[p.s]].cls);
          s.appendChild(el("b", null, STEM_HJ[p.s]));
          s.appendChild(el("small", null, STEM_KO[p.s] + " · " + EL[STEM_EL[p.s]].ko));
          col.appendChild(s);
          const b = el("div", "gz " + EL[BR_EL[p.b]].cls);
          b.appendChild(el("b", null, BR_HJ[p.b]));
          b.appendChild(el("small", null, BR_KO[p.b] + " · " + EL[BR_EL[p.b]].ko));
          col.appendChild(b);
          col.appendChild(el("div", "p-god", tenGod(dm, BR_MAIN[p.b])));
        }
        table.appendChild(col);
      });
    sChart.appendChild(table);
    sChart.appendChild(el("p", "help",
      "위 칸은 천간(하늘의 기운), 아래 칸은 지지(땅의 기운)입니다. 칸 위아래의 작은 글씨는 '나'를 기준으로 본 관계(십성)입니다." +
      (input.known ? "" : " 태어난 시를 모르면 시주는 비워 두고 여섯 글자로 봅니다.")));

    // 일간 풀이
    const me = DAY_MASTER[dm];
    const meBox = el("div", "me-box");
    meBox.appendChild(el("h4", null, `나를 나타내는 글자: ${STEM_HJ[dm]}(${STEM_KO[dm]}) — ${me.title}`));
    meBox.appendChild(el("p", null, me.text));
    sChart.appendChild(meBox);
    card.appendChild(sChart);

    /* ── 오행 ── */
    const sFive = section("s-five", "🌿 오행 분포");
    const bars = el("div", "five-bars");
    counts.forEach((c, i) => {
      const row = el("div", "five-row");
      row.appendChild(el("span", "five-name", `${EL[i].ko}(${EL[i].hj}) ${EL[i].name}`));
      const track = el("span", "five-track");
      const fill = el("span", "five-fill " + EL[i].cls);
      fill.style.width = (total ? (c / total) * 100 : 0) + "%";
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("span", "five-num", c + "개"));
      bars.appendChild(row);
    });
    sFive.appendChild(bars);

    const strongNames = strongEls.map((i) => `${EL[i].ko}(${EL[i].name})`).join(", ");
    const weakNames = weakEls.map((i) => `${EL[i].ko}(${EL[i].name})`).join(", ");
    sFive.appendChild(el("p", null,
      `가장 많은 기운은 ${strongNames}입니다. ${strongEls.map((i) => EL[i].word).join(" / ")}의 성질이 두드러집니다. ` +
      `${EL[strongEls[0]].strong}`));
    sFive.appendChild(el("p", null,
      (minCount === 0
        ? `사주에 ${weakNames} 기운이 없습니다. 없는 것이 나쁜 것은 아니고, 생활 속에서 조금씩 채워 가면 되는 부분입니다. `
        : `상대적으로 적은 기운은 ${weakNames}입니다. `) + EL[weakEls[0]].weak));

    const lucky = el("div", "lucky");
    lucky.appendChild(el("h4", null, `🍀 나에게 도움이 되는 기운: ${EL[weakEls[0]].ko}(${EL[weakEls[0]].hj})`));
    const ul = el("ul");
    ul.appendChild(el("li", null, "행운의 색: " + EL[weakEls[0]].color));
    ul.appendChild(el("li", null, "좋은 방향: " + EL[weakEls[0]].dir));
    ul.appendChild(el("li", null, "행운의 숫자: " + EL[weakEls[0]].num));
    lucky.appendChild(ul);
    sFive.appendChild(lucky);
    card.appendChild(sFive);

    /* ── 운세 ── */
    const sLuck = section("s-luck", "🗓️ 나의 운세");
    const now = new Date();
    const todayL = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate()).getLunar();

    // 오늘
    const tg = dayGz(now);
    const fToday = periodFortune(dm, dayBranch, weakEls, tg.s, tg.b);
    const variant = hash(`${now.toDateString()}-${dm}-${dayBranch}`) % 2;
    sLuck.appendChild(luckCard("오늘의 운세", `${fmtDate(now)} · ${gzFull(tg.s, tg.b)}일`,
      fToday, FORTUNE[fToday.group].today[variant], true, weakEls));

    // 이번 주 (월~일)
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const gz = dayGz(dt);
      days.push({ dt, gz, f: periodFortune(dm, dayBranch, weakEls, gz.s, gz.b) });
    }
    const groupCount = {};
    days.forEach((x) => { groupCount[x.f.group] = (groupCount[x.f.group] || 0) + 1; });
    const maxG = Math.max(...Object.values(groupCount));
    const weekGroup = groups(groupCount, maxG, days[3].f.group);
    const weekScore = Math.round(days.reduce((a, x) => a + x.f.score, 0) / 7);
    const fWeek = { god: null, group: weekGroup, rel: null, fills: false, score: weekScore };
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ahead = days.filter((x) => x.dt >= todayStart);           // 남은 날 먼저
    const pool = ahead.some((x) => x.f.score >= 4) ? ahead : days;
    const best = pool.slice().sort((a, b) => b.f.score - a.f.score || a.dt - b.dt)
      .filter((x) => x.f.score >= 4).slice(0, 2).sort((a, b) => a.dt - b.dt);
    const weekCard = luckCard("이번 주 운세", `${fmtMD(days[0].dt)} ~ ${fmtMD(days[6].dt)}`,
      fWeek, FORTUNE[weekGroup].week, false, weakEls);
    if (best.length) {
      weekCard.appendChild(el("p", "good-days",
        "👍 이번 주 기운이 좋은 날: " + best.map((x) => `${fmtMD(x.dt)} ${gzKo(x.gz.s, x.gz.b)}일`).join(", ")));
    }
    sLuck.appendChild(weekCard);

    // 이달 (절기 기준)
    const ms = STEM_HJ.indexOf(todayL.getMonthGanExact());
    const mb = BR_HJ.indexOf(todayL.getMonthZhiExact());
    const fMonth = periodFortune(dm, dayBranch, weakEls, ms, mb);
    sLuck.appendChild(luckCard("이달의 운세", `${now.getMonth() + 1}월 무렵 · ${gzFull(ms, mb)}월 (절기 기준)`,
      fMonth, FORTUNE[fMonth.group].month, false, weakEls));

    // 올해 (입춘 기준)
    const ys = STEM_HJ.indexOf(todayL.getYearGanByLiChun());
    const yb = BR_HJ.indexOf(todayL.getYearZhiByLiChun());
    const fYear = periodFortune(dm, dayBranch, weakEls, ys, yb);
    const yearCard = luckCard("올해의 운세", `${gzFull(ys, yb)}년 · ${ANIMAL[yb]}의 해 (입춘 기준)`,
      fYear, FORTUNE[fYear.group].year, true, weakEls);
    const ttiRel = branchRel(chart.year.b, yb);
    const ttiText = {
      hap: `${ANIMAL[chart.year.b]}띠와 ${ANIMAL[yb]}의 해는 서로 잘 어울립니다. 사람과의 인연이 좋은 한 해입니다.`,
      chung: `${ANIMAL[chart.year.b]}띠와 ${ANIMAL[yb]}의 해는 서로 마주 보는 기운이라 이사·일자리 같은 변화가 생기기 쉽습니다. 미리 준비하면 변화가 기회가 됩니다.`,
      same: `자기 띠의 해입니다. 새 출발의 기운이 있으니 건강을 잘 챙기며 차분하게 시작하세요.`
    }[ttiRel] || `${ANIMAL[chart.year.b]}띠에게 ${ANIMAL[yb]}의 해는 무난하게 흘러가는 해입니다. 꾸준함이 가장 큰 힘이 됩니다.`;
    yearCard.appendChild(el("p", "good-days", "🐾 띠로 보는 올해: " + ttiText));
    sLuck.appendChild(yearCard);
    card.appendChild(sLuck);

    /* ── 원하는 날의 운세 ── */
    card.appendChild(pickSection(dm, dayBranch, weakEls, todayStart));

    /* ── 대운 ── */
    const sDaeun = section("s-daeun", "🧭 대운 — 10년마다 바뀌는 큰 흐름");
    try {
      const yun = info.ec.getYun(input.gender);
      const list = yun.getDaYun().filter((x) => x.getGanZhi()).slice(0, 9);
      sDaeun.appendChild(el("p", null,
        `태어난 지 약 ${yun.getStartYear()}년 ${yun.getStartMonth()}개월 뒤부터 첫 대운이 시작되어, 10년마다 기운이 바뀝니다. 지금 지나고 있는 대운은 초록색으로 표시했습니다.`));
      const grid = el("div", "daeun");
      const thisYear = now.getFullYear();
      list.forEach((dy) => {
        const gz = dy.getGanZhi();
        const s = STEM_HJ.indexOf(gz[0]), b = BR_HJ.indexOf(gz[1]);
        const sy = dy.getStartYear(), ey = dy.getEndYear();
        const box = el("div", "daeun-item" + (thisYear >= sy && thisYear <= ey ? " now" : ""));
        box.appendChild(el("div", "dy-age", `만 ${sy - info.solar.y}세~`));
        box.appendChild(el("div", "dy-gz", gzKo(s, b)));
        box.appendChild(el("div", "dy-hj", gzHj(s, b)));
        box.appendChild(el("div", "dy-god", GROUP_NAME[TEN[tenGod(dm, s)].g]));
        box.appendChild(el("div", "dy-year", `${sy}~${ey}`));
        grid.appendChild(box);
      });
      sDaeun.appendChild(grid);
      const cur = list.find((dy) => thisYear >= dy.getStartYear() && thisYear <= dy.getEndYear());
      if (cur) {
        const g = TEN[tenGod(dm, STEM_HJ.indexOf(cur.getGanZhi()[0]))].g;
        sDaeun.appendChild(el("p", "good-days", `지금은 ${gzKo(STEM_HJ.indexOf(cur.getGanZhi()[0]), BR_HJ.indexOf(cur.getGanZhi()[1]))} 대운입니다. ${DAEUN_TEXT[g]}`));
      }
    } catch (e) {
      sDaeun.appendChild(el("p", "help", "대운을 계산하지 못했습니다."));
    }
    card.appendChild(sDaeun);

    /* ── 별자리 ── */
    const sStar = section("s-star", "⭐ 별자리와 오늘의 별자리 운세");
    const zi = zodiacIndex(info.solar.m, info.solar.d);
    const sg = SIGNS[zi];
    const starHead = el("div", "star-head");
    starHead.appendChild(el("span", "star-sym", sg[1]));
    const sh = el("div");
    sh.appendChild(el("strong", null, sg[0]));
    sh.appendChild(el("span", "help", ` · ${sg[4]}의 별자리 · 행운의 색 ${sg[6]}`));
    starHead.appendChild(sh);
    sStar.appendChild(starHead);
    sStar.appendChild(el("p", null, sg[5]));

    const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${zi}`;
    const pick = (arr, k) => arr[hash(key + k) % arr.length];
    const starScore = 3 + (hash(key + "s") % 3);
    const friends = SIGNS.map((x, i) => i).filter((i) => i !== zi && (SIGNS[i][4] === sg[4] || SIGNS[i][4] === SIGN_FRIEND[sg[4]]));
    const friend = SIGNS[friends[hash(key + "f") % friends.length]];

    const starBox = el("div", "luck-card");
    const st = el("div", "luck-top");
    st.appendChild(el("h4", null, `오늘의 ${sg[0]} 운세`));
    st.appendChild(stars(starScore));
    starBox.appendChild(st);
    starBox.appendChild(el("p", null, pick(STAR_POOL.total, "t")));
    const sl = el("ul", "luck-areas");
    sl.appendChild(el("li", null, "💞 사람: " + pick(STAR_POOL.people, "p")));
    sl.appendChild(el("li", null, "💰 재물: " + pick(STAR_POOL.money, "m")));
    sl.appendChild(el("li", null, "🌱 건강: " + pick(STAR_POOL.health, "h")));
    sl.appendChild(el("li", null, `✨ 오늘 잘 맞는 별자리: ${friend[1]} ${friend[0]}`));
    starBox.appendChild(sl);
    sStar.appendChild(starBox);
    card.appendChild(sStar);

    /* ── 안내와 단추 ── */
    card.appendChild(el("p", "notice",
      "사주와 별자리 운세는 재미와 참고를 위한 내용입니다. 좋은 말은 힘으로 삼고, 조심하라는 말은 한 번 더 살피는 계기로 삼아 주세요."));

    const actions = el("div", "result-actions");
    const copy = el("button", "btn btn-line btn-full", "📋 결과 요약 복사하기");
    copy.type = "button";
    copy.addEventListener("click", () => copySummary(copy, info, { fToday, fYear, sg, weakEls }));
    actions.appendChild(copy);
    const again = el("button", "btn btn-primary btn-full", "✏️ 다른 사람 사주 보기");
    again.type = "button";
    again.addEventListener("click", () => {
      form.reset();
      setCal("solar");
      setGender(1);
      result.replaceChildren();
      $("sajuTool").scrollIntoView({ behavior: "smooth", block: "start" });
      $("year").focus({ preventScroll: true });
    });
    actions.appendChild(again);
    card.appendChild(actions);

    result.appendChild(card);
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function groups(count, max, fallback) {
    const tied = Object.keys(count).filter((g) => count[g] === max);
    return tied.includes(fallback) ? fallback : tied[0];
  }

  function ymd(d) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function pickSection(dm, dayBranch, weakEls, todayStart) {
    const sec = section("s-pick", "📅 원하는 날의 운세");
    sec.appendChild(el("p", null, "시험, 면접, 이사, 여행처럼 앞으로 다가올 날의 운세가 궁금하신가요? 날짜를 고르고 [이 날 운세 보기]를 누르세요."));

    const addDays = (n) => new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + n);
    const box = el("div", "pick-box tool");

    const dl = el("label", null, "날짜 고르기");
    dl.htmlFor = "pickDate";
    box.appendChild(dl);
    const date = el("input");
    date.type = "date";
    date.id = "pickDate";
    date.min = ymd(todayStart);
    date.max = ymd(addDays(730));
    date.value = ymd(addDays(7));
    box.appendChild(date);

    box.appendChild(el("span", "field-title", "무슨 날인가요? (선택)"));
    const chips = el("div", "chip-row");
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "날의 목적");
    let purpose = "";
    [["", "📆 그냥 궁금해요"]].concat(Object.keys(PURPOSE).map((k) => [k, PURPOSE[k].label]))
      .forEach(([k, label]) => {
        const b = el("button", null, label);
        b.type = "button";
        b.setAttribute("aria-pressed", String(k === ""));
        b.addEventListener("click", () => {
          purpose = k;
          chips.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        });
        chips.appendChild(b);
      });
    box.appendChild(chips);

    const go = el("button", "btn btn-primary btn-full", "🔍 이 날 운세 보기");
    go.type = "button";
    box.appendChild(go);
    sec.appendChild(box);

    const out = el("div", "pick-out");
    out.setAttribute("aria-live", "polite");
    sec.appendChild(out);

    go.addEventListener("click", () => {
      out.replaceChildren();
      const v = date.value;
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
      if (!m) {
        out.appendChild(el("p", "error", "날짜를 골라 주세요."));
        return;
      }
      const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      if (dt < todayStart) {
        out.appendChild(el("p", "error", "오늘이나 앞으로 다가올 날짜를 골라 주세요."));
        return;
      }
      const gz = dayGz(dt);
      const f = periodFortune(dm, dayBranch, weakEls, gz.s, gz.b);
      const dday = Math.round((dt - todayStart) / 86400000);
      const variant = hash(`${dt.toDateString()}-${dm}-${dayBranch}`) % 2;
      const title = (purpose ? PURPOSE[purpose].label.replace(/^\S+\s/, "") + " 날의 운세" : "그날의 운세") +
        (dday === 0 ? " (오늘)" : ` (D-${dday})`);
      const c = luckCard(title, `${fmtDate(dt)} · ${gzFull(gz.s, gz.b)}일`,
        f, FORTUNE[f.group].today[variant], !purpose, weakEls);
      if (purpose) {
        c.appendChild(el("p", "good-days", `${PURPOSE[purpose].label} 이렇게 준비하세요: ${PURPOSE[purpose][f.group]}`));
      }
      out.appendChild(c);
      c.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // 앞으로 30일 가운데 기운이 좋은 날
    const list = [];
    for (let i = 1; i <= 30; i++) {
      const dt = addDays(i);
      const gz = dayGz(dt);
      list.push({ dt, gz, f: periodFortune(dm, dayBranch, weakEls, gz.s, gz.b) });
    }
    const top = list.filter((x) => x.f.score >= 4)
      .sort((a, b) => b.f.score - a.f.score || a.dt - b.dt).slice(0, 4)
      .sort((a, b) => a.dt - b.dt);
    if (top.length) {
      const g = el("div", "good-list");
      g.appendChild(el("h4", null, "✨ 앞으로 30일 가운데 기운이 좋은 날"));
      const ul = el("ul");
      top.forEach((x) => {
        const li = el("li");
        const b = el("button", "link-btn", `${fmtDate(x.dt)} · ${gzKo(x.gz.s, x.gz.b)}일 ${"★".repeat(x.f.score)}`);
        b.type = "button";
        b.addEventListener("click", () => { date.value = ymd(x.dt); go.click(); });
        li.appendChild(b);
        ul.appendChild(li);
      });
      g.appendChild(ul);
      g.appendChild(el("p", "help", "날짜를 누르면 그날의 자세한 운세를 볼 수 있습니다. 중요한 날을 정할 때 재미로 참고해 보세요."));
      sec.appendChild(g);
    }
    return sec;
  }

  const DAEUN_TEXT = {
    비겁: "스스로 서고 사람들과 힘을 모으는 시기입니다. 독립심이 커지니 동료와의 신뢰를 잘 지키세요.",
    식상: "재능을 펼치고 표현하는 시기입니다. 하고 싶은 일을 시작하기 좋고, 베푼 만큼 돌아옵니다.",
    재성: "부지런히 일하고 거두는 시기입니다. 살림과 재물을 차곡차곡 쌓기 좋습니다.",
    관성: "책임과 역할이 커지는 시기입니다. 성실함이 인정받고 이름이 알려집니다.",
    인성: "배우고 도움받는 시기입니다. 마음공부와 배움이 큰 바탕이 됩니다."
  };

  function luckCard(title, sub, f, text, withAreas, weakEls) {
    const box = el("div", "luck-card");
    const top = el("div", "luck-top");
    top.appendChild(el("h4", null, title));
    top.appendChild(stars(f.score));
    box.appendChild(top);
    box.appendChild(el("p", "luck-sub", sub + (f.god ? ` · ${f.god}(${GROUP_NAME[f.group]})의 기운` : ` · ${GROUP_NAME[f.group]}의 기운이 많은 주`)));
    box.appendChild(el("p", null, text));
    const notes = [];
    if (f.rel && REL_NOTE[f.rel]) notes.push(REL_NOTE[f.rel]);
    if (f.fills) notes.push(`부족한 ${EL[weakEls[0]].ko}(${EL[weakEls[0]].name}) 기운을 채워 주는 때라 몸과 마음이 한결 가벼워집니다.`);
    notes.forEach((n) => box.appendChild(el("p", "luck-note", n)));
    if (withAreas) {
      const a = FORTUNE[f.group].area;
      const ul = el("ul", "luck-areas");
      ul.appendChild(el("li", null, "💰 재물: " + a.money));
      ul.appendChild(el("li", null, "💼 일: " + a.work));
      ul.appendChild(el("li", null, "💞 사람: " + a.people));
      ul.appendChild(el("li", null, "🌱 건강: " + a.health));
      box.appendChild(ul);
    }
    return box;
  }

  async function copySummary(btn, info, x) {
    const c = info.chart;
    const p = (k) => (c[k] ? gzKo(c[k].s, c[k].b) : "모름");
    const text = [
      "[운세쉼터 사주보기]",
      `사주: 년 ${p("year")} · 월 ${p("month")} · 일 ${p("day")} · 시 ${p("time")}`,
      `${ANIMAL[c.year.b]}띠 · 일간 ${STEM_KO[c.day.s]}${EL[STEM_EL[c.day.s]].ko} · 도움 되는 기운 ${EL[x.weakEls[0]].ko}`,
      `오늘의 운세 ${"★".repeat(x.fToday.score)} / 올해의 운세 ${"★".repeat(x.fYear.score)}`,
      `별자리: ${x.sg[0]}`,
      location.href.split("#")[0]
    ].join("\n");
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      area.remove();
    }
    btn.textContent = ok ? "✅ 복사했습니다!" : "복사가 되지 않았습니다";
    setTimeout(() => { btn.textContent = "📋 결과 요약 복사하기"; }, 2500);
  }
})();
