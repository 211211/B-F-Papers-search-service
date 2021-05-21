import { CaseStudyController } from "./../1 - REST Interface/Controllers/CaseStudyController"
import { Connection, getConnection } from "typeorm"
import { Container, decorate, injectable, interfaces } from "inversify"
import { Client } from "@elastic/elasticsearch"

import { Controller } from "tsoa"
import { SearchController } from "../1 - REST Interface/Controllers/SearchController"
import {
  ISearchService,
  SearchService
} from "../2 - Domain/Services/SearchService"
import {
  CaseStudyService,
  ICaseStudyService
} from "../2 - Domain/Services/CaseStudyService"

decorate(injectable(), Controller)

const iocContainer = new Container()

iocContainer
  .bind<Connection>("ConnectionProvider")
  .toDynamicValue((ctx: any) => getConnection())
  .inSingletonScope()

iocContainer
  .bind<Client>("EsClient")
  .toDynamicValue((ctx: any) => new Client({ node: "http://localhost:9200" }))
  .inTransientScope()

iocContainer
  .bind<SearchController>(SearchController)
  .to(SearchController)
  .inTransientScope()

iocContainer
  .bind<ISearchService>("ISearchService")
  .to(SearchService)
  .inTransientScope()

iocContainer
  .bind<CaseStudyController>(CaseStudyController)
  .to(CaseStudyController)
  .inTransientScope()

iocContainer
  .bind<ICaseStudyService>("ICaseStudyService")
  .to(CaseStudyService)
  .inTransientScope()

export { iocContainer }
