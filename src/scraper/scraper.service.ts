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

    // Oblicz całkowitą liczbę produktów
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

    // Przetwarzanie produktów
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
                seoId: product.seo?.seoProductId || String(product.id), // Zawsze zapewnij seoId
                country: "unknown", // Domyślna wartość
                category: category.name,
              };

              try {
                const productDetails = await this.getDetails(product);
                if (productDetails) {
                  productData.country = productDetails.country || "unknown";
                }

                console.log("Saving product:", {
                  id: productData.id,
                  name: productData.name.substring(0, 20) + '...' // Skrócona nazwa dla logów
                });

                await this.productRepository.save(
                    this.productRepository.create(productData)
                );
                allProducts.push(productData);
              } catch (error) {
                console.error(`Failed to save product ${product.id}:`, {
                  error: error.message,
                  productData
                });
              }
            }

            processedProducts++;
            const progress = (processedProducts / totalProducts) * 100;
            console.log(`Progress: ${progress.toFixed(1)}% (${processedProducts}/${totalProducts})`);
          }
        }
      }
    }

    return allProducts;
  }

  async getDetails(productData: any): Promise<{ country: string }> {
    try {
      const details = await this.detailsConnector.getProductDetails(productData.id);
      if (!details || details.length === 0) {
        return { country: "unknown" };
      }

      const countryText = details[details.length - 1]?.components[4]?.text?.value;
      return {
        country: countryText
            ? countryText.replace('Wyprodukowano w ', '')
            : "unknown"
      };
    } catch (error) {
      console.error(`Details error for ${productData.id}:`, error.message);
      return { country: "error" };
    }
  }

  async runScraper(): Promise<ScraperResult> {
    try {
      await this.clearDatabase();
      console.log(`Database cleared. Current count: ${await this.countProducts()}`);

      const relevantIndexes = await this.getCategories();
      if (relevantIndexes.length === 0) {
        return { success: false, data: [] };
      }

      const products = await this.getProducts(relevantIndexes);
      return {
        success: true,
        data: products,
        stats: {
          totalSaved: products.length,
          expectedCount: await this.countProducts()
        }
      };
    } catch (error) {
      console.error("Scraper fatal error:", error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }
}
