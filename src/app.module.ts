import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperService } from './scraper/scraper.service';
import { ProductConnector, CategoryConnector, DetailsConnector } from './connectors/connectos';
import { ProductEntity } from './models/product.entity';
import { ScraperModule } from './scraper/scraper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // Używamy pełnego URL z Railway
      ssl: { rejectUnauthorized: false }, // Wymagane dla Railway
      entities: [ProductEntity],
      synchronize: true,
      extra: {
        ssl: {
          rejectUnauthorized: false
        },
      }}),
    TypeOrmModule.forFeature([ProductEntity]),
    ScraperModule,
  ],
  providers: [ScraperService, ProductConnector, CategoryConnector, DetailsConnector],
})
export class AppModule {}
