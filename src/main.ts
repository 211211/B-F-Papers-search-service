import bodyParser from "body-parser"
import express from "express"
import cors from "cors"
import { createConnection } from "typeorm"
import rateLimit from "express-rate-limit"

// @ts-ignore
import { RegisterRoutes } from "./routes"
import RequestLogger from "./1 - REST Interface/Middleware/RequestLogger"
import { RegisterServices } from "./registerServices"

import appsettings from "./appsettings.json"
import { MINUTE_IN_MS } from "./Constants"

const swaggerUiPath = require("swagger-ui-dist").absolutePath()

;(async () => {
  // get environment variables from .env
  require("dotenv").config()

  const { APPLICATION_PORT } = process.env
  if (!APPLICATION_PORT) {
    console.error("Missing APPLICATION_PORT!")
    process.exit(1)
  }

  // First we make sure we can connect to the database
  if (appsettings.UseDatabase) await createConnection()
  await RegisterServices()

  // Then we can start our express web server
  const app = express()

  // Log all request to this API
  app.use(RequestLogger)

  // Standard middleware
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json({ limit: "50mb" }))

  // Routing static content via middleware
  app.use("/v1/images", express.static("public"))

  // Only show Swagger if server is in development mode
  if (process.env.NODE_ENV !== "production") {
    // Swagger definition files
    app.use("/definitions/", express.static("definitions"))

    // Make swagger-ui available
    app.use("/swagger-ui", express.static(swaggerUiPath))

    // Redirect to API definition for the developer
    app.get("/swagger", (req: express.Request, res: express.Response) => {
      res.redirect("/swagger-ui/?url=/definitions/swagger.json")
    })
  }

  // Create a rate limiting
  const limiter = rateLimit({
    windowMs: MINUTE_IN_MS,
    max: 50,
    message: "Slow down boi"
  })

  // Apply rate limiter to all requests
  app.use(limiter)

  // Let TSOA register the controllers
  RegisterRoutes(app)

  // Error handling
  app.use(
    (err: any, req: express.Request, res: express.Response, next: any) => {
      if (err.status && err.status === 401) {
        // Not authorized or authenticated - Return info to user
        res.status(401).json(err)
      } else if (err.status && err.status === 400) {
        // The developer made an error. Return the error to the developer
        res.status(400).json(err)
      } else {
        // We fucked up - Only return HTTP 500 and log the error
        console.error("[ERROR]", "Internal error", err)
        res.status(500)
        res.end()
      }
    }
  )

  app.listen(APPLICATION_PORT, () =>
    console.error(`Service is listening on port ${APPLICATION_PORT}`)
  )
})()
