using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using MagicDraw.Api.Application.Configuration;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Domain.Entities;
using MagicDraw.Api.Domain.Exceptions;
using MagicDraw.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MagicDraw.Api.Application.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly AdminSettings _adminSettings;

    public AuthService(AppDbContext context, IConfiguration configuration, IOptions<AdminSettings> adminOptions)
    {
        _context = context;
        _configuration = configuration;
        _adminSettings = adminOptions.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
        {
            throw new ConflictException("User with this email already exists.");
        }
        if (await _context.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
        {
            throw new ConflictException("User with this username already exists.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        var isAdmin = IsAdmin(user.Email);
        var token = GenerateJwtToken(user, isAdmin);

        return new AuthResponse(token, new UserResponse(user.Id, user.Username, user.Email, user.CreatedAt), isAdmin);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials."); 
        }

        if (user.IsBanned)
        {
            throw new ForbiddenException("User is banned.");
        }

        var isAdmin = IsAdmin(user.Email);
        var token = GenerateJwtToken(user, isAdmin);

        return new AuthResponse(token, new UserResponse(user.Id, user.Username, user.Email, user.CreatedAt), isAdmin);
    }

    private string GenerateJwtToken(User user, bool isAdmin)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (isAdmin)
        {
            claims.Add(new Claim("is_admin", "true"));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7), // Long expiry for MVP
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(secretKey), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private bool IsAdmin(string email)
    {
        return _adminSettings.Emails.Any(e => string.Equals(e, email, StringComparison.OrdinalIgnoreCase));
    }
}
