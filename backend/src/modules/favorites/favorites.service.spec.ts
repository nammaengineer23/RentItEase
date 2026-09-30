import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  const prisma = {
    property: { findFirst: jest.fn() },
    favorite: { upsert: jest.fn(), findMany: jest.fn(), count: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
  } as any;

  let service: FavoritesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FavoritesService(prisma);
  });

  it('requires a verified and available property', async () => {
    prisma.property.findFirst.mockResolvedValue(null);
    await expect(service.addFavorite('property-1', { id: 'tenant-1' })).rejects.toThrow('Property not found.');
    expect(prisma.property.findFirst).toHaveBeenCalledWith({ where: { id: 'property-1', isVerified: true, isAvailable: true } });
  });

  it('is idempotent when adding an existing favorite', async () => {
    prisma.property.findFirst.mockResolvedValue({ id: 'property-1' });
    const favorite = { id: 'favorite-1', userId: 'tenant-1', propertyId: 'property-1' };
    prisma.favorite.upsert.mockResolvedValue(favorite);

    const result = await service.addFavorite('property-1', { id: 'tenant-1' });

    expect(prisma.favorite.upsert).toHaveBeenCalledWith({
      where: { userId_propertyId: { userId: 'tenant-1', propertyId: 'property-1' } },
      create: { userId: 'tenant-1', propertyId: 'property-1' },
      update: {},
    });
    expect(result.success).toBe(true);
    expect(result.favorite).toEqual(favorite);
  });

  it('is idempotent when removing a missing favorite', async () => {
    prisma.favorite.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeFavorite('property-1', { id: 'tenant-1' })).resolves.toMatchObject({ success: true, removed: false });
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({ where: { userId: 'tenant-1', propertyId: 'property-1' } });
  });

  it('enforces user ownership through the user/property composite key', async () => {
    prisma.favorite.deleteMany.mockResolvedValue({ count: 1 });
    await service.removeFavorite('property-1', { id: 'tenant-2' });
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({ where: { userId: 'tenant-2', propertyId: 'property-1' } });
  });

  it('paginates favorites and scopes both data and count to the user', async () => {
    const favorites = [{ id: 'favorite-1' }];
    prisma.$transaction.mockResolvedValue([favorites, 45]);
    const result = await service.getMyFavorites({ id: 'tenant-1' }, 2, 20);

    expect(prisma.$transaction).toHaveBeenCalled();
    const [findMany, count] = prisma.$transaction.mock.calls[0][0];
    expect(findMany).toMatchObject({ where: { userId: 'tenant-1' }, skip: 20, take: 20, orderBy: { createdAt: 'desc' } });
    expect(count).toEqual({ where: { userId: 'tenant-1' } });
    expect(result).toMatchObject({ page: 2, limit: 20, total: 45, totalPages: 3, favorites });
  });

  it('caps page size at 100', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);
    const result = await service.getMyFavorites({ id: 'tenant-1' }, 1, 500);
    const [findMany] = prisma.$transaction.mock.calls[0][0];
    expect(findMany.take).toBe(100);
    expect(result.limit).toBe(100);
  });

  it('returns no favorites after a property has been deleted', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);
    const result = await service.getMyFavorites({ id: 'tenant-1' });
    expect(result.total).toBe(0);
    expect(result.favorites).toEqual([]);
  });

  it('does not include owner contact fields in favorite-list queries', async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);
    await service.getMyFavorites({ id: 'tenant-1' });
    const [findMany] = prisma.$transaction.mock.calls[0][0];
    expect(findMany.include.property.include.owner.select).toEqual({ id: true });
  });
});
