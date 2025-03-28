export interface Category {
    id: number;
    name: string;
    sectionName: string;
    subcategories: Subcategory[];
}

export interface Subcategory {
    id: number;
    name: string;
    sectionName: string;
    subcategories: Subcategory[];
    layout: string;
    contentType: string;
    gridLayout: string;
    seo?: object;
    attributes?: object;
    key: string;
    isRedirected: boolean;
    isSelected: boolean;
    hasSubcategories: boolean;
    irrelevant: boolean;
    menuLevel: number;
}

export interface CategoryResponse {
    categories: Category[];
}

export interface ProductResponse {
    id: number;
    name: string;
    price: number;
    images: string[];
}

export interface ProductDetailsResponse {
    id: number;
    description: string;
    specifications: object;
}

export interface Product {
    index: number;
    id: number;
    name: string;
    price: number;
    seoId: string;
    country?: string;
    category?: string;
    subcategory?: string; // Nowe pole na subkategorię
}

export interface ProductDetails {
    id: number;
    reference: string;
    type: string;
    kind: string;
    brand: {
        brandId: number;
        brandGroupId: number;
        brandGroupCode: string;
    };
    xmedia: any[]; // You can further define the structure if needed
    name: string;
    description: string;
    price: number;
    section: number;
    sectionName: string;
    familyName: string;
    subfamilyName: string;
    detail: {
        reference: string;
        displayReference: string;
        colors: Color[];
        pdpMedia: XMedia[];
        price: number;
        availability: string;
        extraInfo: { highlightPrice: boolean };
        canonicalReference: string;
    };
    seo: {
        keyword: string;
        seoProductId: string;
        discernProductId: number;
    };
    availability: string;
    attributes: { key: string; value: string }[];
    gridPosition: number;
    zoomedGridPosition: number;
    preservedBlockPosition: number;
    athleticzPosition: number;
    productTag: string[];
    colorList: string;
    isDivider: boolean;
    hasXmediaDouble: boolean;
    showExtraImageOnHover: boolean;
    showAvailability: boolean;
    priceUnavailable: boolean;
}

interface Color {
    id: string;
    productId: number;
    name: string;
    stylingId: string;
    outfitId: string;
    xmedia: XMedia[];
    pdpMedia: XMedia;
    price: number;
    availability: string;
    reference: string;
    extraInfo: { highlightPrice: boolean };
    canonicalReference: string;
}

interface XMedia {
    datatype: string;
    set: number;
    type: string;
    kind: string;
    path: string;
    name: string;
    width: number;
    height: number;
    timestamp: string;
    allowedScreens: string[];
    extraInfo: {
        originalName: string;
        assetId: string;
        deliveryUrl: string;
        deliveryPath: string;
    };
    url: string;
}


export enum EWomanCategories {
    JACKETS = 'MARYNARKI',
    COATS = 'KURTKI',
    DRESSES = 'SUKIENKI',
    SKIRTS = 'SPÓDNICE | SPODENKI',
    SHIRTS_BLOUSES = 'KOSZULE | BLUZKI',
    TROUSERS = 'SPODNIE',
    KOSZULE = 'KOSZULE',
    SHORTS = 'SPODENKI',
    TRENCH_COATS = 'KURTKI_COATS',
    VESTS = 'MARYNARKI | KAMIZELKI',
    SKIRTSV2 = 'SPÓDNICE',
    "TRENCHES" = 'PŁASZCZE | TRENCZE',
}
