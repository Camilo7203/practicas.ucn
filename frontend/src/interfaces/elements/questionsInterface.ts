
export interface IQuestion {
  question: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'checkbox' | 'radiobutton' | 'chipSelect' | 'number' | 'boolean' | 'date' | 'time' | 'datetime' | 'email' | 'phone' | 'url' | 'image' | 'audio' | 'video' | 'document';
  required: boolean;
  possible_answers: IPossibleAnswer[];
  related_field?: string;
}
export interface IPossibleAnswer {
  text: string;
  type: string;
  isRight: boolean;
  tag?: string;
}