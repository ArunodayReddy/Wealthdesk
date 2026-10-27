/**
 * jest.preset.js — shared Jest base config for every project in the repo.
 *
 * WHY cacheDirectory IS SET HERE: Jest's default cache lives in the OS temp
 * directory. On machines where /tmp is a small tmpfs (this VM: 512MB), the
 * haste-map cache write fails with ENOSPC and the whole test run dies
 * before a single test executes — even though the disk has room elsewhere.
 * Pointing the cache inside each project (git-ignored via the node_modules
 * pattern) makes `nx test` work regardless of /tmp size. <rootDir> resolves
 * per project, so every project gets its own isolated cache directory.
 */
const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
};
