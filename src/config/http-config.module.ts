import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('BASE_URL'),
        timeout: 6000,
        headers: {
          Accept: 'application/json'
        }
      })
    })
  ],
  exports: [HttpModule]
})
export class HttpConfigModule {}
