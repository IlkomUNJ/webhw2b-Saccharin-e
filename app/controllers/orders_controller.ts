import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import ProductVM from '#view_models/product'
import db from '@adonisjs/lucid/services/db'

export default class OrdersController {
  /**
   * Display user's order history
   */
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()
    
    const orders = await Order.query()
      .where('user_id', user.id)
      .preload('items')
      .orderBy('created_at', 'desc')

    return view.render('pages/orders/index', {
      orders
    })
  }

  /**
   * Display order details
   */
  async show({ auth, params, view, response, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    
    const order = await Order.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('items')
      .first()

    if (!order) {
      return response.notFound('Order not found')
    }

    // Load product details for each order item
    const allProducts = await ProductVM.all()
    logger.info(`Total products available: ${allProducts.length}`)
    logger.info(`Order items count: ${order.items.length}`)
    
    // Log all available product slugs
    const productSlugs = allProducts.map(p => p.slug)
    logger.info(`Available product slugs: ${JSON.stringify(productSlugs)}`)
    
    const orderItemsWithProducts = order.items.map(item => {
      logger.info(`Looking for product with slug: "${item.productSlug}" (trimmed: "${item.productSlug.trim()}")`)
      
      const product = allProducts.find(p => p.slug === item.productSlug.trim())
      
      logger.info(`Item slug: ${item.productSlug}, Product found: ${!!product}`)
      if (product) {
        logger.info(`Product data: title="${product.title}", image="${product.image}"`)
      } else {
        logger.warn(`Product not found for slug: "${item.productSlug}"`)
      }
      
      return {
        id: item.id,
        orderId: item.orderId,
        productSlug: item.productSlug,
        quantity: item.quantity,
        price: item.price,
        product: product ? {
          slug: product.slug,
          title: product.title,
          summary: product.summary,
          image: product.image,
          price: product.price
        } : null
      }
    })
    
    logger.info(`Total items with product data: ${orderItemsWithProducts.filter(i => i.product).length}`)
    logger.info(`Total items without product data: ${orderItemsWithProducts.filter(i => !i.product).length}`)

    return view.render('pages/orders/show', {
      order,
      orderItems: orderItemsWithProducts
    })
  }

  /**
   * Show checkout form
   */
  async checkout({ auth, view, session, response }: HttpContext) {
    auth.getUserOrFail()
    
    // Get cart from session (cart is an array)
    let cart = session.get('cart', [])
    
    // Ensure cart is an array
    if (!Array.isArray(cart)) {
      cart = []
    }
    
    const cartItems = cart as Array<{ slug: string; quantity: number }>

    if (cartItems.length === 0) {
      session.flash('error', 'Your cart is empty')
      return response.redirect().toRoute('cart.index')
    }

    // Load products for cart items
    const allProducts = await ProductVM.all()
    const cartItemsWithProducts = cartItems.map((item) => {
      const product = allProducts.find(p => p.slug === item.slug)
      return {
        ...item,
        product
      }
    })

    // Calculate total
    const total = cartItemsWithProducts.reduce((sum: number, item: any) => {
      return sum + (item.product?.price || 0) * item.quantity
    }, 0)

    return view.render('pages/orders/checkout', {
      cartItems: cartItemsWithProducts,
      total
    })
  }

  /**
   * Process checkout and create order
   */
  async store({ auth, request, session, response, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    
    // Get cart from session (cart is an array)
    let cart = session.get('cart', [])
    
    // Ensure cart is an array
    if (!Array.isArray(cart)) {
      cart = []
    }
    
    const cartItems = cart as Array<{ slug: string; quantity: number }>

    if (cartItems.length === 0) {
      session.flash('error', 'Your cart is empty')
      return response.redirect().toRoute('cart.index')
    }

    // Validate request
    const data = request.only(['shipping_address', 'payment_method', 'notes'])

    if (!data.shipping_address || !data.payment_method) {
      session.flash('error', 'Please fill in all required fields')
      return response.redirect().back()
    }

    // Load products to calculate total
    const allProducts = await ProductVM.all()
    let total = 0
    const orderItemsData: any[] = []

    for (const item of cartItems) {
      const product = allProducts.find(p => p.slug === item.slug)
      if (product) {
        const itemTotal = product.price * item.quantity
        total += itemTotal
        orderItemsData.push({
          productSlug: item.slug,
          quantity: item.quantity,
          price: product.price
        })
        logger.info(`Order item added: slug="${item.slug}", quantity=${item.quantity}, price=${product.price}`)
      } else {
        logger.warn(`Product not found for slug: "${item.slug}"`)
      }
    }

    // Create order in a transaction
    const trx = await db.transaction()

    try {
      const order = await Order.create({
        userId: user.id,
        total,
        status: 'pending',
        shippingAddress: data.shipping_address,
        paymentMethod: data.payment_method,
        notes: data.notes || null
      }, { client: trx })

      // Create order items
      for (const itemData of orderItemsData) {
        await OrderItem.create({
          orderId: order.id,
          ...itemData
        }, { client: trx })
      }

      await trx.commit()

      // Clear cart (cart is an array)
      session.put('cart', [])
      session.flash('success', 'Order placed successfully!')

      return response.redirect().toRoute('orders.show', { id: order.id })
    } catch (error) {
      await trx.rollback()
      console.error('Order creation error:', error)
      session.flash('error', 'Failed to create order. Please try again.')
      return response.redirect().back()
    }
  }

  /**
   * Cancel an order (only if pending)
   */
  async cancel({ auth, params, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    
    const order = await Order.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .first()

    if (!order) {
      session.flash('error', 'Order not found')
      return response.redirect().toRoute('orders.index')
    }

    if (order.status !== 'pending') {
      session.flash('error', 'Only pending orders can be cancelled')
      return response.redirect().back()
    }

    order.status = 'cancelled'
    await order.save()

    session.flash('success', 'Order cancelled successfully')
    return response.redirect().toRoute('orders.show', { id: order.id })
  }
}
