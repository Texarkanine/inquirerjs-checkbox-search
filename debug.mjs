import { render } from '@inquirer/testing';
import checkboxSearch from './dist/esm/index.js';

async function test() {
  const { events, getScreen } = await render(checkboxSearch, {
    message: 'Test',
    choices: ['Apple', 'Banana']
  });
  
  console.log('Initial screen:');
  console.log(getScreen());
  
  console.log('\nPressing tab...');
  events.keypress('tab');
  
  console.log('Screen after tab:');
  console.log(getScreen());
}

test().catch(console.error); 