using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Domain.Entities;
using MagicDraw.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MagicDraw.Api.Application.Services;

public class DrawingService : IDrawingService
{
    private readonly AppDbContext _db;

    public DrawingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DrawingResponse> CreateAsync(Guid userId, CreateDrawingRequest request, CancellationToken ct)
    {
        var drawing = new Drawing
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title,
            Width = request.Width,
            Height = request.Height,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Drawings.Add(drawing);
        await _db.SaveChangesAsync(ct);

        return MapToResponse(drawing);
    }

    public async Task<DrawingResponse?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var drawing = await _db.Drawings
            .AsNoTracking()
            .Include(d => d.Layers)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        return drawing == null ? null : MapToResponse(drawing);
    }

    public async Task<IReadOnlyList<DrawingListItemResponse>> GetAllAsync(CancellationToken ct)
    {
        return await _db.Drawings
            .AsNoTracking()
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DrawingListItemResponse(
                d.Id,
                d.UserId,
                d.Title,
                d.Width,
                d.Height,
                d.IsPublic,
                d.CreatedAt,
                d.UpdatedAt
            ))
            .ToListAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        await _db.Drawings.Where(d => d.Id == id).ExecuteDeleteAsync(ct);
    }

    // Layer Operations

    public async Task<LayerResponse?> AddLayerAsync(Guid drawingId, CreateLayerRequest request, CancellationToken ct)
    {
        var drawing = await _db.Drawings.Include(d => d.Layers).FirstOrDefaultAsync(d => d.Id == drawingId, ct);
        if (drawing == null) return null;

        var layer = new Layer
        {
            Id = Guid.NewGuid(),
            DrawingId = drawingId,
            Type = request.Type,
            OrderIndex = request.OrderIndex,
            IsVisible = request.IsVisible,
            IsLocked = request.IsLocked,
            Content = request.Content,
            ImageUrl = request.ImageUrl,
            ConfigurationJson = request.ConfigurationJson
        };

        drawing.Layers.Add(layer);
        drawing.UpdatedAt = DateTime.UtcNow; // Touch parent
        
        await _db.SaveChangesAsync(ct);

        return MapToLayerResponse(layer);
    }

    public async Task<LayerResponse?> UpdateLayerAsync(Guid drawingId, Guid layerId, UpdateLayerRequest request, CancellationToken ct)
    {
        var drawing = await _db.Drawings.Include(d => d.Layers).FirstOrDefaultAsync(d => d.Id == drawingId, ct);
        if (drawing == null) return null;

        var layer = drawing.Layers.FirstOrDefault(l => l.Id == layerId);
        if (layer == null) return null;

        if (request.OrderIndex.HasValue) layer.OrderIndex = request.OrderIndex.Value;
        if (request.IsVisible.HasValue) layer.IsVisible = request.IsVisible.Value;
        if (request.IsLocked.HasValue) layer.IsLocked = request.IsLocked.Value;
        if (request.Content != null) layer.Content = request.Content;
        if (request.ImageUrl != null) layer.ImageUrl = request.ImageUrl;
        if (request.ConfigurationJson != null) layer.ConfigurationJson = request.ConfigurationJson;

        drawing.UpdatedAt = DateTime.UtcNow; // Touch parent
        await _db.SaveChangesAsync(ct);

        return MapToLayerResponse(layer);
    }

    public async Task<bool> DeleteLayerAsync(Guid drawingId, Guid layerId, CancellationToken ct)
    {
        var drawing = await _db.Drawings.Include(d => d.Layers).FirstOrDefaultAsync(d => d.Id == drawingId, ct);
        if (drawing == null) return false;

        var layer = drawing.Layers.FirstOrDefault(l => l.Id == layerId);
        if (layer == null) return false;

        drawing.Layers.Remove(layer);
        drawing.UpdatedAt = DateTime.UtcNow; // Touch parent
        await _db.SaveChangesAsync(ct);

        return true;
    }

    // Hélpers

    private static DrawingResponse MapToResponse(Drawing drawing)
    {
        return new DrawingResponse(
            drawing.Id,
            drawing.UserId,
            drawing.Title,
            drawing.Width,
            drawing.Height,
            drawing.IsPublic,
            drawing.CreatedAt,
            drawing.UpdatedAt,
            drawing.Layers.Select(MapToLayerResponse).OrderBy(l => l.OrderIndex).ToList()
        );
    }

    private static LayerResponse MapToLayerResponse(Layer layer)
    {
        return new LayerResponse(
            layer.Id,
            layer.DrawingId,
            layer.Type,
            layer.OrderIndex,
            layer.IsVisible,
            layer.IsLocked,
            layer.Content,
            layer.ImageUrl,
            layer.ConfigurationJson
        );
    }
}
