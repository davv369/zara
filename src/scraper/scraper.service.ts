import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryConnector, DetailsConnector, ProductConnector } from "../connectors/connectos";
import { Category, EWomanCategories, Product } from "../models/ICategories";
import { ProductEntity } from "../models/product.entity";

type ScraperResult = { success: boolean; data?: Product[] };

@Injectable()
export class ScraperService {
  constructor(
      private readonly categoryConnector: CategoryConnector,
      private readonly detailsConnector: DetailsConnector,
      private readonly productConnector: ProductConnector,
      @InjectRepository(ProductEntity) private productRepository: Repository<ProductEntity>
  ) {}

  async clearDatabase(): Promise<void> {
    await this.productRepository.clear();
  }

  async countProducts(): Promise<number> {
    return this.productRepository.count();
  }

  async getCategories(): Promise<{ id: number; name: string }[]> {
    const categories = await this.categoryConnector.getCategories();
    if (!categories) {
      console.log("Failed to fetch categories.");
      return [];
    }

    const relevantIndexes: { id: number; name: string }[] = [];
    categories.categories[0].subcategories.forEach((category: Category) => {
      if (Object.values(EWomanCategories).includes(category.name as EWomanCategories)) {
        relevantIndexes.push({ id: category.id, name: category.name });
      }
    });

    console.log("Relevant Category Indexes:", relevantIndexes);
    return relevantIndexes;
  }

  async getProducts(relevantIndexes: { id: number; name: string }[]): Promise<Product[]> {
    const allProducts: Product[] = [];
    let totalProducts = 0;
    let processedProducts = 0;

    for (const category of relevantIndexes) {
      const response = await this.productConnector.getProducts(category.id.toString());
      if (response?.productGroups && Array.isArray(response.productGroups)) {
        for (const group of response.productGroups) {
          if (group?.elements && Array.isArray(group.elements)) {
            for (const element of group.elements) {
              if (element?.commercialComponents && Array.isArray(element.commercialComponents)) {
                totalProducts += element.commercialComponents.length;
              }
            }
          }
        }
      }
    }

    for (const category of relevantIndexes) {
      const response = await this.productConnector.getProducts(category.id.toString());
      if (!response?.productGroups || !Array.isArray(response.productGroups)) {
        continue;
      }

      for (const group of response.productGroups) {
        if (!group?.elements || !Array.isArray(group.elements)) {
          continue;
        }

        for (const element of group.elements) {
          if (!element?.commercialComponents || !Array.isArray(element.commercialComponents)) {
            continue;
          }

          for (const product of element.commercialComponents) {
            const availability = product.availability || "unknown";
            if (availability === "in_stock") {
              const productData: Product = {
                index: processedProducts + 1,
                id: product.id,
                name: product.name || "",
                price: product.price || 0,
                seoId: product.seo?.seoProductId || "",
                country: undefined,
                category: category.name,
              };

              const productDetails = await this.getDetails(product);
              if (productDetails) {
                productData.country = productDetails.country;
                console.log("Product data:", productData);

                try {
                  const productEntity = this.productRepository.create(productData);
                  await this.productRepository.save(productEntity);
                  console.log(`Saved product with index: ${productData.index}`);
                  allProducts.push(productData);
                } catch (error) {
                  console.error(`Error saving product with index: ${productData.index}`, error);
                }
              }
            }

            processedProducts++;
            const progress = (processedProducts / totalProducts) * 100;
            console.log(`Progress: ${Math.round(progress)}% - Processed ${processedProducts} of ${totalProducts} products`);
          }
        }
      }
    }

    return allProducts;
  }

  async getDetails(productData: any): Promise<{ country?: string } | null> {
    let country: string;
    try {
      const details = await this.detailsConnector.getProductDetails(productData.id);
      if (details && details.length > 0 && details[details.length - 1].components[4]?.text?.value) {
        country = details[details.length - 1].components[4].text.value.replace('Wyprodukowano w ', '');
        return { country };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching details for product ${productData.id}:`, error);
      return null;
    }
  }

  async runScraper(): Promise<ScraperResult> {
    try {
      await this.clearDatabase();

      const afterClearCount = await this.countProducts();
      console.log(`Number of products after clearing: ${afterClearCount}`);

      const relevantIndexes = await this.getCategories();
      if (relevantIndexes.length === 0) {
        return { success: false, data: [] };
      }

      const products = await this.getProducts(relevantIndexes);
      return { success: true, data: products };
    } catch (error) {
      console.error("Error running scraper:", error);
      return { success: false, data: [] };
    }
  }
}
