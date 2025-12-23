// src/config/database.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const env = process.env.NODE_ENV as string;

  // 테스트 환경 - SQLite in-memory
  if (env === 'dev') {
    return {
      type: 'sqlite',
      database: ':memory:',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
      dropSchema: true,
    };
  }

  // 개발/프로덕션 환경 - MariaDB
  return {
    type: 'mariadb',
    host: configService.get('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    autoLoadEntities: true,
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
    logging: configService.get<boolean>('DB_LOGGING', false),
  };
};

export const getColumnType = () => {
  return process.env.NODE_ENV === 'dev' ? 'simple-enum' : 'enum';
};

export const getPrimaryGeneratedColumnType = () => {
  return process.env.NODE_ENV === 'dev' ? 'int' : 'bigint';
};
