import axe from 'axe-core';

/**
 * Runs axe on the rendered page. Colour contrast is checked in the browser (jsdom has no
 * layout), and the "region" rule is noisy for toasts and portals.
 */
export async function axeViolations(container = document.body) {
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 160)),
  }));
}
