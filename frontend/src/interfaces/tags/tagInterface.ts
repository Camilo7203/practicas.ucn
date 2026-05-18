export interface ITag {
  id: string;
  activist: string;
  tag: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ITagsResponse {
  tags: ITag[];
  total: number;
}

export interface IUniqueTagsResponse {
  tags: string[];
  total: number;
}

export interface ITagAssignRequest {
  activist_id?: string;
  phone?: string;
  tag: string;
}

export interface ISearchActivistResponse {
  activist: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export interface IBulkTagAssignRequest {
  activist_ids: string[];
  tag: string;
}

export interface IBulkTagAssignResponse {
  message: string;
  created: number;
  skipped: number;
  errors: string[];
}

export interface IActivistTagsResponse {
  tags: ITag[];
  total: number;
}