import ZSchema from 'z-schema';
import { Questionnaire } from 'fhir/r4';

class ValidationService {
  private schema: any;
  private validator: ZSchema;

  constructor() {
    this.validator = new ZSchema({
      assumeAdditional: true,
      ignoreUnknownFormats: true,
    });
  }

  async loadSchema(): Promise<void> {
    if (!this.schema) {
      try {
        const response = await fetch('https://www.hl7.org/fhir/questionnaire.schema.json');
        this.schema = await response.json();
      } catch (error) {
        console.error('Failed to load FHIR schema:', error);
        throw error;
      }
    }
  }

  validateQuestionnaire(questionnaire: Questionnaire): { valid: boolean; errors: any[] } {
    if (!this.schema) {
      throw new Error('Schema not loaded. Call loadSchema() first.');
    }

    const valid = this.validator.validate(questionnaire, this.schema);
    const errors = this.validator.getLastErrors() || [];

    return { valid, errors };
  }

  validateQuestionnaireItem(item: any): string[] {
    const errors: string[] = [];

    // Basic validation rules
    if (!item.linkId) {
      errors.push('LinkId is required');
    }

    if (!item.text) {
      errors.push('Text is required');
    }

    if (!item.type) {
      errors.push('Type is required');
    }

    // Type-specific validation
    switch (item.type) {
      case 'choice':
      case 'open-choice':
        if (!item.answerOption?.length && !item.answerValueSet) {
          errors.push('Choice items must have either answerOption or answerValueSet');
        }
        break;

      case 'group':
        if (item.item && !Array.isArray(item.item)) {
          errors.push('Group items must have an array of sub-items');
        }
        break;

      case 'integer':
      case 'decimal':
        if (item.maxValue !== undefined && item.minValue !== undefined) {
          if (item.maxValue < item.minValue) {
            errors.push('Maximum value cannot be less than minimum value');
          }
        }
        break;
    }

    // Validate enableWhen conditions
    if (item.enableWhen?.length > 0) {
      if (!item.enableBehavior && item.enableWhen.length > 1) {
        errors.push('enableBehavior is required when multiple enableWhen conditions exist');
      }

      item.enableWhen.forEach((condition: any, index: number) => {
        if (!condition.question) {
          errors.push(`enableWhen[${index}]: question is required`);
        }
        if (!condition.operator) {
          errors.push(`enableWhen[${index}]: operator is required`);
        }
        if (condition.answer === undefined) {
          errors.push(`enableWhen[${index}]: answer is required`);
        }
      });
    }

    return errors;
  }
}

export const validationService = new ValidationService();