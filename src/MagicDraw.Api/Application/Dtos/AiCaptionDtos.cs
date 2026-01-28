namespace MagicDraw.Api.Application.Dtos;

public record AutoCaptionRequest(
    string? Prompt,
    string? Notes,
    int? LayerCount,
    bool? HasGlow,
    string? Style
);

public record AutoCaptionResponse(string Title, string Description);
