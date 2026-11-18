// Route table. need: 'none' (anyone), 'profile' (joined), 'ready' (joined and has bodies).
import { renderWelcome } from './views/welcome.js';
import { renderAddress } from './views/address.js';
import { renderHome } from './views/home.js';
import { renderBody } from './views/body.js';

export const routes = [
  { name: 'welcome', pattern: /^\/welcome$/, need: 'none', view: (_, root) => renderWelcome(root) },
  { name: 'address', pattern: /^\/address$/, need: 'profile', view: (_, root) => renderAddress(root) },
  { name: 'home', pattern: /^\/$/, need: 'ready', view: (_, root) => renderHome(root, null) },
  { name: 'item', pattern: /^\/item\/([\w-]+)$/, need: 'ready', view: ([id], root) => renderHome(root, id) },
  { name: 'body', pattern: /^\/body\/([\w-]+)$/, need: 'ready', view: ([id], root) => renderBody(id, root) },
];
