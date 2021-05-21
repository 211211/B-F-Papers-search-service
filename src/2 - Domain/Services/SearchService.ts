import { isNullOrWhiteSpace } from "../Helpers"
import { Client } from "@elastic/elasticsearch"
import { inject, injectable } from "inversify"
import { ISearchResult } from "../DomainObjects/ISearchResult"
import { INews } from "../DomainObjects/INews"
import { ICaseStudy } from "../DomainObjects/ICaseStudy"

export interface ISearchService {
  Search(
    skip: number,
    take: number,
    query: string
  ): Promise<ISearchResult<INews | ICaseStudy>>
}

@injectable()
export class SearchService implements ISearchService {
  private readonly esClient: Client

  constructor(@inject("EsClient") client: Client) {
    this.esClient = client
  }

  public async Search(
    skip: number,
    take: number,
    query: string
  ): Promise<ISearchResult<INews | ICaseStudy>> {
    const searchQuery: any[] = []
    const searchFilter: any[] = []

    if (!isNullOrWhiteSpace(query)) {
      searchQuery.push({
        multi_match: {
          query: query,
          fields: ["title", "description", "content", "category", "clientName"],
          minimum_should_match: "100%",
          fuzziness: 2,
          prefix_length: 2
        }
      })
    }

    const queryForCount = {
      index: "papers-*",
      body: {
        query: {
          bool: {
            must: searchQuery.length === 0 ? [] : searchQuery,
            filter: searchFilter.length === 0 ? [] : searchFilter
          }
        }
      }
    }

    const queryForSearch = {
      index: "papers-*",
      body: {
        from: skip,
        size: take,
        query: {
          bool: {
            must: searchQuery.length === 0 ? [] : searchQuery,
            filter: searchFilter.length === 0 ? [] : searchFilter
          }
        }
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
