using System;
using System.Collections.Generic;

namespace MagicDraw.Api.Application.Dtos;

public record CreateDrawingRequest(
    Guid UserId,
    string Title,
    int Width,
    int Height,
    bool IsPublic
);

public record UpdateDrawingRequest(
    string? Title,
    int? Width,
    int? Height,
    bool? IsPublic
);

public record DrawingResponse(
    Guid Id,
    Guid UserId,
    string Title,
    int Width,
    int Height,
    bool IsPublic,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<LayerResponse> Layers
);

public record DrawingListItemResponse(
    Guid Id,
    Guid UserId,
    string Title,
    int Width,
    int Height,
    bool IsPublic,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
