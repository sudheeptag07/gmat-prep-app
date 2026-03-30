import { ensureMinimumQuestionsPerSubtopic } from '../lib/db';

async function main() {
  const minimum = Number(process.env.GMAT_SUBTOPIC_MIN ?? 20);
  const rows = await ensureMinimumQuestionsPerSubtopic(minimum);

  const underTarget = rows.filter((row) => row.count < minimum);
  const byTopic = rows.reduce<Record<string, { covered: number; total: number }>>((acc, row) => {
    const curr = acc[row.topic] ?? { covered: 0, total: 0 };
    curr.total += 1;
    if (row.count >= minimum) curr.covered += 1;
    acc[row.topic] = curr;
    return acc;
  }, {});

  console.log(`Subtopic coverage target: ${minimum}`);
  console.log(JSON.stringify(byTopic, null, 2));
  console.log(`Subtopics under target: ${underTarget.length}`);
  if (underTarget.length > 0) {
    console.log(JSON.stringify(underTarget.slice(0, 20), null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
