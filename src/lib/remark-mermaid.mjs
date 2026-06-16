// Remark plugin: converts ```mermaid code blocks to <pre class="mermaid">
// for client-side rendering by the Mermaid.js library.
import { visit } from 'unist-util-visit';

export function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        parent.children[index] = {
          type: 'html',
          value: `<pre class="mermaid">${node.value}</pre>`,
        };
      }
    });
  };
}
