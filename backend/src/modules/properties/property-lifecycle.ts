import { BadRequestException } from '@nestjs/common';
import { PropertyLifecycleStatus } from '@prisma/client';

const transitions: Record<PropertyLifecycleStatus, readonly PropertyLifecycleStatus[]> = {
  [PropertyLifecycleStatus.DRAFT]: [PropertyLifecycleStatus.SUBMITTED, PropertyLifecycleStatus.ARCHIVED],
  [PropertyLifecycleStatus.SUBMITTED]: [PropertyLifecycleStatus.VERIFIED, PropertyLifecycleStatus.DRAFT, PropertyLifecycleStatus.ARCHIVED],
  [PropertyLifecycleStatus.VERIFIED]: [PropertyLifecycleStatus.PUBLISHED, PropertyLifecycleStatus.SUBMITTED, PropertyLifecycleStatus.ARCHIVED],
  [PropertyLifecycleStatus.PUBLISHED]: [PropertyLifecycleStatus.BOOKED, PropertyLifecycleStatus.UNAVAILABLE, PropertyLifecycleStatus.SUBMITTED, PropertyLifecycleStatus.ARCHIVED],
  [PropertyLifecycleStatus.BOOKED]: [PropertyLifecycleStatus.PUBLISHED, PropertyLifecycleStatus.OCCUPIED, PropertyLifecycleStatus.UNAVAILABLE, PropertyLifecycleStatus.ARCHIVED],
  [PropertyLifecycleStatus.OCCUPIED]: [PropertyLifecycleStatus.PUBLISHED, PropertyLifecycleStatus.UNAVAILABLE, PropertyLifecycleStatus.ARCHIVED],
  [PropertyLifecycleStatus.UNAVAILABLE]: [PropertyLifecycleStatus.PUBLISHED, PropertyLifecycleStatus.SUBMITTED, PropertyLifecycleStatus.ARCHIVED],
  [PropertyLifecycleStatus.ARCHIVED]: [],
};

export function canTransitionProperty(
  from: PropertyLifecycleStatus,
  to: PropertyLifecycleStatus,
): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function assertPropertyTransition(
  from: PropertyLifecycleStatus,
  to: PropertyLifecycleStatus,
): void {
  if (!canTransitionProperty(from, to)) {
    throw new BadRequestException(
      `Property cannot transition from ${from} to ${to}.`,
    );
  }
}
