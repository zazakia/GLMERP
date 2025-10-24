# GLM ERP POS System

A comprehensive point of sale (POS) system built with React Native and Expo, featuring multi-company, multi-branch, and multi-location support.

## Features

- **Multi-Company Support**: Manage multiple companies from a single application
- **Multi-Branch Management**: Organize operations by branch within each company
- **Multi-Location Inventory**: Track inventory across different locations
- **Product Catalog**: Comprehensive product management with categories and variants
- **Sales Processing**: Full-featured sales with cart functionality and multiple payment methods
- **Customer Management**: Complete customer database with loyalty points and store credit
- **Inventory Tracking**: Real-time inventory updates and stock management
- **Reporting & Analytics**: Detailed sales, inventory, and financial reports
- **User Management**: Role-based access control with granular permissions
- **Hardware Integration**: Support for receipt printers, barcode scanners, and cash drawers
- **Offline Mode**: Basic functionality without internet connection
- **Data Synchronization**: Seamless sync between offline and online data
- **Receipt Management**: Print and email receipts
- **Tax Management**: PHP-based tax calculation and management
- **Discount & Promotions**: Flexible discount and promotion system
- **Return & Exchange**: Handle product returns and exchanges
- **Shift Management**: Track cash and manage employee shifts
- **Audit Trail**: Comprehensive activity logging
- **Backup & Restore**: Data backup and restoration capabilities

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase for real-time data
- **Authentication**: Supabase Auth
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Currency Calculation**: PHP utilities
- **Database**: PostgreSQL via Supabase

## Project Structure

```
glmerp-pos/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts for state management
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── products/     # Product management screens
│   │   ├── sales/         # Sales and cart screens
│   │   ├── inventory/     # Inventory management screens
│   │   ├── customers/     # Customer management screens
│   │   ├── reports/       # Reporting screens
│   │   └── settings/      # Settings screens
│   ├── services/           # API and service integrations
│   │   ├── supabase/      # Supabase configuration
│   │   ├── hardware/       # Hardware integration services
│   │   └── currency/      # Currency calculation services
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # Application constants
│   └── store/              # State management
├── php/                   # PHP backend services
│   ├── currency/          # Currency calculation utilities
│   ├── reports/           # Report generation services
│   ├── api/               # API endpoints
│   └── config/            # Configuration files
├── assets/                 # Static assets
│   ├── images/            # Image assets
│   ├── icons/             # Icon assets
│   └── fonts/             # Font assets
├── __tests__/              # Test files
├── package.json            # Project dependencies
├── app.json               # Expo configuration
└── README.md              # Project documentation
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install` or `yarn install`
3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `Database-Schema.md`
   - Configure environment variables in `src/services/supabase/config.ts`
4. Start the development server: `npm start` or `expo start`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The database schema is defined in `Database-Schema.md` and includes tables for:

- Companies, branches, and locations
- User profiles and sessions
- Products, categories, and variants
- Inventory and inventory transactions
- Sales, sale items, and payments
- Customers and customer addresses
- Discounts and promotions
- Shifts and shift payments
- Daily reports and audit logs

## API Endpoints

The PHP backend provides the following API endpoints:

- `/currency/index.php` - Currency calculation utilities
- `/reports/index.php` - Report generation services
- `/api/` - General API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.