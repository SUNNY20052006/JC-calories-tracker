// Run with Node 22.13+ after npm install. Gemini responses are fixtures and no network is used.
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
require.cache[require.resolve('../services/ApiKeyService.ts')] = {
  exports: { getPersonalApiKey: async () => 'fixture-key' },
};

const { initializeDatabase } = require('../database/DatabaseService.ts');
const { analyzeFoodWithGemini } = require('../services/GeminiFoodAnalysisService.ts');
const { analyzeTextMeal, rememberTextMeal } = require('../services/TextMealAnalysisService.ts');

const breakfast = [
  ['200 g banana', 1], ['2 eggs and 2 rotis', 2], ['black coffee and toast', 2],
  ['150 g apple', 1], ['1 bowl poha with peanuts', 2], ['200 g cooked white rice', 1],
  ['2 idlis and sambar', 2],
];
const lunch = [
  ['rice with chicken', 2], ['fried rice with chicken', 2],
  ['dal with two rotis', 2], ['paneer bhurji with roti', 2],
];
const dinners = [
  ['rice with chicken', 2], ['two chapatis and dal', 2], ['vegetable upma with curd', 2],
  ['fish curry and rice', 2], ['moong dal khichdi with curd', 2], ['glass of plain buttermilk', 1],
  ['chana masala and roti', 2],
];
const recipe = '400 g paneer, 150 g spinach, 100 g onion, 200 g tomato, and 20 g oil. Simmer everything together.';
const recipeMeal = '1 serving homemade spinach paneer curry';

function mealsForDay(day) {
  const weekday = day % 7;
  const [morning, morningItems] = breakfast[weekday];
  const [midday, middayItems] = lunch[day % lunch.length];
  const [evening, eveningItems] = dinners[weekday];
  return [
    { text: morning, items: morningItems, oil: 100 },
    [1, 3, 6].includes(weekday)
      ? { text: '', items: 0, oil: 100, savedRecipe: true }
      : { text: midday, items: middayItems, oil: day % 11 === 0 ? 125 : 100 },
    [0, 2, 4].includes(weekday)
      ? { text: `${100 + day} g roasted vegetables and ${90 + day} g grilled chicken`, items: 2, oil: 100 }
      : { text: evening, items: eveningItems, oil: 100, savedRecipe: weekday === 5 },
  ];
}

function fixtureReply(count) {
  const names = ['Cooked rice', 'Chicken breast', 'Spinach', 'Onion', 'Cooking oil'];
  const foodItems = Array.from({ length: count }, (_, index) => ({
    name: names[index % names.length],
    preparation: 'cooked',
    quantity: '100 g',
    estimatedWeightGrams: 100,
    calories: 145,
    protein: 8,
    carbs: 20,
    fat: 4,
  }));
  return JSON.stringify({ foodItems, calories: 145 * count, protein: 8 * count, carbs: 20 * count, fat: 4 * count });
}

function openDatabase() {
  const sql = new DatabaseSync(':memory:');
  return {
    close: () => sql.close(),
    execAsync: async text => sql.exec(text),
    getFirstAsync: async (text, ...args) => sql.prepare(text).get(...args),
    getAllAsync: async (text, ...args) => sql.prepare(text).all(...args),
    runAsync: async (text, ...args) => sql.prepare(text).run(...args),
  };
}

async function replay(optimized) {
  const db = openDatabase();
  const originalFetch = global.fetch;
  const metrics = { calls: 0, inputChars: 0, outputChars: 0, cacheHits: 0, local: 0, recipeReuses: 0, recipeAnalyses: 0 };
  let itemCount = 1;
  let recipeCreated = false;
  const checkpoints = {};

  global.fetch = async (url, { body }) => {
    if (!url.startsWith('https://generativelanguage.googleapis.com/')) {
      throw new Error('Unexpected request in offline replay');
    }
    const request = JSON.parse(body);
    const response = fixtureReply(itemCount);
    metrics.calls++;
    metrics.inputChars += [...request.contents[0].parts[0].text].length;
    metrics.outputChars += [...response].length;
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: response }] } }] }) };
  };

  try {
    await initializeDatabase(db);
    for (let day = 0; day < 365; day++) {
      for (const meal of mealsForDay(day)) {
        if (!optimized) {
          itemCount = meal.items + (meal.savedRecipe ? 1 : 0);
          const description = [meal.text, meal.savedRecipe && recipeMeal].filter(Boolean).join(' and ');
          await analyzeFoodWithGemini(db, description, meal.oil);
          continue;
        }
        if (meal.savedRecipe) {
          if (!recipeCreated) {
            itemCount = 5;
            await analyzeFoodWithGemini(db, recipe, 100, true);
            metrics.recipeAnalyses++;
            recipeCreated = true;
          }
          metrics.recipeReuses++;
        }
        if (!meal.text) continue;
        itemCount = meal.items;
        const result = await analyzeTextMeal(db, meal.text, meal.oil);
        if (result.source === 'cache') metrics.cacheHits++;
        if (result.source === 'database') metrics.local++;
        if (result.source === 'fallback') throw new Error('Fixture should never need fallback analysis');
        await rememberTextMeal(db, meal.text, meal.oil, result);
      }
      if ([1, 7, 30, 365].includes(day + 1)) checkpoints[day + 1] = { ...metrics };
    }
    return checkpoints;
  } finally {
    global.fetch = originalFetch;
    db.close();
  }
}

async function main() {
  const baseline = await replay(false);
  const optimized = await replay(true);
  console.log(JSON.stringify({ baseline, optimized }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
