using System;
using System.Threading;
using System.Threading.Tasks;
using BCrypt.Net;
using MagicDraw.Api.Application.Dtos;
using MagicDraw.Api.Domain.Entities;
using MagicDraw.Api.Domain.Exceptions;
using MagicDraw.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MagicDraw.Api.Application.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken ct)
    {
        // Enforce uniqueness
        if (await _db.Users.AnyAsync(u => u.Email == request.Email, ct))
            throw new ConflictException("Email already exists.");
        if (await _db.Users.AnyAsync(u => u.Username == request.Username, ct))
            throw new ConflictException("Username already exists.");

        var hashed = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = hashed,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return MapToResponse(user);
    }

    public async Task<UserResponse?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        return user == null ? null : MapToResponse(user);
    }

    public async Task<UserResponse?> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user == null) return null;

        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var usernameExists = await _db.Users.AnyAsync(u => u.Username == request.Username && u.Id != id, ct);
            if (usernameExists) throw new ConflictException("Username already exists.");
            user.Username = request.Username;
        }
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailExists = await _db.Users.AnyAsync(u => u.Email == request.Email && u.Id != id, ct);
            if (emailExists) throw new ConflictException("Email already exists.");
            user.Email = request.Email;
        }

        await _db.SaveChangesAsync(ct);

        return MapToResponse(user);
    }

    private static UserResponse MapToResponse(User user)
    {
        return new UserResponse(user.Id, user.Username, user.Email, user.CreatedAt);
    }
}
