import { ProductFormData, CompletenessResult } from '../types/index.js';

export function calculateCompleteness(product: Partial<ProductFormData>): CompletenessResult {
  let score = 0;
  const missingFields: string[] = [];
  const recommendations: string[] = [];

  // Name (15 pts)
  if (product.name && product.name.trim().length >= 3) {
    score += 15;
  } else {
    missingFields.push('name');
    recommendations.push('Add a descriptive product title (min 3 characters).');
  }

  // SKU (15 pts)
  if (product.sku && product.sku.trim().length >= 2) {
    score += 15;
  } else {
    missingFields.push('sku');
    recommendations.push('Assign a unique SKU code.');
  }

  // Regular Price (15 pts)
  if (product.regularPrice !== undefined && product.regularPrice !== null && product.regularPrice > 0) {
    score += 15;
  } else {
    missingFields.push('regularPrice');
    recommendations.push('Set a valid regular price greater than ₹0.00.');
  }

  // Description (15 pts)
  if (product.description && product.description.trim().length >= 20) {
    score += 15;
  } else {
    missingFields.push('description');
    recommendations.push('Provide a rich product description (at least 20 characters).');
  }

  // Short Description (10 pts)
  if (product.shortDescription && product.shortDescription.trim().length >= 5) {
    score += 10;
  } else {
    missingFields.push('shortDescription');
    recommendations.push('Add a concise summary in the short description.');
  }

  // Images (15 pts: 10 for first, 5 for multiple)
  const images = Array.isArray(product.images) ? product.images : [];
  if (images.length >= 2) {
    score += 15;
  } else if (images.length === 1) {
    score += 10;
    recommendations.push('Upload secondary product images or gallery shots.');
  } else {
    missingFields.push('images');
    recommendations.push('Upload at least one high-resolution product image.');
  }

  // Categories (10 pts)
  const categories = Array.isArray(product.categories) ? product.categories : [];
  if (categories.length > 0) {
    score += 10;
  } else {
    missingFields.push('categories');
    recommendations.push('Assign this product to at least one category.');
  }

  // Attributes (10 pts)
  const attributes = Array.isArray(product.attributes) ? product.attributes : [];
  if (attributes.length > 0 && attributes.some(a => a.name && a.values && a.values.length > 0)) {
    score += 10;
  } else {
    missingFields.push('attributes');
    recommendations.push('Define specifications or custom attributes (e.g., Color, Size).');
  }

  // Clamp score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    missingFields,
    recommendations,
  };
}

export function validateProductData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Product name is required.');
  }

  if (!data.sku || typeof data.sku !== 'string' || data.sku.trim().length === 0) {
    errors.push('Product SKU is required.');
  } else if (data.sku.length > 64) {
    errors.push('Product SKU cannot exceed 64 characters.');
  }

  const regPrice = Number(data.regularPrice);
  if (isNaN(regPrice) || regPrice < 0) {
    errors.push('Regular price must be a non-negative number.');
  }

  if (data.salePrice !== undefined && data.salePrice !== null && data.salePrice !== '') {
    const salePrice = Number(data.salePrice);
    if (isNaN(salePrice) || salePrice < 0) {
      errors.push('Sale price must be a non-negative number.');
    } else if (salePrice >= regPrice && regPrice > 0) {
      errors.push('Sale price must be lower than the regular price.');
    }
  }

  if (data.stockQuantity !== undefined && data.stockQuantity !== null && data.stockQuantity !== '') {
    const stock = Number(data.stockQuantity);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.push('Stock quantity must be an integer equal to or greater than 0.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
