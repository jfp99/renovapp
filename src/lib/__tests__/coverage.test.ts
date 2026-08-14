import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guard tests over the source itself.
 *
 * Every data-loss incident on this project came from the same shape of
 * mistake: a store was added, and one of the places that must know about
 * every store was not updated. The export silently dropped tenancy and
 * scenarios; diskSync's emptiness check missed a key, which would let a disk
 * restore overwrite a real project.
 *
 * These tests fail the moment a new store is not wired everywhere, so the
 * mistake cannot reach a build — let alone a user's data.
 */

const SRC = join(process.cwd(), 'src');

function read(relative: string): string {
  return readFileSync(join(SRC, relative), 'utf8');
}

/** Store files on disk, e.g. ['blueprint', 'cost', ...]. */
const storeFiles = readdirSync(join(SRC, 'stores'))
  .filter((f) => f.endsWith('Store.ts'))
  .sort();

/** localStorage keys each store persists under. */
function persistedKeys(): string[] {
  return storeFiles
    .flatMap((file) => {
      const match = read(`stores/${file}`).match(/name:\s*'(renovapp-[a-z]+)'/);
      return match ? [match[1]] : [];
    })
    .sort();
}

describe('couverture des stores', () => {
  it('chaque store declare une cle de persistance', () => {
    expect(persistedKeys()).toHaveLength(storeFiles.length);
  });

  it("l'export du projet reference tous les stores", () => {
    const source = read('lib/projectData.ts');
    const missing = storeFiles
      .map((file) => file.replace('.ts', ''))
      .map((name) => `use${name[0].toUpperCase()}${name.slice(1)}`)
      .filter((hook) => !source.includes(hook));

    // A store absent here is silently left out of every backup.
    expect(missing, `stores absents de l'export : ${missing.join(', ')}`).toEqual([]);
  });

  it("la detection de projet vide couvre toutes les cles", () => {
    const source = read('lib/diskSync.ts');
    const missing = persistedKeys().filter((key) => !source.includes(`'${key}'`));

    // A key missing here makes a real project look empty, so a disk restore
    // would overwrite it.
    expect(missing, `cles absentes de hasLocalData : ${missing.join(', ')}`).toEqual([]);
  });

  it("l'import restaure tous les stores exportes", () => {
    const source = read('lib/projectData.ts');
    const importSection = source.slice(source.indexOf('export async function importProjectExport'));
    const missing = storeFiles
      .map((file) => file.replace('.ts', ''))
      .map((name) => `use${name[0].toUpperCase()}${name.slice(1)}`)
      .filter((hook) => !importSection.includes(`${hook}.setState`));

    // Exporting without importing means a backup you cannot actually restore.
    expect(missing, `stores non restaures a l'import : ${missing.join(', ')}`).toEqual([]);
  });

  it('tous les stores passent par le stockage protege', () => {
    const unguarded = storeFiles.filter((file) => {
      const source = read(`stores/${file}`);
      return !source.includes('createJSONStorage(() => safeStorage)');
    });

    // Without safeStorage a quota error is swallowed and the write is lost.
    expect(unguarded, `stores sans safeStorage : ${unguarded.join(', ')}`).toEqual([]);
  });
});
