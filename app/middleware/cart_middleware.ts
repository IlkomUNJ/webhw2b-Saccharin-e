import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

/**
 * Cart middleware shares cart data with all views
 */
export default class CartMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Make cart count available to all views
    let cart = ctx.session.get('cart', [])
    
    // Ensure cart is always an array (handle corrupted session data)
    if (!Array.isArray(cart)) {
      cart = []
      ctx.session.put('cart', [])
    }
    
    const cartCount = (cart as Array<{ slug: string; quantity: number }>).reduce(
      (total: number, item: { slug: string; quantity: number }) => total + (item.quantity || 0),
      0
    )
    
    // Share auth state with all views (auth is now initialized)
    let isAuthenticated = false
    let user = null
    
    try {
      await ctx.auth.check()
      isAuthenticated = ctx.auth.isAuthenticated
      user = ctx.auth.user || null
    } catch (error) {
      // Silently fail if not authenticated
    }
    
    ctx.view.share({ 
      cartCount,
      auth: {
        isAuthenticated,
        user,
      },
    })

    return next()
  }
}
