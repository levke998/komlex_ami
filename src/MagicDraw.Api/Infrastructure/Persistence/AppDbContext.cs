using MagicDraw.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MagicDraw.Api.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Drawing> Drawings { get; set; }
    public DbSet<Layer> Layers { get; set; }
    public DbSet<AiGeneration> AiGenerations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Explicitly configure enum conversions if necessary, but EF Core 9 handles them well.
        // We can add configurations here later.
    }
}
