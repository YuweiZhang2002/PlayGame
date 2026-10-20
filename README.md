# 抽球猜颜色 · Probability Club

一个可直接玩的中英文条件概率课堂小游戏。A small, bilingual classroom game about conditional probability.

## Play / 开始游戏

Open `dist/index.html` in a modern browser. No installation, build step, external libraries, or network connection is required.

直接用浏览器打开 `dist/index.html` 即可。右上角的 **EN / 中文** 按钮切换语言，保留本轮答案、抽球结果和分数。浏览器只在本地保存语言偏好；刷新页面会重新开始游戏。

For a local web server / 本地预览：

```sh
python3 -m http.server 8765 --directory dist
```

Then open `http://localhost:8765`.

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

Below the game, switch between the three conditions to see the eligible set **B** and the orange intersection **A ∩ B**. The ball diagram, numerator, denominator, and worked formula update together. This exploration does not change the game score.

游戏下方提供中英文可视化讲解：切换条件，观察范围 B 和交集 A ∩ B，并把球数对应到条件概率公式：

```text
P(A | B) = P(A ∩ B) / P(B), where P(B) > 0

All balls / 所有球:     (4/8) / (8/8) = 1/2
Starred / 带星星:       (3/8) / (4/8) = 3/4
No stars / 不带星星:    (1/8) / (4/8) = 1/4
```

The guide explains why probabilities are first calculated over the original eight equally likely balls, why the denominator changes after conditioning, and how joint probability differs from conditional probability.

## Checks / 检查

```sh
node test.cjs
```

Tests cover ball counts, all three probabilities, eligible draw intervals, duplicate-answer protection, scoring, reset state, language-key parity, and JavaScript syntax.

Browser checks cover correct and incorrect answers, all three rounds, mid-game language switching, translated instructions, the results screen, and replay.

## Files / 文件

- `dist/index.html`: self-contained game, styles, and both languages.
- `test.cjs`: dependency-free Node.js tests.

Publish the contents of `dist/` using any static hosting service. The game does not require a backend.
