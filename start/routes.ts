/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import RedisController from '#controllers/redis_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const ProductsController = () => import('#controllers/products_controller')
const CartController = () => import('#controllers/cart_controller')
const AuthController = () => import('#controllers/auth_controller')
const WishlistsController = () => import('#controllers/wishlists_controller')
const OrdersController = () => import('#controllers/orders_controller')
const SellerDashboardController = () => import('#controllers/seller_dashboard_controller')
const SellerProductsController = () => import('#controllers/seller_products_controller')

router.get('/',[ProductsController, 'index'] ).as('home')

// Auth routes
router.group(() => {
  router.get('/register', [AuthController, 'showRegister']).as('register')
  router.post('/register', [AuthController, 'register'])
  router.get('/login', [AuthController, 'showLogin']).as('login')
  router.post('/login', [AuthController, 'login'])
}).middleware(middleware.guest())

router.post('/logout', [AuthController, 'logout']).as('logout').middleware(middleware.auth())

// User Dashboard routes
const DashboardController = () => import('#controllers/dashboard_controller')
router.group(() => {
  router.get('/dashboard', [DashboardController, 'index']).as('dashboard.index')
  router.get('/dashboard/search', [DashboardController, 'search']).as('dashboard.search')
}).middleware(middleware.auth())

// Wishlist routes
router.group(() => {
  router.get('/wishlist', [WishlistsController, 'index']).as('wishlist.index')
  router.post('/wishlist', [WishlistsController, 'store']).as('wishlist.store')
  router.delete('/wishlist/:slug', [WishlistsController, 'destroy']).as('wishlist.destroy')
  router.get('/wishlist/check/:slug', [WishlistsController, 'check']).as('wishlist.check')
}).middleware(middleware.auth())

// Order routes
router.group(() => {
  router.get('/orders', [OrdersController, 'index']).as('orders.index')
  router.get('/orders/checkout', [OrdersController, 'checkout']).as('orders.checkout')
  router.post('/orders', [OrdersController, 'store']).as('orders.store')
  router.get('/orders/:id', [OrdersController, 'show']).as('orders.show')
  router.post('/orders/:id/cancel', [OrdersController, 'cancel']).as('orders.cancel')
}).middleware(middleware.auth())

// Seller Dashboard routes
router.group(() => {
  router.get('/seller/dashboard', [SellerDashboardController, 'index']).as('seller.dashboard.index')
  router.get('/seller/orders', [SellerDashboardController, 'orders']).as('seller.orders.index')
  router.get('/seller/orders/:id', [SellerDashboardController, 'showOrder']).as('seller.orders.show')
  router.post('/seller/orders/:id/status', [SellerDashboardController, 'updateOrderStatus']).as('seller.orders.updateStatus')
  router.get('/seller/wishlist-insights', [SellerDashboardController, 'wishlistInsights']).as('seller.wishlist.insights')
  
  // Product management routes
  router.get('/seller/products', [SellerProductsController, 'index']).as('seller.products.index')
  router.get('/seller/products/create', [SellerProductsController, 'create']).as('seller.products.create')
  router.post('/seller/products', [SellerProductsController, 'store']).as('seller.products.store')
  router.get('/seller/products/:id/edit', [SellerProductsController, 'edit']).as('seller.products.edit')
  router.post('/seller/products/:id', [SellerProductsController, 'update']).as('seller.products.update')
  router.post('/seller/products/:id/delete', [SellerProductsController, 'destroy']).as('seller.products.destroy')
}).middleware([middleware.auth(), middleware.seller()])

// Static pages
router.on('/about').render('pages/about').as('about')
router.on('/contact').render('pages/contact').as('contact')

// Products routes
router.get('/products', [ProductsController, 'all']).as('products.index')
router
    .get('/products/:slug', [ProductsController, 'show'])
    .as('products.show')
    .where('slug', router.matchers.slug())

// Cart routes
router.get('/cart', [CartController, 'index']).as('cart.index')
router.post('/cart', [CartController, 'store']).as('cart.store')
router.post('/cart/:slug/update', [CartController, 'update']).as('cart.update')
router.post('/cart/:slug/delete', [CartController, 'destroy']).as('cart.destroy')

router.delete('/redis/flush', [RedisController, 'flush']).as('redis.flush')
router.delete('/redis/:slug', [RedisController, 'destroy']).as('redis.destroy')    