#!/usr/bin/env node

import checkboxSearch from 'inquirerjs-checkbox-search';

// Sample data with descriptions of varying lengths
const choices = [
  { value: 'apple', name: 'Apple', description: 'Crisp and sweet red fruit' },
  {
    value: 'banana',
    name: 'Banana',
    description:
      'Yellow tropical fruit\nRich in potassium\nGreat for smoothies',
  },
  {
    value: 'orange',
    name: 'Orange',
    description: 'Citrus fruit high in vitamin C',
  },
  {
    value: 'grape',
    name: 'Grape',
    description:
      'Small round fruit\nComes in red, green, or purple\nPerfect for snacking or wine',
  },
  {
    value: 'strawberry',
    name: 'Strawberry',
    description: 'Sweet red berry with seeds on the outside',
  },
  {
    value: 'blueberry',
    name: 'Blueberry',
    description: 'Small antioxidant-rich berry',
  },
  {
    value: 'cherry',
    name: 'Cherry',
    description: 'Small stone fruit\nCan be sweet or tart\nGreat in desserts',
  },
  {
    value: 'peach',
    name: 'Peach',
    description: 'Fuzzy stone fruit with sweet flesh',
  },
  { value: 'plum', name: 'Plum', description: 'Purple or red stone fruit' },
  {
    value: 'kiwi',
    name: 'Kiwi',
    description: 'Brown fuzzy fruit with green flesh inside',
  },
  {
    value: 'mango',
    name: 'Mango',
    description:
      'Tropical stone fruit\nSweet and juicy\nHigh in vitamins A and C\nGreat in smoothies and salads',
  },
  {
    value: 'pineapple',
    name: 'Pineapple',
    description: 'Spiky tropical fruit with sweet interior',
  },
  {
    value: 'watermelon',
    name: 'Watermelon',
    description: 'Large summer fruit\nMostly water\nRefreshing and hydrating',
  },
  {
    value: 'cantaloupe',
    name: 'Cantaloupe',
    description: 'Orange melon with sweet flesh',
  },
  {
    value: 'honeydew',
    name: 'Honeydew',
    description: 'Green melon with pale sweet flesh',
  },
  {
    value: 'papaya',
    name: 'Papaya',
    description: 'Tropical fruit rich in enzymes',
  },
  {
    value: 'coconut',
    name: 'Coconut',
    description:
      'Hard-shelled tropical fruit\nContains coconut water and meat\nUsed in many cuisines',
  },
  {
    value: 'passion-fruit',
    name: 'Passion Fruit',
    description: 'Small wrinkled fruit with intense flavor',
  },
  {
    value: 'dragon-fruit',
    name: 'Dragon Fruit',
    description: 'Exotic fruit with white flesh and black seeds',
  },
  {
    value: 'lychee',
    name: 'Lychee',
    description: 'Small Asian fruit with translucent flesh',
  },
  {
    value: 'rambutan',
    name: 'Rambutan',
    description: 'Spiky red fruit similar to lychee',
  },
  {
    value: 'jackfruit',
    name: 'Jackfruit',
    description:
      'Large tropical fruit\nCan be used as meat substitute\nSweet when ripe',
  },
  {
    value: 'durian',
    name: 'Durian',
    description:
      'Strong-smelling tropical fruit\nKnown as "king of fruits"\nCreamy texture',
  },
  {
    value: 'pomegranate',
    name: 'Pomegranate',
    description: 'Red fruit with antioxidant-rich seeds',
  },
  {
    value: 'persimmon',
    name: 'Persimmon',
    description: 'Orange fruit that becomes very sweet when ripe',
  },
  {
    value: 'fig',
    name: 'Fig',
    description: 'Sweet fruit with tiny seeds\nCan be eaten fresh or dried',
  },
  {
    value: 'date',
    name: 'Date',
    description: 'Sweet dried fruit from date palms',
  },
  {
    value: 'cranberry',
    name: 'Cranberry',
    description: 'Tart red berry\nOften used in sauces and juices',
  },
  {
    value: 'blackberry',
    name: 'Blackberry',
    description: 'Dark purple aggregate berry',
  },
  {
    value: 'raspberry',
    name: 'Raspberry',
    description: 'Red or black aggregate berry\nFragile and sweet-tart',
  },
  {
    value: 'gooseberry',
    name: 'Gooseberry',
    description: 'Small tart berry\nGreen or red varieties',
  },
];

