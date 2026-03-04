import 'dotenv/config'
import readline from "readline/promises"
import { generateText, generateImage, experimental_generateVideo as generateVideo, stepCountIs } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import { fal } from "@ai-sdk/fal"
import { z } from "zod"
import fs from "fs"


function generateImageTool() {
  return {
    description: "Generate an image from a text prompt",
    inputSchema: z.object({
      prompt: z.string().describe("Detailed description of the image to generate"),
      outputPath: z.string().describe("File path to save the image to"),
    }),
    execute: async ({ prompt, outputPath }: { prompt: string; outputPath: string }) => {
      const { image } = await generateImage({
        model: openai.image("dall-e-3"),
        prompt,
        size: "1024x1024",
      })
      fs.writeFileSync(outputPath, Buffer.from(image.uint8Array))
      return `Image saved to ${outputPath}`
    },
  }
}

function generateVideoTool() {
  return {
    description: "Generate a short video from a text prompt",
    inputSchema: z.object({
      prompt: z.string().describe("Detailed description of the video to generate"),
      outputPath: z.string().describe("File path to save the video to"),
    }),
    execute: async ({ prompt, outputPath }: { prompt: string; outputPath: string }) => {
      const { video } = await generateVideo({
        model: fal.video("fal-ai/minimax-video"),
        prompt,
        aspectRatio: "16:9",
      })
      fs.writeFileSync(outputPath, Buffer.from(video.uint8Array))
      return `Video saved to ${outputPath}`
    },
  }
}

function writeFileTool() {
  return {
    description: "Write text content to a file",
    inputSchema: z.object({
      content: z.string().describe("The text content to write"),
      outputPath: z.string().describe("File path to save the content to"),
    }),
    execute: async ({ content, outputPath }: { content: string; outputPath: string }) => {
      fs.writeFileSync(outputPath, content)
      return `File saved to ${outputPath}`
    },
  }
}

function readFileTool() {
  return {
    description: "Read text content from a file",
    inputSchema: z.object({
      path: z.string().describe("File path to read"),
    }),
    execute: async ({ path }: { path: string }) => {
      return fs.readFileSync(path, "utf-8")
    },
  }
}

function createMarketingAgent() {
  const tools = {
    webSearch: anthropic.tools.webSearch_20250305({ maxUses: 2 }),
    generateImage: generateImageTool(),
    generateVideo: generateVideoTool(),
    writeFile: writeFileTool(),
    readFile: readFileTool(),
  }

  return {
    run(prompt: string) {
      return generateText({
        model: anthropic("claude-sonnet-4-6"),
        prompt,
        tools,
        stopWhen: stepCountIs(3),
      })
    },
  }
}


async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const prompt = await rl.question("> ")
  rl.close()

  const agent = createMarketingAgent()
  console.log("thinking...")
  const result = await agent.run(prompt)
  console.log("done\n")
  console.log(result.text)
}

main().catch(err => {
  const message = err?.message ?? String(err)
  console.error("\nError:", message)
})
