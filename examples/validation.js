#!/usr/bin/env node

import checkboxSearch from '../dist/esm/index.js';

const teamMembers = [
  { value: 'alice', name: 'Alice Johnson', description: 'Frontend Developer' },
  { value: 'bob', name: 'Bob Smith', description: 'Backend Developer' },
  { value: 'carol', name: 'Carol Williams', description: 'UI/UX Designer' },
  { value: 'david', name: 'David Brown', description: 'DevOps Engineer' },
  { value: 'eve', name: 'Eve Davis', description: 'Product Manager' },
  { value: 'frank', name: 'Frank Miller', description: 'QA Engineer' },
];

async function main() {
  console.log('✅ Validation Example\n');
  console.log('💡 Select 2-4 team members for the project\n');

  const selected = await checkboxSearch({
    message: 'Select team members (2-4):',
    choices: teamMembers,
    default: ['alice', 'bob'], // Pre-select Alice and Bob
    required: true,
    validate: (selection) => {
      if (selection.length < 2) {
        return 'Please select at least 2 team members';
      }
      if (selection.length > 4) {
        return 'Please select no more than 4 team members';
      }
      return true;
    },
  });

  console.log('\n✅ Team assembled successfully!');
  console.log('👥 Your team:');
  selected.forEach((memberValue) => {
    const member = teamMembers.find((m) => m.value === memberValue);
    if (member) {
      console.log(`  🧑‍💻 ${member.name} - ${member.description}`);
    }
  });

  console.log(`\n📊 Team size: ${selected.length} members`);
}

main().catch(console.error);
