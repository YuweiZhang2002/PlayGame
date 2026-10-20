// Classroom copy and activities are separate from the timed, server-scored game.
Object.assign(TRANSLATIONS.zh, {
  courseNav:"课堂目录", courseIntro:"主题介绍", courseRules:"游戏规则", courseGame:"抽球挑战",
  courseFormula:"概念与公式", courseWeather:"天气随堂题", courseBoard:"实时排行榜",
  courseTiming:"约 16 分钟 · 互动课堂", courseLocked:"完成三轮游戏后解锁公式；看完大球袋的解法后解锁随堂题。",
  coursePlaying:"计时进行中，请先完成本局三轮答题。", courseGroup:"大家好，我们是 Group 12",
  courseTitle:"一条线索，<br><em>如何改变概率？</em>", courseLead:"Conditional probability · 条件概率",
  courseQuestion:"知道抽到的球带星星后，抽到橙色的机会会改变吗？",
  introBefore:"还没有线索", introAfter:"已知带星星", introBeforeValue:"看所有球", introAfterValue:"只看符合条件的球",
  introInsight:"先亲手玩，再把直觉写成公式。", introCTA:"开始了解游戏规则 →",
  journeyOne:"看见条件", journeyOneText:"用 8 颗球观察参照范围的变化。",
  journeyTwo:"理解公式", journeyTwoText:"把数量关系推广为概率关系。",
  journeyThree:"迁移应用", journeyThreeText:"用天气情境检验你的理解。",
  bigTitle:"如果袋子里有 10,000 颗球呢？", bigKicker:"03 / 从游戏走向一个新问题",
  bigLead:"每颗球等可能被抽中。没有完整球单，只有下面两条统计信息。",
  bigSchematic:"示意图 · 只展示少量球，不代表完整数量或比例",
  bigA:"A = 抽到橙色球", bigB:"B = 抽到带星星的球",
  bigGivenB:"40% 的球带星星", bigGivenAB:"24% 的球既是橙色又带星星",
  bigPrompt:"已知抽到的球带星星，它是橙色的概率是多少？",
  bigNote:"不计时、不计分。先留下你的判断，下一部分用公式检验。",
  bigUnsure:"暂时不确定", bigSaved:"已记录你的想法。先想一想：应该把哪个范围当作 100%？",
  bigBridge:"逐颗数不方便时，我们需要一种直接使用概率的方法。",
  unlockLesson:"进入概念与公式 →", lessonTime:"5 分钟 · 从图到公式",
  revisitTitle:"回到刚才的 10,000 颗球", revisitLead:"条件仍然是 B：带星星。先找条件，再找交集，最后相除。",
  revisitReveal:"用公式揭晓 →", revisitLabel:"在 B 内重新归一化",
  revisitAnswer:"P(A | B) = 0.24 ÷ 0.40 = 0.60 = 60%",
  revisitExplanation:"24% 和 40% 原来都以全部球为参照。相除后，分母变成带星星的球，橙色占其中的 60%。",
  revisitCount:"等可能时也可算 2,400 ÷ 4,000；公式直接利用已知概率，不必逐颗点数。",
  methodTitle:"把这三个动作带到任何题目", methodOne:"确定条件 B", methodOneText:"“已知……”后面的事件就是新的参照范围。",
  methodTwo:"找到交集 A ∩ B", methodTwoText:"目标与条件同时成立，而不是只有目标 A。",
  methodThree:"除以 P(B)", methodThreeText:"先确认 P(B) > 0，再把条件范围归一化。",
  generalNote:"公式适用于任何满足 P(B) > 0 的事件；直接按数量相除，还要求基本结果等可能。",
  weatherCTA:"用天气题检验一下 →", weatherTitle:"已知多云，下雨的概率是？",
  weatherKicker:"05 / 随堂检验", weatherLead:"一个假设的天气模型，给出以下两个概率。请独立选择答案，再查看解析。",
  weatherC:"C = 多云", weatherR:"R = 下雨", weatherGivenC:"P(C) = 0.50", weatherGivenRC:"P(R ∩ C) = 0.20",
  weatherDataC:"多云的概率", weatherDataRC:"既下雨又多云的概率", weatherPrompt:"求 P(R | C)",
  weatherNote:"教学用假设数据，并非真实天气预报。无需数球，也不需要假设 R 与 C 独立。",
  weatherSubmit:"提交答案", weatherCorrect:"答对了！分母是已知条件 C 的概率。",
  weatherWrong:"再看一次条件：0.20 是联合概率，还需要除以 P(C) = 0.50。",
  weatherCalculation:"P(R | C) = P(R ∩ C) / P(C) = 0.20 / 0.50 = 40%",
  weatherReason:"把所有天气情况中的 50%（多云）当作新整体；其中占原整体 20% 的“下雨且多云”，在新整体中占 40%。",
  weatherTakeaway:"先限制到条件，再看其中的目标。", weatherReplay:"回到公式再看一遍", weatherFinish:"返回游戏成绩",
  weatherUnscored:"随堂检验不计入三轮游戏排行榜。", chosenGuess:"你在大球袋题中的判断：{value}",
  answerSelect:"选择一个答案", lessonTitle:"从一袋球，走到条件概率。",
  title:"条件概率<em>实验室。</em>", subtitle:"Group 12 · 看线索，玩游戏，理解概率。",
  stamp:"PLAY · UNDERSTAND · APPLY", tagline:"Group 12 · 互动课堂"
});
Object.assign(TRANSLATIONS.en, {
  courseNav:"CLASS OUTLINE", courseIntro:"Introduction", courseRules:"Game rules", courseGame:"Ball challenge",
  courseFormula:"Concept & formula", courseWeather:"Weather check", courseBoard:"Live leaderboard",
  courseTiming:"16 minutes · Interactive lesson", courseLocked:"Finish all 3 rounds to unlock the formula. Reveal the large-bag solution to unlock the weather check.",
  coursePlaying:"The clock is running. Finish all 3 rounds first.", courseGroup:"Hello, we are Group 12",
  courseTitle:"One clue.<br><em>A different probability?</em>", courseLead:"Conditional probability",
  courseQuestion:"If we know a ball has a star, does its chance of being orange change?",
  introBefore:"Before the clue", introAfter:"Given a star", introBeforeValue:"Look at every ball", introAfterValue:"Keep only eligible balls",
  introInsight:"Play first. Then turn your intuition into a formula.", introCTA:"Explore the game rules →",
  journeyOne:"Notice the condition", journeyOneText:"Use 8 balls to see the reference set change.",
  journeyTwo:"Understand the formula", journeyTwoText:"Move from counts to probabilities.",
  journeyThree:"Apply the idea", journeyThreeText:"Test your understanding with weather.",
  bigTitle:"What if there are 10,000 balls?", bigKicker:"03 / A NEW QUESTION AFTER THE GAME",
  bigLead:"Every ball is equally likely to be drawn. There is no full inventory to inspect, only these two summaries.",
  bigSchematic:"Illustration only · The dots do not show the full count or proportions",
  bigA:"A = drawing an orange ball", bigB:"B = drawing a starred ball",
  bigGivenB:"40% of all balls have stars", bigGivenAB:"24% of all balls are orange AND starred",
  bigPrompt:"Given that the drawn ball has a star, what is the probability it is orange?",
  bigNote:"Untimed and unscored. Make a prediction; we will check it with a formula.",
  bigUnsure:"Not sure yet", bigSaved:"Prediction saved. Which group should now count as 100%?",
  bigBridge:"When inspecting balls one by one is impractical, we need a method that uses probabilities directly.",
  unlockLesson:"Explore the concept & formula →", lessonTime:"5 minutes · From picture to formula",
  revisitTitle:"Back to the 10,000-ball challenge", revisitLead:"The condition is still B: a star. Identify the condition, find the overlap, then divide.",
  revisitReveal:"Reveal the calculation →", revisitLabel:"Rescale within B",
  revisitAnswer:"P(A | B) = 0.24 ÷ 0.40 = 0.60 = 60%",
  revisitExplanation:"Both 24% and 40% originally refer to all balls. Dividing changes the reference set to starred balls: 60% of that set is orange.",
  revisitCount:"With equally likely balls, 2,400 ÷ 4,000 also works. The formula uses the supplied probabilities without inspecting every ball.",
  methodTitle:"Take these three steps to any question", methodOne:"Identify the condition B", methodOneText:"The event after “given” defines the new reference set.",
  methodTwo:"Find the overlap A ∩ B", methodTwoText:"Both the target and the condition must hold.",
  methodThree:"Divide by P(B)", methodThreeText:"Check that P(B) > 0, then rescale within that set.",
  generalNote:"The formula applies whenever P(B) > 0. Counting outcomes directly also requires those outcomes to be equally likely.",
  weatherCTA:"Try the weather check →", weatherTitle:"Given clouds, what is the chance of rain?",
  weatherKicker:"05 / CHECK YOUR UNDERSTANDING", weatherLead:"A hypothetical weather model gives two probabilities. Choose your answer independently, then see the explanation.",
  weatherC:"C = cloudy", weatherR:"R = rain", weatherGivenC:"P(C) = 0.50", weatherGivenRC:"P(R ∩ C) = 0.20",
  weatherDataC:"Probability of clouds", weatherDataRC:"Probability of rain AND clouds", weatherPrompt:"Find P(R | C)",
  weatherNote:"Hypothetical teaching data, not a real forecast. No ball counting or assumption of independence is needed.",
  weatherSubmit:"Submit answer", weatherCorrect:"Correct! The denominator is the probability of the condition C.",
  weatherWrong:"Check the condition again: 0.20 is the joint probability. Divide it by P(C) = 0.50.",
  weatherCalculation:"P(R | C) = P(R ∩ C) / P(C) = 0.20 / 0.50 = 40%",
  weatherReason:"Treat the cloudy cases, 50% of all cases, as the new whole. Rainy AND cloudy cases are 20% of the original whole, so they are 40% of the new one.",
  weatherTakeaway:"Restrict to the condition. Then measure the target within it.", weatherReplay:"Review the formula", weatherFinish:"Back to game results",
  weatherUnscored:"This check does not affect the three-round game leaderboard.", chosenGuess:"Your large-bag prediction: {value}",
  answerSelect:"Choose an answer", lessonTitle:"From a bag of balls to conditional probability.",
  title:"Conditional probability <em>lab.</em>", subtitle:"Group 12 · Follow a clue. Play a game. Understand probability.",
  stamp:"PLAY · UNDERSTAND · APPLY", tagline:"Group 12 · Interactive lesson"
});

