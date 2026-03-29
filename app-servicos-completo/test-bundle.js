import { JSDOM } from 'jsdom';
const dom = new JSDOM(`<!DOCTYPE html><div id="root"></div>`);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

import('./dist/assets/index-BpWfRJFu.js').then(() => console.log('Loaded module successfully.')).catch(e => {
  console.error(e);
});
