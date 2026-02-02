using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MagicDraw.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<AdminUserListItem>>> GetUsers(CancellationToken ct)
    {
        var users = await _adminService.GetUsersAsync(ct);
        return Ok(users);
    }

    [HttpPost("users/{id}/ban")]
    public async Task<ActionResult<AdminUserListItem>> BanUser(Guid id, [FromBody] AdminBanRequest request, CancellationToken ct)
    {
        var adminEmail = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? "admin";
        var user = await _adminService.BanUserAsync(id, request.Reason, adminEmail, ct);
        return Ok(user);
    }

    [HttpPost("users/{id}/unban")]
    public async Task<ActionResult<AdminUserListItem>> UnbanUser(Guid id, CancellationToken ct)
    {
        var adminEmail = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? "admin";
        var user = await _adminService.UnbanUserAsync(id, adminEmail, ct);
        return Ok(user);
    }

    [HttpPost("users/{id}/warn")]
    public async Task<IActionResult> WarnUser(Guid id, [FromBody] AdminWarnRequest request, CancellationToken ct)
    {
        var issuedBy = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? "admin";
        await _adminService.WarnUserAsync(id, request.Message, issuedBy, ct);
        return NoContent();
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        var adminEmail = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? "admin";
        await _adminService.DeleteUserAsync(id, adminEmail, ct);
        return NoContent();
    }

    [HttpGet("drawings")]
    public async Task<ActionResult<IReadOnlyList<AdminDrawingListItem>>> GetDrawings(CancellationToken ct)
    {
        var drawings = await _adminService.GetDrawingsAsync(ct);
        return Ok(drawings);
    }

    [HttpGet("drawings/{id}")]
    public async Task<ActionResult<DrawingResponse>> GetDrawing(Guid id, CancellationToken ct)
    {
        var drawing = await _adminService.GetDrawingAsync(id, ct);
        return Ok(drawing);
    }

    [HttpDelete("drawings/{id}")]
    public async Task<IActionResult> DeleteDrawing(Guid id, CancellationToken ct)
    {
        var adminEmail = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? "admin";
        await _adminService.DeleteDrawingAsync(id, adminEmail, ct);
        return NoContent();
    }

    [HttpGet("logs")]
    public async Task<ActionResult<IReadOnlyList<AdminAuditLogItem>>> GetLogs(CancellationToken ct)
    {
        var logs = await _adminService.GetAuditLogsAsync(ct);
        return Ok(logs);
    }
}
