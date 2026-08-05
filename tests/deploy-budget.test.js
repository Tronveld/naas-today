// Deploy budget — scripts/check-deploy-budget.js and scripts/lib.js
// Run with: node --test
//
// Netlify's free plan is 300 credits a month and a production deploy costs 15
// of them, flat, whatever the build takes. That is 20 deploys a month, total,
// shared with bandwidth and web requests. Run the pool dry and Netlify pauses
// every project on the team — visitors get "Site not available" until the next
// billing cycle. The site goes dark.
//
// The daily rebuild added yesterday would have been 30 deploys a month on its
// own. These helpers keep it to the days that actually have something new, and
// refuse to spend past a cap.
//
// `now` is injected, not read from the clock, so the 30-day window is testable.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { withinBudget } = require('../scripts/check-deploy-budget.js');
const { reportInserted } = require('../scripts/lib.js');

const NOW = new Date('2026-08-05T12:00:00Z');

// A production deploy `daysAgo` days before NOW.
const deploy = (daysAgo, context = 'production') => ({
  created_at: new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  context,
});

describe('withinBudget', () => {
  test('allows when nothing has been deployed', () => {
    assert.equal(withinBudget([], 15, NOW), true);
  });

  test('allows when comfortably under the cap', () => {
    const deploys = Array.from({ length: 5 }, (_, i) => deploy(i));
    assert.equal(withinBudget(deploys, 15, NOW), true);
  });

  test('allows on the deploy immediately before the cap', () => {
    const deploys = Array.from({ length: 14 }, (_, i) => deploy(i));
    assert.equal(withinBudget(deploys, 15, NOW), true);
  });

  // The off-by-one that matters. At the cap the next deploy would exceed it,
  // and exceeding it is what pauses the site — so at the cap must block.
  test('blocks at exactly the cap', () => {
    const deploys = Array.from({ length: 15 }, (_, i) => deploy(i));
    assert.equal(withinBudget(deploys, 15, NOW), false);
  });

  test('blocks past the cap', () => {
    const deploys = Array.from({ length: 40 }, (_, i) => deploy(i % 30));
    assert.equal(withinBudget(deploys, 15, NOW), false);
  });

  describe('the 30-day window', () => {
    test('ignores deploys older than 30 days', () => {
      const old = Array.from({ length: 30 }, (_, i) => deploy(31 + i));
      assert.equal(withinBudget(old, 15, NOW), true);
    });

    test('counts a deploy just inside the window', () => {
      const deploys = Array.from({ length: 14 }, (_, i) => deploy(i)).concat([deploy(29)]);
      assert.equal(withinBudget(deploys, 15, NOW), false);
    });
  });

  // Branch and preview deploys do not cost a production deploy's credits, so
  // counting them would block rebuilds that were affordable all along.
  test('ignores non-production deploys', () => {
    const branch = Array.from({ length: 30 }, (_, i) => deploy(i % 30, 'branch-deploy'));
    assert.equal(withinBudget(branch, 15, NOW), true);
  });

  test('counts production among a mixed list', () => {
    const mixed = [
      ...Array.from({ length: 15 }, (_, i) => deploy(i, 'deploy-preview')),
      ...Array.from({ length: 15 }, (_, i) => deploy(i, 'production')),
    ];
    assert.equal(withinBudget(mixed, 15, NOW), false);
  });
});

describe('reportInserted', () => {
  // Off CI there is no $GITHUB_OUTPUT. Writing must not be attempted, and the
  // fetchers must not care — they run locally far more often than in Actions.
  test('no-ops when GITHUB_OUTPUT is unset', () => {
    const saved = process.env.GITHUB_OUTPUT;
    delete process.env.GITHUB_OUTPUT;
    try {
      assert.equal(reportInserted(3), false);
    } finally {
      if (saved !== undefined) process.env.GITHUB_OUTPUT = saved;
    }
  });

  test('appends the count when GITHUB_OUTPUT is set', () => {
    const file  = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'naas-')), 'out.txt');
    const saved = process.env.GITHUB_OUTPUT;
    process.env.GITHUB_OUTPUT = file;
    try {
      assert.equal(reportInserted(7), true);
      assert.equal(fs.readFileSync(file, 'utf8'), 'inserted=7\n');
    } finally {
      if (saved === undefined) delete process.env.GITHUB_OUTPUT;
      else process.env.GITHUB_OUTPUT = saved;
    }
  });

  // Zero is the common case and the whole point: it is what tells the workflow
  // not to spend 15 credits rebuilding identical content.
  test('reports zero rather than skipping it', () => {
    const file  = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'naas-')), 'out.txt');
    const saved = process.env.GITHUB_OUTPUT;
    process.env.GITHUB_OUTPUT = file;
    try {
      assert.equal(reportInserted(0), true);
      assert.equal(fs.readFileSync(file, 'utf8'), 'inserted=0\n');
    } finally {
      if (saved === undefined) delete process.env.GITHUB_OUTPUT;
      else process.env.GITHUB_OUTPUT = saved;
    }
  });
});
