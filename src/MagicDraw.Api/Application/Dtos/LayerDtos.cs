using System;
using MagicDraw.Api.Domain.Enums;

namespace MagicDraw.Api.Application.Dtos;

public record CreateLayerRequest(
    LayerType Type,
    int OrderIndex,
    bool IsVisible,
    bool IsLocked,
    string? Content,
    string? ImageUrl,
    string? ConfigurationJson
);

public record UpdateLayerRequest(
    int? OrderIndex,
    bool? IsVisible,
    bool? IsLocked,
    string? Content,
    string? ImageUrl,
    string? ConfigurationJson
);

public record LayerResponse(
    Guid Id,
    Guid DrawingId,
    LayerType Type,
    int OrderIndex,
    bool IsVisible,
    bool IsLocked,
    string? Content,
    string? ImageUrl,
    string? ConfigurationJson
);
