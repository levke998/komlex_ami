using OpenAI.Images;
using OpenAI;
using System.ClientModel;

namespace MagicDraw.Api.Services;

public class OpenAIService
{
    private readonly string _apiKey;

    public OpenAIService(IConfiguration configuration)
    {
        _apiKey = configuration["OpenAI:ApiKey"] ?? throw new InvalidOperationException("OpenAI:ApiKey not found.");
    }

    public async Task<string> GenerateImageAsync(string prompt)
    {
        // 1. Create Client
        var client = new OpenAIClient(_apiKey);
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
}
