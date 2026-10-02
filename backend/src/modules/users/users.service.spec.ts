import { UsersService } from './users.service';

describe('UsersService', () => {
  it('constructs with Prisma and audit dependencies', () => {
    const service = new UsersService({} as any, {} as any);
    expect(service).toBeDefined();
  });
});
