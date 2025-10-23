import Product from '#models/product'
import ProductService from '#services/product_service'
import { toHtml } from '@dimerapp/markdown/utils'

/**
 * ProductVM provides a unified interface for products from both database and markdown files
 */
export default class ProductVM {
  declare id?: number
  declare sellerId?: number
  declare slug: string
  declare title: string
  declare description: string
  declare excerpt?: string | null
  declare price: number
  declare category?: string | null
  declare image?: string | null
  declare stock?: number
  declare isActive?: boolean
  declare sellerName?: string
  declare abstract?: string
  declare summary?: string

  /**
   * Get all products (from database and markdown files)
   */
  static async all(): Promise<ProductVM[]> {
    const products: ProductVM[] = []

    // Get database products
    const dbProducts = await Product.query()
      .where('is_active', true)
      .preload('seller')
      .orderBy('created_at', 'desc')

    for (const dbProduct of dbProducts) {
      products.push(this.fromDatabaseProduct(dbProduct))
    }

    // Get markdown products (for backward compatibility)
    try {
      const slugs = await ProductService.getSlugs()
      for (const slug of slugs) {
        const md = await ProductService.read(slug)
        const product = new ProductVM()
        product.slug = slug
        product.title = md.frontmatter.title
        product.summary = md.frontmatter.summary
        product.description = md.frontmatter.summary || ''
        product.excerpt = md.frontmatter.summary
        product.price = md.frontmatter.price
        product.category = md.frontmatter.category
        product.image = md.frontmatter.image || `https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop&q=80`
        product.abstract = toHtml(md).contents
        product.isActive = true
        product.stock = 999 // Default stock for markdown products
        products.push(product)
      }
    } catch (error) {
      // If markdown files don't exist, just continue with database products
      console.log('No markdown products found or error reading them')
    }

    return products
  }

  /**
   * Find a product by slug (checks database first, then markdown)
   */
  static async find(slug: string): Promise<ProductVM | null> {
    // Try database first
    const dbProduct = await Product.query()
      .where('slug', slug)
      .preload('seller')
      .first()

    if (dbProduct) {
      return this.fromDatabaseProduct(dbProduct)
    }

    // Try markdown files
    try {
      const md = await ProductService.read(slug)
      const product = new ProductVM()
      product.slug = slug
      product.title = md.frontmatter.title
      product.summary = md.frontmatter.summary
      product.description = md.frontmatter.summary || ''
      product.excerpt = md.frontmatter.summary
      product.price = md.frontmatter.price
      product.category = md.frontmatter.category
      product.image = md.frontmatter.image || `https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop&q=80`
      product.abstract = toHtml(md).contents
      product.isActive = true
      product.stock = 999
      return product
    } catch (error) {
      return null
    }
  }

  /**
   * Convert database Product model to ProductVM
   */
  private static fromDatabaseProduct(dbProduct: Product): ProductVM {
    const product = new ProductVM()
    product.id = dbProduct.id
    product.sellerId = dbProduct.sellerId
    product.slug = dbProduct.slug
    product.title = dbProduct.title
    product.description = dbProduct.description
    product.excerpt = dbProduct.excerpt
    product.price = dbProduct.price
    product.category = dbProduct.category
    product.image = dbProduct.image || `https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop&q=80`
    product.stock = dbProduct.stock
    product.isActive = dbProduct.isActive
    product.abstract = dbProduct.description // Use description as abstract for database products
    product.summary = dbProduct.excerpt || dbProduct.description.substring(0, 150)
    
    if (dbProduct.seller) {
      product.sellerName = dbProduct.seller.fullName
    }
    
    return product
  }
}