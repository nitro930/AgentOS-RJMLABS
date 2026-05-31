# Task: Prompt Library (System Prompt Manager) Implementation

## Summary
Built a full-featured Prompt Library for the RJMLABS.CO.UK AgentOS project with CRUD API, Prisma model, and a rich 4-tab UI component.

## Files Created/Modified

### New Files
1. **`src/components/agent-os/prompt-library.tsx`** — Main UI component with 4 tabs:
   - **Library** — Grid of prompt cards with search, category filters (system, persona, task, constraint, formatting, safety), use count, tags, and actions (Use, Edit, Copy, Delete)
   - **Editor** — Full prompt editor with name, description, category selector, target agent, content textarea with `{{variable}}` syntax, tags, variable auto-detection, and live preview panel
   - **Variables** — Variable manager with auto-detection from prompt content, table view with description/default/required, and cross-prompt variable usage summary
   - **Templates** — 6 built-in templates (Coding Assistant, Research Analyst, Data Processor, Security Scanner, Documentation Writer, Constitutional AI) with "Use" and "Customize" actions

2. **`src/app/api/prompts/route.ts`** — API endpoint:
   - GET: List prompts with search/category filters
   - POST: Create new prompt

3. **`src/app/api/prompts/[id]/route.ts`** — API endpoint:
   - GET: Get single prompt
   - PUT: Update prompt
   - DELETE: Delete prompt (with built-in protection)

### Modified Files
4. **`prisma/schema.prisma`** — Added `PromptTemplate` model with fields: id, name, description, category, content, variables (JSON), tags (JSON), agentId, isBuiltIn, useCount, version, isActive, timestamps

5. **`src/lib/store.ts`** — Added `'prompt-library'` to `SectionId` type

6. **`src/app/page.tsx`** — Added PromptLibrary import, section component mapping, title, and layer

7. **`src/components/agent-os/sidebar.tsx`** — Added "Prompts" navigation item with BookOpen icon in tools group

8. **`src/lib/db.ts`** — Updated schema version to force Prisma client refresh

9. **`src/components/agent-os/docker-manager.tsx`** — Fixed broken `Resume` import from lucide-react (pre-existing bug)

## Technical Details
- Uses Prisma ORM (SQLite) for persistence
- Dark cyberpunk theme consistent with project (bg: #0f1117, cards: #1a1b2e, accent: emerald-400/500)
- framer-motion for animations
- lucide-react icons throughout
- Responsive design with mobile-first approach
- Variable auto-detection from `{{variable_name}}` syntax in prompt content
- Live preview with variable substitution highlighting
- Built-in templates include full prompt content with variables, tags, and descriptions

## Lint Results
No errors in new files. Pre-existing errors in system-health.tsx and docker-manager.tsx remain.
