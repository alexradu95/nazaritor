# AI Agent System Specification

## Overview

The AI agent system is the brain of the application, enabling natural language interaction with the knowledge management system. Multiple specialized agents work together to handle different aspects of user requests.

### Design Philosophy

- **Multi-agent architecture**: Specialized agents for different domains
- **Natural language first**: Users interact through conversational chat
- **Context-aware**: Agents maintain conversation context and working memory
- **Tool-using**: Agents can call functions to manipulate objects and UI
- **Collaborative**: Agents can hand off to each other when needed

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────┐
│               Conversation Router                    │
│         (Analyzes intent, routes to agent)           │
└───────────────┬──────────────────┬──────────────────┘
                │                  │
     ┌──────────▼─────────┐  ┌────▼──────────┐  ┌──────────────┐
     │  Curator Agent     │  │   Researcher   │  │   Builder    │
     │   (Organize)       │  │   Agent        │  │   Agent      │
     │                    │  │   (Search)     │  │   (UI Gen)   │
     └──────────┬─────────┘  └────┬──────────┘  └──────┬───────┘
                │                 │                     │
                └─────────────────┴─────────────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │   Shared Context   │
                        │   - Conversation   │
                        │   - Working Memory │
                        │   - Active Objects │
                        └────────────────────┘
```

---

## Agent Roles & Capabilities

### 1. Curator Agent

**Role**: Organizes, categorizes, and structures knowledge

**Personality**: Methodical, detail-oriented, loves order

**Capabilities:**
- Organize and categorize objects
- Suggest tags and properties
- Create collections and groups
- Link related objects
- Maintain knowledge structure
- Clean up and archive old content
- Suggest property improvements

**Example Interactions:**

```
User: "Organize my project notes from last week"
Curator: "I found 12 project-related notes from last week.
I've categorized them into 3 projects:
- Mobile App Redesign (5 notes)
- API Migration (4 notes)
- Team Onboarding (3 notes)

I've also added relevant tags and linked them to their
respective project objects. Would you like me to create
a summary page for each project?"
```

```
User: "This knowledge bit about React hooks should be tagged"
Curator: "I suggest adding these tags:
- #programming
- #react
- #frontend
- #hooks

I also found 8 related knowledge bits about React.
Shall I create relations between them?"
```

**Tools Available:**
- `addTags(objectId, tags)` - Add tags to an object
- `createRelation(fromId, toId, type)` - Link objects
- `suggestCategories(objectId)` - AI-suggested categories
- `createCollection(name, objectIds)` - Group objects
- `archiveOldObjects(criteria)` - Archive based on criteria

---

### 2. Researcher Agent

**Role**: Finds information, searches, and synthesizes knowledge

**Personality**: Curious, thorough, loves discovering connections

**Capabilities:**
- Semantic search across all objects
- Summarize long content
- Extract entities (people, dates, concepts)
- Find related information
- Generate insights from data
- Answer questions about knowledge base
- Synthesize information from multiple sources

**Example Interactions:**

```
User: "What have I learned about TypeScript generics?"
Researcher: "I found 5 knowledge bits about TypeScript generics.
Here's a summary:

Key Concepts:
1. Generic constraints with 'extends'
2. Utility types (Partial, Pick, Omit)
3. Conditional types with 'infer'
4. Generic function signatures
5. Mapped types

You've marked the 'Conditional types' note with high
confidence. Would you like me to generate a comprehensive
guide combining all these notes?"
```

```
User: "Find all tasks related to the mobile app project"
Researcher: "I found 23 tasks related to 'Mobile App Redesign':
- 8 in progress (3 are overdue)
- 12 completed
- 3 not started

The overdue tasks are:
1. Implement dark mode (due 3 days ago)
2. User testing feedback (due yesterday)
3. App store screenshots (due today)

Shall I prioritize these for you?"
```

**Tools Available:**
- `semanticSearch(query)` - AI-powered search
- `summarize(objectId, length)` - Summarize content
- `extractEntities(content)` - Extract people, dates, concepts
- `findRelated(objectId)` - Find similar objects
- `answerQuestion(question, context)` - Answer from knowledge base
- `generateInsights(objectIds)` - Synthesize insights

---

### 3. Builder Agent

**Role**: Generates UI components and updates views dynamically

**Personality**: Creative, visual, loves crafting experiences

**Capabilities:**
- Generate UI components from descriptions
- Create dashboards and views
- Update UI state dynamically
- Build custom visualizations
- Generate charts and graphs
- Create interactive elements
- Render object-specific views

**Example Interactions:**

```
User: "Show me a kanban board of all my active tasks"
Builder: *Generates and renders Kanban component*

"I've created a kanban board with 4 columns:
- To Do (8 tasks)
- In Progress (5 tasks)
- Blocked (2 tasks)
- Done (15 tasks this week)

