#!/usr/bin/env tsx
import { readFileSync } from 'fs';
import { glob } from 'glob';

interface MetricCounts {
  asAny: number;
  tsNoCheck: number;
  jsonParse: number;
  jsonParseUnguarded: number;
}

async function collect(): Promise<MetricCounts> {
  const files = await glob('**/*.{ts,tsx,js,jsx}', { ignore: ['node_modules/**','*.d.ts','dist/**'] });
  let counts: MetricCounts = { asAny: 0, tsNoCheck: 0, jsonParse: 0, jsonParseUnguarded: 0 };

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    // Count simple patterns
    const asAnyMatches = content.match(/\bas any\b/g);
    if (asAnyMatches) counts.asAny += asAnyMatches.length;

    if (!file.includes('scripts/type-metrics') && !file.includes('_PLANS/')) {
      const noCheckMatches = content.match(/@ts-nocheck/g);
      if (noCheckMatches) counts.tsNoCheck += noCheckMatches.length;
    }

    // JSON.parse detection with simple heuristic for guard (looking next 3 lines for isRecord|try|catch|if typeof)
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes('JSON.parse(')) {
        counts.jsonParse++;
        const windowText = lines.slice(idx + 1, idx + 4).join('\n');
        const guarded = /is[A-Z]|typeof|try|catch|safeParse|safeJson/i.test(windowText);
        if (!guarded) counts.jsonParseUnguarded++;
      }
    });
  }
  return counts;
}

function format(counts: MetricCounts) {
  const table = [
    ['Metric','Count'],
    ['as any', String(counts.asAny)],
    ['@ts-nocheck', String(counts.tsNoCheck)],
    ['JSON.parse', String(counts.jsonParse)],
    ['JSON.parse (unguarded est.)', String(counts.jsonParseUnguarded)],
  ];
  const widths = table[0].map((_, c) => Math.max(...table.map(r => r[c].length)));
  return table.map(r => r.map((cell,i)=>cell.padEnd(widths[i])).join('  ')).join('\n');
}

(async () => {
  const counts = await collect();
  console.log('\nType Safety Metrics Snapshot');
  console.log('============================');
  console.log(format(counts));
  // CI friendly JSON output
  if (process.env.CI) {
    console.log('\nJSON:' + JSON.stringify(counts));
  }
})();
