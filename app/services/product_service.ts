import app from "@adonisjs/core/services/app"
import { readdir, readFile } from "fs/promises"
import { MarkdownFile } from "@dimerapp/markdown"
import { Exception } from "@adonisjs/core/exceptions";

export default class ProductService {
  static  getSlugUrl(slug: string) {
    if (!slug.endsWith('.md')) {
      slug += '.md';
    }

    return app.makeURL(`resources/products/${slug}`);
  
  }

  static async getSlugs() {
    const files = await readdir(app.makePath('resources/products'));
    return files.map(file => file.replace('.md', ''));
  }

  static async read(slug: string) {
      try {
          const url = this.getSlugUrl(slug)
          const file = await readFile(url, 'utf-8')
          const md = new MarkdownFile(file)

          await md.process()
          return md
      } catch (error) {
          throw new Exception(`could not find product called ${slug}`, {
              code: 'E_NOT_FOUND',
              status: 404
          })
      }
  }
}
      
