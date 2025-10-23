import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import string from '@adonisjs/core/helpers/string'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare sellerId: number

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare excerpt: string | null

  @column()
  declare price: number

  @column()
  declare category: string | null

  @column()
  declare image: string | null

  @column()
  declare stock: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'sellerId',
  })
  declare seller: BelongsTo<typeof User>

  /**
   * Generate slug from title
   */
  static async generateSlug(title: string, excludeId?: number): Promise<string> {
    let slug = string.slug(title, { lower: true })
    
    // Check if slug exists
    let query = this.query().where('slug', slug)
    if (excludeId) {
      query = query.andWhereNot('id', excludeId)
    }
    
    const existingProduct = await query.first()
    
    if (existingProduct) {
      // Append timestamp to make it unique
      slug = `${slug}-${Date.now()}`
    }
    
    return slug
  }
}