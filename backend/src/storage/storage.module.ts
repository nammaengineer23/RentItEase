import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { FirebaseModule } from '../firebase/firebase.module';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule, FirebaseModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
