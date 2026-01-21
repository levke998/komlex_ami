using MagicDraw.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddSqlServerDbContext<AppDbContext>("sqldata");
builder.AddServiceDefaults();
builder.Services.AddControllers(); // Enable Controllers
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddProblemDetails();
builder.Services.AddCors();
builder.Services.AddScoped<MagicDraw.Api.Services.OpenAIService>();
builder.Services.AddScoped<MagicDraw.Api.Application.Services.IUserService, MagicDraw.Api.Application.Services.UserService>();
builder.Services.AddScoped<MagicDraw.Api.Application.Services.IDrawingService, MagicDraw.Api.Application.Services.DrawingService>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply migrations on startup (Development only or safe environments)
if (!app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }
}

// Configure the HTTP request pipeline.
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers(); // Map Controllers

app.UseHttpsRedirection();

app.Run();

public partial class Program { }
