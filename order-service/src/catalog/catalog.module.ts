import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CatalogClientService } from './catalog-client.service';

@Module({
  imports: [HttpModule.register({ timeout: 5000, maxRedirects: 0 })],
  providers: [CatalogClientService],
  exports: [CatalogClientService],
})
export class CatalogModule {}
