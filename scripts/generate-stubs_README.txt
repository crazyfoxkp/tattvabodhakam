================================================================================
TidGi External Media Stub Generator
================================================================================

1. DESCRIPTION
--------------------------------------------------------------------------------
This script (`generate-stubs.mjs`) scans your workspace `files/` directory for 
external media assets (audio files, images, and PDFs) and automatically 
generates corresponding lightweight TiddlyWiki stub `.tid` records in the 
`tiddlers/external/` directory.

In a Node.js-backed TiddlyWiki / TidGi workspace, external files referenced via 
canonical URIs require formal tiddler records with `_canonical_uri` properties 
to prevent 404 errors and properly register them into the internal index.

2. WHAT IT DOES
--------------------------------------------------------------------------------
- Recursively walks through subdirectories inside `files/` (specifically 
  `files/TW_Audio_files`, `files/TW_image_files`, and `files/TW_pdf_files`).
- Determines the appropriate MIME type for each asset (.mp3, .wav, .png, .jpg, 
  .webp, .pdf).
- Generates a proxy `.tid` file for every asset containing:
  * Title: Relative file path matching the resource.
  * Type: Correct MIME type descriptor.
  * _canonical_uri: Direct link pointing to the file location.
- Overwrites/updates existing stubs cleanly without creating duplicates.

3. WHEN TO RUN IT
--------------------------------------------------------------------------------
Run this script whenever you add, remove, or reorganize external media files 
in your `files/` folders (e.g., after adding new audio shlokas, images, or 
documents to your workspace).

4. HOW TO EXECUTE IT
--------------------------------------------------------------------------------
Open your terminal, navigate to your TidGi workspace root directory, and run the 
script using Node.js:

    node scripts/generate-stubs.mjs

Tip: If you use a package.json file in your workspace root, you can also set up 
an npm shortcut script to run it quickly.