/**
 * feature-lib generator — scaffolds a new feature library.
 *
 * WHY A CUSTOM GENERATOR INSTEAD OF `nx g @nx/angular:library`: the
 * built-in generator doesn't know THIS repo's conventions — root-level
 * package layout (not libs/), the scope:web/type:feature tags, the
 * barrel + routes + skeleton component shape, or the tsconfig.base.json
 * path entry. A workspace generator bakes the conventions in, so every
 * new feature starts compliant with the module boundaries instead of
 * needing hand-fixes. That is the Nx pitch for custom generators: encode
 * the team's decisions once, reuse them forever.
 *
 * USAGE: `nx workspace-generator feature-lib --name=reports`
 * Creates feature-reports/ at the repo root. Verify first with --dry-run.
 */
import {
  formatFiles,
  generateFiles,
  names,
  Tree,
  updateJson,
} from '@nx/devkit';
import * as path from 'path';
import { FeatureLibGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: FeatureLibGeneratorSchema,
): Promise<void> {
  const { fileName } = names(options.name);
  const projectRoot = `feature-${fileName}`;
  const importPath = `@fidelity-portfolio-dashboard/feature-${fileName}`;

  if (tree.exists(projectRoot)) {
    throw new Error(
      `Directory ${projectRoot} already exists — pick a different name.`,
    );
  }

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    ...names(options.name),
    name: options.name,
    tmpl: '',
  });

  // Register the path alias so `import('@fidelity-portfolio-dashboard/...')`
  // resolves to the new lib's barrel. Without this, the app build fails
  // on the import even though the files exist — a common first-generator
  // bug, and the reason this step lives in the generator, not in a doc.
  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions.paths[importPath] = [
      `./${projectRoot}/src/index.ts`,
    ];
    return json;
  });

  await formatFiles(tree);
}
