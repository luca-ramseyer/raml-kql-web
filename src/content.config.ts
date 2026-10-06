import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { readFileSync } from 'node:fs';
import { docSlug } from './lib/slug.mjs';

let base = './.content/repo/docs';
try {
  base = JSON.parse(readFileSync('./.content/meta.json', 'utf8')).docsDir;
} catch {
  console.warn('No .content/meta.json found. Run `npm run fetch` first.');
}

const docs = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base,
    generateId: ({ entry }) => docSlug(entry),
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
  }).loose(),
});

export const collections = { docs };
