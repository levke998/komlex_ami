using System;

namespace MagicDraw.Api.Application.Dtos;

public record CreateUserRequest(
    string Username,
    string Email,
    string Password
);

public record UpdateUserRequest(
    string? Username,
    string? Email
);

public record UserResponse(
    Guid Id,
    string Username,
    string Email,
    DateTime CreatedAt
);
