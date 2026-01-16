# Backend Architecture & Agent Implementation Guide (Antigravity)

## 1) Purpose

This document defines how the **backend must be designed and
implemented** when working with Antigravity agents.

The architecture follows a **strict layered approach**:

    Controller → Service → EF Core (DbContext)

All external communication uses **DTOs**.\
Domain entities are **never exposed directly** to the client.

------------------------------------------------------------------------

## 2) Strict Prohibitions (NON-NEGOTIABLE)

🚫 **Repository Pattern is FORBIDDEN**

The agent MUST NOT: - create `IRepository<T>` - create
`GenericRepository<T>` - create `BaseRepository` - create any
abstraction hiding `DbContext`

**Reason:** EF Core already provides Unit of Work + Repository behavior
via `DbContext`. Wrapping it adds complexity and harms performance.

🚫 **Unit of Work Pattern is FORBIDDEN**

The agent MUST NOT: - create `IUnitOfWork` - create `UnitOfWork` class -
create manual transaction wrappers around DbContext

**Rule instead:**\
➡️ The **DbContext itself IS the Unit of Work.**

------------------------------------------------------------------------

## 3) High-Level Architecture

    src/
      Api/
        Controllers/
        Middleware/
        Program.cs

      Application/
        Dtos/
        Services/
        Validation/
        Mapping/
        Common/

      Domain/
        Entities/
        Enums/
        Exceptions/
        Abstractions/

      Infrastructure/
        Persistence/
          AppDbContext.cs
          Configurations/
          Migrations/
        External/ (Email, Storage, etc.)

      Tests/

### Dependency Direction (MUST)

    Api → Application → Domain  
    Infrastructure → Application + Domain  

------------------------------------------------------------------------

## 4) Layer Responsibilities

### Controllers (API Layer)

**Responsibilities** - Define routes and HTTP verbs - Accept DTOs from
body/query/route - Call services - Return proper HTTP responses: -
`Ok()` - `CreatedAtAction()` - `NoContent()` - `Problem()`

**Controllers MUST NOT** - use `DbContext` - contain business logic -
query the database - manipulate entities directly

------------------------------------------------------------------------

### Services (Application Layer)

Services are the **core of the system**.

**Responsibilities** - Contain all business logic - Perform all EF Core
operations - Enforce domain rules - Handle transactions when necessary -
Map entities ↔ DTOs

**Rules** - All methods must be `async` - Use `CancellationToken` -
Throw domain/application exceptions - Be testable and DI-friendly

------------------------------------------------------------------------

### EF Core / Persistence (Infrastructure Layer)

Responsibilities: - `AppDbContext` - Entity configurations - Indexes,
constraints, relationships - Migrations

**Must NOT contain** - DTOs\
- HTTP logic\
- Controllers\
- Business rules

------------------------------------------------------------------------

### DTOs (Application Layer)

For every entity, the agent MUST create:

    CreateXRequest
    UpdateXRequest
    XResponse
    XListItemResponse (optional)

Example:

``` csharp
public record CreateEventRequest(
    string Title,
    DateTime Date
);

public record EventResponse(
    Guid Id,
    string Title,
    DateTime Date
);
```

------------------------------------------------------------------------

## 6) Mapping Strategy

The agent must use:
-   Manual mapping in a dedicated folder `/Mapping`

Mapping MUST NOT be inside controllers.

------------------------------------------------------------------------

## 7) Validation

Use FluentValidation (preferred):

``` csharp
public class CreateEventValidator : AbstractValidator<CreateEventRequest>
{
    public CreateEventValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Date).GreaterThan(DateTime.UtcNow);
    }
}
```

## 8) Standard CRUD Endpoints

For every entity `X`, the agent must generate:

### Controller endpoints

    GET    /api/x
    GET    /api/x/{id}
    POST   /api/x
    PUT    /api/x/{id}
    DELETE /api/x/{id}

------------------------------------------------------------------------

### Service Interface (MANDATORY)

``` csharp
public interface IEventService
{
    Task<IReadOnlyList<EventListItemResponse>> GetAllAsync(CancellationToken ct);
    Task<EventResponse> GetByIdAsync(Guid id, CancellationToken ct);
    Task<EventResponse> CreateAsync(CreateEventRequest req, CancellationToken ct);
    Task<EventResponse> UpdateAsync(Guid id, UpdateEventRequest req, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}
```

### Service Implementation Rules

-   All reads should use:

``` csharp
.AsNoTracking()
```

-   Prefer projection:

``` csharp
Select(e => new EventResponse(...))
```

-   On write:

``` csharp
await db.SaveChangesAsync(ct);
```

------------------------------------------------------------------------

## 9) Error Handling

Use global middleware.

Map exceptions to:

  Exception             HTTP Code
  --------------------- -----------
  NotFoundException     404
  ValidationException   400
  ConflictException     409
  Other                 500

------------------------------------------------------------------------

## 10) Transactions

Use EF Core transactions ONLY when needed:

``` csharp
await using var tx = await db.Database.BeginTransactionAsync(ct);
```

------------------------------------------------------------------------

## 11) Security & Logging

-   Use `[Authorize]` where required
-   Log create/update/delete operations
-   Never log passwords or tokens

------------------------------------------------------------------------

## 12) Agent Workflow (Step-by-Step)

For each new feature:

1.  Create **Domain Entity**
2.  Add **EF Configuration**
3.  Create **DTOs**
4.  Create **Service Interface + Implementation**
5.  Create **Controller**
6.  Add **Validation**
7.  Add **Tests**

------------------------------------------------------------------------

## 13) Acceptance Criteria (Checklist)

The agent must ensure:

-   ✅ No Repository Pattern\
-   ✅ No Unit of Work Pattern\
-   ✅ Controllers have NO DbContext\
-   ✅ All DB logic is in Services\
-   ✅ DTOs used everywhere\
-   ✅ Entities never returned\
-   ✅ Async + CancellationToken everywhere\
-   ✅ AsNoTracking for reads\
-   ✅ Global error handling\
-   ✅ Clean code, SOLID principles