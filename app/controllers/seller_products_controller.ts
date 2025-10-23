import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import { unlink } from 'node:fs/promises'

export default class SellerProductsController {
  /**
   * Display a list of seller's products
   */
  async index({ auth, view }: HttpContext) {
    const seller = auth.user!
    const products = await Product.query()
      .where('sellerId', seller.id)
      .orderBy('createdAt', 'desc')

    return view.render('pages/seller/products/index', { products })
  }

  /**
   * Display form to create a new product
   */
  async create({ view }: HttpContext) {
    return view.render('pages/seller/products/create')
  }

  /**
   * Handle product creation
   */
  async store({ auth, request, response, session }: HttpContext) {
    const seller = auth.user!
    const data = request.only([
      'title',
      'description',
      'excerpt',
      'price',
      'category',
      'stock',
      'isActive',
    ])

    // Generate unique slug
    const slug = await Product.generateSlug(data.title)

    // Handle image upload
    let imagePath: string | null = null
    const image = request.file('image', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (image) {
      const fileName = `${cuid()}.${image.extname}`
      await image.move(app.makePath('public/images/products'), {
        name: fileName,
      })
      imagePath = `/images/products/${fileName}`
    }

    // Create product
    await Product.create({
      sellerId: seller.id,
      slug,
      title: data.title,
      description: data.description,
      excerpt: data.excerpt,
      price: parseFloat(data.price),
      category: data.category,
      image: imagePath,
      stock: parseInt(data.stock),
      isActive: data.isActive === 'true' || data.isActive === true,
    })

    session.flash('success', 'Product created successfully!')
    return response.redirect().toRoute('seller.products.index')
  }

  /**
   * Display form to edit a product
   */
  async edit({ auth, params, view, response, session }: HttpContext) {
    const seller = auth.user!
    const product = await Product.query()
      .where('id', params.id)
      .where('sellerId', seller.id)
      .first()

    if (!product) {
      session.flash('error', 'Product not found')
      return response.redirect().toRoute('seller.products.index')
    }

    return view.render('pages/seller/products/edit', { product })
  }

  /**
   * Handle product update
   */
  async update({ auth, params, request, response, session }: HttpContext) {
    const seller = auth.user!
    const product = await Product.query()
      .where('id', params.id)
      .where('sellerId', seller.id)
      .first()

    if (!product) {
      session.flash('error', 'Product not found')
      return response.redirect().toRoute('seller.products.index')
    }

    const data = request.only([
      'title',
      'description',
      'excerpt',
      'price',
      'category',
      'stock',
      'isActive',
    ])

    // Update slug if title changed
    if (data.title !== product.title) {
      product.slug = await Product.generateSlug(data.title, product.id)
    }

    // Handle image upload
    const image = request.file('image', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (image) {
      // Delete old image if exists
      if (product.image) {
        try {
          await unlink(app.makePath(`public${product.image}`))
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }

      const fileName = `${cuid()}.${image.extname}`
      await image.move(app.makePath('public/images/products'), {
        name: fileName,
      })
      product.image = `/images/products/${fileName}`
    }

    // Update product
    product.merge({
      title: data.title,
      description: data.description,
      excerpt: data.excerpt,
      price: parseFloat(data.price),
      category: data.category,
      stock: parseInt(data.stock),
      isActive: data.isActive === 'true' || data.isActive === true,
    })

    await product.save()

    session.flash('success', 'Product updated successfully!')
    return response.redirect().toRoute('seller.products.index')
  }

  /**
   * Delete a product
   */
  async destroy({ auth, params, response, session }: HttpContext) {
    const seller = auth.user!
    const product = await Product.query()
      .where('id', params.id)
      .where('sellerId', seller.id)
      .first()

    if (!product) {
      session.flash('error', 'Product not found')
      return response.redirect().toRoute('seller.products.index')
    }

    // Delete image if exists
    if (product.image) {
      try {
        await unlink(app.makePath(`public${product.image}`))
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }

    await product.delete()

    session.flash('success', 'Product deleted successfully!')
    return response.redirect().toRoute('seller.products.index')
  }
}