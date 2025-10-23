import type { HttpContext } from '@adonisjs/core/http'
import ProductVM from '#view_models/product'

export default class ProductsController {

  async index({ view }: HttpContext) {

    const products = await ProductVM.all()

    return view.render('pages/home', { products })
  }

  async all({ view, request }: HttpContext) {

    let products = await ProductVM.all()
    const selectedCategory = request.input('category', 'all')
    
    // Get unique categories for filter buttons
    const categories = [...new Set(products.map(p => p.category))].sort()
    
    // Filter products by category if not 'all'
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory)
    }

    return view.render('pages/products/index', { 
      products, 
      categories,
      selectedCategory 
    })
  }
  
  async show({ view, params, response, session }: HttpContext) {
    const product = await ProductVM.find(params.slug)

    if (!product) {
      session.flash('error', 'Product not found')
      return response.redirect().toRoute('products.index')
    }

    return view.render('pages/products/show', { product })
  }
  
}