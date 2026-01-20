# Project Status

## MVP Checklist

### Authentication
- [ ] Register / Login / Logout
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

## Architecture / Infrastructure
- [x] Solution Setup (.NET Aspire)
- [x] Database Configuration (Connection String & Dependencies)
- [x] Backend Services & Controllers (User, Drawing, Layers)
- [ ] Blob Storage Setup
