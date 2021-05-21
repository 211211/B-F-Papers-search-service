import { ICaseStudy } from "./../../2 - Domain/DomainObjects/ICaseStudy"
import { INews } from "./../../2 - Domain/DomainObjects/INews"
import { Controller, Get, Route, Query, Tags, Header } from "tsoa"
import { inject, injectable } from "inversify"
import { ISearchService } from "../../2 - Domain/Services/SearchService"
import { ISearchResult } from "../../2 - Domain/DomainObjects/ISearchResult"
import {
  ISearchResultDto,
  ICaseStudyDto,
  INewsDto
} from "../DTOs/SearchResultDto"

@Route("search")
@Tags("Search")
@injectable()
export class SearchController extends Controller {
  private readonly searchService: ISearchService

  constructor(@inject("ISearchService") searchService: ISearchService) {
    super()

    this.searchService = searchService
  }

  /**
   * Retrieve news and case-studies based on a filter system.
   * Uses Elasticsearch in the background to execute the free text search and filters.
   *
   * @param skip how many entries do we want to skip
   * @param take how many entries do we want to take
   * @param q Query string
   */
  @Get("")
  public async Search(
    @Query() skip = 0,
    @Query() take = 10,
    @Query() q?: string
  ): Promise<ISearchResultDto<ICaseStudyDto | INewsDto>> {
    try {
      const results = await this.searchService.Search(skip, take, q)
      return this._mapToSearchResult(results)
    } catch (error) {
      this.setStatus(400)
      return {
        total: 0,
        data: [],
        error: error.message
      }
    }
  }

  private _mapToSearchResult(
    result: ISearchResult<INews | ICaseStudy>
  ): ISearchResultDto<ICaseStudyDto | INewsDto> {
    try {
      this.setStatus(200)
      return {
        total: result.count,
        data: result.results.map<ICaseStudyDto | INewsDto>((t) => {
          switch (t.type) {
            case "news": {
              return {
                id: t.id,
                slug: t.slug,
                author: t.author,
                content: t.content,
                date: t.date,
                title: t.title,
                thumbnail: t.thumbnail,
                description: t.description,
                type: t.type
              }
            }
            case "case-study": {
              return {
                id: t.id,
                category: t.category,
                clientName: t.clientName,
                date: t.date,
                description: t.description,
                layout: t.layout,
                slug: t.slug,
                thumbnail: t.thumbnail,
                title: t.title,
                type: t.type
              }
            }
          }
        })
      }
    } catch (error) {
      this.setStatus(400)
      return {
        total: 0,
        data: [],
        error: error.message
      }
    }
  }
}
