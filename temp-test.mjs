import { render } from '@inquirer/testing';
import checkboxSearch from './dist/esm/index.js';

async function test() {
  try {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Test',
      choices: ['Apple', 'Banana']
    });
    
    console.log('Initial screen:');
    console.log(getScreen());
    
    console.log('\nPressing space...');
    events.keypress(' '); // space character
    
    console.log('Screen after space:');
    console.log(getScreen());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test(); 