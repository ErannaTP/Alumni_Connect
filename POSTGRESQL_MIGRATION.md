# PostgreSQL Migration Guide

This document outlines the changes made to migrate the KLE Alumni Connect application from MongoDB to PostgreSQL.

## Changes Made

### 1. Dependencies Updated

- Removed `mongoose` dependency
- Added `pg` and `sequelize` dependencies

### 2. Database Configuration

Created a new configuration file at `server/config/database.js` that sets up PostgreSQL connection using Sequelize.

### 3. Model Conversion

Converted all Mongoose models to Sequelize models:

- User model
- Post model
- Connection model
- Message model
- Event model

### 4. Route Updates

Updated routes to use Sequelize syntax instead of Mongoose:

- Auth routes
- Post routes
- Connection routes
- Other route files would need similar updates

### 5. Migration and Seed Scripts

Updated migration and seed scripts to work with PostgreSQL:

- `server/migrate-localstorage.js`
- `server/seed.js`

## Environment Variables

Updated `.env.example` with PostgreSQL configuration:

```
# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=kle_alumni_connect
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Key Differences Between MongoDB and PostgreSQL Implementation

| Feature | MongoDB (Old) | PostgreSQL (New) |
|---------|---------------|------------------|
| Connection | `mongoose.connect()` | `sequelize.authenticate()` |
| Find One | `Model.findOne({ field: value })` | `Model.findOne({ where: { field: value } })` |
| Find By ID | `Model.findById(id)` | `Model.findByPk(id)` |
| Create | `Model.create(data)` | `Model.create(data)` |
| Populate | `.populate()` | `include: [{ model: RelatedModel }]` |
| Delete | `document.deleteOne()` | `instance.destroy()` |

## Installation and Setup

1. Install PostgreSQL on your system
2. Create a database named `kle_alumni_connect`
3. Update your `.env` file with your PostgreSQL credentials
4. Run `npm install` to install new dependencies
5. Run `npm run migrate` to set up the database and create the default admin user
6. Run `npm run seed` to populate with sample data

## Running the Application

```bash
npm run dev
```

The application will be available at http://localhost:5000

## Additional Notes

- All existing functionality should work the same way
- The migration preserves the existing data structure and relationships
- PostgreSQL provides better data integrity with its relational model
- Sequelize ORM provides excellent TypeScript support if you decide to migrate to TypeScript in the future