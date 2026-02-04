using System;
using System.Collections.Generic;

namespace MagicDraw.Api.Domain.Entities;

public class Drawing
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public ICollection<Layer> Layers { get; set; } = new List<Layer>();

    public ICollection<DrawingLike> Likes { get; set; } = new List<DrawingLike>();
}
