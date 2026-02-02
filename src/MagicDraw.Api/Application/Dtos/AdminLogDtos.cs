using System;

namespace MagicDraw.Api.Application.Dtos;

public record AdminAuditLogItem(
    Guid Id,
    string AdminEmail,
    string Action,
    string TargetType,
    Guid? TargetId,
    string? Message,
    DateTime CreatedAt
);
