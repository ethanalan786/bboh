import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.ingredientAdjustment.deleteMany()
  await prisma.burnBoxSale.deleteMany()
  await prisma.gymMasterSale.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.ingredient.deleteMany()
  await prisma.ingredientCategory.deleteMany()
  await prisma.stockHistory.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.product.deleteMany()
  await prisma.paymentMethod.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()

  console.log('Existing data cleared')

  // Seed users
  console.log('Seeding users...')
  
  const users = await prisma.user.createMany({
    data: [
      // Admin users
      {
        email: 'aimahusnain@gmail.com',
        password: '123',
        name: 'Muhammad Husnain',
        role: 'ADMIN',
        phone: '307-4241-757',
        address: '123 Admin St',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90210'
      },
      {
        email: 'admin2@burnbox.com',
        password: 'password123',
        name: 'Admin User 2',
        role: 'ADMIN',
        phone: '555-0102',
        address: '124 Admin St',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90210'
      },
      {
        email: 'admin3@burnbox.com',
        password: 'password123',
        name: 'Admin User 3',
        role: 'ADMIN',
        phone: '555-0103',
        address: '125 Admin St',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90210'
      },
      {
        email: 'admin4@burnbox.com',
        password: 'password123',
        name: 'Admin User 4',
        role: 'ADMIN',
        phone: '555-0104',
        address: '126 Admin St',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90210'
      },
      {
        email: 'admin5@burnbox.com',
        password: 'password123',
        name: 'Admin User 5',
        role: 'ADMIN',
        phone: '555-0105',
        address: '127 Admin St',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90210'
      },
      // Front Desk users
      {
        email: 'aima@gmail.com',
        password: '123456',
        name: 'Front Desk User 1',
        role: 'FRONT_DESK',
        phone: '555-0201',
        address: '234 Front Desk Ave',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90211'
      },
      {
        email: 'frontdesk2@burnbox.com',
        password: 'password123',
        name: 'Front Desk User 2',
        role: 'FRONT_DESK',
        phone: '555-0202',
        address: '235 Front Desk Ave',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90211'
      },
      {
        email: 'frontdesk3@burnbox.com',
        password: 'password123',
        name: 'Front Desk User 3',
        role: 'FRONT_DESK',
        phone: '555-0203',
        address: '236 Front Desk Ave',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90211'
      },
      {
        email: 'frontdesk4@burnbox.com',
        password: 'password123',
        name: 'Front Desk User 4',
        role: 'FRONT_DESK',
        phone: '555-0204',
        address: '237 Front Desk Ave',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90211'
      },
      {
        email: 'frontdesk5@burnbox.com',
        password: 'password123',
        name: 'Front Desk User 5',
        role: 'FRONT_DESK',
        phone: '555-0205',
        address: '238 Front Desk Ave',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90211'
      },
      // Customer users
      {
        email: 'customer1@burnbox.com',
        password: 'password123',
        name: 'Customer User 1',
        role: 'CUSTOMER',
        phone: '555-0301',
        address: '345 Customer Blvd',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90212'
      },
      {
        email: 'customer2@burnbox.com',
        password: 'password123',
        name: 'Customer User 2',
        role: 'CUSTOMER',
        phone: '555-0302',
        address: '346 Customer Blvd',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90212'
      },
      {
        email: 'customer3@burnbox.com',
        password: 'password123',
        name: 'Customer User 3',
        role: 'CUSTOMER',
        phone: '555-0303',
        address: '347 Customer Blvd',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90212'
      },
      {
        email: 'customer4@burnbox.com',
        password: 'password123',
        name: 'Customer User 4',
        role: 'CUSTOMER',
        phone: '555-0304',
        address: '348 Customer Blvd',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90212'
      },
      {
        email: 'customer5@burnbox.com',
        password: 'password123',
        name: 'Customer User 5',
        role: 'CUSTOMER',
        phone: '555-0305',
        address: '349 Customer Blvd',
        city: 'Burn Box City',
        state: 'CA',
        zipCode: '90212'
      }
    ]
  })
  
  console.log(`Created ${users.count} users`)

  // Seed payment methods
  console.log('Seeding payment methods...')
  const paymentMethods = await prisma.paymentMethod.createMany({
    data: [
      { name: 'Cash', description: 'Cash payments', isActive: true },
      { name: 'Credit Card', description: 'Credit card payments', isActive: true },
      { name: 'Debit Card', description: 'Debit card payments', isActive: true },
      { name: 'GymMaster', description: 'GymMaster system payments', isActive: true },
      { name: 'Gift Card', description: 'Gift card payments', isActive: true },
      { name: 'Store Credit', description: 'Store credit payments', isActive: true },
      { name: 'Check', description: 'Check payments', isActive: false },
      { name: 'Other', description: 'Other payment methods', isActive: true }
    ]
  })
  console.log(`Created ${paymentMethods.count} payment methods`)

  // Seed product categories
  console.log('Seeding product categories...')
  const productCategories = await prisma.productCategory.createMany({
    data: [
      { name: 'BURN_BOX', description: 'Burn Box products including smoothies and spritzers', isActive: true },
      { name: 'APPAREL', description: 'General apparel items', isActive: true },
      { name: 'DRINKS', description: 'Beverages and drinks', isActive: true },
      { name: 'ACCESSORIES', description: 'Accessories and add-ons', isActive: true },
      { name: 'WOMENS_APPAREL', description: 'Women\'s clothing and apparel', isActive: true },
      { name: 'MENS_APPAREL', description: 'Men\'s clothing and apparel', isActive: true }
    ]
  })
  console.log(`Created ${productCategories.count} product categories`)

  // Seed ingredient categories
  console.log('Seeding ingredient categories...')
  const categories = await prisma.ingredientCategory.createMany({
    data: [
      { name: 'Fruits', description: 'Fresh fruits and produce' },
      { name: 'Vegetables', description: 'Fresh vegetables' },
      { name: 'Dairy', description: 'Dairy products' },
      { name: 'Beverages', description: 'Drinks and liquids' },
      { name: 'Supplements', description: 'Protein powders and supplements' },
      { name: 'Spreads', description: 'Nut butters and spreads' },
      { name: 'Oils', description: 'Cooking oils' },
      { name: 'Sweeteners', description: 'Sugar and sweeteners' },
      { name: 'Flavorings', description: 'Extracts and flavorings' },
      { name: 'Baking', description: 'Baking ingredients' },
      { name: 'Grains', description: 'Grains and cereals' },
      { name: 'Seeds', description: 'Seeds and nuts' },
      { name: 'Garnishes', description: 'Decorative garnishes' },
      { name: 'Electrolytes', description: 'Electrolyte supplements' },
      { name: 'Syrups', description: 'Syrups and liquid sweeteners' },
      { name: 'Other', description: 'Other ingredients' }
    ]
  })
  console.log(`Created ${categories.count} ingredient categories`)

  // Seed ingredients
  console.log('Seeding ingredients...')
  const ingredients = await prisma.ingredient.createMany({
    data: [
      // Fruits and produce
      { name: 'Dragon Fruit', sku: 'ING-DF-001', category: 'Fruits', unit: 'CUP', quantity: 50, costPerUnit: 3.50, minStockLevel: 10, currentStock: 50 },
      { name: 'Banana', sku: 'ING-BN-001', category: 'Fruits', unit: 'CUP', quantity: 100, costPerUnit: 0.50, minStockLevel: 20, currentStock: 100 },
      { name: 'Dehydrated Lemon', sku: 'ING-DL-001', category: 'Garnishes', unit: 'OUNCE', quantity: 200, costPerUnit: 0.15, minStockLevel: 50, currentStock: 200 },
      { name: 'Dehydrated Dragon Fruit', sku: 'ING-DDF-001', category: 'Garnishes', unit: 'OUNCE', quantity: 20, costPerUnit: 2.00, minStockLevel: 5, currentStock: 20 },
      
      // LMNT electrolytes
      { name: 'Citrus LMNT', sku: 'ING-CLMNT-001', category: 'Electrolytes', unit: 'LITER', quantity: 48, costPerUnit: 1.50, minStockLevel: 12, currentStock: 48 },
      { name: 'Watermelon LMNT', sku: 'ING-WLMNT-001', category: 'Electrolytes', unit: 'LITER', quantity: 48, costPerUnit: 1.50, minStockLevel: 12, currentStock: 48 },
      { name: 'Black Cherry LMNT', sku: 'ING-BCLMNT-001', category: 'Electrolytes', unit: 'LITER', quantity: 48, costPerUnit: 1.50, minStockLevel: 12, currentStock: 48 },
      { name: 'Grapefruit LMNT', sku: 'ING-GLMNT-001', category: 'Electrolytes', unit: 'LITER', quantity: 48, costPerUnit: 1.50, minStockLevel: 12, currentStock: 48 },
      { name: 'Electrolyte Mix', sku: 'ING-ELEC-001', category: 'Electrolytes', unit: 'SCOOP', quantity: 100, costPerUnit: 0.75, minStockLevel: 25, currentStock: 100 },
      
      // Beverages
      { name: 'Schweppes Soda Water', sku: 'ING-SSW-001', category: 'Beverages', unit: 'LITER', quantity: 20, costPerUnit: 1.25, minStockLevel: 5, currentStock: 20 },
      { name: 'Almond Coconut Milk', sku: 'ING-ACM-001', category: 'Beverages', unit: 'OUNCE', quantity: 128, costPerUnit: 0.15, minStockLevel: 32, currentStock: 128 },
      { name: 'Chocolate Almond Milk', sku: 'ING-CHM-001', category: 'Beverages', unit: 'OUNCE', quantity: 128, costPerUnit: 0.18, minStockLevel: 32, currentStock: 128 },
      { name: 'Vanilla Almond Milk', sku: 'ING-VAM-001', category: 'Beverages', unit: 'OUNCE', quantity: 128, costPerUnit: 0.16, minStockLevel: 32, currentStock: 128 },
      { name: 'Oat Milk', sku: 'ING-OM-001', category: 'Beverages', unit: 'CUP', quantity: 50, costPerUnit: 0.50, minStockLevel: 10, currentStock: 50 },
      { name: 'Heavy Milk', sku: 'ING-HM-001', category: 'Beverages', unit: 'CUP', quantity: 30, costPerUnit: 0.75, minStockLevel: 8, currentStock: 30 },
      
      // Proteins and supplements
      { name: 'Protein Powder', sku: 'ING-PP-001', category: 'Supplements', unit: 'SCOOP', quantity: 200, costPerUnit: 1.25, minStockLevel: 50, currentStock: 200 },
      { name: 'Spirulina', sku: 'ING-SPR-001', category: 'Supplements', unit: 'SCOOP', quantity: 100, costPerUnit: 0.50, minStockLevel: 25, currentStock: 100 },
      { name: 'Blue Berry Powder', sku: 'ING-BBP-001', category: 'Supplements', unit: 'SCOOP', quantity: 80, costPerUnit: 0.75, minStockLevel: 20, currentStock: 80 },
      { name: 'Strawberry Powder', sku: 'ING-STP-001', category: 'Supplements', unit: 'SCOOP', quantity: 80, costPerUnit: 0.75, minStockLevel: 20, currentStock: 80 },
      { name: 'Matcha Powder', sku: 'ING-MP-001', category: 'Supplements', unit: 'TEASPOON', quantity: 50, costPerUnit: 0.40, minStockLevel: 15, currentStock: 50 },
      { name: 'MCT Oil', sku: 'ING-MCT-001', category: 'Supplements', unit: 'SCOOP', quantity: 60, costPerUnit: 0.35, minStockLevel: 15, currentStock: 60 },
      
      // Nut butters and spreads
      { name: 'Peanut Butter', sku: 'ING-PB-001', category: 'Spreads', unit: 'SCOOP', quantity: 100, costPerUnit: 0.30, minStockLevel: 25, currentStock: 100 },
      
      // Oils and sweeteners
      { name: 'Coconut Oil', sku: 'ING-CO-001', category: 'Oils', unit: 'TABLESPOON', quantity: 80, costPerUnit: 0.25, minStockLevel: 20, currentStock: 80 },
      { name: 'Brown Sugar', sku: 'ING-BS-001', category: 'Sweeteners', unit: 'TABLESPOON', quantity: 100, costPerUnit: 0.10, minStockLevel: 25, currentStock: 100 },
      { name: 'Honey', sku: 'ING-HON-001', category: 'Sweeteners', unit: 'TABLESPOON', quantity: 60, costPerUnit: 0.20, minStockLevel: 15, currentStock: 60 },
      { name: 'Vanilla Extract', sku: 'ING-VE-001', category: 'Flavorings', unit: 'TEASPOON', quantity: 40, costPerUnit: 0.15, minStockLevel: 10, currentStock: 40 },
      
      // Other ingredients
      { name: 'Sugar-Free Strawberry Jelly', sku: 'ING-SFSJ-001', category: 'Spreads', unit: 'CUP', quantity: 30, costPerUnit: 1.00, minStockLevel: 8, currentStock: 30 },
      { name: 'Sugar-Free Strawberry Syrup', sku: 'INF-SFSS-001', category: 'Syrups', unit: 'TABLESPOON', quantity: 50, costPerUnit: 0.20, minStockLevel: 12, currentStock: 50 },
      { name: 'Espresso', sku: 'ING-ESP-001', category: 'Beverages', unit: 'OUNCE', quantity: 64, costPerUnit: 0.25, minStockLevel: 16, currentStock: 64 },
      { name: 'Hot Water', sku: 'ING-HW-001', category: 'Beverages', unit: 'CUP', quantity: 100, costPerUnit: 0.01, minStockLevel: 20, currentStock: 100 },
      
      // Protein bites ingredients
      { name: 'Chocolate', sku: 'ING-CHOC-001', category: 'Baking', unit: 'CUP', quantity: 20, costPerUnit: 2.50, minStockLevel: 5, currentStock: 20 },
      { name: 'Oats', sku: 'ING-OATS-001', category: 'Grains', unit: 'CUP', quantity: 30, costPerUnit: 0.75, minStockLevel: 8, currentStock: 30 },
      { name: 'Coconut Flakes', sku: 'ING-CF-001', category: 'Baking', unit: 'CUP', quantity: 25, costPerUnit: 1.00, minStockLevel: 6, currentStock: 25 },
      { name: 'Chia Seeds', sku: 'ING-CS-001', category: 'Seeds', unit: 'CUP', quantity: 15, costPerUnit: 2.00, minStockLevel: 4, currentStock: 15 },
    ]
  })
  console.log(`Created ${ingredients.count} ingredients`)

  // Seed recipes
  console.log('Seeding recipes...')
  
  // Get ingredient IDs for mapping
  const ingredientList = await prisma.ingredient.findMany()
  const ingredientMap = new Map(ingredientList.map(i => [i.name, i.id]))
  
  const recipes = await prisma.recipe.createMany({
    data: [
      // Spritzers
      {
        name: 'Citron',
        sku: 'REC-CITRON-001',
        category: 'Spritzers',
        description: 'Refreshing citrus spritzer with electrolytes',
        ingredients: [
          { ingredientId: ingredientMap.get('Citrus LMNT'), ingredientName: 'Citrus LMNT', quantity: 0.25, unit: 'LITER', costPerUnit: 1.50 },
          { ingredientId: ingredientMap.get('Dehydrated Lemon'), ingredientName: 'Dehydrated Lemon', quantity: 2, unit: 'OUNCE', costPerUnit: 0.15 },
          { ingredientId: ingredientMap.get('Schweppes Soda Water'), ingredientName: 'Schweppes Soda Water', quantity: 0.5, unit: 'LITER', costPerUnit: 1.25 }
        ],
        totalCost: 1.05,
        sellingPrice: 8.00,
        profitMargin: 86.88,
        profitPerUnit: 6.95,
        preparationTime: 3,
        servings: 1,
        instructions: ['Mix electrolytes with soda water', 'Add dehydrated lemon garnish', 'Serve over ice'],
        isActive: true
      },
      {
        name: 'Watermelon Wave',
        sku: 'REC-WW-001',
        category: 'Spritzers',
        description: 'Refreshing watermelon electrolyte spritzer',
        ingredients: [
          { ingredientId: ingredientMap.get('Watermelon LMNT'), ingredientName: 'Watermelon LMNT', quantity: 0.25, unit: 'LITER', costPerUnit: 1.50 },
          { ingredientId: ingredientMap.get('Dehydrated Lemon'), ingredientName: 'Dehydrated Lemon', quantity: 2, unit: 'OUNCE', costPerUnit: 0.15 },
          { ingredientId: ingredientMap.get('Schweppes Soda Water'), ingredientName: 'Schweppes Soda Water', quantity: 0.5, unit: 'LITER', costPerUnit: 1.25 }
        ],
        totalCost: 1.05,
        sellingPrice: 8.00,
        profitMargin: 86.88,
        profitPerUnit: 6.95,
        preparationTime: 3,
        servings: 1,
        instructions: ['Mix electrolytes with soda water', 'Add dehydrated lemon garnish', 'Serve over ice'],
        isActive: true
      },
      {
        name: 'Black Cherry Bliss',
        sku: 'REC-BCB-001',
        category: 'Spritzers',
        description: 'Rich black cherry electrolyte spritzer',
        ingredients: [
          { ingredientId: ingredientMap.get('Black Cherry LMNT'), ingredientName: 'Black Cherry LMNT', quantity: 0.25, unit: 'LITER', costPerUnit: 1.50 },
          { ingredientId: ingredientMap.get('Dehydrated Lemon'), ingredientName: 'Dehydrated Lemon', quantity: 2, unit: 'OUNCE', costPerUnit: 0.15 },
          { ingredientId: ingredientMap.get('Schweppes Soda Water'), ingredientName: 'Schweppes Soda Water', quantity: 0.5, unit: 'LITER', costPerUnit: 1.25 }
        ],
        totalCost: 1.05,
        sellingPrice: 8.00,
        profitMargin: 86.88,
        profitPerUnit: 6.95,
        preparationTime: 3,
        servings: 1,
        instructions: ['Mix electrolytes with soda water', 'Add dehydrated lemon garnish', 'Serve over ice'],
        isActive: true
      },
      {
        name: 'Grapefruit Glow',
        sku: 'REC-GG-001',
        category: 'Spritzers',
        description: 'Tangy grapefruit electrolyte spritzer',
        ingredients: [
          { ingredientId: ingredientMap.get('Grapefruit LMNT'), ingredientName: 'Grapefruit LMNT', quantity: 0.25, unit: 'LITER', costPerUnit: 1.50 },
          { ingredientId: ingredientMap.get('Dehydrated Lemon'), ingredientName: 'Dehydrated Lemon', quantity: 2, unit: 'OUNCE', costPerUnit: 0.15 },
          { ingredientId: ingredientMap.get('Schweppes Soda Water'), ingredientName: 'Schweppes Soda Water', quantity: 0.5, unit: 'LITER', costPerUnit: 1.25 }
        ],
        totalCost: 1.05,
        sellingPrice: 8.00,
        profitMargin: 86.88,
        profitPerUnit: 6.95,
        preparationTime: 3,
        servings: 1,
        instructions: ['Mix electrolytes with soda water', 'Add dehydrated lemon garnish', 'Serve over ice'],
        isActive: true
      },
      // Smoothies
      {
        name: 'Tropical Paradise',
        sku: 'REC-TP-001',
        category: 'Smoothies',
        description: 'Tropical fruit smoothie with protein',
        ingredients: [
          { ingredientId: ingredientMap.get('Dragon Fruit'), ingredientName: 'Dragon Fruit', quantity: 1, unit: 'CUP', costPerUnit: 3.50 },
          { ingredientId: ingredientMap.get('Banana'), ingredientName: 'Banana', quantity: 1, unit: 'CUP', costPerUnit: 0.50 },
          { ingredientId: ingredientMap.get('Almond Coconut Milk'), ingredientName: 'Almond Coconut Milk', quantity: 1, unit: 'CUP', costPerUnit: 0.15 },
          { ingredientId: ingredientMap.get('Protein Powder'), ingredientName: 'Protein Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 1.25 }
        ],
        totalCost: 5.40,
        sellingPrice: 12.00,
        profitMargin: 55.00,
        profitPerUnit: 6.60,
        preparationTime: 5,
        servings: 1,
        instructions: ['Blend dragon fruit and banana', 'Add almond milk and protein powder', 'Blend until smooth', 'Serve cold'],
        isActive: true
      },
      {
        name: 'Berry Blast',
        sku: 'REC-BB-001',
        category: 'Smoothies',
        description: 'Berry protein smoothie',
        ingredients: [
          { ingredientId: ingredientMap.get('Blue Berry Powder'), ingredientName: 'Blue Berry Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 0.75 },
          { ingredientId: ingredientMap.get('Strawberry Powder'), ingredientName: 'Strawberry Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 0.75 },
          { ingredientId: ingredientMap.get('Oat Milk'), ingredientName: 'Oat Milk', quantity: 1, unit: 'CUP', costPerUnit: 0.50 },
          { ingredientId: ingredientMap.get('Protein Powder'), ingredientName: 'Protein Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 1.25 }
        ],
        totalCost: 3.25,
        sellingPrice: 10.00,
        profitMargin: 67.50,
        profitPerUnit: 6.75,
        preparationTime: 4,
        servings: 1,
        instructions: ['Mix berry powders with oat milk', 'Add protein powder', 'Blend until smooth', 'Serve cold'],
        isActive: true
      },
      {
        name: 'Green Energy',
        sku: 'REC-GE-001',
        category: 'Smoothies',
        description: 'Energizing green smoothie',
        ingredients: [
          { ingredientId: ingredientMap.get('Spirulina'), ingredientName: 'Spirulina', quantity: 1, unit: 'SCOOP', costPerUnit: 0.50 },
          { ingredientId: ingredientMap.get('Matcha Powder'), ingredientName: 'Matcha Powder', quantity: 1, unit: 'TEASPOON', costPerUnit: 0.40 },
          { ingredientId: ingredientMap.get('Almond Coconut Milk'), ingredientName: 'Almond Coconut Milk', quantity: 1, unit: 'CUP', costPerUnit: 0.15 },
          { ingredientId: ingredientMap.get('MCT Oil'), ingredientName: 'MCT Oil', quantity: 1, unit: 'SCOOP', costPerUnit: 0.35 }
        ],
        totalCost: 1.40,
        sellingPrice: 9.00,
        profitMargin: 84.44,
        profitPerUnit: 7.60,
        preparationTime: 4,
        servings: 1,
        instructions: ['Mix spirulina and matcha', 'Add almond milk and MCT oil', 'Blend until smooth', 'Serve cold'],
        isActive: true
      },
      // Shakes
      {
        name: 'Chocolate Peanut Butter',
        sku: 'REC-CPB-001',
        category: 'Shakes',
        description: 'Rich chocolate peanut butter shake',
        ingredients: [
          { ingredientId: ingredientMap.get('Chocolate'), ingredientName: 'Chocolate', quantity: 0.5, unit: 'CUP', costPerUnit: 2.50 },
          { ingredientId: ingredientMap.get('Peanut Butter'), ingredientName: 'Peanut Butter', quantity: 2, unit: 'SCOOP', costPerUnit: 0.30 },
          { ingredientId: ingredientMap.get('Chocolate Almond Milk'), ingredientName: 'Chocolate Almond Milk', quantity: 1, unit: 'CUP', costPerUnit: 0.18 },
          { ingredientId: ingredientMap.get('Protein Powder'), ingredientName: 'Protein Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 1.25 }
        ],
        totalCost: 2.53,
        sellingPrice: 11.00,
        profitMargin: 77.00,
        profitPerUnit: 8.47,
        preparationTime: 4,
        servings: 1,
        instructions: ['Blend chocolate and peanut butter', 'Add almond milk and protein powder', 'Blend until smooth', 'Serve cold'],
        isActive: true
      },
      {
        name: 'Vanilla Chai',
        sku: 'REC-VC-001',
        category: 'Shakes',
        description: 'Spiced vanilla chai shake',
        ingredients: [
          { ingredientId: ingredientMap.get('Vanilla Extract'), ingredientName: 'Vanilla Extract', quantity: 1, unit: 'TEASPOON', costPerUnit: 0.15 },
          { ingredientId: ingredientMap.get('Vanilla Almond Milk'), ingredientName: 'Vanilla Almond Milk', quantity: 1, unit: 'CUP', costPerUnit: 0.16 },
          { ingredientId: ingredientMap.get('Protein Powder'), ingredientName: 'Protein Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 1.25 },
          { ingredientId: ingredientMap.get('Brown Sugar'), ingredientName: 'Brown Sugar', quantity: 1, unit: 'TABLESPOON', costPerUnit: 0.10 }
        ],
        totalCost: 1.66,
        sellingPrice: 9.00,
        profitMargin: 81.56,
        profitPerUnit: 7.34,
        preparationTime: 4,
        servings: 1,
        instructions: ['Mix vanilla extract with almond milk', 'Add protein powder and brown sugar', 'Blend until smooth', 'Serve cold'],
        isActive: true
      },
      {
        name: 'Oatmeal Cookie',
        sku: 'REC-OC-001',
        category: 'Shakes',
        description: 'Oatmeal cookie flavored shake',
        ingredients: [
          { ingredientId: ingredientMap.get('Oats'), ingredientName: 'Oats', quantity: 0.5, unit: 'CUP', costPerUnit: 0.75 },
          { ingredientId: ingredientMap.get('Coconut Flakes'), ingredientName: 'Coconut Flakes', quantity: 1, unit: 'SCOOP', costPerUnit: 1.00 },
          { ingredientId: ingredientMap.get('Heavy Milk'), ingredientName: 'Heavy Milk', quantity: 1, unit: 'CUP', costPerUnit: 0.75 },
          { ingredientId: ingredientMap.get('Protein Powder'), ingredientName: 'Protein Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 1.25 }
        ],
        totalCost: 3.75,
        sellingPrice: 10.00,
        profitMargin: 62.50,
        profitPerUnit: 6.25,
        preparationTime: 5,
        servings: 1,
        instructions: ['Blend oats with heavy milk', 'Add coconut flakes and protein powder', 'Blend until smooth', 'Serve cold'],
        isActive: true
      },
      {
        name: 'Chia Berry',
        sku: 'REC-CB-001',
        category: 'Shakes',
        description: 'Berry chia seed shake',
        ingredients: [
          { ingredientId: ingredientMap.get('Chia Seeds'), ingredientName: 'Chia Seeds', quantity: 1, unit: 'SCOOP', costPerUnit: 2.00 },
          { ingredientId: ingredientMap.get('Strawberry Powder'), ingredientName: 'Strawberry Powder', quantity: 1, unit: 'SCOOP', costPerUnit: 0.75 },
          { ingredientId: ingredientMap.get('Oat Milk'), ingredientName: 'Oat Milk', quantity: 1, unit: 'CUP', costPerUnit: 0.50 },
          { ingredientId: ingredientMap.get('Honey'), ingredientName: 'Honey', quantity: 1, unit: 'TABLESPOON', costPerUnit: 0.20 }
        ],
        totalCost: 3.45,
        sellingPrice: 10.00,
        profitMargin: 65.50,
        profitPerUnit: 6.55,
        preparationTime: 5,
        servings: 1,
        instructions: ['Soak chia seeds in oat milk', 'Add strawberry powder and honey', 'Blend until smooth', 'Serve cold'],
        isActive: true
      }
    ]
  })
  console.log(`Created ${recipes.count} recipes`)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
