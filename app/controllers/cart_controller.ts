import type { HttpContext } from '@adonisjs/core/http'
import ProductVM from '#view_models/product'

/**
 * CartController handles shopping cart operations
 * Following SRP: Only responsible for cart-related HTTP requests
 */
export default class CartController {
  /**
   * Display the shopping cart page
   */
  async index({ view, session, auth, logger }: HttpContext) {
    // Log session info for debugging
    const sessionId = session.sessionId
    const userId = auth.user?.id || 'guest'
    logger.info(`Cart view - Session: ${sessionId}, User: ${userId}`)
    
    // Get cart items from session (array of { slug, quantity })
    let cartData = session.get('cart', [])
    
    // Validate cart is an array (handle corrupted data)
    if (!Array.isArray(cartData)) {
      logger.warn(`Cart data is not an array for user ${userId}, resetting to empty array`)
      cartData = []
      session.put('cart', [])
    }
    
    logger.info(`Cart items for user ${userId}:`, cartData.length)

    // Fetch actual product data
    const cartItemsWithProducts = []

    for (const cartItem of cartData) {
      try {
        // Use ProductVM to support both database and markdown products
        const product = await ProductVM.find(cartItem.slug)
        if (product) {
          cartItemsWithProducts.push({
            id: cartItem.slug,
            slug: cartItem.slug,
            name: product.title,
            summary: product.summary || product.description,
            image: product.image || `https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop&q=80`,
            price: product.price,
            quantity: cartItem.quantity,
          })
        } else {
          logger.warn(`Product not found for slug: ${cartItem.slug}`)
        }
      } catch (error) {
        logger.error(`Error loading product ${cartItem.slug}:`, error)
        // Skip items that can't be loaded
        continue
      }
    }

    // Group items by vendor (for now, all items are from "Cozy Kitchen")
    const cartItems = [
      {
        vendor: 'Cozy Kitchen',
        items: cartItemsWithProducts,
      },
    ]

    // Calculate totals
    let totalItems = 0
    let subtotal = 0
    
    for (const item of cartItemsWithProducts) {
      totalItems += item.quantity
      subtotal += item.price * item.quantity
    }

    const summary = {
      totalItems,
      subtotal,
      total: subtotal,
    }

    return view.render('pages/cart/index', { cartItems, summary })
  }

  /**
   * Add item to cart
   */
  async store({ request, response, session, logger, auth }: HttpContext) {
    try {
      const { slug, quantity = 1 } = request.only(['slug', 'quantity'])
      const sessionId = session.sessionId
      const userId = auth.user?.id || 'guest'
      
      logger.info(`Adding to cart - Session: ${sessionId}, User: ${userId}, slug: ${slug}, quantity: ${quantity}`)
      
      // Validate that slug exists
      if (!slug) {
        logger.warn('No slug provided')
        session.flash('error', 'Product slug is required')
        const referer = request.header('referer') || '/products'
        return response.redirect(referer)
      }
      
      // Get current cart from session
      let cart = session.get('cart', [])
      
      // Validate cart is an array
      if (!Array.isArray(cart)) {
        logger.warn('Cart data corrupted, resetting to empty array')
        cart = []
      }
      
      logger.info('Current cart items:', cart.length)
      
      // Type cast cart for type safety
      const typedCart = cart as Array<{ slug: string; quantity: number }>
      
      // Check if item already exists
      const existingItem = typedCart.find((item) => item.slug === slug)
      
      if (existingItem) {
        existingItem.quantity += Number(quantity)
        logger.info('Updated existing item, new quantity:', existingItem.quantity)
      } else {
        typedCart.push({ slug, quantity: Number(quantity) })
        logger.info('Added new item to cart')
      }
      
      // Save back to session
      session.put('cart', typedCart)
      logger.info('Cart saved to session')
      
      session.flash('success', 'Product added to cart')
      
      const referer = request.header('referer') || '/products'
      return response.redirect(referer)
    } catch (error) {
      logger.error('Error adding to cart:', error)
      session.flash('error', 'Failed to add product to cart')
      
      const referer = request.header('referer') || '/products'
      return response.redirect(referer)
    }
  }

  /**
   * Update cart item quantity
   */
  async update({ params, request, response, session, logger }: HttpContext) {
    try {
      const { slug } = params
      const { quantity } = request.only(['quantity'])
      
      logger.info('Updating cart item - slug:', slug, 'quantity:', quantity)
      
      // Get current cart from session
      let cart = session.get('cart', [])
      
      // Validate cart is an array
      if (!Array.isArray(cart)) {
        logger.warn('Cart data corrupted, resetting to empty array')
        cart = []
      }
      
      const typedCart = cart as Array<{ slug: string; quantity: number }>
      logger.info('Current cart:', typedCart.length)
      
      // Find and update the item
      const item = typedCart.find((item) => item.slug === slug)
      if (item) {
        item.quantity = Number(quantity)
        logger.info('Updated item quantity to:', item.quantity)
        
        // Remove if quantity is 0
        if (item.quantity <= 0) {
          const index = typedCart.indexOf(item)
          typedCart.splice(index, 1)
          logger.info('Removed item from cart (quantity was 0)')
        }
      } else {
        logger.warn('Item not found in cart:', slug)
      }
      
      // Save back to session
      session.put('cart', typedCart)
      logger.info('Cart updated in session')
      session.flash('success', 'Cart updated')
      
      const referer = request.header('referer') || '/cart'
      return response.redirect(referer)
    } catch (error) {
      logger.error('Error updating cart:', error)
      session.flash('error', 'Failed to update cart')
      const referer = request.header('referer') || '/cart'
      return response.redirect(referer)
    }
  }

  /**
   * Remove item from cart
   */
  async destroy({ params, request, response, session, logger }: HttpContext) {
    try {
      const { slug } = params
      
      logger.info('Removing item from cart - slug:', slug)
      
      // Get current cart from session
      let cart = session.get('cart', [])
      
      // Validate cart is an array
      if (!Array.isArray(cart)) {
        logger.warn('Cart data corrupted, resetting to empty array')
        cart = []
      }
      
      const typedCart = cart as Array<{ slug: string; quantity: number }>
      logger.info('Current cart:', typedCart.length)
      
      // Filter out the item
      const updatedCart = typedCart.filter((item) => item.slug !== slug)
      logger.info('Updated cart after removal:', updatedCart.length)
      
      // Save back to session
      session.put('cart', updatedCart)
      logger.info('Cart saved to session')
      session.flash('success', 'Item removed from cart')
      
      const referer = request.header('referer') || '/cart'
      return response.redirect(referer)
    } catch (error) {
      logger.error('Error removing item from cart:', error)
      session.flash('error', 'Failed to remove item')
      const referer = request.header('referer') || '/cart'
      return response.redirect(referer)
    }
  }
}
