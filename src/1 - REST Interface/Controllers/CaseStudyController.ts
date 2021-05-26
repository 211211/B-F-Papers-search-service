import { inject, injectable } from "inversify"
import { Controller, Get, Route, Query, Tags, Path } from "tsoa"
import { ICaseStudy } from "../../2 - Domain/DomainObjects/ICaseStudy"
import { ISearchResult } from "../../2 - Domain/DomainObjects/ISearchResult"
import { ICaseStudyService } from "../../2 - Domain/Services/CaseStudyService"
import { ICaseStudyDto, ISearchResultDto } from "../DTOs/SearchResultDto"

@Route("case-studies")
@Tags("Case Studies")
@injectable()
export class CaseStudyController extends Controller {
  private readonly caseStudyService: ICaseStudyService
  constructor(
    @inject("ICaseStudyService") caseStudyService: ICaseStudyService
  ) {
    super()

    this.caseStudyService = caseStudyService
  }

  /**
   * Retrieve case studies based on a sort system.
   * Uses Elasticsearch in the background to execute the sort system.
   *
   * @param skip how many entries do we want to skip
   * @param take how many entries do we want to take
   * @param sortBy field name used for sorting
   * @param orderBy "asc" | "desc"
   */
  @Get("")
  public async Search(
    @Query() skip = 0,
    @Query() take = 10,
    @Query() sortBy?: string,
    @Query() orderBy?: string
  ): Promise<ISearchResultDto<ICaseStudyDto>> {
    try {
      const results = await this.caseStudyService.Sort(
        skip,
        take,
        sortBy,
        orderBy
      )
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

  /**
   * Retrieve related case studies based on a case study id.
   * Uses Elasticsearch in the background to execute.
   *
   * @param id the id of the document
   */
  @Get("/related/{id}")
  public async GetRelatedDocuments(
    @Path() id: string,
    @Query() skip = 0,
    @Query() take = 3
  ): Promise<ISearchResultDto<ICaseStudyDto>> {
    try {
      const results = await this.caseStudyService.GetRelatedDocuments(
        id,
        skip,
        take
      )
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
    result: ISearchResult<ICaseStudy>
  ): ISearchResultDto<ICaseStudyDto> {
    try {
      this.setStatus(200)
      return {
        total: result.count,
        data: result.results.map<ICaseStudyDto>((t) => {
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
