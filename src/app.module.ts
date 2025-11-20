import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/validation/env.validation';

@Module({
  imports: [
    AuthModule,
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
export class AppModule { }
