---
description: "Unloads the model from LM Studio GPU memory"
arguments:
  type: string
  optional: true
---

Execute the following bash command to unload the active LM Studio model from GPU VRAM:

```bash
curl -X POST http://localhost:1234/v1/models/unload