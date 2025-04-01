import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryConnector, DetailsConnector, ProductConnector } from "../connectors/connectos";
import { Category, EWomanCategories, Product } from "../models/ICategories";
import { ProductEntity } from "../models/product.entity";

type ScraperResult = {
  success: boolean;
  data?: Product[];
  totalSaved?: number;
  expectedCount?: number;
  error?: string;
};

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
                seoId: product.seo?.seoProductId || String(product.id),
                country: "unknown",
                category: category.name,
              };

              try {
                const productDetails = await this.getDetails(product);
                productData.country = productDetails.country;
                console.log("Saving product:", {
                  id: productData.id,
                  country: productData.country,
                  name: productData.name.substring(0, 20) + '...'
                });

                await this.productRepository.save(
                    this.productRepository.create(productData)
                );
                allProducts.push(productData);
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Failed to save product ${product.id}:`, {
                  error: errorMessage,
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

  async getDetails(productData: { id: string }): Promise<{ country: string }> {
    try {
      const details = await this.detailsConnector.getProductDetails(productData.id);

      if (!details || !Array.isArray(details) || details.length === 0) {
        console.log(`No details found for product ${productData.id}`);
        return { country: "unknown" };
      }

      let originSection = details.find(section => section.sectionType === "origin");
      let componentsToSearch

      if (originSection && originSection.components) {
        componentsToSearch = originSection.components;
      } else {

        const accordionSection = details.find(section => section.sectionType === "accordion");
        if (accordionSection && accordionSection.components?.[0]?.datatype === "accordion") {
          const accordionContent = accordionSection.components[0].sections?.find(
              (sec: any) => sec.title?.value === "SKŁAD, PIELĘGNACJA I POCHODZENIE"
          )?.content;
          if (accordionContent) {
            componentsToSearch = accordionContent
          }
        }
      }

      if (!componentsToSearch) {
        console.log(`Origin section not found for product ${productData.id}`);
        return { country: "unknown" };
      }

      const countryComponent = componentsToSearch.find((comp: any) =>
          comp.datatype === "paragraph" &&
          comp.text?.value?.startsWith("Wyprodukowano w")
      );

      const countryText = countryComponent?.text?.value;
      if (!countryText) {
        console.log(`Country text not found in origin section for product ${productData.id}`);
        return { country: "unknown" };
      }

      const country = countryText.replace('Wyprodukowano w ', '').trim();
      console.log(`Extracted country for product ${productData.id}: ${country}`);
      return { country };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Details error for product ${productData.id}: ${errorMessage}`);
      return { country: "unknown" };
    }
  }


  async runScraper(): Promise<ScraperResult> {
    try {

      const relevantIndexes = await this.getCategories();
      if (relevantIndexes.length === 0) {
        return { success: false, data: [] };
      }

      const products = await this.getProducts(relevantIndexes);
      return {
        success: true,
        data: products,
        totalSaved: products.length,
        expectedCount: await this.countProducts()
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Scraper fatal error:", errorMessage);
      return {
        success: false,
        data: [],
        error: errorMessage
      };
    }
  }
}
