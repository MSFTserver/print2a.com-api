import swaggerJsdoc from "swagger-jsdoc";

const options = {
  // List of files to be processed.
  apis: ["src/*.js"],
  swaggerDefinition: {
    info: {
      description: "Demo API for to get json data",
      swagger: "2.0",
      title: "Print2a API",
      version: "1.0.0"
    }
  },
  customCssUrl: "./src/swagger.css"
};

const specs = swaggerJsdoc(options);

export default specs;
