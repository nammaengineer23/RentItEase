import { UsersController } from './users.controller';

describe('UsersController', () => {
  it('constructs without an Owner request service', () => {
    const controller = new UsersController();
    expect(controller).toBeDefined();
  });
});
