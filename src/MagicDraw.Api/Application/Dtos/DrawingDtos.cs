using System;
using System.Collections.Generic;

namespace MagicDraw.Api.Application.Dtos;

public record CreateDrawingRequest(
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

// ITT A LÉNYEG: A mezõk sorrendjének egyeznie kell a Service-szel!
public record DrawingResponse(
    Guid Id,
    Guid UserId,
    string Title,
    int Width,
    int Height,
    bool IsPublic,
    int LikeCount,       // 7. adat
    bool IsLikedByMe,    // 8. adat
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
    int LikeCount,
    bool IsLikedByMe,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
