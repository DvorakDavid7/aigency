import 'dotenv/config'
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

async function main() {
  const result = await generateText({
    model: anthropic("claude-sonnet-4-5"),
    prompt: "how are you?"
  })

  console.log(result)
}

main()
