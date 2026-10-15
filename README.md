# Yoana Karageorgieva Portfolio

Static portfolio site. All content comes from a Google Sheet (ID in `config.js`), shared as "Anyone with the link: Viewer".
If the sheet can't be reached, the site falls back to `content.csv`.

Sheet columns: Section | Title | Description | Video or article link | Photo link | Colour

- `Intro` row: Title = name, Description = intro text, Photo link = portrait
- `Background` row: Photo link = landscape photo behind the intro
- Any other Section name becomes a section card. New name = new section.
- Colours: sage, peach, sky, lavender, butter, mint, rose, sand
- Photo links: Google Drive share links work (file must be "Anyone with the link").
- Video links: YouTube or Google Drive file links play inside the page.
