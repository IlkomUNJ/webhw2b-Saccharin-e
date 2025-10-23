import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Guest middleware is used to deny access to authenticated users
 * on routes like login/register
 */
export default class GuestMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.auth.isAuthenticated) {
      // Redirect authenticated users based on their role
      const user = ctx.auth.user!
      if (user.role === 'seller') {
        return ctx.response.redirect().toRoute('seller.dashboard.index')
      }
      return ctx.response.redirect().toRoute('dashboard.index')
    }
    
    return next()
  }
}
