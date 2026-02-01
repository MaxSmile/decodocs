import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Run from decodocs/web
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..'); // web/
const decodocsRoot = path.resolve(projectRoot, '..'); // decodocs/

const outRoot = path.join(projectRoot, 'public', 'classifications');
const outValidationDir = path.join(outRoot, 'validation');

const docsValidationDir = path.join(decodocsRoot, 'docs', 'validation');

const ensureDir = async (p) => {
  await fs.mkdir(p, { recursive: true });
};

const writeJson = async (filePath, obj) => {
  const json = JSON.stringify(obj, null, 2) + '\n';
  await fs.writeFile(filePath, json, 'utf8');
};

const parseValidationMd = (md, filename) => {
  const lines = md.split(/\r?\n/);
  const title = (lines.find((l) => l.startsWith('# ')) || '').replace(/^#\s+/, '').trim();

  const typeIdLine = lines.find((l) => /^Type id:/i.test(l));
  const typeIdsBlockStart = lines.findIndex((l) => /^Type ids/i.test(l));

  const typeIds = [];

  if (typeIdLine) {
    const m = typeIdLine.match(/`([^`]+)`/);
    if (m) typeIds.push(m[1]);
  } else if (typeIdsBlockStart >= 0) {
    for (let i = typeIdsBlockStart + 1; i < Math.min(typeIdsBlockStart + 20, lines.length); i++) {
      const m = lines[i].match(/`([^`]+)`/);
      if (m) typeIds.push(m[1]);
      if (lines[i].trim() === '') break;
    }
  }

  return {
    id: path.basename(filename, path.extname(filename)),
    title: title || filename,
    typeIds,
    // Keep the raw markdown for now; later we can compile into a structured schema.
    markdown: md,
    version: 1,
  };
};

const main = async () => {
  await ensureDir(outRoot);
  await ensureDir(outValidationDir);

  const { DOCUMENT_TYPES } = await import(path.join(projectRoot, 'src', 'lib', 'documentTypes.js'));

  // 1) Index file for typeahead
  await writeJson(path.join(outRoot, 'document-types.index.json'), {
    version: 1,
    generatedAt: new Date().toISOString(),
    types: DOCUMENT_TYPES.map((t) => ({
      id: t.id,
      label: t.label,
      category: t.category,
      synonyms: t.synonyms || [],
      parentId: t.parentId || null,
      validationSlug: t.validationSlug || null,
    })),
  });

  // 2) Validation files
  let entries = [];
  try {
    entries = await fs.readdir(docsValidationDir, { withFileTypes: true });
  } catch {
    // no docs folder in some setups
    entries = [];
  }

  const mdFiles = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => n.endsWith('.md'))
    .filter((n) => n.toLowerCase() !== 'readme.md');

  for (const file of mdFiles) {
    const full = path.join(docsValidationDir, file);
    const md = await fs.readFile(full, 'utf8');
    const parsed = parseValidationMd(md, file);

    // Name output by filename id (stable), not by typeId (some docs cover multiple ids).
    await writeJson(path.join(outValidationDir, `${parsed.id}.json`), parsed);
  }

  // Index of validation docs
  await writeJson(path.join(outRoot, 'validation.index.json'), {
    version: 1,
    generatedAt: new Date().toISOString(),
    items: mdFiles.map((f) => ({
      id: path.basename(f, '.md'),
      file: `validation/${path.basename(f, '.md')}.json`,
    })),
  });

  console.log(`Generated classifications into ${outRoot}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
