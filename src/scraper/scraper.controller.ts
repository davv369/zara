import {Controller, Get, Query} from '@nestjs/common';
import { ScraperService } from './scraper.service';
import {InjectRepository} from "@nestjs/typeorm";
import {ProductEntity} from "../models/product.entity";
import {Repository} from "typeorm";

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get('run')
  async runScraper() {
    console.log('GET /scraper/run route hit');  // Add this line for logging
    try {
      const result = await this.scraperService.runScraper();
      if (result.success) {
        return { message: 'Scraper ran successfully', data: result.data };
      } else {
        return { message: 'Scraper failed', error: result.data };
      }
    } catch (error) {
      console.error('Error running scraper:', error);
      return { message: 'Error running scraper', error: error };
    }
  }

}

@Controller('category-stats')
export class CategoryStatsController {
  constructor(
      private readonly scraperService: ScraperService,
      @InjectRepository(ProductEntity)
      private productRepository: Repository<ProductEntity>
  ) {}

  @Get('country-percentage')
  async getCountryPercentage(@Query('categoryName') categoryName: string) {
    const categoryProducts = await this.productRepository.find({ where: { category: categoryName } });

    if (categoryProducts.length === 0) {
      return { message: 'Category not found or no products in this category' };
    }

    const countryCount: { [key: string]: number } = {};

    categoryProducts.forEach(product => {
      if (product.country) {
        countryCount[product.country] = (countryCount[product.country] || 0) + 1;
      }
    });

    const totalProducts = categoryProducts.length;
    const countryPercentage = Object.keys(countryCount).reduce((acc, country) => {
      acc[country] = ((countryCount[country] / totalProducts) * 100).toFixed(2) + '%';
      return acc;
    }, {} as { [key: string]: string });

    return countryPercentage;
  }
}
