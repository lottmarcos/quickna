import { generateRoomId } from 'src/utils/generate-room-id';

describe('generateRoomId', () => {
  it('should return a string', () => {
    const id = generateRoomId();
    expect(typeof id).toBe('string');
  });

  it('should generate an ID with length of 5', () => {
    const id = generateRoomId();
    expect(id.length).toBe(5);
  });

  it('should only contain uppercase letters and numbers', () => {
    const id = generateRoomId();
    expect(id).toMatch(/^[A-Z0-9]+$/);
  });

  it('should generate IDs with proper character distribution', () => {
    const charCounts = {};
    const sampleSize = 1000;
    const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < sampleSize; i++) {
      const id = generateRoomId();

      for (const char of id) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
    }

    for (const char of allowedChars) {
      expect(charCounts[char]).toBeDefined();
    }

    expect(
      Object.keys(charCounts).every((char) => allowedChars.includes(char))
    ).toBe(true);
  });
});
