using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MagicDraw.Api.Application.Dtos;

namespace MagicDraw.Api.Application.Services;

public interface IDrawingService
{
    Task<DrawingResponse> CreateAsync(Guid userId, CreateDrawingRequest request, CancellationToken ct);
    Task<DrawingResponse?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<DrawingListItemResponse>> GetAllAsync(CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);

    // Layer operations (Nested)
    Task<LayerResponse?> AddLayerAsync(Guid drawingId, CreateLayerRequest request, CancellationToken ct);
    Task<LayerResponse?> UpdateLayerAsync(Guid drawingId, Guid layerId, UpdateLayerRequest request, CancellationToken ct);
    Task<bool> DeleteLayerAsync(Guid drawingId, Guid layerId, CancellationToken ct);
}
