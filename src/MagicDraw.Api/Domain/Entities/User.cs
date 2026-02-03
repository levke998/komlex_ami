using System;
using System.Collections.Generic;

namespace MagicDraw.Api.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? ProfilePictureUrl { get; set; }

    public ICollection<Drawing> Drawings { get; set; } = new List<Drawing>();
    public ICollection<AiGeneration> AiGenerations { get; set; } = new List<AiGeneration>();
}
