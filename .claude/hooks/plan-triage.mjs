// Hook PostToolUse (Write): quando um plano é salvo na raiz de .plans/,
// pede ao Claude que rode a skill plan-triage para movê-lo à pasta da fase.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
const plansDir = path.resolve(projectDir, '.plans');
const file = path.resolve(projectDir, filePath);

const isRootPlan =
  path.dirname(file).toLowerCase() === plansDir.toLowerCase() &&
  path.extname(file).toLowerCase() === '.md';
if (!isRootPlan) process.exit(0);

// Roteiros e planos já triados ficam onde estão.
const frontmatter = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
if (/^tipo:\s*roteiro\s*$/m.test(frontmatter) || /^fase:/m.test(frontmatter)) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `Um plano foi salvo na raiz de .plans/ (${path.basename(file)}). Rode agora a skill plan-triage para movê-lo à pasta da fase correspondente.`,
    },
  }),
);
