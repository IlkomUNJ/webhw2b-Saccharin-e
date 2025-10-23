import { HttpContext } from '@adonisjs/core/http'
import ProductVM from '#view_models/product'
import Wishlist from '#models/wishlist'
import Order from '#models/order'

export default class DashboardController {
  /**
   * Show user dashboard
   */
  async index({ view, auth }: HttpContext) {
    const user = auth.user!
    
    // Get all products for display
    const products = await ProductVM.all()
    
    // Get wishlist count
    const wishlistCount = await Wishlist.query().where('user_id', user.id).count('* as total')
    
    // Get orders with items
    const orders = await Order.query()
      .where('user_id', user.id)
      .preload('items')
      .orderBy('created_at', 'desc')
    
    // Get orders count
    const ordersCount = orders.length
    
    // Calculate total spent from all delivered/completed orders
    const totalSpent = orders
      .filter(order => order.status === 'delivered' || order.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0)
    
    return view.render('pages/dashboard/index', {
      user,
      products: products.slice(0, 8), // Show only 8 products on dashboard
      wishlistCount: wishlistCount[0].$extras.total,
      ordersCount: ordersCount,
      totalSpent: totalSpent,
      orders: orders.slice(0, 5), // Show only 5 recent orders on dashboard
    })
  }

  /**
   * Search products with filters
   */
  async search({ request, view, auth }: HttpContext) {
    const user = auth.user!
    const query = request.input('q', '')
    const category = request.input('category', '')
    const minPrice = parseFloat(request.input('min_price', '0'))
    const maxPrice = parseFloat(request.input('max_price', '999999'))
    const page = parseInt(request.input('page', '1'))
    const perPage = 12

    // Get all products
    let products = await ProductVM.all()

    // Apply search filter
    if (query) {
      const searchLower = query.toLowerCase()
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          (p.summary && p.summary.toLowerCase().includes(searchLower)) ||
          (p.category && p.category.toLowerCase().includes(searchLower))
      )
    }

    // Apply category filter
    if (category) {
      products = products.filter((p) => p.category && p.category.toLowerCase() === category.toLowerCase())
    }

    // Apply price filter
    products = products.filter((p) => {
      const price = p.price
      return price >= minPrice && price <= maxPrice
    })

    // Pagination
    const total = products.length
    const totalPages = Math.ceil(total / perPage)
    const start = (page - 1) * perPage
    const paginatedProducts = products.slice(start, start + perPage)

    // Get unique categories for filter
    const allProducts = await ProductVM.all()
    const categories = [...new Set(allProducts.map((p) => p.category))].sort()

    return view.render('pages/dashboard/search', {
      user,
      products: paginatedProducts,
      query,
      category,
      minPrice,
      maxPrice,
      page,
      totalPages,
      total,
      categories,
    })
  }
}
