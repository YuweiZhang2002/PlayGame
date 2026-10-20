class ArcadeFlow {
  constructor({t, onSession, clearEffects}) {
    this.t = t;
    this.onSession = onSession;
    this.clearEffects = clearEffects;
    this.site = window.PROBABILITY_SITE || {basePath:"/",apiBase:""};
    this.lessonPath = this.site.basePath + "lesson" + (this.site.apiBase ? "/" : "");
    this.isLessonPage = location.pathname.replace(/\/+$/, "") === this.lessonPath.replace(/\/+$/, "");
    this.tokenKey = "probability-attempt:" + this.site.basePath;
    if (this.site.apiBase) {
      try { this.sessionToken = localStorage.getItem(this.tokenKey); } catch {}
    }
    this.phase = "loading";
    this.session = null;
    this.accepted = false;
    this.avatar = crypto.getRandomValues(new Uint32Array(1))[0] % 12;
    this.avatars = ["🐱","🦊","🐼","🐸","🦉","🐶","🤖","👽","👻","🧑‍🚀","🦄","🐙"];
    this.mode = "overall";
    this.boardData = null;
    this.boardBusy = false;
    this.boardError = false;
    this.$ = id => document.getElementById(id);
    this.classroom = new ClassroomFlow(this);
    this.$("rules-accept").addEventListener("click", () => {
      this.accepted = true;
      this.phase = "profile";
      this.render();
      this.$("player-name").focus();
    });
    this.$("player-name").addEventListener("input", () => this.renderProfile());
    this.$("random-avatar").addEventListener("click", () => {
      this.avatar = (this.avatar + 1 + crypto.getRandomValues(new Uint32Array(1))[0] % 11) % 12;
      this.renderProfile();
    });
    this.$("profile-form").addEventListener("submit", event => { event.preventDefault(); this.start(); });
    this.$("boot-retry").addEventListener("click", () => this.init());
    this.$("board-refresh").addEventListener("click", () => this.refreshBoard());
    document.querySelectorAll("[data-board-mode]").forEach(button => button.addEventListener("click", () => {
      this.mode = button.dataset.boardMode;
      this.boardData = null;
      this.renderBoard();
      this.refreshBoard();
    }));
    this.$("avatar-grid").innerHTML = this.avatars.map((emoji, i) => `<button type="button" class="avatar-option" data-avatar="${i}" aria-pressed="false"><span aria-hidden="true">${emoji}</span></button>`).join("");
    this.$("avatar-grid").addEventListener("click", event => {
      const button = event.target.closest("[data-avatar]");
      if (!button) return;
      this.avatar = Number(button.dataset.avatar);
      this.renderProfile();
    });
    this.clock = setInterval(() => this.renderTimer(), 100);
    this.poll = setInterval(() => { if (!document.hidden && this.phase === "results") this.refreshBoard(); }, 5000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.phase === "results") this.refreshBoard();
    });
    window.addEventListener("online", () => { if (this.phase === "results") this.refreshBoard(); });
    window.addEventListener("pageshow", event => { if (event.persisted) this.init(); });
  }
  async api(path, input) {
    const headers = input ? { "Content-Type": "application/json" } : {};
    if (this.site.apiBase && this.sessionToken) headers.Authorization = "Bearer " + this.sessionToken;
    const response = await fetch(this.site.apiBase + path, {
      method: input ? "POST" : "GET",
      headers,
      body: input ? JSON.stringify(input) : undefined,
      credentials: this.site.apiBase ? "omit" : "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "unavailable");
    return response.json();
  }
  sync(session) {
    this.session = session;
    this.baseElapsed = session.elapsedMs;
    this.clockSyncedAt = performance.now();
  }
  async init() {
    this.phase = "loading";
    this.$("boot-retry").hidden = true;
    this.$("boot-text").textContent = this.t("loadingGame");
    this.render();
    try {
      const {session} = await this.api("/api/session");
      if (session) {
        this.sync(session);
        this.avatar = session.avatar;
        this.$("player-name").value = session.name;
        this.accepted = true;
        if (this.isLessonPage && !session.completed) {
          location.replace(this.site.basePath);
          return;
        }
        this.phase = session.completed ? (this.isLessonPage ? "lesson" : "results") : "playing";
        this.onSession(session);
      } else {
        if (this.isLessonPage) {
          location.replace(this.site.basePath);
          return;
        }
        this.phase = "intro";
      }
      this.classroom.restore();
      // Old deep links must not expose the lesson before a completed attempt.
      if (location.hash && !["lesson","weather"].includes(this.phase)) history.replaceState(null, "", location.pathname);
      this.render();
      if (this.phase === "results") this.refreshBoard();
    } catch {
      this.$("boot-text").textContent = this.t("connectionError");
      this.$("boot-retry").hidden = false;
    }
  }
  renderProfile() {
    const name = this.$("player-name").value.trim();
    this.$("profile-preview-name").textContent = name || this.t("yourNickname");
    this.$("profile-avatar").textContent = this.avatars[this.avatar];
    this.$("player-name").placeholder = this.t("namePlaceholder");
    document.querySelectorAll("[data-avatar]").forEach(button => {
      const i = Number(button.dataset.avatar);
      button.setAttribute("aria-pressed", String(this.avatar === i));
      button.setAttribute("aria-label", this.t("avatarNames")[i]);
      button.disabled = Boolean(this.startBusy);
    });
    this.$("player-name").disabled = Boolean(this.startBusy);
    this.$("random-avatar").disabled = Boolean(this.startBusy);
    this.$("start-game").disabled = !name || [...name].length > 20 || !this.accepted || Boolean(this.startBusy);
    this.$("start-game").textContent = this.t(this.startBusy ? "startingGame" : "startGame");
  }
  async start() {
    if (!this.accepted || this.startBusy) return;
    const name = this.$("player-name").value.trim();
    if (!name || [...name].length > 20) return;
    this.startBusy = true;
    this.$("profile-error").textContent = "";
    // Keep the same ID after uncertain network failure; a retry must not create two games.
    this.startId ??= crypto.randomUUID();
    if (this.site.apiBase) {
      // Retain the attempt across refreshes without relying on third-party cookies.
      this.sessionToken = this.startId;
      try { localStorage.setItem(this.tokenKey, this.sessionToken); } catch {}
    }
    this.renderProfile();
    try {
      const {session} = await this.api("/api/start", {startId:this.startId,name,avatar:this.avatar,rulesAccepted:true});
      this.sync(session);
      this.classroom.reset();
      this.phase = session.completed ? "results" : "playing";
      this.onSession(session);
      this.startId = null;
      this.render();
      this.$("game-stage").scrollIntoView({block:"start",behavior:"instant"});
      document.querySelector(".choice")?.focus({preventScroll:true});
    } catch {
      this.$("profile-error").textContent = this.t("startError");
    } finally {
      this.startBusy = false;
      this.renderProfile();
    }
  }
  isPlaying() { return this.phase === "playing" && this.session && !this.session.completed; }
  async submit(round, value) {
    const {session} = await this.api("/api/answer", {round,value});
    this.sync(session);
    this.renderTimer();
    return session;
  }
  elapsed() {
    if (!this.session) return 0;
    return this.session.completed ? this.session.elapsedMs : this.baseElapsed + performance.now() - this.clockSyncedAt;
  }
  seconds(ms) { return (ms / 1000).toFixed(2); }
  renderTimer() {
    this.$("game-timer").textContent = this.seconds(this.elapsed()) + " s";
  }
  finish() {
    if (!this.session?.completed) return;
    this.phase = "results";
    this.clearEffects();
    this.render();
    this.refreshBoard();
    this.$("result-title").focus({preventScroll:true});
    this.$("results-screen").scrollIntoView({block:"start",behavior:"instant"});
  }
  prepare() {
    this.phase = "rules";
    this.accepted = false;
    this.startId = null;
    this.session = null;
    this.classroom.reset();
    this.render();
    this.$("rules-accept").focus({preventScroll:true});
    this.$("onboarding").scrollIntoView({block:"start",behavior:"instant"});
  }
  openLesson() {
    if (this.session?.completed) location.assign(this.lessonPath);
  }
  render() {
    const $ = this.$, phase = this.phase;
    $("boot-screen").hidden = phase !== "loading";
    $("onboarding").hidden = !["rules","profile"].includes(phase);
    $("profile-locked").hidden = this.accepted;
    $("profile-form").hidden = !this.accepted;
    $("rules-accept").hidden = this.accepted;
    $("rules-confirmed").hidden = !this.accepted;
    $("game-stage").hidden = phase !== "playing";
    $("results-screen").hidden = phase !== "results";
    $("leaderboard").hidden = phase !== "results";
    $("conditional-lesson").hidden = phase !== "lesson";
    $("lesson-nav").hidden = !["lesson","weather"].includes(phase);
    $("flow-track").hidden = !["rules","profile","playing","results"].includes(phase);
    const step = ["rules","profile","playing","results"].indexOf(phase);
    document.querySelectorAll("[data-flow-step]").forEach((el, i) => {
      el.classList.toggle("active", i === step);
      el.classList.toggle("done", i < step);
      if(i === step) el.setAttribute("aria-current","step"); else el.removeAttribute("aria-current");
    });
    this.renderProfile();
    if (this.session) {
      $("hud-avatar").textContent = this.avatars[this.session.avatar];
      $("hud-name").textContent = this.session.name;
      $("result-avatar").textContent = this.avatars[this.session.avatar];
      $("result-name").textContent = this.session.name;
      $("result-accuracy").textContent = (this.session.score/3*100).toFixed(this.session.score%3?1:0) + "%";
      $("result-score").textContent = this.session.score + " / 3";
      $("result-time").textContent = this.seconds(this.session.elapsedMs) + " s";
      $("result-average").textContent = this.seconds(this.session.elapsedMs/3) + " s";
    }
    this.renderTimer();
    this.renderBoard();
    this.classroom.render();
  }
  escape(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }
  accuracy(score) { return (score/3*100).toFixed(score%3?1:0) + "%"; }
  async refreshBoard() {
    if (this.boardBusy) { this.boardPending = true; return; }
    this.boardBusy = true;
    this.$("board-refresh").disabled = true;
    const mode = this.mode;
    try {
      const data = await this.api("/api/leaderboard?mode=" + mode);
      if (mode === this.mode) {
        this.boardData = data;
        this.boardError = false;
      }
    } catch {
      if (mode === this.mode) this.boardError = true;
    } finally {
      this.boardBusy = false;
      this.$("board-refresh").disabled = false;
      this.renderBoard();
      if (this.boardPending) { this.boardPending = false; this.refreshBoard(); }
    }
  }
  renderBoard() {
    const $ = this.$, t = this.t;
    document.querySelectorAll("[data-board-mode]").forEach(button => button.setAttribute("aria-pressed",String(button.dataset.boardMode === this.mode)));
    $("board-rule").textContent = t("boardRule_" + this.mode);
    $("board-status").textContent = t(this.boardError ? "boardOffline" : "boardLive");
    $("board-status").classList.toggle("offline", this.boardError);
    const data = this.boardData;
    $("board-empty").hidden = Boolean(data?.entries.length);
    $("board-empty").textContent = t(this.boardError && !data ? "boardError" : data ? "boardEmpty" : "boardLoading");
    $("board-table-wrap").hidden = !data?.entries.length;
    $("podium").hidden = !data?.entries.length;
    $("board-total").textContent = data ? t("boardCount", {n:data.total}) : "";
    $("board-updated").textContent = data ? t(this.boardError ? "boardStale" : "boardUpdated",{time:new Date(data.updatedAt).toLocaleTimeString(document.documentElement.lang,{hour12:false})}) : "";
    if (!data) { $("own-rank").hidden = true; return; }
    const ownId = this.session?.publicId;
    const avatars = this.avatars;
    $("podium").dataset.count = Math.min(data.entries.length, 3);
    $("podium").innerHTML = data.entries.slice(0,3).map((entry,i) => `<article class="podium-card"><div class="podium-place">${i===0?"✦ ":""}${t("rankLabel",{n:entry.rank})}</div><span class="avatar-icon" aria-hidden="true">${avatars[entry.avatar] ?? "🤖"}</span><strong>${this.escape(entry.name)}</strong><p><b>${this.accuracy(entry.score)}</b> · ${this.seconds(entry.elapsedMs)} s</p><small>${t("correctCount",{n:entry.score})}</small></article>`).join("");
    $("board-rows").innerHTML = data.entries.map(entry => `<tr class="${entry.publicId===ownId?"is-me":""}"><td>${entry.rank}</td><td><span class="table-player"><span class="avatar-icon" aria-hidden="true">${avatars[entry.avatar] ?? "🤖"}</span><span>${this.escape(entry.name)}${entry.publicId===ownId?` <span class="me-tag">${t("yourRun")}</span>`:""}</span></span></td><td class="accuracy">${this.accuracy(entry.score)} <small>(${entry.score}/3)</small></td><td>${this.seconds(entry.elapsedMs)} s</td><td>${this.seconds(entry.elapsedMs/3)} s</td></tr>`).join("");
    $("own-rank").hidden = !data.own;
    if(data.own) $("own-rank").textContent = t("yourRanking",{n:data.own.rank,total:data.total});
  }
}
