#!/usr/bin/env node
const {Command} = require('commander');
const program = new Command();
const readline = require('readline');
const chalk = require('chalk');
const filesystem = require('fs');
const path = require('path');
const  {scenarioParser} = require('../parser/index');

/**
 * Verifies the command line arguments, re-prompts in case of error. Parses file and returns the object representation.
 * @param rd
 * @param file
 * @returns {Promise<*|null>}
 */
const verifyInput_ParseFile =  async (rd, file) => {
  const handlingContext = this;
  handlingContext.ready = false;
  handlingContext.rd = rd;
  handlingContext.file = file;
  const yamlJsonRegex = RegExp(/^.*\.(json|yaml)$/, 'gm');
  const inputLoop = () => {
    handlingContext.rd.question('\nEnter a proper asyncApi document filepath:', (filepath) => {
      filesystem.access(filepath, 1, (err) => {
        if (err) {
          rd.write(`\nError in accessing provided file \nDetails:${err}\n\n`);
          inputLoop();
        } else if (!String(filepath).match(yamlJsonRegex)) {
          rd.write('\nPlease provide a proper filepath ex:\'./myAsyncApi.json ./myAsyncApi.yaml\':\n');
          inputLoop();
        } else {
          handlingContext.ready = true;
          handlingContext.file = filepath;
          parseAsyncApi();
        }
      });
    });
  };

  rd.write(chalk.blueBright(`
  Async api Fluffy-robot
  `));
  rd.write('\nWelcome ');

  if (!!file) {
    if (!String(file).match(yamlJsonRegex)) {
      rd.write('\nPlease provide a correctly formatted filepath ex:\'./myAsyncApi.json ./myAsyncApi.yaml\':\n');
      inputLoop();
    } else {
      handlingContext.file = file;
      handlingContext.ready = true;
      parseAsyncApi();
    }
  } else {
    rd.write('\nFilepath not provided');
    inputLoop();
  }

  function parseAsyncApi() {
    if (handlingContext.ready) {
      handlingContext.ParsedAndFormated = scenarioParser(handlingContext.file);
    } else {
      rd.write('\nUnable to complete AsyncApi File parsing. The file is either non-Existent or there was an unknown Error.\nPress Ctrl + c to terminate');
    }
  }

  return handlingContext.ready ? await handlingContext.ParsedAndFormated : null;
};

(async function Main ()  {
  program.version('0.0.1', 'v', 'async-api performance tester cli version');

  program
    .requiredOption('-f, --filepath <type>', 'The filepath of a async-api specification yaml or json file')
    .option('-b, --basedir <type>', 'The basepath from which relative paths are computed.\nDefaults to the directory where simulator.sh resides.');

  program.parse(process.argv);
  ///Interface , SignalsHandling
  const cliInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  cliInterface.on('SIGINT', () => {
    console.log('\nShutting down');
    process.exit();
  });
  cliInterface.on('close', () => {
    console.log('\nAsync-api performance tester instance closed');
    process.exit();
  });
  cliInterface.on('uncaughtException', (err) => {
    console.log(err);
    process.exit();
  });

  const options = program.opts();

  await verifyInput_ParseFile(cliInterface, path.resolve(options.filepath));
}());