import { readdir, readFile } from 'node:fs/promises';
const ROOT = new URL('../app/src/', import.meta.url);
const issues = [];

const walk = async (dirUrl) => {
  const entries = await readdir(dirUrl, { withFileTypes: true });

  for (const entry of entries) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dirUrl);
    if (entry.isDirectory()) {
      await walk(entryUrl);
      continue;
    }

    if (!entry.name.endsWith('.ts')) {
      continue;
    }

    const absolutePath = entryUrl.pathname;
    const relativePath = absolutePath.split('/app/src/')[1];
    const content = await readFile(entryUrl, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNo = index + 1;
      if (line.includes('\t')) {
        issues.push(`${relativePath}:${lineNo} tabs are not allowed`);
      }
      if (/\s+$/.test(line)) {
        issues.push(`${relativePath}:${lineNo} trailing whitespace`);
      }
      if (line.includes('any')) {
        issues.push(`${relativePath}:${lineNo} avoid explicit any`);
      }
    });
  }
};

await walk(ROOT);

if (issues.length > 0) {
  console.error('Lint failed:');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('Lint passed');
