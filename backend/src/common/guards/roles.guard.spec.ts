import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const contextFor = (role?: string): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { id: 'user-1', role } : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.resetAllMocks());

  it('denies unauthenticated requests when roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['OWNER']);
    expect(guard.canActivate(contextFor())).toBe(false);
  });

  it.each([
    ['USER', ['OWNER'], false],
    ['USER', ['ADMIN'], false],
    ['OWNER', ['OWNER'], true],
    ['OWNER', ['ADMIN'], false],
    ['ADMIN', ['ADMIN'], true],
    ['ADMIN', ['OWNER'], false],
  ])('%s access to %j route is %s', (role, required, allowed) => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(required);
    expect(guard.canActivate(contextFor(role))).toBe(allowed);
  });

  it('allows routes without a role restriction to proceed to their own guards', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(contextFor())).toBe(true);
  });
});
