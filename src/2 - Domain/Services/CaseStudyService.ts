import { ICaseStudy } from "./../DomainObjects/ICaseStudy"
import { ISearchResult } from "./../DomainObjects/ISearchResult"
import { inject, injectable } from "inversify"
import { Client } from "@elastic/elasticsearch"
import { isNullOrWhiteSpace } from "../Helpers"

export interface ICaseStudyService {
  Sort(
    skip: number,
    take: number,
    sortBy: string,
    orderBy?: string
  ): Promise<ISearchResult<ICaseStudy>>
}

@injectable()
export class CaseStudyService implements ICaseStudyService {
  private readonly esClient: Client

  constructor(@inject("EsClient") client: Client) {
    this.esClient = client
  }
  public async Sort(
    skip: number,
    take: number,
    sortBy?: string,
    orderBy?: string
  ): Promise<ISearchResult<ICaseStudy>> {
    const searchSort: any[] = []
    if (!isNullOrWhiteSpace(sortBy)) {
      searchSort.push({
        [`${sortBy}.keyword`]: {
          order: isNullOrWhiteSpace(orderBy) ? "asc" : orderBy
        }
      })
    } else {
      searchSort.push({
        [`title.keyword`]: {
          order: isNullOrWhiteSpace(orderBy) ? "asc" : orderBy
        }
      })
    }
    const queryForCount = {
      index: "papers-case-studies",
      body: {
        query: {
          match_all: {}
        }
      }
    }
    const queryForSearch = {
      index: "papers-case-studies",
      body: {
        from: skip,
        size: take,
        sort: searchSort.length === 0 ? [] : searchSort
      }
    }

    try {
      const [searchCount, searchResults] = await Promise.all([
        this.esClient.count(queryForCount),
        this.esClient.search(queryForSearch)
      ])

      return {
        count: searchCount.body.count,
        results: searchResults.body.hits.hits.map((t: any) => t._source)
      }
    } catch (err) {
      console.log("ERROR!", err)
      throw new Error(err)
    }
  }
}
