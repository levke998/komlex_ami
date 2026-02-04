using System;

namespace MagicDraw.Api.Domain.Entities;

public class DrawingLike
{
    public Guid DrawingId { get; set; }
    public Drawing Drawing { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime LikedAt { get; set; } = DateTime.UtcNow;
}
