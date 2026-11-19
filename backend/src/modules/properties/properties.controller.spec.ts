import 'reflect-metadata';
import { UserRole } from '@prisma/client';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { PropertiesController } from './properties.controller';

describe('PropertiesController first-property submission permissions', () => {
  it('allows tenant and owner roles to create a property submission', () => {
    expect(Reflect.getMetadata(ROLES_KEY, PropertiesController.prototype.create)).toEqual([
      UserRole.OWNER,
      UserRole.USER,
    ]);
  });

  it('allows tenant and owner roles to submit a draft for admin review', () => {
    expect(Reflect.getMetadata(ROLES_KEY, PropertiesController.prototype.submit)).toEqual([
      UserRole.OWNER,
      UserRole.USER,
    ]);
  });

  it('keeps AI listing suggestions restricted to owners', () => {
    expect(Reflect.getMetadata(ROLES_KEY, PropertiesController.prototype.suggestListing)).toEqual([
      UserRole.OWNER,
    ]);
  });
});
