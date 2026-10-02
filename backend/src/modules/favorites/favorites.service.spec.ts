import { FavoritesService } from './favorites.service';

describe('FavoritesService tenant clean flow', () => {
  const prisma = {
    property: {
      findFirst: jest.fn(),
    },
    favorite: {
      findMany: jest.fn(),
    },
  } as any;

  let service: FavoritesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FavoritesService(prisma);
  });

  it('only allows verified, available properties to be favorited', async () => {
    prisma.property.findFirst.mockResolvedValue(null);

    await expect(
      service.addFavorite('property-1', { id: 'tenant-1' }),
    ).rejects.toThrow('Property not found.');

    expect(prisma.property.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'property-1',
        isVerified: true,
        isAvailable: true,
      },
    });
  });

  it('does not include owner contact fields in favorite-list queries', async () => {
    prisma.favorite.findMany.mockResolvedValue([]);

    await service.getMyFavorites({ id: 'tenant-1' });

    const query = prisma.favorite.findMany.mock.calls[0][0];
    expect(query.include.property.include.owner.select).toEqual({ id: true });
  });
});