You can drag tasks between columns. Would you like me to
add filters for priority or project?"
```

```
User: "Create a dashboard for my daily review"
Builder: *Generates dashboard layout*

"I've built a daily review dashboard with:
- Today's tasks and completion rate
- Recent notes and highlights
- Active habits and streaks
- Upcoming calendar events
- Financial snapshot

Shall I save this as your default morning view?"
```

**Tools Available:**
- `generateComponent(description, data)` - Create UI component
- `updateView(viewType, config)` - Change current view
- `renderVisualization(data, chartType)` - Create charts
- `createDashboard(widgets)` - Build custom dashboard
- `renderObjectCard(objectId)` - Display object
- `updateUIState(state)` - Modify UI state

---

## Agent Orchestration

### Conversation Router

The router analyzes user intent and routes to the appropriate agent(s).

```typescript
// apps/api/src/ai/orchestrator.ts

interface Intent {
  primary: 'organize' | 'search' | 'build' | 'create' | 'update' | 'general'
  confidence: number
  entities: string[]
  suggestedAgent: 'curator' | 'researcher' | 'builder'
}

async function analyzeIntent(message: string, context: Context): Promise<Intent> {
  // Use LLM to analyze user intent
  const analysis = await llm.complete({
    system: `Analyze the user message and determine intent:
    - organize: categorizing, tagging, linking, cleaning up
    - search: finding, discovering, answering questions
    - build: creating views, dashboards, visualizations
    - create: making new objects
    - update: modifying existing objects
    - general: conversation, help`,
    user: message,
    context,
  })

  return analysis
}

async function routeToAgent(intent: Intent, message: string, context: Context) {
  switch (intent.suggestedAgent) {
    case 'curator':
      return await curatorAgent.handle(message, context)
    case 'researcher':
      return await researcherAgent.handle(message, context)
    case 'builder':
      return await builderAgent.handle(message, context)
    default:
      // Handle with general conversation or delegate to multiple agents
      return await handleGeneralQuery(message, context)
  }
}
```

### Multi-Agent Collaboration

Agents can collaborate on complex tasks:

```
User: "Analyze my productivity this week and create a report"

Router: → Researcher Agent (analyze productivity)
Researcher: *Analyzes tasks, calendar, habits*
  → Hands off to Curator Agent (organize findings)
Curator: *Categorizes insights, creates structure*
  → Hands off to Builder Agent (create visual report)
Builder: *Generates dashboard with charts*

Final Output: Interactive productivity report with:
- Task completion rate
- Time spent per project
- Habits maintained
- Productivity trends
- Recommendations
```

---

## Context Management

### Conversation Context

Each agent maintains conversation context:

```typescript
interface ConversationContext {
  // Current conversation
  messages: Message[]
  currentTopic: string | null
  activeObjects: string[] // Object IDs user is discussing

  // Working memory (short-term)
  workingMemory: {
    recentQueries: string[]
    recentObjects: BaseObject[]
    pendingActions: Action[]
  }

  // User context
  userPreferences: {
    defaultView: string
    favoriteObjectTypes: string[]
    aiVerbosity: 'concise' | 'normal' | 'detailed'
  }

  // Session state
  sessionStart: Date
  interactionCount: number
}
```

### Context Sharing

Agents share context through a centralized store:

```typescript
// Shared context accessible by all agents
class SharedContext {
  private store: Map<string, any> = new Map()

  set(key: string, value: any, ttl?: number) {
    this.store.set(key, { value, expiresAt: ttl ? Date.now() + ttl : null })
  }

  get<T>(key: string): T | null {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  // Agents can read what other agents have learned
  getAgentMemory(agentName: string): any {
    return this.get(`agent:${agentName}:memory`)
  }
}
```

---

## Tool System

Agents use tools to interact with the system:

### Tool Definition

```typescript
interface Tool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute: (params: any, context: Context) => Promise<any>
}

// Example: Create Object Tool
const createObjectTool: Tool = {
  name: 'create_object',
  description: 'Create a new object in the knowledge base',
  parameters: z.object({
    type: z.string(),
    title: z.string(),
    properties: z.record(z.any()).optional(),
  }),
  execute: async (params, context) => {
    const object = await context.db.objects.create({
      type: params.type,
      title: params.title,
      content: '',
      properties: params.properties || {},
      relations: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        archived: false,
        favorited: false,
      },
    })
    return object
  },
}
```

### Tool Categories

**Object Management:**
- `create_object` - Create new object
- `update_object` - Modify existing object
- `delete_object` - Remove object
- `add_relation` - Link objects
- `add_tags` - Add tags to object

**Search & Discovery:**
- `semantic_search` - AI-powered search
- `full_text_search` - Traditional search
- `find_related` - Find related objects
- `get_object_graph` - Get relationship graph

**Content Generation:**
- `summarize` - Summarize content
- `extract_entities` - Extract entities
- `generate_content` - Generate text
- `categorize` - Auto-categorize

**UI Manipulation:**
- `generate_component` - Create UI component
- `update_view` - Change current view
- `render_visualization` - Create chart/graph
- `update_state` - Modify UI state

---

## AI Provider Integration

### OpenAI/Anthropic SDK

```typescript
// apps/api/src/ai/providers/openai.ts
import OpenAI from 'openai'

