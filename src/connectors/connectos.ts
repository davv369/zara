import axios, { AxiosResponse } from 'axios';

// Losowe User-Agenty, żeby uniknąć blokady
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/537.36',
];

const BASE_URL = 'https://www.zara.com/pl/pl';

class BaseConnector {
    protected async fetchData(url: string, headers: Record<string, string> = {}): Promise<any> {
        try {

            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)], // Losowy User-Agent
                    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': BASE_URL,
                    'DNT': '1', // "Do Not Track"
                    'Connection': 'keep-alive',
                    ...headers, // Możliwość dodania własnych nagłówków
                },
            });

            return response.data;
        } catch (error: any) {
            console.error(`❌ Error fetching data from ${url}:`, error.message);
            return null;
        }
    }
}

export class CategoryConnector extends BaseConnector {
    async getCategories(): Promise<any> {
        return this.fetchData(`${BASE_URL}/categories?ajax=true`);
    }
}

export class ProductConnector extends BaseConnector {
    async getProducts(categoryId: string): Promise<any> {
        return this.fetchData(`${BASE_URL}/category/${categoryId}/products?ajax=true`);
    }
}

export class DetailsConnector extends BaseConnector {
    async getProductDetails(productId: string): Promise<any> {
        return this.fetchData(`${BASE_URL}/product/${productId}/extra-detail?ajax=true`);
    }
}
