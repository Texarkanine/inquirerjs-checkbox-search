#!/usr/bin/env node

// Import from built distribution
import checkboxSearch from '../dist/esm/index.js';

// 🍎 REAL Fruit Database with ONLY actual emoji for real fruits!
const fruits = [
  // 🍎 Core fruit emoji (actual emoji for real fruits)
  { name: 'Apple', value: 'apple', emoji: '🍎' },
  { name: 'Green Apple', value: 'green-apple', emoji: '🍏' },
  { name: 'Banana', value: 'banana', emoji: '🍌' },
  { name: 'Orange', value: 'orange', emoji: '🍊' },
  { name: 'Lemon', value: 'lemon', emoji: '🍋' },
  { name: 'Watermelon', value: 'watermelon', emoji: '🍉' },
  { name: 'Melon', value: 'melon', emoji: '🍈' },
  { name: 'Grape', value: 'grape', emoji: '🍇' },
  { name: 'Strawberry', value: 'strawberry', emoji: '🍓' },
  { name: 'Cherry', value: 'cherry', emoji: '🍒' },
  { name: 'Peach', value: 'peach', emoji: '🍑' },
  { name: 'Pear', value: 'pear', emoji: '🍐' },
  { name: 'Pineapple', value: 'pineapple', emoji: '🍍' },
  { name: 'Kiwi', value: 'kiwi', emoji: '🥝' },
  { name: 'Mango', value: 'mango', emoji: '🥭' },
  { name: 'Avocado', value: 'avocado', emoji: '🥑' },
  { name: 'Coconut', value: 'coconut', emoji: '🥥' },
  { name: 'Blueberry', value: 'blueberry', emoji: '🫐' },
  { name: 'Olive', value: 'olive', emoji: '🫒' },

  // 🍅 The tomato joke (since it has its own emoji!)
  {
    name: 'Tomato',
    value: 'tomato',
    emoji: '🍅',
    description: 'Technically a fruit! 😉🍅',
  },

  // 🌶️ Other "vegetables" that are botanically fruits (with real emoji)
  { name: 'Eggplant', value: 'eggplant', emoji: '🍆' },
  { name: 'Bell Pepper', value: 'bell-pepper', emoji: '🫑' },
  { name: 'Hot Pepper', value: 'hot-pepper', emoji: '🌶️' },
  { name: 'Cucumber', value: 'cucumber', emoji: '🥒' },

  // 🌰 Nuts (technically fruits with real emoji)
  { name: 'Chestnut', value: 'chestnut', emoji: '🌰' },
  {
    name: 'Peanut',
    value: 'peanut',
    emoji: '🥜',
    description: "Technically a legume, but we'll allow it! 🥜",
  },
];

console.log('🍎 Welcome to the REAL Fruit Emoji Demo! 🍎');
console.log(`🎉 Choose from ${fruits.length} fruits with authentic emoji! 🎉`);
console.log('Search for fruits and use Tab to select them.\n');

const selectedFruits = await checkboxSearch({
  message: '🔍 Search and select your favorite fruits:',
  choices: fruits.map((fruit) => ({
    name: fruit.name,
    value: fruit.value,
    description:
      fruit.description || `Add delicious ${fruit.emoji} to your basket`,
  })),

  // 🎨 Enhanced theming for the authentic fruit experience
  theme: {
    icon: {
      // NEW: Function-based icons that include the fruit name!
      checked: (text) => `✅ ${text}`,
      unchecked: (text) => `⬜ ${text}`,
      cursor: (text) => `👉 ${text}`,
    },
    style: {
      // Beautiful description styling
      description: (text) => `💭 ${text}`,

      // Custom message styling
      message: (text) => `🌟 ${text}`,

      // Search input styling
      searchTerm: (text) => `🔍 "${text}"`,

      // Help text styling
      help: (text) => `💡 ${text}`,

      // Loading state styling
      // loading: (text) => `⏳ ${text}`,

      // Error styling
      error: (text) => `❌ ${text}`,

      // Disabled choice styling
      disabled: (text) => `🚫 ${text}`,
      // disabledReason: (text) => `(${text})`
    },
  },

  // Custom help instructions
  instructions:
    'Type to search • Tab to select • Enter to confirm • ↑↓ Navigate',
});

// 🎉 Display the results with authentic emoji!
console.log('\n🎉 You selected these amazing fruits:');

if (selectedFruits.length === 0) {
  console.log("🤷 No fruits selected. Maybe you're on a diet? 😄");
} else {
  // Create a mapping for quick emoji lookup
  const fruitEmojis = Object.fromEntries(
    fruits.map((fruit) => [fruit.value, fruit.emoji]),
  );

  // Display fruit names
  console.log('\n📝 Selected fruits:');
  selectedFruits.forEach((fruit, index) => {
    const fruitData = fruits.find((f) => f.value === fruit);
    console.log(
      `   ${index + 1}. ${fruitData?.name || fruit} ${fruitData?.emoji || '🍎'}`,
    );
  });

  // Display emoji fruit salad
  const emojiLine = selectedFruits
    .map((fruit) => fruitEmojis[fruit] || '🍎')
    .join(' ');

  console.log('\n🥗 Your authentic fruit salad:');
  console.log(`   ${emojiLine}`);

  // Fun fruit facts for the "vegetables" that are actually fruits
  const hasVeggiesFruits = selectedFruits.some((f) =>
    ['tomato', 'eggplant', 'bell-pepper', 'hot-pepper', 'cucumber'].includes(f),
  );

  if (hasVeggiesFruits) {
    console.log(
      '\n🤓 Fun fact: You selected some "vegetables" that are actually fruits!',
    );
  }

  // Special tomato joke
  if (selectedFruits.includes('tomato')) {
    console.log(
      '🍅 The eternal question: Is a tomato a fruit or vegetable? Science says fruit! 🍅',
    );
  }

  console.log(
    `\n🎊 Enjoy your ${selectedFruits.length} delicious fruit${selectedFruits.length === 1 ? '' : 's'}!`,
  );
}

console.log('\n✨ Thanks for trying the real emoji fruit demo! ✨');
