using System;
using MagicDraw.Api.Domain.Enums;

namespace MagicDraw.Api.Domain.Entities;

public class AiGeneration
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public AiGenerationStatus Status { get; set; }
    public string? ResultImageUrl { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