class ClassroomFlow {
  constructor(flow) {
    this.flow = flow;
    this.$ = flow.$;
    this.weatherChoice = null;
    this.weatherAnswer = null;
    document.querySelectorAll("[data-course]").forEach(button =>
      button.addEventListener("click", () => this.navigate(button.dataset.course)));
    this.$("intro-continue").addEventListener("click", () => this.navigate("rules"));
    this.$("course-toggle").addEventListener("click", () => {
      const open = this.$("course-toggle").getAttribute("aria-expanded") !== "true";
      this.$("course-toggle").setAttribute("aria-expanded", String(open));
      this.$("course-sidebar").classList.toggle("is-open", open);
    });
    this.$("big-choices").addEventListener("click", event => {
      const button = event.target.closest("[data-big-answer]");
      if (!button || !flow.session?.completed) return;
      this.guess = button.dataset.bigAnswer;
      this.save("guess", this.guess);
      this.render();
    });
    this.$("revisit-reveal").addEventListener("click", () => {
      if (!flow.session?.completed) return;
      this.revisited = true;
      this.save("revisited", "yes");
      this.render();
      this.$("revisit-solution").scrollIntoView({block:"nearest",behavior:"instant"});
    });
    this.$("weather-continue").addEventListener("click", () => this.navigate("weather"));
    this.$("weather-choices").addEventListener("click", event => {
      const button = event.target.closest("[data-weather-answer]");
      if (!button || this.weatherAnswer !== null) return;
      this.weatherChoice = Number(button.dataset.weatherAnswer);
      this.render();
    });
    this.$("weather-submit").addEventListener("click", () => {
      if (this.weatherChoice === null || !this.canWeather() || this.weatherAnswer !== null) return;
      this.weatherAnswer = this.weatherChoice;
      this.save("weather", String(this.weatherAnswer));
      this.render();
      this.$("weather-feedback").focus({preventScroll:true});
      this.$("weather-feedback").scrollIntoView({block:"nearest",behavior:"instant"});
      document.dispatchEvent(new CustomEvent("classroom-answer",{detail:{correct:this.weatherAnswer === 0.4,button:this.$("weather-submit")}}));
    });
    this.$("weather-review").addEventListener("click", () => this.navigate("formula"));
    this.$("weather-finish").addEventListener("click", () => this.navigate("game"));
    this.$("large-ball-cloud").innerHTML = Array.from({length:96},(_,i) =>
      `<span class="cloud-ball ${i%3===0?"warm":"cool"}" aria-hidden="true">${i%5===0?"★":""}</span>`).join("");
  }
  key(name) { return `group12-${this.flow.session?.publicId}-${name}`; }
  save(name,value) { try { sessionStorage.setItem(this.key(name),value); } catch {} }
  read(name) { try { return sessionStorage.getItem(this.key(name)); } catch { return null; } }
  restore() {
    this.guess = this.read("guess");
    this.revisited = this.read("revisited") === "yes";
    const answer = this.read("weather");
    this.weatherAnswer = answer === null ? null : Number(answer);
    this.weatherChoice = this.weatherAnswer;
    if (location.pathname === "/lesson" && location.hash === "#weather-check" && this.canWeather()) this.flow.phase = "weather";
  }
  reset() { this.guess=null;this.revisited=false;this.weatherChoice=null;this.weatherAnswer=null; }
  canWeather() { return this.flow.session?.completed && this.revisited; }
  navigate(section) {
    const f=this.flow;
    if (f.phase==="loading" || (f.isPlaying() && section!=="game")) return;
    if (["formula","weather","board"].includes(section) && !f.session?.completed) return;
    if (section==="weather" && !this.canWeather()) return;
    if (section==="formula" || section==="weather") {
      if (location.pathname !== "/lesson") {
        location.assign("/lesson" + (section==="weather" ? "#weather-check" : ""));
        return;
      }
      f.phase=section==="weather"?"weather":"lesson";
    } else if (section==="intro") f.phase="intro";
    else if (section==="rules") f.phase=f.accepted?"profile":"rules";
    else f.phase=f.session?.completed?"results":f.session?"playing":f.accepted?"profile":"rules";
    f.clearEffects();
    f.render();
    if (f.phase==="results") f.refreshBoard();
    const id={intro:"class-introduction",rules:"onboarding",profile:"onboarding",playing:"game-stage",results:"results-screen",lesson:"conditional-lesson",weather:"weather-check"}[f.phase];
    const target=this.$(section==="board"?"leaderboard":id);
    target?.scrollIntoView({block:"start",behavior:"instant"});
    target?.querySelector("h2,h1")?.focus({preventScroll:true});
    this.$("course-sidebar").classList.remove("is-open");
    this.$("course-toggle").setAttribute("aria-expanded","false");
    history.replaceState(null,"",location.pathname+(section==="weather"?"#weather-check":""));
  }
  render() {
    const f=this.flow,$=this.$,t=f.t;
    document.body.dataset.phase=f.phase;
    $("class-introduction").hidden=f.phase!=="intro";
    $("weather-check").hidden=f.phase!=="weather";
    const current={intro:"intro",rules:"rules",profile:"rules",playing:"game",results:"game",lesson:"formula",weather:"weather"}[f.phase];
    document.querySelectorAll("[data-course]").forEach(button=>{
      const section=button.dataset.course;
      button.disabled=f.phase==="loading" || (f.isPlaying() && section!=="game") ||
        (["formula","board"].includes(section) && !f.session?.completed) ||
        (section==="weather" && !this.canWeather());
      if (section===current) button.setAttribute("aria-current","step"); else button.removeAttribute("aria-current");
    });
    $("course-hint").textContent=t(f.isPlaying()?"coursePlaying":"courseLocked");
    document.querySelectorAll("[data-big-answer]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.bigAnswer===this.guess)));
    $("big-status").hidden=!this.guess;
    $("revisit-guess").hidden=!this.guess;
    $("revisit-guess").textContent=t("chosenGuess",{value:this.guess==="unsure"?t("bigUnsure"):this.guess+"%"});
    $("revisit-solution").hidden=!this.revisited;
    $("revisit-reveal").hidden=this.revisited;
    $("weather-continue").hidden=!this.revisited;
    document.querySelectorAll("[data-weather-answer]").forEach(b=>{
      b.disabled=this.weatherAnswer!==null;
      b.setAttribute("aria-pressed",String(Number(b.dataset.weatherAnswer)===this.weatherChoice));
    });
    $("weather-submit").disabled=this.weatherChoice===null || this.weatherAnswer!==null;
    $("weather-feedback").hidden=this.weatherAnswer===null;
    $("weather-feedback").dataset.correct=String(this.weatherAnswer===0.4);
    $("weather-verdict").textContent=t(this.weatherAnswer===0.4?"weatherCorrect":"weatherWrong");
  }
}
