import { UsersController } from './users.controller';

describe('UsersController', () => {
  it('constructs with its service dependency', () => {
    const controller = new UsersController({} as any);
    expect(controller).toBeDefined();
  });
});
