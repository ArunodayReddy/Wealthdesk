/**
 * tools/eslint.config.mjs — lint config for the tools project.
 *
 * WHY IT EXISTS: the tools project contains the feature-lib generator's
 * TEMPLATE files (tools/generators/feature-lib/files/), which are EJS
 * templates (<%= %>) — not valid TypeScript. Without this config, the
 * inferred `tools:lint` target parses them as real code and fails with
 * "Parsing error: Type parameter declaration expected". The ignores
 * entry below excludes the templates directory; the generator and
 * executor sources themselves are still linted.
 */
import baseConfig from '../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['generators/feature-lib/files/**'],
  },
];
