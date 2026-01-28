namespace MagicDraw.Api.Application.Dtos;

public record RewritePromptRequest(
    string Prompt,
    string? Style
);

public record RewritePromptResponse(
    string Prompt
);
