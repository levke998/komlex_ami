using System;
using MagicDraw.Api.Domain.Enums;

namespace MagicDraw.Api.Domain.Entities;

public class Layer
{
    public Guid Id { get; set; }
    public Guid DrawingId { get; set; }
    public LayerType Type { get; set; }
    public int OrderIndex { get; set; }
    public bool IsVisible { get; set; }
    public bool IsLocked { get; set; }
    
    // Stores serialized stroke data for reconstruction
    public string? Content { get; set; } 
    
    // For Image/AiImage
    public string? ImageUrl { get; set; }
    
    // Opacity, BlendMode, etc.
    public string? ConfigurationJson { get; set; }

    public Drawing? Drawing { get; set; }
}
