import type { HttpContext } from '@adonisjs/core/http'
import Wishlist from '#models/wishlist'
import ProductVM from '#view_models/product'

export default class WishlistsController {
  /**
   * Display user's wishlist
   */
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()
    
    // Get all wishlist items for the user
    const wishlistItems = await Wishlist.query().where('user_id', user.id).orderBy('created_at', 'desc')
    
    // Get product slugs from wishlist
    const productSlugs = wishlistItems.map(item => item.productSlug)
    
    // Load all products
    const allProducts = await ProductVM.all()
    
    // Filter products that are in the wishlist
    const wishlistedProducts = allProducts.filter(product => productSlugs.includes(product.slug))
    
    return view.render('pages/wishlist/index', {
      products: wishlistedProducts
    })
  }

  /**
   * Add product to wishlist
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const productSlug = request.input('product_slug')

    try {
      // Check if already in wishlist
      const existing = await Wishlist.query()
        .where('user_id', user.id)
        .where('product_slug', productSlug)
        .first()

      if (existing) {
        return response.badRequest({ message: 'Product already in wishlist' })
      }

      // Add to wishlist
      await Wishlist.create({
        userId: user.id,
        productSlug: productSlug
      })

      return response.ok({ message: 'Added to wishlist' })
    } catch (error) {
      return response.internalServerError({ message: 'Failed to add to wishlist' })
    }
  }

  /**
   * Remove product from wishlist
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const productSlug = params.slug

    try {
      const wishlistItem = await Wishlist.query()
        .where('user_id', user.id)
        .where('product_slug', productSlug)
        .first()

      if (!wishlistItem) {
        return response.notFound({ message: 'Product not in wishlist' })
      }

      await wishlistItem.delete()

      return response.ok({ message: 'Removed from wishlist' })
    } catch (error) {
      return response.internalServerError({ message: 'Failed to remove from wishlist' })
    }
  }

  /**
   * Check if product is in wishlist (for AJAX)
   */
  async check({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const productSlug = params.slug

    const exists = await Wishlist.query()
      .where('user_id', user.id)
      .where('product_slug', productSlug)
      .first()

    return response.ok({ inWishlist: !!exists })
  }
}
