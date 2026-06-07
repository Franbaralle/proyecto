import { BdiDataService } from './bdi-data.service';

describe('BdiDataService', () => {
  let service: BdiDataService;

  beforeEach(() => {
    service = new BdiDataService();
  });

  it('clasifica correctamente todos los puntajes posibles de 0 a 63', () => {
    for (let score = 0; score <= 63; score += 1) {
      const level = service.depressionLevelFromScore(score);

      if (score <= 13) {
        expect(level).toBe('DEPRESIÓN MÍNIMA');
      } else if (score <= 19) {
        expect(level).toBe('DEPRESIÓN LEVE');
      } else if (score <= 28) {
        expect(level).toBe('DEPRESIÓN MODERADA');
      } else {
        expect(level).toBe('DEPRESIÓN GRAVE');
      }
    }
  });

  it('calcula el total con scoring especial en sueño y apetito', () => {
    service.responses = Array(21).fill(0);
    service.responses[15] = 6;
    service.responses[17] = 6;

    expect(service.totalScore).toBe(6);
  });
});
