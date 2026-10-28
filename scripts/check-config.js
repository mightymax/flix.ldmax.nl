import { loadConfiguration, validateConfiguration } from '../src/lib/server/flix/configuration.js';

try {
  const filename = process.argv[2] ?? 'config/config.example.ttl';
  const configuration = await loadConfiguration(filename);
  const result = await validateConfiguration(configuration);
  console.log(`Configuration valid: ${result.files} files, ${result.queries} queries (${filename}).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
