using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Services;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using FluentValidation.Results;

namespace MagicDraw.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly OpenAIService _aiService;
    private readonly IValidator<GenerateRequest> _validator;

    public AiController(OpenAIService aiService, IValidator<GenerateRequest> validator)
    {
        _aiService = aiService;
        _validator = validator;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateRequest req)
    {
        var validationResult = await _validator.ValidateAsync(req);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

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
