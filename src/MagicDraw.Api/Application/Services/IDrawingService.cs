using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MagicDraw.Api.Application.Dtos;

namespace MagicDraw.Api.Application.Services;

public interface IDrawingService
{
    Task<DrawingResponse> CreateAsync(Guid userId, CreateDrawingRequest request, CancellationToken ct);
    Task<DrawingResponse?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct);
    Task<IReadOnlyList<DrawingListItemResponse>> GetAllAsync(Guid userId, CancellationToken ct);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken ct);

    // Layer operations (Nested)
    Task<LayerResponse?> AddLayerAsync(Guid drawingId, Guid userId, CreateLayerRequest request, CancellationToken ct);
    Task<LayerResponse?> UpdateLayerAsync(Guid drawingId, Guid layerId, Guid userId, UpdateLayerRequest request, CancellationToken ct);
    Task<bool> DeleteLayerAsync(Guid drawingId, Guid layerId, Guid userId, CancellationToken ct);
}