async function demoPageSizeConfiguration() {
  console.log('🍎 PageSize Configuration Demo\n');

  // Demo 1: Simple number (backward compatibility)
  console.log('1️⃣  Traditional numeric pageSize (backward compatible):');
  const result1 = await checkboxSearch({
    message: 'Select fruits (pageSize: 5)',
    choices,
    pageSize: 5,
  });
  console.log(
    'Selected:',
    result1.map((val) => choices.find((c) => c.value === val)?.name).join(', '),
  );
  console.log();

  // Demo 2: Basic PageSizeConfig with base
  console.log('2️⃣  PageSizeConfig with base pageSize:');
  const result2 = await checkboxSearch({
    message: 'Select fruits (base: 6, buffer: 2)',
    choices,
    pageSize: {
      base: 6,
      buffer: 2, // Reserve 2 extra lines
    },
  });
  console.log(
    'Selected:',
    result2.map((val) => choices.find((c) => c.value === val)?.name).join(', '),
  );
  console.log();

  // Demo 3: Auto-buffering for descriptions
  console.log(
    '3️⃣  Auto-buffer for descriptions (will reserve space for largest description):',
  );
  const result3 = await checkboxSearch({
    message: 'Select fruits (auto-buffering descriptions)',
    choices,
    pageSize: {
      base: 8,
      autoBufferDescriptions: true, // Automatically reserve space for descriptions
    },
  });
  console.log(
    'Selected:',
    result3.map((val) => choices.find((c) => c.value === val)?.name).join(', '),
  );
  console.log();

  // Demo 4: Complex configuration with min/max constraints
  console.log('4️⃣  Complex configuration with min/max constraints:');
  const result4 = await checkboxSearch({
    message: 'Select fruits (complex config)',
    choices,
    pageSize: {
      base: 10,
      autoBufferDescriptions: true,
      minBuffer: 3, // Always reserve at least 3 lines
      min: 3, // Never show fewer than 3 items
      max: 7, // Never show more than 7 items
    },
  });
  console.log(
    'Selected:',
    result4.map((val) => choices.find((c) => c.value === val)?.name).join(', '),
  );
  console.log();

  // Demo 5: Auto-calculation with constraints
  console.log('5️⃣  Auto-calculated base with constraints:');
  const result5 = await checkboxSearch({
    message: 'Select fruits (auto-calculated base)',
    choices,
    pageSize: {
      // No base specified - will auto-calculate from terminal height
      autoBufferDescriptions: true,
      max: 6, // Cap at 6 items max
      minBuffer: 2, // Always reserve at least 2 lines
    },
  });
  console.log(
    'Selected:',
    result5.map((val) => choices.find((c) => c.value === val)?.name).join(', '),
  );
  console.log();

  // Demo 6: Many items with auto-buffering (no max constraint)
  console.log(
    '6️⃣  Many items with auto-buffering (fills terminal with reserved space):',
  );

  const result6 = await checkboxSearch({
    message: 'Select fruits (many items, auto-buffering, no max limit)',
    choices,
    pageSize: {
      // No base specified - auto-calculate to fill terminal
      // No max specified - allow full terminal height usage
      autoBufferDescriptions: true, // Reserve space for descriptions
      minBuffer: 1, // Ensure at least 1 line reserved
    },
  });
  console.log(
    'Selected:',
    result6.map((val) => choices.find((c) => c.value === val)?.name).join(', '),
  );
  console.log();

  // Demo 7: Line-width counting for auto-buffering
  console.log(
    '7️⃣  Auto-buffering with line-width counting (handles long text wrapping):',
  );

  // Create choices with 10x longer descriptions based on existing fruits
  const longDescriptionChoices = choices.slice(0, 8).map((choice) => ({
    ...choice,
    description: choice.description
      ? choice.description
          .split('\n') // Split into individual lines
          .map((line) => `${line} `.repeat(10).trim()) // Repeat each line 10 times
          .join('\n') // Join lines back together
      : 'This item has an extremely long description that was generated by repeating the original text multiple times to demonstrate how the auto-buffering system handles very long descriptions that will definitely wrap across multiple lines in most standard terminal windows.',
  }));

  console.log(
    "\n🔄 First, let's see WITHOUT line-width counting (autoBufferCountsLineWidth: false):",
  );
  const result7a = await checkboxSearch({
    message: 'Select items (auto-buffering WITHOUT line-width counting)',
    choices: longDescriptionChoices,
    pageSize: {
      autoBufferDescriptions: true,
      autoBufferCountsLineWidth: false, // Only count \\n characters
    },
  });

  console.log(
    "\n🔄 Now, let's see WITH line-width counting (autoBufferCountsLineWidth: true):",
  );
  const result7b = await checkboxSearch({
    message: 'Select items (auto-buffering WITH line-width counting)',
    choices: longDescriptionChoices,
    pageSize: {
      autoBufferDescriptions: true,
      autoBufferCountsLineWidth: true, // Consider terminal width for wrapping
    },
  });

  console.log(
    'Selected (without line-width):',
    result7a
      .map((val) => longDescriptionChoices.find((c) => c.value === val)?.name)
      .join(', '),
  );
  console.log(
    'Selected (with line-width):',
    result7b
      .map((val) => longDescriptionChoices.find((c) => c.value === val)?.name)
      .join(', '),
  );
  console.log();

  console.log(
    '✅ Demo complete! Notice how Demo 6 fills your terminal but reserves space at the bottom for descriptions.',
  );
  console.log(
    '💡 The auto-buffering prevents UI jumping when navigating through items with varying description lengths.',
  );
  console.log(
    '📏 Demo 7 shows how line-width counting provides more accurate buffering for long text that wraps.',
  );
}

// Run the demo
demoPageSizeConfiguration().catch(console.error);
