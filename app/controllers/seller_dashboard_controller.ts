import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import ProductVM from '#view_models/product'
import db from '@adonisjs/lucid/services/db'

export default class SellerDashboardController {
  /**
   * Display seller dashboard with statistics
   */
  async index({ auth, view }: HttpContext) {
    const seller = auth.getUserOrFail()

    // Get seller's product count
    const productCount = await db
      .from('products')
      .where('seller_id', seller.id)
      .count('* as total')

    // Get all orders (for now, showing all orders - can be filtered by seller products later)
    const totalOrders = await Order.query().count('* as total')
    const totalRevenue = await Order.query().sum('total as revenue')
    
    // Get recent orders
    const recentOrders = await Order.query()
      .preload('items')
      .orderBy('created_at', 'desc')
      .limit(10)

    // Get order statistics by status
    const ordersByStatus = await db
      .from('orders')
      .select('status')
      .count('* as count')
      .groupBy('status')

    // Calculate statistics
    const stats = {
      totalProducts: productCount[0]?.total || 0,
      totalOrders: totalOrders[0].$extras.total || 0,
      totalRevenue: totalRevenue[0].$extras.revenue || 0,
      pendingOrders: ordersByStatus.find(s => s.status === 'pending')?.count || 0,
      completedOrders: ordersByStatus.find(s => s.status === 'delivered')?.count || 0,
    }

    return view.render('pages/seller/dashboard/index', {
      stats,
      recentOrders,
      ordersByStatus
    })
  }

  /**
   * View all orders for seller
   */
  async orders({ auth, view, request }: HttpContext) {
    auth.getUserOrFail()
    const page = request.input('page', 1)
    const status = request.input('status', '')

    let query = Order.query().preload('items').orderBy('created_at', 'desc')

    // Filter by status if provided
    if (status) {
      query = query.where('status', status)
    }

    const orders = await query.paginate(page, 20)

    return view.render('pages/seller/dashboard/orders', {
      orders,
      currentStatus: status
    })
  }

  /**
   * View order details
   */
  async showOrder({ auth, params, view, response, logger }: HttpContext) {
    auth.getUserOrFail()

    const order = await Order.query()
      .where('id', params.id)
      .preload('items')
      .preload('user')
      .first()

    if (!order) {
      return response.notFound('Order not found')
    }

    // Load product details for each order item (same as user orders)
    const allProducts = await ProductVM.all()
    logger.info(`Seller viewing order #${order.id} - Total products available: ${allProducts.length}`)
    logger.info(`Order items count: ${order.items.length}`)
    
    const orderItemsWithProducts = order.items.map(item => {
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

    return view.render('pages/seller/dashboard/order-details', {
      order,
      orderItems: orderItemsWithProducts
    })
  }

  /**
   * Update order status
   */
  async updateOrderStatus({ auth, params, request, session, response }: HttpContext) {
    auth.getUserOrFail()
    const newStatus = request.input('status')

    const order = await Order.find(params.id)

    if (!order) {
      session.flash('error', 'Order not found')
      return response.redirect().back()
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
      session.flash('error', 'Invalid status')
      return response.redirect().back()
    }

    order.status = newStatus
    await order.save()

    session.flash('success', `Order status updated to ${newStatus}`)
    return response.redirect().back()
  }

  /**
   * View wishlist insights for seller's products
   */
  async wishlistInsights({ auth, view }: HttpContext) {
    const seller = auth.getUserOrFail()

    // Get wishlist counts for seller's products
    const productWishlists = await db
      .from('products')
      .leftJoin('wishlists', 'products.slug', 'wishlists.product_slug')
      .where('products.seller_id', seller.id)
      .select('products.id', 'products.slug', 'products.title', 'products.image', 'products.category', 'products.price')
      .count('wishlists.id as wishlist_count')
      .groupBy('products.id', 'products.slug', 'products.title', 'products.image', 'products.category', 'products.price')
      .orderBy('wishlist_count', 'desc')

    // Get total wishlists for all seller's products
    const totalWishlists = productWishlists.reduce((sum, p) => sum + Number(p.wishlist_count), 0)

    // Get products with most wishlists (top 5)
    const topProducts = productWishlists.slice(0, 5)

    // Get category breakdown
    const categoryStats = productWishlists.reduce((acc: any, product: any) => {
      const category = product.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { category, count: 0, wishlists: 0 }
      }
      acc[category].count++
      acc[category].wishlists += Number(product.wishlist_count)
      return acc
    }, {})

    const categoryBreakdown = Object.values(categoryStats).sort((a: any, b: any) => b.wishlists - a.wishlists)

    return view.render('pages/seller/dashboard/wishlist-insights', {
      productWishlists,
      totalWishlists,
      topProducts,
      categoryBreakdown,
      totalProducts: productWishlists.length
    })
  }
}
