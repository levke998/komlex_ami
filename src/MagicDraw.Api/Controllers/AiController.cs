using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MagicDraw.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly OpenAIService _aiService;

    public AiController(OpenAIService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Prompt))
            return BadRequest("Prompt is required");

        try
        {
            var base64Image = await _aiService.GenerateImageAsync(req.Prompt);
            return Ok(new { Image = $"data:image/png;base64,{base64Image}" });
        }
        catch (Exception ex)
        {
            return Problem(ex.Message);
        }
    }
}
