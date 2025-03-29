import Client from 'fhirclient/lib/Client';
import { Questionnaire } from 'fhir/r4';

class FhirService {
  private client: Client | null = null;

  async connect(serverUrl: string): Promise<void> {
    try {
      this.client = await Client.init({
        serverUrl,
        tokenResponse: {
          access_token: '', // Add token if needed
          token_type: 'Bearer'
        }
      });
    } catch (error) {
      console.error('Failed to connect to FHIR server:', error);
      throw error;
    }
  }

  async searchQuestionnaires(params: Record<string, string> = {}): Promise<Questionnaire[]> {
    if (!this.client) {
      throw new Error('FHIR client not initialized');
    }

    try {
      const response = await this.client.search({
        resourceType: 'Questionnaire',
        searchParams: params
      });

      return response.data.entry?.map((entry: any) => entry.resource) || [];
    } catch (error) {
      console.error('Failed to search questionnaires:', error);
      throw error;
    }
  }

  async saveQuestionnaire(questionnaire: Questionnaire): Promise<Questionnaire> {
    if (!this.client) {
      throw new Error('FHIR client not initialized');
    }

    try {
      const response = await this.client.create({
        resourceType: 'Questionnaire',
        body: questionnaire
      });

      return response.data;
    } catch (error) {
      console.error('Failed to save questionnaire:', error);
      throw error;
    }
  }

  async updateQuestionnaire(questionnaire: Questionnaire): Promise<Questionnaire> {
    if (!this.client) {
      throw new Error('FHIR client not initialized');
    }

    try {
      const response = await this.client.update({
        resourceType: 'Questionnaire',
        id: questionnaire.id,
        body: questionnaire
      });

      return response.data;
    } catch (error) {
      console.error('Failed to update questionnaire:', error);
      throw error;
    }
  }
}

export const fhirService = new FhirService();