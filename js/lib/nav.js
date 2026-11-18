// Route helpers. Routes are hash paths such as #/item/i-bos-3. The home route is #/.
export const currentPath = () => location.hash.replace(/^#/, '') || '/';

// Navigate to a path. If we're already there, ask the app to re-render.
export function go(path) {
  if (currentPath() === path) window.dispatchEvent(new Event('route:refresh'));
  else location.hash = path;
}
