import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Seller middleware is used to check if the authenticated user has the 'seller' role.
 * This middleware should be used on routes that are only accessible to sellers.
 */
export default class SellerMiddleware {
  async handle({ auth, response, session }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()

    // Check if user has seller role
    if (user.role !== 'seller') {
      session.flash('error', 'Access denied. This area is only accessible to sellers.')
      return response.redirect().toRoute('dashboard.index')
    }

    return next()
  }
}
