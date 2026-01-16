using MagicDraw.Api.Domain.Enums;

namespace MagicDraw.Api.Domain.Entities;

public class Layer
{
    public Guid Id { get; set; }
    
    public Guid DrawingId { get; set; }
    public Drawing? Drawing { get; set; }

    public LayerType Type { get; set; }
    public int Position { get; set; }
    public bool IsVisible { get; set; } = true;
    public float Opacity { get; set; } = 1.0f;
    
    /// <summary>
    /// Stores JSON content for strokes or URL for images.
    /// </summary>
    public string Data { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
