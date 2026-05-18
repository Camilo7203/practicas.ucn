import { API_CONFIG } from '../../config';
import API from '../core/apiCore';
import { handleAPIError } from '../core/handleApiError';
import { IElement, IElementsResponse, ICreateElementData, ITaskElement, ITriggerElement, ISurveyElement, IInfoElement, IIncentiveElement } from '@/interfaces/elements';
class ElementsService {
  private baseUrl = API_CONFIG.BASE_URL;

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getElements(): Promise<IElementsResponse| undefined> {
    try {
      const response = await API.get<IElementsResponse>(`${this.baseUrl}/campaigns/elements`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching elements:', error);
      handleAPIError(error);
    }
  }

  async getElementById(elementId: string): Promise<{ element: IElement }| undefined> {
    try {
      const response = await API.get<{ element: IElement }>(`${this.baseUrl}/campaigns/elements/${elementId}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching element:', error);
      handleAPIError(error);
    }
  }

  async createElement(elementData: IElement): Promise<{ message: string; element: ITriggerElement | ITaskElement | IIncentiveElement }| undefined > {
    try {
      const response = await API.post<{ message: string; element: ITriggerElement | ITaskElement | IIncentiveElement }>(
        `${this.baseUrl}/campaigns/elements/create`,
        elementData,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating element:', error);  
      handleAPIError(error);
    }
  }

  async updateElement(elementId: string, elementData: Partial<ICreateElementData>): Promise<{ message: string; element: ITriggerElement | ITaskElement | IIncentiveElement }  | undefined> {
    try {
      const response = await API.put<{ message: string; element: ITriggerElement | ITaskElement | IIncentiveElement }>(
        `${this.baseUrl}/campaigns/elements/${elementId}`,
        elementData,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating element:', error);
      handleAPIError(error);
    }
  }

  // Métodos de conveniencia para tipos específicos
  async createTrigger(triggerData: ITriggerElement){
    return await this.createElement(triggerData);
  }

  async createSurvey(surveyData: ISurveyElement) {
    return this.createElement(surveyData);
  }

  async createInfo(infoData:IInfoElement){
    return this.createElement(infoData);
  }

  async createIncentive(incentiveData: IIncentiveElement){
    return this.createElement(incentiveData);
  }

  // Métodos de actualización de conveniencia
  async updateTrigger(elementId: string, triggerData: Partial<ITriggerElement>): Promise<{ message: string; element: IElement } | undefined> {
    return this.updateElement(elementId, triggerData);
  }

  async updateSurvey(elementId: string, surveyData: Partial<ISurveyElement>): Promise<{ message: string; element: IElement } | undefined> {
    return this.updateElement(elementId, surveyData);
  }

  async updateInfo(elementId: string, infoData: Partial<IInfoElement>): Promise<{ message: string; element: IElement } | undefined> {
    return this.updateElement(elementId, infoData);
  }

  async updateIncentive(elementId: string, incentiveData: Partial<IIncentiveElement>): Promise<{ message: string; element: IElement } | undefined> {
    return this.updateElement(elementId, incentiveData);
  }

  // Filtros de conveniencia
  filterTriggers(elements: ITriggerElement[]): IElement[] {
    return elements.filter(element => 
      element.type === 'trigger' && element.sub_type === 'onArrival'
    );
  }

  filterSurveys(elements: ISurveyElement[]): IElement[] {
    return elements.filter(element => 
      element.type === 'task' && element.sub_type === 'survey'
    );
  }

  filterInfo(elements: IInfoElement[]): IElement[] {
    return elements.filter(element => 
      element.type === 'task' && element.sub_type === 'info'
    );
  }

  filterIncentives(elements: IIncentiveElement[]): IElement[] {
    return elements.filter(element => 
      element.type === 'incentive' && element.sub_type === 'points'
    );
  }
}

export const elementsService = new ElementsService();