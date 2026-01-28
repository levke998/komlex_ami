using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Services;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using System.Threading;

namespace MagicDraw.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly OpenAIService _aiService;
    private readonly IValidator<GenerateRequest> _validator;
    private readonly IValidator<RewritePromptRequest> _rewriteValidator;

    public AiController(OpenAIService aiService, IValidator<GenerateRequest> validator, IValidator<RewritePromptRequest> rewriteValidator)
    {
        _aiService = aiService;
        _validator = validator;
        _rewriteValidator = rewriteValidator;
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
            return Ok(new { image = $"data:image/png;base64,{base64Image}" });
        }
        catch (Exception ex)
        {
            return Problem(ex.Message);
        }
    }

    [HttpPost("rewrite")]
    public async Task<IActionResult> Rewrite([FromBody] RewritePromptRequest req, CancellationToken ct)
    {
        var validationResult = await _rewriteValidator.ValidateAsync(req, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

        try
        {
            var rewritten = await _aiService.RewritePromptAsync(req.Prompt, req.Style, ct);
            return Ok(new RewritePromptResponse(rewritten));
        }
        catch (Exception ex)
        {
            return Problem(ex.Message);
        }
    }
}
