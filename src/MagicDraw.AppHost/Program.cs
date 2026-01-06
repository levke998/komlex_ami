var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.MagicDraw_Api>("api");

builder.AddNpmApp("web", "../MagicDraw.Web")
    .WithReference(api)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
