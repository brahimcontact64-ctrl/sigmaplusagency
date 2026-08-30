import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AICompletionParams, AIStreamParams } from "./provider";

export class AnthropicProvider implements AIProvider {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async *streamReply({ system, messages, maxTokens, signal }: AIStreamParams): AsyncIterable<string> {
    const stream = this.client.messages.stream(
      { model: this.model, max_tokens: maxTokens, system, messages },
      { signal },
    );

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }

  async complete({ system, messages, maxTokens }: AICompletionParams): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.type === "text" ? textBlock.text : "";
  }
}
