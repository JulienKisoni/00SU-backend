import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';
import JsYaml from 'js-yaml';
import type { JsonObject } from 'swagger-ui-express';

interface ILoadYaml {
  swaggerYaml: any;
}
const loadRoutes = ({ swaggerYaml }: ILoadYaml) => {
  const schemaPath = `${__dirname}/routes`;
  const folderFiles = fs.readdirSync(schemaPath);

  folderFiles.forEach((file) => {
    const pathFile = path.join(schemaPath, file);
    const fileYaml = JsYaml.load(fs.readFileSync(pathFile, 'utf8')) as any;
    if (!swaggerYaml.components) {
      swaggerYaml.components = {};
    }
    if (!swaggerYaml.components?.routes) {
      swaggerYaml.components.routes = {};
    }
    const [fileKey] = file.split('.yaml');
    if (!swaggerYaml.components?.routes[fileKey]) {
      swaggerYaml.components.routes[fileKey] = {};
    }
    const entries = Object.entries(fileYaml.components.routes);
    entries.forEach((entry) => {
      const [key, value] = entry;
      if (swaggerYaml.components.routes[fileKey][key]) {
        throw new Error(`Duplicated route key: ${key}`);
      }
      swaggerYaml.components.routes[fileKey][key] = value;
    });
  });
};
const loadErrors = ({ swaggerYaml }: ILoadYaml) => {
  const schemaPath = `${__dirname}/errors`;
  const folderFiles = fs.readdirSync(schemaPath);

  folderFiles.forEach((file) => {
    const pathFile = path.join(schemaPath, file);
    const fileYaml = JsYaml.load(fs.readFileSync(pathFile, 'utf8')) as any;
    if (!swaggerYaml.components) {
      swaggerYaml.components = {};
    }
    if (!swaggerYaml.components?.errors) {
      swaggerYaml.components.errors = {};
    }
    const entries = Object.entries(fileYaml.components.errors);
    entries.forEach((entry) => {
      const [key, value] = entry;
      if (swaggerYaml.components.errors[key]) {
        throw new Error(`Duplicated error key: ${key}`);
      }
      swaggerYaml.components.errors[key] = value;
    });
  });
};
const loadSchemas = ({ swaggerYaml }: ILoadYaml) => {
  const schemaPath = `${__dirname}/schemas`;
  const folderFiles = fs.readdirSync(schemaPath);

  folderFiles.forEach((file) => {
    const pathFile = path.join(schemaPath, file);
    const fileYaml = JsYaml.load(fs.readFileSync(pathFile, 'utf8')) as any;
    if (!swaggerYaml.components) {
      swaggerYaml.components = {};
    }
    if (!swaggerYaml.components?.schemas) {
      swaggerYaml.components.schemas = {};
    }
    const entries = Object.entries(fileYaml.components.schemas);
    entries.forEach((entry) => {
      const [key, value] = entry;
      if (swaggerYaml.components.schemas[key]) {
        throw new Error(`Duplicated schema key: ${key}`);
      }
      swaggerYaml.components.schemas[key] = value;
    });
  });
};

export const generateSwaggerDoc = (): JsonObject => {
  const swaggerDocPath = `${__dirname}/swagger.yaml`;
  const initialDocPath = `${__dirname}/initial.yaml`;

  const swaggerYaml = JsYaml.load(fs.readFileSync(initialDocPath, 'utf8')) as any;
  loadRoutes({ swaggerYaml });
  loadSchemas({ swaggerYaml });
  loadErrors({ swaggerYaml });

  fs.unlinkSync(swaggerDocPath);
  const finalSwaggerDoc = JsYaml.dump(swaggerYaml);
  fs.writeFileSync(swaggerDocPath, finalSwaggerDoc);
  const swaggerDoc = YAML.load(swaggerDocPath);
  return swaggerDoc;
};
