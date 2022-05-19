#!/usr/bin/env node

const process = require("process");
const createPiocheApp = require("./init.js");
const buildPiocheApp = require("./build.js");


class Loggy {

    stream = process.stdout;
    c = {
        fg: {
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            blue: "\x1b[34m",
            cyan: "\x1b[36m",
        },
        bg: {
            red: "\x1b[41m",
            green: "\x1b[42m",
            yellow: "\x1b[43m",
            blue: "\x1b[44m",
            cyan: "\x1b[46m"
        }
    };
    current;

    log(text){
        this.stream.write((text || "") + "\n");
    }

    begin(text){ // Write to console without newline
        this.current = text;
        this.stream.write(" >  " + text);
    }

    fail(text){ // Rewrite line as ERROR:text with red background
        this.stream.cursorTo(0);
        this.stream.clearLine(1);
        this.stream.write(this.color(` ❌ ERROR: ${text}`, this.c.fg.red) + "\n");
    }

    info(text){ // Rewrite line as INFO:text with yellow text
        this.stream.cursorTo(0);
        this.stream.clearLine(1);
        this.stream.write(this.color(` 🔔 INFO: ${text}`, this.c.fg.yellow) + "\n");
    }

    finish(){ // Write a checkmark and then add the newline
        this.stream.cursorTo(0);
        this.stream.clearLine(1);
        this.stream.write(" ✔️  " + this.current + "\n");
    }

    bgerror(text){ // Write ERROR:text in red background
        this.stream.write(this.color(`ERROR: ${text}`, this.c.bg.red) + "\n");
    }

    fgerror(text){ // Write ERROR:text in red text
        this.stream.write(this.color(`ERROR: ${text}`, this.c.fg.red) + "\n");
    }

    fglog(input, color){
        this.stream.write(this.color(input, this.c.fg[color]) + "\n");
    }

    bglog(input, color){
        this.stream.write(this.color(input, this.c.bg[color]) + "\n");
    }

    fgwrite(input, color){
        this.stream.write(this.color(input, this.c.fg[color]));
    }

    bgwrite(input, color){
        this.stream.write(this.color(input, this.c.bg[color]));
    }

    color(input, color){
        return `${color}${input}\x1b[0m`;
    }
}

const logger = new Loggy();

switch(process.argv[2]){
    case "create" : 
        createPiocheApp(logger, process.argv[3]);
        break;
    case "build" :
        buildPiocheApp(logger);
        break;
    case "help" :
        printPiocheHelp();
        break;
    default :
        logger.fgerror("No command provided, see help for info");
        break;
}

function printPiocheHelp(){
    logger.log("pioche create <ProjectName>");
    logger.log(" - Create a new pioche project from a starter repository");
    logger.log(" - Preconfigured package.json, pioche.config.js, and .env");
    logger.log();
    logger.log("pioche build");
    logger.log(" - Generate an entry file to be deployed to workers");
    logger.log(" - Runs durable object migrations intelligently checking for renames");
    logger.log();
    logger.log("pioche help");
    logger.log(" - Prints this help message");
}