export class OpenAIProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async chat(messages: Message[], tools: Tool[]) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages,
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: zodToJsonSchema(t.parameters),
        },
      })),
      stream: true,
    })

    return response
  }

  async generateEmbedding(text: string) {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  }
}
```

---

## Agent Implementation Example

### Curator Agent Implementation

```typescript
// apps/api/src/ai/agents/curator.ts
import { OpenAIProvider } from '../providers/openai'
import { Tool } from '../tools'

export class CuratorAgent {
  private llm: OpenAIProvider
  private tools: Tool[]

  constructor() {
    this.llm = new OpenAIProvider(process.env.OPENAI_API_KEY!)
    this.tools = [
      addTagsTool,
      createRelationTool,
      suggestCategoriesTool,
      createCollectionTool,
      archiveOldObjectsTool,
    ]
  }

  async handle(message: string, context: ConversationContext) {
    const systemPrompt = `You are the Curator Agent, responsible for organizing
    and structuring the user's knowledge base. You are methodical, detail-oriented,
    and love creating order from chaos.

    Your capabilities:
    - Organize and categorize objects
    - Suggest tags and properties
    - Create meaningful connections between objects
    - Maintain knowledge structure
    - Clean up and archive content

    Always explain your organizational decisions and ask for confirmation
    before making bulk changes.`

    const response = await this.llm.chat(
      [
        { role: 'system', content: systemPrompt },
        ...context.messages,
        { role: 'user', content: message },
      ],
      this.tools
    )

    // Handle tool calls
    if (response.toolCalls) {
      for (const toolCall of response.toolCalls) {
        const tool = this.tools.find(t => t.name === toolCall.name)
        if (tool) {
          const result = await tool.execute(toolCall.params, context)
          // Add tool result to context
        }
      }
    }

    return response
  }
}
```

---

## Streaming Responses

For real-time interaction:

```typescript
async function* streamAgentResponse(
  agent: Agent,
  message: string,
  context: Context
) {
  const stream = await agent.handle(message, context)

  for await (const chunk of stream) {
    // Yield text chunks
    if (chunk.type === 'text') {
      yield { type: 'text', content: chunk.text }
    }

    // Yield tool calls
    if (chunk.type === 'tool-call') {
      yield { type: 'tool-call', tool: chunk.toolName, params: chunk.params }

      // Execute tool
      const result = await executeTool(chunk.toolName, chunk.params, context)

      yield { type: 'tool-result', result }
    }

    // Yield UI updates (for Builder agent)
    if (chunk.type === 'ui-component') {
      yield { type: 'component', component: chunk.component }
    }
  }
}
```

---

## Prompting Best Practices

### System Prompts

Each agent has a carefully crafted system prompt:

- **Personality**: Define agent character
- **Capabilities**: List what the agent can do
- **Constraints**: What the agent should NOT do
- **Examples**: Few-shot examples of good interactions
- **Guidelines**: How to handle edge cases

### User Prompts

Enhance user messages with context:

```typescript
function enhanceUserPrompt(message: string, context: Context): string {
  return `
User message: "${message}"

Context:
- Active objects: ${context.activeObjects.map(o => o.title).join(', ')}
- Current view: ${context.currentView}
- Recent queries: ${context.workingMemory.recentQueries.slice(0, 3).join(', ')}

Based on this context, understand the user's intent and respond accordingly.
  `.trim()
}
```

---

## Future Enhancements

### Planned Features

1. **Memory System**: Long-term memory across sessions
2. **Learning**: Agents learn from user preferences
3. **Proactive Suggestions**: Agents suggest actions without prompting
4. **Voice Interaction**: Speech-to-text and text-to-speech
5. **Multi-modal**: Image and file understanding
6. **Agent Personalities**: Customizable agent behavior

### Advanced Capabilities

- **Workflow Automation**: Agents can create and execute workflows
- **Smart Notifications**: Context-aware reminders
- **Predictive Actions**: Anticipate user needs
- **Collaborative Planning**: Help with goal setting and planning

---

## Summary

The AI agent system provides:

- **Three specialized agents**: Curator (organize), Researcher (search), Builder (UI)
- **Natural language interaction**: Conversational interface for all operations
- **Tool-using capabilities**: Agents can manipulate objects and UI
- **Context-aware**: Maintains conversation and working memory
- **Collaborative**: Agents work together on complex tasks
- **Streaming responses**: Real-time interaction
- **Extensible**: Easy to add new agents and tools

This multi-agent architecture enables a truly AI-first knowledge management experience where users can accomplish complex tasks through simple conversation.
