using System;

namespace MagicDraw.Api.Application.Dtos;

public record LoginRequest(
    string Email,
    string Password
);

public record RegisterRequest(
    string Username,
    string Email,
    string Password
);

public record AuthResponse(
    string Token,
    UserResponse User
);
