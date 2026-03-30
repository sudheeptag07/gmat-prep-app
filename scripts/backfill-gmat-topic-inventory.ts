import { ensureMinimumQuestionsForAllTopics } from '../lib/db';

async function main() {
  const counts = await ensureMinimumQuestionsForAllTopics(50);
  console.log('GMAT inventory counts by topic:');
  console.log(JSON.stringify(counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
