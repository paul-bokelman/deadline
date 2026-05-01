import { describe, expect, it } from 'vitest';

import { iconList } from './iconList';
import { iconIds, iconSizes } from '../types/Icon';

describe('iconList', () => {
  it('contains an entry for every iconId declared in src/types/Icon.ts', () => {
    for (const iconId of iconIds) {
      expect(iconList[iconId], `missing icon entry for ${iconId}`).toBeDefined();
    }
  });

  it('every icon entry has at least one supported size resolved', () => {
    for (const iconId of iconIds) {
      const urls = iconList[iconId];
      const hasAtLeastOneSize = iconSizes.some((size) => Boolean(urls[size]));
      expect(
        hasAtLeastOneSize,
        `${iconId} resolves no supported size`
      ).toBe(true);
    }
  });

  it('exposes the fallback icon for use as a missing-icon placeholder', () => {
    const fallback = iconList.fallback;
    expect(fallback).toBeDefined();
    const hasAtLeastOneSize = iconSizes.some((size) => Boolean(fallback[size]));
    expect(hasAtLeastOneSize).toBe(true);
  });
});
