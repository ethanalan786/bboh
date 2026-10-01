import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting product category migration...')

  // Create the new product categories based on the old enum values
  console.log('Creating product categories...')
  const categoryData = [
    { name: 'BURN_BOX', description: 'Burn Box products including smoothies and spritzers', isActive: true },
    { name: 'APPAREL', description: 'General apparel items', isActive: true },
    { name: 'DRINKS', description: 'Beverages and drinks', isActive: true },
    { name: 'ACCESSORIES', description: 'Accessories and add-ons', isActive: true },
    { name: 'WOMENS_APPAREL', description: 'Women\'s clothing and apparel', isActive: true },
    { name: 'MENS_APPAREL', description: 'Men\'s clothing and apparel', isActive: true }
  ]

  let createdCount = 0
  for (const category of categoryData) {
    try {
      await prisma.productCategory.create({ data: category })
      createdCount++
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`Category ${category.name} already exists, skipping...`)
      } else {
        throw error
      }
    }
  }
  console.log(`Created ${createdCount} product categories`)

  // Get the created categories
  const categoryMap = await prisma.productCategory.findMany()
  const categoryMapping = new Map(categoryMap.map(c => [c.name, c.id]))

  // Update existing products to use the new category references
  console.log('Updating existing products...')
  const products = await prisma.product.findMany()

  let updatedCount = 0
  let skippedCount = 0
  for (const product of products) {
    // The old category field might be undefined or have a string value
    const oldCategory = (product as any).category as string

    if (!oldCategory) {
      console.log(`Product ${product.name} has no category, skipping...`)
      skippedCount++
      continue
    }

    const newCategoryId = categoryMapping.get(oldCategory)

    if (newCategoryId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { categoryId: newCategoryId }
      })
      updatedCount++
    } else {
      console.warn(`No matching category found for product ${product.name} with category ${oldCategory}`)
      skippedCount++
    }
  }

  console.log(`Updated ${updatedCount} products to use new category references`)
  console.log(`Skipped ${skippedCount} products`)
  console.log('Migration completed successfully!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
