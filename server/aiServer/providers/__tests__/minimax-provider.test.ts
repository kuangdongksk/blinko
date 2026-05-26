import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the proxy module before importing LLMProvider
vi.mock('@server/lib/proxy', () => ({
  fetchWithProxy: async () => fetch
}));

// Mock @ai-sdk/openai
const mockLanguageModel = { modelId: 'MiniMax-M2.5' };
const mockCreateOpenAI = vi.fn((config: any) => ({
  languageModel: vi.fn((modelKey: string) => mockLanguageModel)
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI
}));

// Mock other SDK modules to avoid import errors
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => ({ languageModel: vi.fn(() => ({})) }))
}));
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => ({ languageModel: vi.fn(() => ({})) }))
}));
vi.mock('ollama-ai-provider', () => ({
  createOllama: vi.fn(() => ({ languageModel: vi.fn(() => ({})) }))
}));
vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() => ({ languageModel: vi.fn(() => ({})) }))
}));
vi.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: vi.fn(() => ({ languageModel: vi.fn(() => ({})) }))
}));
vi.mock('@ai-sdk/xai', () => ({
  createXai: vi.fn(() => ({ languageModel: vi.fn(() => ({})) }))
}));
vi.mock('@ai-sdk/azure', () => ({
  createAzure: vi.fn(() => ({ languageModel: vi.fn(() => ({})) }))
}));

describe('MiniMax LLM Provider', () => {
  beforeEach(() => {
    mockCreateOpenAI.mockClear();
    vi.clearAllMocks();
  });

  it('should handle minimax provider case', async () => {
    const { LLMProvider } = await import('../LLMProvider');
    const provider = new LLMProvider();

    const result = await provider.getLanguageModel({
      provider: 'minimax',
      apiKey: 'test-api-key',
      modelKey: 'MiniMax-M2.5'
    });

    expect(result).toBeDefined();
    expect(mockCreateOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-api-key',
        baseURL: 'https://api.minimax.io/v1'
      })
    );
  });

  it('should use default MiniMax base URL when not provided', async () => {
    const { LLMProvider } = await import('../LLMProvider');
    const provider = new LLMProvider();

    await provider.getLanguageModel({
      provider: 'minimax',
      apiKey: 'test-key',
      modelKey: 'MiniMax-M2.7'
    });

    expect(mockCreateOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.minimax.io/v1'
      })
    );
  });

  it('should allow custom base URL override', async () => {
    const { LLMProvider } = await import('../LLMProvider');
    const provider = new LLMProvider();

    await provider.getLanguageModel({
      provider: 'minimax',
      apiKey: 'test-key',
      baseURL: 'https://custom.minimax.io/v1',
      modelKey: 'MiniMax-M2.5'
    });

    expect(mockCreateOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://custom.minimax.io/v1'
      })
    );
  });

  it('should be case-insensitive for provider name', async () => {
    const { LLMProvider } = await import('../LLMProvider');
    const provider = new LLMProvider();

    await provider.getLanguageModel({
      provider: 'MiniMax',
      apiKey: 'test-key',
      modelKey: 'MiniMax-M2.5'
    });

    expect(mockCreateOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.minimax.io/v1'
      })
    );
  });

  it('should support all MiniMax model keys', async () => {
    const { LLMProvider } = await import('../LLMProvider');
    const provider = new LLMProvider();
    const models = ['MiniMax-M2.7', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed'];

    for (const modelKey of models) {
      mockCreateOpenAI.mockClear();
      await provider.getLanguageModel({
        provider: 'minimax',
        apiKey: 'test-key',
        modelKey
      });
      expect(mockCreateOpenAI).toHaveBeenCalled();
    }
  });

  it('should pass proxiedFetch to createOpenAI', async () => {
    const { LLMProvider } = await import('../LLMProvider');
    const provider = new LLMProvider();

    await provider.getLanguageModel({
      provider: 'minimax',
      apiKey: 'test-key',
      modelKey: 'MiniMax-M2.5'
    });

    expect(mockCreateOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        fetch: expect.any(Function)
      })
    );
  });
});
