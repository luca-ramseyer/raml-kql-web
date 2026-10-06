import { readFileSync } from 'node:fs';
import { docsMeta } from './docs';

export interface Asset { name: string; url: string; size: number }
export interface Release { version: string; tag: string; url: string; publishedAt: string; assets: Asset[] }

export const repoUrl = `https://github.com/${docsMeta.repo}`;
export const releasesUrl = `${repoUrl}/releases/latest`;

export function getRelease(): Release | null {
  try {
    return JSON.parse(readFileSync('./.content/release.json', 'utf8'));
  } catch {
    return null;
  }
}

export interface Download { label: string; detail: string; asset?: Asset }

/** Group release assets into the platforms listed in the app README. */
export function downloads(release: Release | null): Download[] {
  const find = (re: RegExp) => release?.assets.find((a) => re.test(a.name));
  return [
    { label: 'macOS', detail: 'Apple Silicon · dmg', asset: find(/mac.*arm64.*\.dmg$/i) },
    { label: 'macOS', detail: 'Intel · dmg', asset: find(/mac.*x64.*\.dmg$/i) },
    { label: 'Windows', detail: 'x64 · installer', asset: find(/win.*x64.*\.exe$/i) },
    { label: 'Linux', detail: 'AppImage', asset: find(/\.AppImage$/i) },
    { label: 'Linux', detail: 'deb', asset: find(/\.deb$/i) },
    { label: 'Linux', detail: 'rpm', asset: find(/\.rpm$/i) },
  ];
}
