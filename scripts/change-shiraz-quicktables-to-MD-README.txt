================================================================================
TidGi Sanskrit Declension Table Migrator
================================================================================

1. DESCRIPTION
--------------------------------------------------------------------------------
This script (`change-shiraz-quicktables-to-MD.js`) recursively scans your TidGi workspace `tiddlers/` 
folder for JSON-format tiddlers tagged with "SKS शब्दरूपाणि v2" and automatically 
converts broken Shiraz macro-driven table blocks into clean, native Markdown tables.

Due to regex compatibility limitations with custom character delimiters in certain 
TiddlyWiki environments, this tool migrates deprecated custom table blocks into 
robust Markdown structures that render natively without macros.

2. WHAT IT DOES
--------------------------------------------------------------------------------
- Recursively traverses the `tiddlers/` directory to inspect all `.json` tiddler files.
- Filters and targets only tiddlers containing the tag: "SKS शब्दरूपाणि v2".
- Converts custom Shiraz data blocks (`@@.dblock...@@`) into standard Markdown tables:
  * Replaces all custom '¦' cell delimiters with standard pipes ('|').
  * Automatically appends '|h' to the end of the first row to designate it as a table header.
- Strips out obsolete `<<table-csv>>` macro lines and structural `@@` wrappers.
- Cleans up trailing blank lines and writes the updated tiddler contents back to 
  disk in-place.

3. WHEN TO RUN IT
--------------------------------------------------------------------------------
Run this script whenever you have batch-updated your declension tiddlers or need 
to migrate legacy Shiraz comma/pipe table formats to native Markdown syntax across 
your workspace.

4. HOW TO EXECUTE IT
--------------------------------------------------------------------------------
Open your terminal, navigate to your TidGi workspace root directory where the script 
is saved, and run it using Node.js:

    node scripts/change-shiraz-quicktables-to-MD.js

After running the script, restart your TidGi server or reload your workspace 
to view the cleanly rendered Markdown tables.