import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/validation/env.validation';
import { CampinfoModule } from './campinfo/campinfo.module';
import { HttpConfigModule } from './config/http-config.module';
import { BoardModule } from './board/board.module';

@Module({
  imports: [
    HttpConfigModule,
    CampinfoModule,
    AuthModule,
    BoardModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
      dropSchema: true,
    }),
    ConfigModule.forRoot({
      envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`],
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
