# Shiv Shakti Admin Panel

A modern admin panel built with Next.js and React for managing Shiv Shakti's administrative tasks.

## Features

- Modern and responsive UI
- Secure authentication system
- Dashboard with key metrics
- User management
- Content management
- Role-based access control

## Tech Stack

- **Frontend Framework**: Next.js
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: MongoDB
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **API Integration**: Axios

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

## Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd shivshakti-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
shivshakti-admin/
├── app/                 # Next.js app directory
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations
├── public/             # Static assets
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [support@shivshakti.com](mailto:support@shivshakti.com) or create an issue in the repository.

## Acknowledgments

- Next.js team for the amazing framework
- All contributors who have helped shape this project
