/**
 * affected-report executor — writes a markdown report of affected projects.
 *
 * WHAT IT DOES: runs `nx show projects --affected` (Nx's own affected
 * computation: project graph + git changes vs base) and writes the result
 * as markdown to outputPath. CI uses it to make affected builds auditable
 * — the report shows exactly which projects a change touched, so a
 * reviewer can see why a job ran what it ran.
 *
 * WHY AN EXECUTOR INSTEAD OF A SCRIPT: executors get the Nx context
 * (workspace root, project graph metadata) and first-class caching and
 * target configuration. A raw npm script would re-implement argument
 * parsing and output handling that Nx already provides.
 *
 * NOTE ON NESTED NX: this executor shells out to `nx show` while running
 * under Nx. NX_DAEMON=false avoids any daemon-nesting surprises; the
 * inner call just recomputes the graph (a few seconds) and exits.
 */
import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { AffectedReportExecutorSchema } from './schema';

export default async function runExecutor(
  options: AffectedReportExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const args = ['show', 'projects', '--affected'];
  if (options.base) {
    args.push('--base', options.base);
  }
  const raw = execSync(`npx nx ${args.join(' ')}`, {
    cwd: context.root,
    encoding: 'utf-8',
    env: { ...process.env, NX_DAEMON: 'false' },
  });
  const projects = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const stamp = new Date().toISOString();
  const lines = [
    '# Affected projects report',
    '',
    `Generated: ${stamp}`,
    `Base: ${options.base ?? '(Nx default)'}`,
    '',
  ];
  if (projects.length === 0) {
    lines.push('No affected projects.');
  } else {
    lines.push(`Affected projects (${projects.length}):`, '');
    for (const project of projects) {
      lines.push(`- ${project}`);
    }
  }
  lines.push('');
  const report = lines.join('\n');

  const outputPath = path.join(
    context.root,
    options.outputPath ?? 'affected-report.md',
  );
  writeFileSync(outputPath, report);
  console.log(report);
  console.log(`Wrote ${outputPath}`);
  return { success: true };
}
