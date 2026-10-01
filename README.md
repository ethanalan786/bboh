# Burn Box Operations Hub

A comprehensive operations management system for Burn Box, designed to handle inventory tracking, sales management, recipe management, and financial reporting across multiple product categories including smoothies, drinks, apparel, and accessories.

## Features

### 📊 Dashboard & Analytics
- **Role-based dashboards** for Admin and Front Desk staff
- **Real-time sales tracking** with detailed metrics and trends
- **Financial reporting** including COGS, gross profit, and profitability analysis
- **Inventory management** with stock level monitoring and alerts
- **Audit trail** for tracking all system changes and transactions

### 🛒 Sales Management
- **Burn Box sales** - Recipe-based product sales with automatic ingredient deduction
- **Apparel sales** - Clothing and accessories inventory management
- **Customer tracking** - Sales linked to customer accounts
- **Payment method management** - Multiple payment options
- **Sales returns and adjustments** - Handle returns and inventory corrections

### 📦 Inventory Management
- **Multi-category inventory** - Burn Box, Apparel, Drinks, Accessories
- **Supplier management** - Track supplier information and relationships
- **Stock history tracking** - Complete audit trail of inventory changes
- **Low stock alerts** - Automated notifications for reordering
- **Cost breakdown tracking** - Material, labor, shipping, and overhead costs

### 🥤 Recipe & Ingredient Management
- **Recipe creation** - Build and manage smoothie/drink recipes
- **Ingredient tracking** - Monitor ingredient quantities and costs
- **Automatic cost calculation** - Recipe costs based on ingredient prices
- **Stock adjustments** - Handle wastage, damage, expiry, and physical counts
- **Unit conversion** - Support for multiple measurement units

### 📈 Reporting
- **Sales reports** - Daily, weekly, and monthly sales analysis
- **Inventory reports** - Movement, on-hand, and retail value reports
- **Profitability reports** - Product and recipe profitability analysis
- **Employee sales reports** - Track individual staff performance
- **GymMaster integration** - External sales data reconciliation

### 🔐 Authentication & Authorization
- **NextAuth.js integration** - Secure authentication system
- **Role-based access control** - Admin, Front Desk, Inventory, and Customer roles
- **User management** - Admin can create and manage user accounts
- **Session management** - Secure session handling with automatic redirects

## Tech Stack

- **Framework**: Next.js 16.3.4 (App Router)
- **React**: 19.2.8
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js 4.24.15
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React, Tabler Icons, HugeIcons
- **Forms**: React Day Picker, Framer Motion
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or cloud)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/aimahusnain/Burn-Box-Operations-Hub.git
cd burn-box-operations-hub
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="mongodb://localhost:27017/burn-box-operations"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Initialize the database:
```bash
npm run seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run add-user` - Add a new user via CLI
- `npm run seed` - Seed database with initial data
- `npm run fix-orphaned-sales` - Fix orphaned sales records
- `npm run fix-orphaned-audit-logs` - Fix orphaned audit log records
- `npm run check-integrity` - Check data integrity
- `npm run update-product-images` - Update product images

## User Roles

### Admin
- Full access to all features
- User management
- Supplier management
- Complete inventory control
- Access to all reports
- Audit trail viewing

### Front Desk
- Record sales (Burn Box and Apparel)
- View stock availability
- Customer management
- Limited reporting access
- Profile management

### Inventory
- Stock management
- Inventory adjustments
- Supplier access
- Purchase management

### Customer
- View personal purchase history
- Limited product viewing

## Database Schema

The application uses MongoDB with the following main models:

- **User** - User accounts with roles and contact information
- **Product** - Inventory items with cost and pricing
- **Sale** - Sales transactions with customer and payment details
- **Ingredient** - Recipe ingredients with unit measurements
- **Recipe** - Product recipes with ingredient breakdowns
- **Supplier** - Supplier information and relationships
- **AuditLog** - System change tracking
- **GymMasterSale** - External sales integration

## Project Structure

```
src/
├── app/
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # Dashboard layouts
│   │   ├── admin/           # Admin dashboard
│   │   └── front-desk-role/ # Front desk dashboard
│   └── api/                 # API routes
├── components/
│   ├── adjustments/         # Inventory adjustment components
│   ├── charts/              # Chart components
│   ├── inventory/           # Inventory management components
│   ├── products/            # Product management components
│   ├── recipes/             # Recipe management components
│   ├── sales/               # Sales components
│   └── ui/                  # UI components
└── lib/                     # Utility functions and configurations
```

## Deployment

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

```env
DATABASE_URL="mongodb://your-production-db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### GymMaster Integration

GymMaster integration credentials (Client Name and API Key) should be configured through the **Admin Settings** page in the application UI, not via environment variables. Navigate to:
- Dashboard → Admin → Settings → Integrations → GymMaster

Enter your GymMaster client name and API key there to enable sales data synchronization.

### Build and Deploy

```bash
npm run build
npm start
```

For deployment, consider using:
- **Vercel** - Recommended for Next.js applications
- **Railway** - Good for MongoDB hosting
- **DigitalOcean** - Full control over infrastructure
- **AWS** - Enterprise-grade hosting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support and questions, please contact the development team or create an issue in the repository.

## License

This project is proprietary software. All rights reserved.
