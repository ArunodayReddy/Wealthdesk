export interface AffectedReportExecutorSchema {
  /** Report path, relative to the workspace root. */
  outputPath?: string;
  /** Git base to compare against (passed to --base). Omit for default. */
  base?: string;
}
