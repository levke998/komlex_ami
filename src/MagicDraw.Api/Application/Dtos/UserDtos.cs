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

public record UpdateProfileRequest(
    int? Age,
    string? Gender,
    string? ProfilePictureUrl
);

public record UserResponse(
    Guid Id,
    string Username,
    string Email,
    DateTime CreatedAt,
    int? Age = null,
    string? Gender = null,
    string? ProfilePictureUrl = null
);
