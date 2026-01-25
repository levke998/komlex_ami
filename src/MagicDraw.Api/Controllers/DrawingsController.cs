using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MagicDraw.Api.Controllers;

[ApiController]
[Route("api/drawings")]
[Authorize]
public class DrawingsController : ControllerBase
{
    private readonly IDrawingService _drawingService;
    private readonly IValidator<CreateDrawingRequest> _createDrawingValidator;
    private readonly IValidator<CreateLayerRequest> _createLayerValidator;
    private readonly IValidator<UpdateLayerRequest> _updateLayerValidator;

    public DrawingsController(
        IDrawingService drawingService,
        IValidator<CreateDrawingRequest> createDrawingValidator,
        IValidator<CreateLayerRequest> createLayerValidator,
        IValidator<UpdateLayerRequest> updateLayerValidator)
    {
        _drawingService = drawingService;
        _createDrawingValidator = createDrawingValidator;
        _createLayerValidator = createLayerValidator;
        _updateLayerValidator = updateLayerValidator;
    }

    [HttpPost]
    public async Task<ActionResult<DrawingResponse>> Create([FromBody] CreateDrawingRequest request, CancellationToken ct)
    {
        var validationResult = await _createDrawingValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

        var userId = GetUserId();
        var drawing = await _drawingService.CreateAsync(userId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = drawing.Id }, drawing);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DrawingResponse>> GetById(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var drawing = await _drawingService.GetByIdAsync(id, userId, ct);
        if (drawing == null)
        {
            return NotFound();
        }
        return Ok(drawing);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DrawingListItemResponse>>> GetAll(CancellationToken ct)
    {
        var userId = GetUserId();
        var drawings = await _drawingService.GetAllAsync(userId, ct);
        return Ok(drawings);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        await _drawingService.DeleteAsync(id, userId, ct);
        return NoContent();
    }

    // Layer Endpoints

    [HttpPost("{drawingId}/layers")]
    public async Task<ActionResult<LayerResponse>> AddLayer(Guid drawingId, [FromBody] CreateLayerRequest request, CancellationToken ct)
    {
        var validationResult = await _createLayerValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

        var userId = GetUserId();
        var layer = await _drawingService.AddLayerAsync(drawingId, userId, request, ct);
        if (layer == null)
        {
            return NotFound("Drawing not found");
        }
        // In a real scenario we might want a specific GetLayer endpoint for CreatedAtAction, 
        // but often returning the resource is enough or pointing to the drawing.
        // For now, simple 200/201.
        return Ok(layer); 
    }

    [HttpPut("{drawingId}/layers/{layerId}")]
    public async Task<ActionResult<LayerResponse>> UpdateLayer(Guid drawingId, Guid layerId, [FromBody] UpdateLayerRequest request, CancellationToken ct)
    {
        var validationResult = await _updateLayerValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.ToDictionary());
        }

        var userId = GetUserId();
        var layer = await _drawingService.UpdateLayerAsync(drawingId, layerId, userId, request, ct);
        if (layer == null)
        {
            return NotFound("Drawing or Layer not found");
        }
        return Ok(layer);
    }

    [HttpDelete("{drawingId}/layers/{layerId}")]
    public async Task<IActionResult> DeleteLayer(Guid drawingId, Guid layerId, CancellationToken ct)
    {
        var userId = GetUserId();
        var result = await _drawingService.DeleteLayerAsync(drawingId, layerId, userId, ct);
        if (!result)
        {
            return NotFound("Drawing or Layer not found");
        }
        return NoContent();
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (sub == null || !Guid.TryParse(sub, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user identity.");
        }
        return userId;
    }
}
