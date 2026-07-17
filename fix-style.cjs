const fs = require('fs');

const content = `import * as React from "react";

export function AccessibilityStyle({ a11yLargeText, a11yHighContrast, a11yReducedMotion, a11yColorblindMode }: any) {
  return (
    <style>{\`
      \${a11yLargeText ? \`
        html, body, button, input, select, textarea, p, span, div, h1, h2, h3, h4, h5, h6 {
          font-size: 104% !important;
        }
      \` : ""}
      \${a11yHighContrast ? \`
        body {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        .bg-surface, .bg-background, .bg-surface-hover, select, button, input {
          background-color: #0c0c0c !important;
          color: #ffffff !important;
          border-color: #ffffff !important;
          border-width: 2px !important;
        }
        .text-text-secondary, .text-text-muted, .text-caption, p, span, h1, h2, h3, h4, h5, h6 {
          color: #ffffff !important;
        }
        .border, border-border {
          border-color: #ffffff !important;
          border-width: 2px !important;
        }
      \` : ""}
      \${a11yReducedMotion ? \`
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      \` : ""}
      \${a11yColorblindMode ? \`
        .border-error, .border-success, .border-warning {
          border-style: dashed !important;
          border-width: 3px !important;
        }
        .text-error, .text-success, .text-warning {
          text-decoration: underline !important;
          font-weight: 900 !important;
        }
        .bg-error, .bg-success, .bg-warning {
          opacity: 0.8 !important;
          border: 2px solid #000 !important;
        }
      \` : ""}
    \`}</style>
  );
}
`;

fs.writeFileSync('src/components/dashboard/AccessibilityStyle.tsx', content);

