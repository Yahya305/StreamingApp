# Backend Server Conventions & Standards
This document outlines the coding standards, architectural patterns, and workflows used for backend development. AI-assisted IDEs should follow these conventions when making changes or adding new features to the codebase.
## 🛠 Core Technology Stack
- **Framework**: NestJS (v11+)
- **Language**: TypeScript
- **Database**: MySQL (via TypeORM)
- **API Documentation**: Swagger (OpenAPI 3.0)
- **Security**: Passport.js with JWT (Cookie-based)
- **Validation**: `class-validator` and `class-transformer`
- **File Storage**: AWS SDK / S3-compatible (e.g., Cloudflare R2)
---
## 📂 Directory Structure & Modules
- **Location**: All feature modules MUST reside directly within the `src/` folder.
- **Pattern**: Flat module-based architecture.
    - `src/auth`: Security and session management.
    - `src/users`: User management and profiles.
    - `src/entities`: Centralized location for TypeORM entities.
    - `src/dto`: Shared DTOs (if applicable, otherwise keep within module folders).
> [!IMPORTANT]
> Avoid nested subdirectories for primary feature modules. Keep the `src/` folder organized with high-level modules.
---
## 🔐 Authentication & Authorization
### JWT-in-Cookies
The system uses a cookie-based JWT strategy. Two cookies are used:
- `access_token`: Short-term access (e.g., 7 days).
- `refresh_token`: Long-term session (e.g., 30 days).
### Guards & Decorators
- **Global Guard**: `JwtAuthGuard` is applied globally in `main.ts`.
- **@Public()**: Use this decorator on controller methods or classes that do not require authentication.
- **@CurrentUser()**: Use this custom decorator to inject the authenticated user into controller methods.
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: any) {
    return { user };
}
```
---
## 🏗 Data Modeling (Entities)
- **Location**: `src/entities/`
- **Identity**: Use UUIDs or primary incrementing IDs consistently.
- **Time-stamping**: Always include `createdAt` and `updatedAt` using `@CreateDateColumn()` and `@UpdateDateColumn()`.
- **Relationships**: Use standard TypeORM decorators (`@OneToMany`, `@ManyToOne`, etc.) with explicit `onDelete: 'CASCADE'` where appropriate.
---
## 📡 API Development (Controllers & DTOs)
### Controllers
- **Decorators**: Use `@ApiTags`, `@ApiOperation`, and `@ApiResponse` for Swagger documentation.
- **Response Format**: Methods should return structured objects or provide success messages.
- **Error Handling**: Use built-in NestJS exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`).
### DTOs
- Use `class-validator` decorators for input validation.
- Use `ApiProperty` for Swagger metadata.
- **Naming**: End with `.dto.ts` (e.g., `create-item.dto.ts`).
```typescript
export class CreateItemDto {
    @ApiProperty({ example: 'Item Name' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
```
---
## ⚡ Business Logic (Services)
- **Pattern**: Services handle all database interactions and business logic.
- **Transactional Logic**: Use `DataSource` or `EntityManager` for complex transactions.
- **Dependency Injection**: Always use `constructor` injection for repositories and other services.
---
## 🚀 Workflows & Utilities
- **Validation Pipe**: Global pipe configured with:
    - `whitelist: true` (strips properties not in DTO).
    - `forbidNonWhitelisted: true` (errors if extra properties are sent).
    - `transform: true` (auto-transforms payloads to DTO instances).
- **Seeding**: Use a `SeedService` for initial data population.
- **Environment**: Managed via `@nestjs/config`. Use `ConfigService` instead of `process.env` inside services/modules.
---
## 🎨 Code Style
- **Naming**:
    - Classes: PascalCase (e.g., `ItemsService`).
    - Files: kebab-case (e.g., `items.service.ts`).
    - Variables/Methods: camelCase.
- **Comments**: Use JSDoc for complex methods. Use clear section headers in large files.
- **Imports**: Prefer absolute paths using `src/` alias or relative paths for local module files.
