# Project Status

## MVP Checklist

### Authentication
- [x] Register / Login / Logout
- [ ] Profile view/edit
- [ ] Role-based access (admin)

### Drawing Core
- [x] Canvas drawing (brush, eraser, colors)
- [ ] Undo/Redo
- [ ] Save & Load drawings
- [x] Layer system (visibility/lock/order)
- [x] UI Polish (Dark Theme, Full Page Canvas, Shape Tools)

### AI Draw
- [ ] Prompt → queued job → generated image
- [ ] Insert generated image as a layer
- [ ] Handle failures and rate limits

### Export
- [ ] Export PNG/JPG
- [ ] Thumbnail generation

---

**Current Phase:** Stable / Debugging Complete
**Last Updated:** 2026-01-06 14:15

## Recent Completed Tasks
- [x] Integrate AI Image Generation (OpenAI)
- [x] Implement Soft Brush Physics
- [x] **CRITICAL FIX**: Backend Startup & CORS Configuration
- [x] **CRITICAL FIX**: App connectivity (Proxy vs Direct)
- [x] **UI FIX**: Layer Data Persistence on Resize
- [x] **UI FIX**: Opacity Slider Usability

## Current Focus
- Verification & Deployment Readiness

## Known Issues
- None (All critical blockers resolved).

## Next Steps
- User Testing
- Database Integration (PostgreSQL) - *Deferred*

## Architecture / Infrastructure
- [x] Solution Setup (.NET Aspire)
- [x] Database Configuration (Connection String & Dependencies)
- [x] Backend Services & Controllers (User, Drawing, Layers, Auth)
- [ ] Blob Storage Setup
