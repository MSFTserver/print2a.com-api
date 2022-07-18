import swaggerJsdoc from "swagger-jsdoc";

const options = {
  // List of files to be processed.
  apis: ["src/*.js"],
  swaggerDefinition: {
    info: {
      description: "API to get info from print2a repository",
      swagger: "2.0",
      title: "Print2a API",
      version: "1.0.0",
      servers: ['https://api.print2a.com', 'https://print2a.com:5757']
    }
  },
  customCssUrl: "./src/swagger.css"
};

const specs = swaggerJsdoc(options);

export default specs;
