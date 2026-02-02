using System;

namespace MagicDraw.Api.Application.Dtos;

public record AdminUserListItem(
    Guid Id,
    string Username,
    string Email,
    DateTime CreatedAt,
    bool IsAdmin,
    bool IsBanned,
    DateTime? BannedAt,
    string? BanReason,
    int WarningCount,
    DateTime? LastWarningAt
);

public record AdminBanRequest(
    string? Reason
);

public record AdminWarnRequest(
    string Message
);

public record AdminDrawingListItem(
    Guid Id,
    string Title,
    int Width,
    int Height,
    bool IsPublic,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid UserId,
    string Username,
    string Email
);
