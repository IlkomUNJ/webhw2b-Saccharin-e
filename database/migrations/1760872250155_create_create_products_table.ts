import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('seller_id').unsigned().notNullable()
      table.string('slug', 255).notNullable().unique()
      table.string('title', 255).notNullable()
      table.text('description').notNullable()
      table.text('excerpt').nullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('category', 100).nullable()
      table.string('image', 500).nullable()
      table.integer('stock').unsigned().defaultTo(0)
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Foreign key to users table
      table.foreign('seller_id').references('id').inTable('users').onDelete('CASCADE')
      
      // Index for faster queries
      table.index('seller_id')
      table.index('category')
      table.index('is_active')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}