(() => {
  const ns = window.__OR_EXPORT__;

  function buildMarkdownFromDomData({ paperTitle, forumUrl, reviews }) {
    let md = `# ${paperTitle}\n\n`;
    md += `> **${reviews.length}** official review(s) parsed from this **OpenReview** page (matches what you see while logged in) · [this page](${forumUrl})\n\n`;
    md += `---\n\n`;

    reviews.forEach((rev, index) => {
      const titleLine = rev.headingText || `Review ${index + 1}`;
      md += `## ${titleLine}\n\n`;
      if (rev.signatureText) md += `_${rev.signatureText}_\n\n`;

      const { compact, body } = ns.partitionDomFields(rev.fields);
      if (compact.length) {
        md += `### Scores & short fields\n\n`;
        compact.forEach(({ label, text }) => {
          md += `- **${label}** — ${text.replace(/\s+/g, ' ')}\n`;
        });
        md += `\n`;
      }

      if (body.length) {
        md += `### Review text\n\n`;
        body.forEach(({ label, text }) => {
          md += `#### ${label}\n\n`;
          md += ns.formatLongFieldBody({ value: text });
          md += `\n`;
        });
      }

      if (rev.noteId) md += `### Metadata\n\n- **Note ID:** \`${rev.noteId}\`\n\n`;
      md += `---\n\n`;
    });
    return md;
  }

  ns.buildMarkdownFromDomData = buildMarkdownFromDomData;
})();
