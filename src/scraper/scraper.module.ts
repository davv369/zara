import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {CategoryStatsController, ScraperController} from './scraper.controller';
import { ScraperService } from './scraper.service';
import { CategoryConnector, DetailsConnector, ProductConnector } from '../connectors/connectos';
import { ProductEntity } from '../models/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  providers: [
    ScraperService,
    CategoryConnector,
    DetailsConnector,
    ProductConnector,
  ],
  controllers: [ScraperController, CategoryStatsController],
})
export class ScraperModule {}
