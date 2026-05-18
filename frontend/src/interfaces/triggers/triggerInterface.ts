export interface TriggerRegisterPayload {
  _id?: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  type: string;
  configuration: CronTriggerConfiguration | KeyWordTriggerConfiguration;
  organization: string;
}
export interface CronTriggerConfiguration {
  intervalType: string;
  intervalValue: number;
  customCron?: string;
  triggerAtHour: number;
  triggerAtMinute: number;
  triggerOnWeekDays: number[];
  triggerOnMonthDays: number[];
}

export interface KeyWordTriggerConfiguration {
  keywords: string[]; // Lista de palabras clave que activan el trigger
  softMatch?: boolean; // Si es true, se activará con coincidencias parciales
}