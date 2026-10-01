import { BadRequestException } from '@nestjs/common';
import { PropertyLifecycleStatus } from '@prisma/client';

import { assertPropertyTransition, canTransitionProperty } from './property-lifecycle';

describe('Property lifecycle state machine', () => {
  it('allows the intended happy path', () => {
    const path = [
      PropertyLifecycleStatus.DRAFT,
      PropertyLifecycleStatus.SUBMITTED,
      PropertyLifecycleStatus.VERIFIED,
      PropertyLifecycleStatus.PUBLISHED,
      PropertyLifecycleStatus.BOOKED,
      PropertyLifecycleStatus.OCCUPIED,
      PropertyLifecycleStatus.PUBLISHED,
      PropertyLifecycleStatus.UNAVAILABLE,
      PropertyLifecycleStatus.ARCHIVED,
    ];

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransitionProperty(path[i], path[i + 1])).toBe(true);
      expect(() => assertPropertyTransition(path[i], path[i + 1])).not.toThrow();
    }
  });

  it.each([
    [PropertyLifecycleStatus.DRAFT, PropertyLifecycleStatus.PUBLISHED],
    [PropertyLifecycleStatus.SUBMITTED, PropertyLifecycleStatus.BOOKED],
    [PropertyLifecycleStatus.VERIFIED, PropertyLifecycleStatus.BOOKED],
    [PropertyLifecycleStatus.PUBLISHED, PropertyLifecycleStatus.OCCUPIED],
    [PropertyLifecycleStatus.OCCUPIED, PropertyLifecycleStatus.BOOKED],
    [PropertyLifecycleStatus.ARCHIVED, PropertyLifecycleStatus.PUBLISHED],
  ])('rejects illegal transition %s -> %s', (from, to) => {
    expect(() => assertPropertyTransition(from, to)).toThrow(BadRequestException);
  });

  it('treats archived as terminal', () => {
    expect(canTransitionProperty(PropertyLifecycleStatus.ARCHIVED, PropertyLifecycleStatus.PUBLISHED)).toBe(false);
    expect(canTransitionProperty(PropertyLifecycleStatus.ARCHIVED, PropertyLifecycleStatus.DRAFT)).toBe(false);
  });
});
