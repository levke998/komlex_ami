using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MagicDraw.Api.Application.Dtos;

namespace MagicDraw.Api.Application.Services;

public interface IUserService
{
    Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken ct);
    Task<UserResponse?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<UserResponse?> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct);
    // Task DeleteAsync(Guid id, CancellationToken ct); // Not required for MVP
}
