import User from '#models/user'
import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

export default class AuthController {
  /**
   * Show registration form
   */
  async showRegister({ view }: HttpContext) {
    return view.render('pages/auth/register')
  }

  /**
   * Handle user registration
   */
  async register({ request, response, session, auth }: HttpContext) {
    const registerSchema = vine.object({
      fullName: vine.string().trim().minLength(2).maxLength(255),
      email: vine.string().email().normalizeEmail(),
      password: vine.string().minLength(8).maxLength(32),
      role: vine.enum(['user', 'seller']),
      storeName: vine.string().trim().minLength(2).maxLength(255).optional(),
      storeDescription: vine.string().trim().maxLength(1000).optional(),
    })

    try {
      const data = await vine.validate({ schema: registerSchema, data: request.all() })

      // Check if email already exists
      const existingUser = await User.findBy('email', data.email)
      if (existingUser) {
        session.flash('error', 'Email already registered')
        return response.redirect().back()
      }

      // Create user
      const user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        storeName: data.role === 'seller' ? data.storeName : null,
        storeDescription: data.role === 'seller' ? data.storeDescription : null,
      })

      // Automatically log in the user with remember me
      await auth.use('web').login(user, true)

      session.flash('success', `Welcome to CozyLiving, ${user.fullName}!`)
      
      // Redirect based on role
      if (user.role === 'seller') {
        return response.redirect().toRoute('seller.dashboard.index')
      }
      return response.redirect().toRoute('dashboard.index')
    } catch (error) {
      console.error('Registration error:', error)
      session.flash('error', 'Registration failed. Please try again.')
      return response.redirect().back()
    }
  }

  /**
   * Show login form
   */
  async showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * Handle login
   */
  async login({ request, response, auth, session }: HttpContext) {
    const loginSchema = vine.object({
      email: vine.string().email().normalizeEmail(),
      password: vine.string(),
    })

    try {
      const { email, password } = await vine.validate({ schema: loginSchema, data: request.all() })

      const user = await User.verifyCredentials(email, password)
      
      // Login with remember me token for persistent session
      await auth.use('web').login(user, true)

      session.flash('success', `Welcome back, ${user.fullName}!`)

      // Redirect based on role
      if (user.role === 'seller') {
        return response.redirect().toRoute('seller.dashboard.index')
      }
      return response.redirect().toRoute('dashboard.index')
    } catch (error) {
      console.error('Login error:', error)
      session.flash('error', 'Invalid email or password')
      return response.redirect().back()
    }
  }

  /**
   * Handle logout
   */
  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Logged out successfully')
    return response.redirect('/')
  }
}
