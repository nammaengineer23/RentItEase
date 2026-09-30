import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PropertyLifecycleStatus, UserRole } from '@prisma/client';

import { PropertiesService } from './properties.service';

describe('PropertiesService lifecycle and public-listing security', () => {
  const property = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };
  const amenity = { findMany: jest.fn() };
  const prisma = {
    property,
    amenity,
    $transaction: jest.fn(),
  } as any;

  let service: PropertiesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(prisma);
  });

  it('builds public filters around PUBLISHED availability rather than client availability', () => {
    const where = (service as any).buildPropertyWhere({ isAvailable: true });
    expect(where).toEqual(
      expect.objectContaining({
        lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
        isAvailable: true,
        isVerified: true,
      }),
    );
  });

  it('rounds public coordinates to approximately 100m precision', () => {
    const result = (service as any).toPublicProperty({
      id: 'property-1',
      latitude: '12.911623',
      longitude: '77.647456',
    });

    expect(result.latitude).toBe(12.912);
    expect(result.longitude).toBe(77.647);
  });

  it('rejects lifecycle and ownership fields even if the service is called outside ValidationPipe', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      lifecycleStatus: PropertyLifecycleStatus.DRAFT,
    });

    await expect(
      service.update(
        'property-1',
        {
          title: 'Updated listing',
          isAvailable: true,
        } as any,
        { id: 'owner-1', role: UserRole.OWNER },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(property.update).not.toHaveBeenCalled();
  });

  it('prevents another owner from changing the property', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      lifecycleStatus: PropertyLifecycleStatus.DRAFT,
    });

    await expect(
      service.update(
        'property-1',
        { title: 'Updated listing' } as any,
        { id: 'owner-2', role: UserRole.OWNER },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates new properties in DRAFT regardless of client-supplied lifecycle fields', async () => {
    amenity.findMany.mockResolvedValue([]);
    property.create.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      lifecycleStatus: PropertyLifecycleStatus.DRAFT,
      isVerified: false,
      isAvailable: false,
      amenities: [],
      reviews: [],
      images: [],
      owner: null,
    });

    const dto: any = {
      title: 'Spacious 2 BHK in HSR Layout',
      description: 'A spacious apartment with modern amenities and good access.',
      price: 25000,
      address: '123 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560102',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      propertyType: 'APARTMENT',
      furnishing: 'SEMI_FURNISHED',
      parking: true,
      petFriendly: false,
      securityDeposit: 50000,
      lifecycleStatus: PropertyLifecycleStatus.PUBLISHED,
    };

    await expect(service.create(dto, { id: 'owner-1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(property.create).not.toHaveBeenCalled();
  });
});
