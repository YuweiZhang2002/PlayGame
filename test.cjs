const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const html = fs.readFileSync("web/index.html", "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(html.match(/<script id="game-engine">([\s\S]*?)<\/script>/)[1] + "\nglobalThis.game = BallGame;", context);
const game = context.game;
assert.equal(game.balls.length, 8);
assert.equal(game.balls.filter(b => b.color === "orange").length, 4);
assert.equal(game.balls.filter(b => b.star && b.color === "orange").length, 3);
assert.equal(game.balls.filter(b => b.star && b.color === "blue").length, 1);
const expected = [0.5, 0.75, 0.25];
const explanationCases = [
  {eligible:8,overlap:4,joint:0.5,condition:1},
  {eligible:4,overlap:3,joint:0.375,condition:0.5},
  {eligible:4,overlap:1,joint:0.125,condition:0.5}
];
expected.forEach((probability, round) => {
  assert.equal(game.probability(round), probability);
  const explanation=game.explanation(round),expectedExplanation=explanationCases[round];
  assert.equal(explanation.total,8);
  assert.equal(explanation.eligible.length,expectedExplanation.eligible);
  assert.equal(explanation.overlap.length,expectedExplanation.overlap);
  assert.equal(explanation.jointProbability,expectedExplanation.joint);
  assert.equal(explanation.conditionProbability,expectedExplanation.condition);
  assert.equal(explanation.jointProbability/explanation.conditionProbability,probability,"The illustrated formula must agree with the actual game probability");
  const eligible = game.pool(round);
  const counts = {};
  // Deterministic stratified inputs verify every draw interval and the filter.
  for (let i = 0; i < 800; i++) {
    const draw = game.draw(round, () => (i + 0.5) / 800);
    assert.ok(game.rounds[round].accept(draw));
    counts[draw.id] = (counts[draw.id] || 0) + 1;
  }
  eligible.forEach(b => assert.equal(counts[b.id], 800 / eligible.length));
  assert.equal(game.draw(round, () => 0).id, eligible[0].id);
  assert.equal(game.draw(round, () => 1 - Number.EPSILON).id, eligible.at(-1).id);
});
const perfect = game.createState();
expected.forEach((answer, round) => {
  perfect.round = round;
  perfect.answered = false;
  assert.equal(game.answer(perfect, answer), true);
  assert.equal(game.answer(perfect, answer), null, "Duplicate answer must not award points");
});
assert.equal(perfect.score, 3);
assert.equal(perfect.results.length, 3);
const wrong = game.createState();
assert.equal(game.answer(wrong, 0.25), false);
assert.equal(wrong.score, 0);
assert.equal(game.answer(wrong, 0.5), null, "A wrong answer cannot be retried for points");
const fresh = game.createState();
assert.equal(fresh.score, 0);
assert.equal(fresh.answered, false);
assert.equal(game.answer(fresh, 0.9), null);
for (const script of html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
new vm.Script(fs.readFileSync("public/flow.js", "utf8"));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, "Every UI element must have a unique ID");
vm.runInContext(html.match(/<script id="translations">([\s\S]*?)<\/script>/)[1] + "\nglobalThis.copy = TRANSLATIONS;", context);
vm.runInContext(fs.readFileSync("public/classroom.js", "utf8"), context);
assert.deepEqual(Object.keys(context.copy.zh).sort(), Object.keys(context.copy.en).sort());
for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) {
  assert.equal(typeof context.copy.zh[match[1]], "string", `Missing Chinese copy: ${match[1]}`);
  assert.equal(typeof context.copy.en[match[1]], "string", `Missing English copy: ${match[1]}`);
}
for (const locale of ["zh", "en"]) {
  assert.equal(context.copy[locale].clues.length, 3);
  assert.equal(context.copy[locale].explanations.length, 3);
  assert.equal(context.copy[locale].summaryTitles.length, 4);
  assert.equal(context.copy[locale].eventBs.length, 3);
  assert.equal(context.copy[locale].eventIntersections.length, 3);
  assert.equal(context.copy[locale].lessonMembership.length, 3);
  assert.equal(context.copy[locale].avatarNames.length, 12);
}
console.log("PASS: ball counts, conditional probabilities and illustrated derivations, uniform eligible draws, score locking, reset, translation coverage, and JavaScript syntax.");
