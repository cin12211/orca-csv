import { Migration } from './MigrationInterface';
import {
  executeMigrations,
  type RunMigrationsOptions,
  type MigrationStepInfo,
} from './MigrationRunner';
import { MigrateLegacyAppConfig1740477873005 } from './versions/MigrateLegacyAppConfig1740477873005';

export const ALL_MIGRATIONS: Migration[] = [
  new MigrateLegacyAppConfig1740477873005(),
];

export async function runMigrations(
  options?: RunMigrationsOptions
): Promise<void> {
  await executeMigrations(ALL_MIGRATIONS, options);
}

export { Migration, executeMigrations };
export type { RunMigrationsOptions, MigrationStepInfo };
export { checkImportCompatibility } from './compatibility';
export type { ImportCompatibilityResult } from './compatibility';
export { getApplied } from './MigrationRunner';
