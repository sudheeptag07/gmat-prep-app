import { backfillMissingQuestionVisuals } from '../lib/db';

async function main() {
  const limit = Number(process.env.GMAT_VISUAL_BACKFILL_LIMIT ?? 100);
  const result = await backfillMissingQuestionVisuals(limit);

  console.log(`Scanned chart questions: ${result.scanned}`);
  console.log(`Updated visuals: ${result.updated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
