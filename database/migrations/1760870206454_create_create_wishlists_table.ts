import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wishlists'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.string('product_slug', 255).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Foreign key to users table
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      
      // Unique constraint - user can only wishlist a product once
      table.unique(['user_id', 'product_slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}