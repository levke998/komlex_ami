using OpenAI.Images;
using OpenAI;
using OpenAI.Chat;
using System.ClientModel;

namespace MagicDraw.Api.Services;

public class OpenAIService
{
    private readonly string _apiKey;

    public OpenAIService(IConfiguration configuration)
    {
        _apiKey = configuration["OpenAI:ApiKey"]
                  ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY")
                  ?? throw new InvalidOperationException("OpenAI:ApiKey not found. Set OpenAI__ApiKey in config or OPENAI_API_KEY env variable.");
    }

    public async Task<string> GenerateImageAsync(string prompt)
    {
        // 1. Create Client
        var client = new OpenAIClient(new ApiKeyCredential(_apiKey));
        var imageClient = client.GetImageClient("dall-e-3");

        // 2. Generate
        ClientResult<GeneratedImage> result = await imageClient.GenerateImageAsync(prompt, new ImageGenerationOptions
        {
            Quality = GeneratedImageQuality.Standard,
            Size = GeneratedImageSize.W1024xH1024,
            ResponseFormat = GeneratedImageFormat.Bytes
        });

        // 3. Return Base64
        // The SDK returns BinaryData, we convert to Base64 string for frontend
        return Convert.ToBase64String(result.Value.ImageBytes.ToArray());
    }

    public async Task<string> RewritePromptAsync(string prompt, string? style, CancellationToken ct)
    {
        var client = new OpenAIClient(new ApiKeyCredential(_apiKey));
        var chatClient = client.GetChatClient("gpt-4o-mini");

        var styleInstruction = style switch
        {
            "professional" => "Rewrite to a clear, precise, professional image prompt with strong nouns and adjectives.",
            "playful" => "Rewrite with playful, whimsical tone and a bit of charm.",
            "random" => "Rewrite with a surprising twist and creative elements.",
            "cinematic" => "Rewrite with cinematic composition, lighting, and mood.",
            "minimal" => "Rewrite into a short, minimal prompt with only essential details.",
            _ => "Rewrite into a clear, vivid, high-quality image prompt."
        };

        var system = "You are a prompt enhancer for text-to-image. Return ONLY the improved prompt, no quotes, no extra text.";
        var user = $"{styleInstruction}\nOriginal prompt: {prompt}";

        ChatCompletion completion = await chatClient.CompleteChatAsync(
            [
                ChatMessage.CreateSystemMessage(system),
                ChatMessage.CreateUserMessage(user)
            ],
            new ChatCompletionOptions { Temperature = 0.7f },
            ct
        );

        return completion.ToString().Trim();
    }
}
