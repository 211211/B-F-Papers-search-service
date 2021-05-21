export interface INewsDto {
  id: string
  slug: string
  author: string
  content: string
  date: string
  title: string
  thumbnail: string
  description: string
  type: string
}

export interface ICaseStudyDto {
  id: string
  category: string
  clientName: string
  date: string
  description: string
  layout: string
  slug: string
  thumbnail: string
  title: string
  type: string
}

export interface ISearchResultDto<T> {
  total: number
  skip?: number
  limit?: number
  data: T[]
  error?: string
}
