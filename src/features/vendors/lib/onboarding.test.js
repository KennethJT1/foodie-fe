import { missingDocuments, nextStep, prevStep, reachedIndex } from './onboarding';

describe('onboarding steps', () => {
  it('opens a submitted store at review and a draft at its saved step', () => {
    expect(reachedIndex('submitted')).toBe(5);
    expect(reachedIndex('location')).toBe(2);
    expect(reachedIndex(undefined)).toBe(0);
  });

  it('moves forward and back within the wizard', () => {
    expect(nextStep('type')).toBe('business');
    expect(nextStep('review')).toBe('review');
    expect(prevStep('type')).toBe('type');
    expect(prevStep('bank')).toBe('documents');
  });

  it('lists the documents still missing', () => {
    const onboarding = {
      requiredDocuments: [{ type: 'government_id' }, { type: 'cac_certificate' }],
      documents: [{ type: 'government_id' }],
    };
    expect(missingDocuments(onboarding)).toEqual([{ type: 'cac_certificate' }]);
  });
});
