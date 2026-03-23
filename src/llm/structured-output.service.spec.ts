import { StructuredOutputService } from './structured-output.service';

describe('StructuredOutputService', () => {
  it('returns valid true when no schema is provided', () => {
    const service = new StructuredOutputService();
    expect(service.parse('plain text')).toEqual({ valid: true });
  });

  it('parses and validates required schema fields', () => {
    const service = new StructuredOutputService();
    const result = service.parse('{"answer":"ok"}', {
      responseSchema: { type: 'object', required: ['answer'], properties: { answer: { type: 'string' } } },
    });
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({ answer: 'ok' });
  });

  it('attempts json fix and fails when schema remains invalid', () => {
    const service = new StructuredOutputService();
    const result = service.parse('result: {"x":1}', {
      responseSchema: { type: 'object', required: ['answer'], properties: { answer: { type: 'string' } } },
    });
    expect(result.valid).toBe(false);
  });
});
