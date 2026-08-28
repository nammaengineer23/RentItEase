import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { FirebaseModule } from '../firebase/firebase.module';
import { R2StorageService } from './r2-storage.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule, FirebaseModule],
  providers: [R2StorageService, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
