using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Domain.Entities;
using MagicDraw.Api.Domain.Exceptions;
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

        // Friss rajzon még nincs like
        return MapToResponse(drawing, 0, false);
    }

    public async Task<DrawingResponse?> GetByIdAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var drawing = await _db.Drawings
            .AsNoTracking()
            .Where(d => d.UserId == userId)
            .Include(d => d.Layers)
            .Include(d => d.Likes) // Betöltjük a like-okat is!
            .FirstOrDefaultAsync(d => d.Id == id, ct);

        if (drawing == null) return null;

        var likeCount = drawing.Likes.Count;
        var isLikedByMe = drawing.Likes.Any(l => l.UserId == userId);

        return MapToResponse(drawing, likeCount, isLikedByMe);
    }

    public async Task<IReadOnlyList<DrawingListItemResponse>> GetAllAsync(Guid userId, CancellationToken ct)
    {
        return await _db.Drawings
            .AsNoTracking()
            .Where(d => d.UserId == userId)
            .Include(d => d.Likes) // Itt is kellenek a like-ok
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DrawingListItemResponse(
                d.Id,
                d.UserId,
                d.Title,
                d.Width,
                d.Height,
                d.IsPublic,
                d.Likes.Count, // LikeCount
                d.Likes.Any(l => l.UserId == userId), // IsLikedByMe
                d.CreatedAt,
                d.UpdatedAt
            ))
            .ToListAsync(ct);
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken ct)
    {
        var drawing = await _db.Drawings.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (drawing == null)
        {
            throw new NotFoundException("Drawing", id);
        }
        if (drawing.UserId != userId)
        {
            throw new ForbiddenException("You cannot delete this drawing.");
        }

        _db.Drawings.Remove(drawing);
        await _db.SaveChangesAsync(ct);
    }

    // --- ÚJ: LIKE FUNKCIÓ ---
    public async Task<bool> ToggleLikeAsync(Guid userId, Guid drawingId)
    {
        // Megnézzük, létezik-e már a like
        var existingLike = await _db.DrawingLikes
            .FirstOrDefaultAsync(dl => dl.UserId == userId && dl.DrawingId == drawingId);

        if (existingLike != null)
        {
            // Ha van, töröljük (Dislike)
            _db.DrawingLikes.Remove(existingLike);
            await _db.SaveChangesAsync();
            return false; // Már NINCS like-olva
        }

        // Ha nincs, létrehozzuk (Like)
        var newLike = new DrawingLike
        {
            UserId = userId,
            DrawingId = drawingId,
            LikedAt = DateTime.UtcNow
        };

        _db.DrawingLikes.Add(newLike);
        await _db.SaveChangesAsync();
        return true; // MOST lett like-olva
    }

    // Layer Operations (Változatlan)

    public async Task<LayerResponse?> AddLayerAsync(Guid drawingId, Guid userId, CreateLayerRequest request, CancellationToken ct)
    {
        var drawing = await _db.Drawings.Include(d => d.Layers)
            .FirstOrDefaultAsync(d => d.Id == drawingId && d.UserId == userId, ct);
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
        drawing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return MapToLayerResponse(layer);
    }

    public async Task<LayerResponse?> UpdateLayerAsync(Guid drawingId, Guid layerId, Guid userId, UpdateLayerRequest request, CancellationToken ct)
    {
        var drawing = await _db.Drawings.Include(d => d.Layers)
            .FirstOrDefaultAsync(d => d.Id == drawingId && d.UserId == userId, ct);
        if (drawing == null) return null;

        var layer = drawing.Layers.FirstOrDefault(l => l.Id == layerId);
        if (layer == null) return null;

        if (request.OrderIndex.HasValue) layer.OrderIndex = request.OrderIndex.Value;
        if (request.IsVisible.HasValue) layer.IsVisible = request.IsVisible.Value;
        if (request.IsLocked.HasValue) layer.IsLocked = request.IsLocked.Value;
        if (request.Content != null) layer.Content = request.Content;
        if (request.ImageUrl != null) layer.ImageUrl = request.ImageUrl;
        if (request.ConfigurationJson != null) layer.ConfigurationJson = request.ConfigurationJson;

        drawing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return MapToLayerResponse(layer);
    }

    public async Task<bool> DeleteLayerAsync(Guid drawingId, Guid layerId, Guid userId, CancellationToken ct)
    {
        var drawing = await _db.Drawings.Include(d => d.Layers)
            .FirstOrDefaultAsync(d => d.Id == drawingId && d.UserId == userId, ct);
        if (drawing == null) return false;

        var layer = drawing.Layers.FirstOrDefault(l => l.Id == layerId);
        if (layer == null) return false;

        drawing.Layers.Remove(layer);
        drawing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return true;
    }

    // Helpers

    private static DrawingResponse MapToResponse(Drawing drawing, int likeCount, bool isLikedByMe)
    {
        return new DrawingResponse(
            drawing.Id,
            drawing.UserId,
            drawing.Title,
            drawing.Width,
            drawing.Height,
            drawing.IsPublic,
            likeCount,      // ÚJ
            isLikedByMe,    // ÚJ
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