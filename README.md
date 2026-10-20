# 抽球猜颜色 · Probability Club

一个可直接玩的中英文条件概率课堂小游戏。A small, bilingual classroom game about conditional probability.

## Play / 开始游戏

Public site: https://probability-detective-20261020.yuweizhang2002.chatgpt.site/

The bilingual game now uses a shared D1 database and a Vinext/Cloudflare Worker backend. Open the hosted site to play; opening the HTML file directly does not provide sessions or rankings.

游戏流程：阅读并确认规则 → 自选 12 个头像之一、输入昵称 → 点击开始并计时 → 完成三题 → 查看成绩和共享排行榜 → 解锁独立讲解页。

昵称为 1–20 字，并与头像、完成成绩一起公开展示。头像可自行选择或随机选择。右上角切换中英文，保留进度和计时。刷新可恢复当前挑战，已提交答案无法修改。

## Leaderboard / 共享排行榜

- **Overall / 综合榜**: accuracy descending, then total time ascending; identical accuracy and time share a rank.
- **Accuracy / 正确率榜**: accuracy descending; equal accuracy shares a rank, faster runs displayed first.
- **Speed / 速度榜**: total time ascending; equal times share a rank. Accuracy is displayed alongside time.

Each completed run is a separate entry. The top 50 are shown, plus the current player's rank even outside the top 50. Incomplete attempts are excluded. Visible results refresh every 5 seconds; refresh and connection errors are shown explicitly. There are no demo scores in production.

计时由服务器记录：从创建游戏到服务器收到最后一题，包含抽球展示、两题间切换和网络传输时间。每题平均用时 = 总用时 ÷ 3。正确率按首次提交的答案计算；重复提交不会重复计分或改变完成时间。

`/lesson` checks for a completed attempt on the server before displaying the visual explanation. This is a casual classroom activity with player nicknames, not a verified-identity examination system. Each browser's current game is stored in an HttpOnly, SameSite session cookie (24-hour lifetime); language preference stays in local storage.

## Rules / 游戏规则

The bag contains 8 balls: 4 orange and 4 blue. Three orange balls and one blue ball have a star.

| Round / 轮次 | Eligible balls / 参与抽取的球 | P(orange) / 橙色概率 |
| --- | --- | --- |
| 1 | All balls / 所有球 | 4/8 = 1/2 |
| 2 | Starred balls / 带星星 | 3/4 |
| 3 | Balls without stars / 不带星星 | 1/4 |

Choose one of three probabilities each round. A correct first answer earns 1 point; the maximum score is 3. After answering, one eligible ball is sampled uniformly at random. The drawn color does not affect the score. Every round starts with the full bag.

每轮选择一个概率，答对得 1 分，满分 3 分。作答后从符合条件的球中等概率抽取一颗，抽取结果不影响得分。每轮放回全部球。

Correct answers trigger colorful confetti, a soft glow, and a +1 badge. Incorrect answers trigger a gentle card shake, an amber ripple, and an encouraging prompt. Effects do not block interaction and respect the system's reduced-motion preference.

答对时会撒下彩纸、亮起柔和光晕并显示 +1；答错时答案卡会轻晃，出现橙色波纹和鼓励提示。特效不阻挡操作，并遵循系统的减少动态效果设置。

The final recap explains the key idea: calculate the proportion of orange balls **among only the balls that meet the condition**.

## Visual explanation / 可视化讲解

After completing the game, open the independent `/lesson` page and switch between the three conditions to see the eligible set **B** and the orange intersection **A ∩ B**. The ball diagram, numerator, denominator, and worked formula update together. This exploration does not change the game score.

通关后解锁中英文可视化讲解：切换条件，观察范围 B 和交集 A ∩ B，并把球数对应到条件概率公式：

```text
P(A | B) = P(A ∩ B) / P(B), where P(B) > 0

All balls / 所有球:     (4/8) / (8/8) = 1/2
Starred / 带星星:       (3/8) / (4/8) = 3/4
No stars / 不带星星:    (1/8) / (4/8) = 1/4
```

The guide explains why probabilities are first calculated over the original eight equally likely balls, why the denominator changes after conditioning, and how joint probability differs from conditional probability.

## Group 12 classroom flow / 课堂流程

The left navigation follows a 16-minute lesson: introduction (2.5 min), rules (2.5 min), game and large-bag prediction (3 min), concept and formula (5 min), and a weather check (3 min). On narrow screens the outline collapses into a menu.

After the three scored rounds, learners predict the orange probability among starred balls in a hypothetical 10,000-ball bag: `P(B) = 0.40`, `P(A ∩ B) = 0.24`. The lesson revisits that question and rescales the visual probability bar to show `0.24 / 0.40 = 60%`. The ball cloud is explicitly a schematic, not an inventory.

Revealing that solution unlocks the weather check, using hypothetical data `P(C) = 0.50` and `P(R ∩ C) = 0.20`, giving `P(R | C) = 40%`. Both teaching questions are untimed and unscored. Their answers and reveal state stay in this tab's session storage, keyed to the game attempt; they do not change the server leaderboard.

The English speech and slide deck are separate teaching documents, not website routes or public assets.

## Local development / 本地运行

Requires Node.js 22.13+ and npm.

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mean_deathstrike.sql
npm run dev -- --hostname 127.0.0.1 --port 5173
```

Apply a local migration only once. Local preview data is separate from the hosted leaderboard. Schema migrations are generated with `npm run db:generate`; Sites applies pending hosted migrations during publication.

## Checks / 检查

```sh
node test.cjs
node test-server.mjs
npm run build
```

Tests cover conditional probabilities and formula derivations, uniform draws, translations, syntax, server-side scoring and timing, duplicate/concurrent submissions, session recovery, validation, completed-only rankings and ties. Browser checks cover onboarding, avatar selection, both languages, gameplay, refresh recovery, live rankings across independent sessions, and the lesson gate.

## Files / 文件

- `web/index.html`: game, bilingual copy and visual explanation.
- `public/arcade.css`: responsive neon arcade theme.
- `public/flow.js`: onboarding, session recovery, timer and leaderboard UI.
- `public/classroom.js`, `public/classroom.css`: bilingual course outline, introduction, large-bag prediction, formula application and weather check.
- `server/game.mjs`: scoring, sessions and leaderboard API.
- `app/`: HTML and API route handlers, including the gated lesson route.
- `db/schema.ts`, `drizzle/`: durable database schema and migrations.
- `.openai/hosting.json`: original Site identity and D1 binding.
- `dist/`: generated Worker deployment, excluded from source control.
